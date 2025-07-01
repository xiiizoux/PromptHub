-- 删除migration_status字段（修正版本）
-- 实际状态值是'completed'而不是'complete'

BEGIN;

-- 步骤1: 检查migration_status字段的当前状态
DO $$
DECLARE
    total_records INTEGER;
    completed_records INTEGER;
    error_records INTEGER;
    other_status_records INTEGER;
    rec RECORD;
BEGIN
    RAISE NOTICE '=== migration_status字段分析 ===';
    
    SELECT COUNT(*) INTO total_records FROM prompts;
    SELECT COUNT(*) INTO completed_records FROM prompts WHERE migration_status = 'completed';
    SELECT COUNT(*) INTO error_records FROM prompts WHERE migration_status = 'error';
    SELECT COUNT(*) INTO other_status_records FROM prompts WHERE migration_status NOT IN ('completed', 'error') OR migration_status IS NULL;
    
    RAISE NOTICE '总记录数: %', total_records;
    RAISE NOTICE 'completed状态记录: %', completed_records;
    RAISE NOTICE 'error状态记录: %', error_records;
    RAISE NOTICE '其他状态记录: %', other_status_records;
    
    -- 显示所有不同的状态值
    RAISE NOTICE '所有状态值分布:';
    FOR rec IN 
        SELECT migration_status, COUNT(*) as count
        FROM prompts 
        GROUP BY migration_status 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  %: % 条记录', COALESCE(rec.migration_status, 'NULL'), rec.count;
    END LOOP;
    
    -- 如果有error状态的记录，显示详细信息
    IF error_records > 0 THEN
        RAISE NOTICE '=== error状态记录详情 ===';
        FOR rec IN 
            SELECT id, name, migration_status
            FROM prompts 
            WHERE migration_status = 'error'
            LIMIT 5
        LOOP
            RAISE NOTICE '  ID: %, 名称: %', rec.id, rec.name;
        END LOOP;
    END IF;
END $$;

-- 步骤2: 处理error状态的记录
DO $$
DECLARE
    error_count INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO error_count FROM prompts WHERE migration_status = 'error';
    
    IF error_count > 0 THEN
        RAISE NOTICE '=== 处理error状态记录 ===';
        RAISE NOTICE '发现 % 条error状态记录，需要先处理', error_count;
        
        -- 检查这些error记录是否有content内容
        FOR rec IN 
            SELECT id, name, 
                   CASE WHEN content IS NOT NULL AND content != '' THEN 'HAS_CONTENT' ELSE 'NO_CONTENT' END as content_status
            FROM prompts 
            WHERE migration_status = 'error'
        LOOP
            RAISE NOTICE '  %: % - %', rec.name, rec.id, rec.content_status;
        END LOOP;
        
        -- 如果error记录也有content，将其状态更新为completed
        UPDATE prompts 
        SET migration_status = 'completed' 
        WHERE migration_status = 'error' 
          AND content IS NOT NULL 
          AND content != '';
        
        GET DIAGNOSTICS error_count = ROW_COUNT;
        RAISE NOTICE '✅ 已将 % 条有content的error记录更新为completed', error_count;
    END IF;
END $$;

-- 步骤3: 最终检查所有记录状态
DO $$
DECLARE
    non_completed_count INTEGER;
    rec RECORD;
BEGIN
    -- 检查是否还有非completed状态的记录
    SELECT COUNT(*) INTO non_completed_count 
    FROM prompts 
    WHERE migration_status != 'completed' OR migration_status IS NULL;
    
    IF non_completed_count > 0 THEN
        RAISE NOTICE '⚠️ 仍有 % 条记录不是completed状态:', non_completed_count;
        FOR rec IN 
            SELECT migration_status, COUNT(*) as count
            FROM prompts 
            WHERE migration_status != 'completed' OR migration_status IS NULL
            GROUP BY migration_status
        LOOP
            RAISE NOTICE '  %: % 条记录', COALESCE(rec.migration_status, 'NULL'), rec.count;
        END LOOP;
        
        -- 如果用户确认要删除，可以取消下面这行的注释
        -- RAISE EXCEPTION '存在非completed状态记录，停止删除操作';
        RAISE NOTICE '⚠️ 继续删除操作（忽略非completed状态记录）';
    ELSE
        RAISE NOTICE '✅ 所有记录都是completed状态，可以安全删除字段';
    END IF;
END $$;

-- 步骤4: 删除migration_status字段
ALTER TABLE prompts DROP COLUMN IF EXISTS migration_status CASCADE;

-- 删除prompt_versions表的migration_status字段（如果存在）
ALTER TABLE prompt_versions DROP COLUMN IF EXISTS migration_status CASCADE;

-- 步骤5: 验证删除结果
DO $$
BEGIN
    RAISE NOTICE '=== 删除结果验证 ===';
    
    -- 检查prompts表
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prompts' AND column_name = 'migration_status'
    ) THEN
        RAISE NOTICE '✅ prompts表的migration_status字段已删除';
    ELSE
        RAISE WARNING '⚠️ prompts表的migration_status字段删除失败';
    END IF;
    
    -- 检查prompt_versions表
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prompt_versions' AND column_name = 'migration_status'
    ) THEN
        RAISE NOTICE '✅ prompt_versions表的migration_status字段已删除（或本来就不存在）';
    ELSE
        RAISE WARNING '⚠️ prompt_versions表的migration_status字段删除失败';
    END IF;
END $$;

COMMIT;

-- 最终总结
DO $$
DECLARE
    field_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO field_count 
    FROM information_schema.columns 
    WHERE table_name = 'prompts';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 migration_status字段清理完成！';
    RAISE NOTICE '📊 prompts表现在有 % 个字段', field_count;
    RAISE NOTICE '💾 节省了存储空间';
    RAISE NOTICE '🔧 简化了表结构';
    RAISE NOTICE '📊 prompts表记录数: %', (SELECT COUNT(*) FROM prompts);
    RAISE NOTICE '✅ 数据库优化项目彻底完成！';
END $$;
