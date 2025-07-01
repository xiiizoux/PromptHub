-- 删除migration_status字段
-- 迁移已完成，该字段不再需要

BEGIN;

-- 步骤1: 检查migration_status字段的当前状态
DO $$
DECLARE
    total_records INTEGER;
    complete_records INTEGER;
    other_status_records INTEGER;
    rec RECORD;
BEGIN
    RAISE NOTICE '=== migration_status字段分析 ===';
    
    SELECT COUNT(*) INTO total_records FROM prompts;
    SELECT COUNT(*) INTO complete_records FROM prompts WHERE migration_status = 'complete';
    SELECT COUNT(*) INTO other_status_records FROM prompts WHERE migration_status != 'complete' OR migration_status IS NULL;
    
    RAISE NOTICE '总记录数: %', total_records;
    RAISE NOTICE 'complete状态记录: %', complete_records;
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
    
    -- 检查prompt_versions表是否也有这个字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prompt_versions' AND column_name = 'migration_status'
    ) THEN
        RAISE NOTICE 'prompt_versions表也有migration_status字段';
        SELECT COUNT(*) INTO total_records FROM prompt_versions;
        SELECT COUNT(*) INTO complete_records FROM prompt_versions WHERE migration_status = 'complete';
        RAISE NOTICE 'prompt_versions - 总记录: %, complete: %', total_records, complete_records;
    ELSE
        RAISE NOTICE 'prompt_versions表没有migration_status字段';
    END IF;
END $$;

-- 步骤2: 检查是否有视图或其他对象依赖这个字段
DO $$
DECLARE
    view_count INTEGER := 0;
    rec RECORD;
BEGIN
    RAISE NOTICE '=== 检查字段依赖关系 ===';
    
    -- 检查视图定义中是否引用了migration_status
    FOR rec IN
        SELECT table_name, view_definition
        FROM information_schema.views
        WHERE view_definition ILIKE '%migration_status%'
    LOOP
        RAISE NOTICE '视图 % 引用了migration_status字段', rec.table_name;
        view_count := view_count + 1;
    END LOOP;
    
    IF view_count = 0 THEN
        RAISE NOTICE '✅ 没有视图依赖migration_status字段';
    ELSE
        RAISE WARNING '⚠️ 发现 % 个视图依赖migration_status字段', view_count;
    END IF;
END $$;

-- 步骤3: 删除migration_status字段（如果所有记录都是complete）
DO $$
DECLARE
    non_complete_count INTEGER;
BEGIN
    -- 最后确认所有记录都是complete状态
    SELECT COUNT(*) INTO non_complete_count 
    FROM prompts 
    WHERE migration_status != 'complete' OR migration_status IS NULL;
    
    IF non_complete_count > 0 THEN
        RAISE EXCEPTION '发现 % 条记录不是complete状态，不能删除字段', non_complete_count;
    END IF;
    
    RAISE NOTICE '✅ 所有记录都是complete状态，可以安全删除字段';
END $$;

-- 删除prompts表的migration_status字段
ALTER TABLE prompts DROP COLUMN IF EXISTS migration_status CASCADE;

-- 删除prompt_versions表的migration_status字段（如果存在）
ALTER TABLE prompt_versions DROP COLUMN IF EXISTS migration_status CASCADE;

-- 步骤4: 验证删除结果
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

-- 步骤5: 显示清理后的表结构
DO $$
DECLARE
    rec RECORD;
    field_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO field_count 
    FROM information_schema.columns 
    WHERE table_name = 'prompts';
    
    RAISE NOTICE '=== 清理后的prompts表结构 ===';
    RAISE NOTICE '总字段数: %', field_count;
    RAISE NOTICE '字段列表:';
    
    FOR rec IN 
        SELECT ordinal_position, column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'prompts' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % (%)', rec.ordinal_position, rec.column_name, rec.data_type;
    END LOOP;
END $$;

COMMIT;

-- 最终总结
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 migration_status字段清理完成！';
    RAISE NOTICE '💾 节省了存储空间';
    RAISE NOTICE '🔧 简化了表结构';
    RAISE NOTICE '📊 prompts表记录数: %', (SELECT COUNT(*) FROM prompts);
    RAISE NOTICE '✅ 迁移工作彻底完成！';
END $$;
