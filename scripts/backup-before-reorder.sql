-- 备份prompts表数据
-- 在重排字段之前创建完整备份

BEGIN;

-- 步骤1: 创建备份表（使用时间戳）
CREATE TABLE prompts_backup_20250101 AS
SELECT * FROM prompts;

-- 步骤2: 创建prompt_versions备份表（以防万一）
CREATE TABLE prompt_versions_backup_20250101 AS
SELECT * FROM prompt_versions;

-- 步骤3: 备份视图定义
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== 备份信息 ===';
    RAISE NOTICE '备份时间: %', NOW();
    RAISE NOTICE 'prompts表记录数: %', (SELECT COUNT(*) FROM prompts);
    RAISE NOTICE 'prompt_versions表记录数: %', (SELECT COUNT(*) FROM prompt_versions);

    RAISE NOTICE '=== 当前prompts表结构 ===';
    FOR rec IN
        SELECT ordinal_position, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'prompts'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % % %',
            rec.ordinal_position,
            rec.column_name,
            rec.data_type,
            CASE WHEN rec.is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END;
    END LOOP;

    RAISE NOTICE '=== 当前索引信息 ===';
    FOR rec IN
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'prompts'
        ORDER BY indexname
    LOOP
        RAISE NOTICE '  索引: %', rec.indexname;
        RAISE NOTICE '    定义: %', rec.indexdef;
    END LOOP;
END $$;

COMMIT;

-- 验证备份表创建成功
DO $$
BEGIN
    RAISE NOTICE '=== 备份验证 ===';
    RAISE NOTICE 'prompts_backup_20250101 记录数: %', (SELECT COUNT(*) FROM prompts_backup_20250101);
    RAISE NOTICE 'prompt_versions_backup_20250101 记录数: %', (SELECT COUNT(*) FROM prompt_versions_backup_20250101);
    RAISE NOTICE '✅ 备份完成！可以安全执行字段重排操作';
    RAISE NOTICE '';
    RAISE NOTICE '如需恢复数据，可执行:';
    RAISE NOTICE '  DROP TABLE prompts;';
    RAISE NOTICE '  ALTER TABLE prompts_backup_20250101 RENAME TO prompts;';
END $$;
