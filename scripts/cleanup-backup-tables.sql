-- 清理所有备份表和migration_report表
-- 删除不再需要的临时表和视图

BEGIN;

-- 步骤1: 查看当前所有备份表和相关表
DO $$
DECLARE
    rec RECORD;
    table_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== 准备删除的表和视图 ===';
    
    -- 查找所有备份表（只在public schema中）
    FOR rec IN
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE (table_name LIKE '%backup%'
           OR table_name = 'migration_report'
           OR table_name LIKE 'prompts_backup_%'
           OR table_name LIKE 'prompt_versions_backup_%')
           AND table_schema = 'public'  -- 只查找public schema的表
           AND table_name NOT LIKE 'pg_%'  -- 排除PostgreSQL系统表
        ORDER BY table_name
    LOOP
        RAISE NOTICE '  %: % (%)', table_count + 1, rec.table_name, rec.table_type;
        table_count := table_count + 1;
    END LOOP;
    
    IF table_count = 0 THEN
        RAISE NOTICE '  没有找到需要删除的备份表';
    ELSE
        RAISE NOTICE '  总共找到 % 个表/视图需要删除', table_count;
    END IF;
END $$;

-- 步骤2: 删除migration_report视图（如果存在）
DROP VIEW IF EXISTS migration_report CASCADE;

-- 步骤3: 删除所有备份表
-- 3.1: 删除prompts备份表
DROP TABLE IF EXISTS prompts_backup_20250101 CASCADE;
DROP TABLE IF EXISTS prompts_backup CASCADE;

-- 3.2: 删除prompt_versions备份表  
DROP TABLE IF EXISTS prompt_versions_backup_20250101 CASCADE;
DROP TABLE IF EXISTS prompt_versions_backup CASCADE;

-- 3.3: 删除其他可能的备份表（使用动态SQL，排除系统表）
DO $$
DECLARE
    rec RECORD;
    sql_cmd TEXT;
BEGIN
    -- 查找并删除所有以backup结尾或包含backup的用户表（排除系统表）
    FOR rec IN
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE (table_name LIKE '%backup%'
           OR table_name LIKE 'prompts_backup_%'
           OR table_name LIKE 'prompt_versions_backup_%')
           AND table_schema = 'public'  -- 只处理public schema的表
           AND table_name NOT LIKE 'pg_%'  -- 排除PostgreSQL系统表
           AND table_name NOT LIKE 'information_schema%'  -- 排除信息模式表
    LOOP
        IF rec.table_type = 'BASE TABLE' THEN
            sql_cmd := format('DROP TABLE IF EXISTS %I CASCADE', rec.table_name);
        ELSE
            sql_cmd := format('DROP VIEW IF EXISTS %I CASCADE', rec.table_name);
        END IF;
        EXECUTE sql_cmd;
        RAISE NOTICE '✅ 已删除备份%: %', LOWER(rec.table_type), rec.table_name;
    END LOOP;
END $$;

-- 步骤4: 清理可能的临时视图
DROP VIEW IF EXISTS migration_report_backup CASCADE;
DROP VIEW IF EXISTS prompts_with_category_type_backup CASCADE;

-- 步骤5: 验证清理结果
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM information_schema.tables
    WHERE (table_name LIKE '%backup%'
       OR table_name = 'migration_report'
       OR table_name LIKE 'prompts_backup_%'
       OR table_name LIKE 'prompt_versions_backup_%')
       AND table_schema = 'public'  -- 只检查public schema
       AND table_name NOT LIKE 'pg_%';  -- 排除系统表
    
    IF remaining_count = 0 THEN
        RAISE NOTICE '🎉 清理完成！所有备份表和migration_report都已删除';
    ELSE
        RAISE WARNING '⚠️ 仍有 % 个相关表未删除', remaining_count;
    END IF;
END $$;

-- 步骤6: 显示当前数据库中的主要表
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== 当前数据库主要表 ===';
    FOR rec IN 
        SELECT table_name, 
               (xpath('/row/c/text()', query_to_xml(format('SELECT COUNT(*) as c FROM %I', table_name), false, true, '')))[1]::text::int as row_count
        FROM information_schema.tables 
        WHERE table_name IN ('prompts', 'prompt_versions', 'categories', 'prompt_collaborators', 'prompt_audit_logs')
        ORDER BY table_name
    LOOP
        RAISE NOTICE '  %: % 条记录', rec.table_name, rec.row_count;
    END LOOP;
END $$;

COMMIT;

-- 最终确认
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ 清理操作完成！';
    RAISE NOTICE '📊 保留的核心表：prompts, prompt_versions, categories 等';
    RAISE NOTICE '🗑️ 已删除：所有备份表和migration_report视图';
    RAISE NOTICE '💾 数据库空间已释放';
END $$;
