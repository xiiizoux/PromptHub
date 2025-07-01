-- 查询prompt_versions表完整结构的SQL语句
-- 执行日期：2025-07-01

-- =============================================================================
-- 查询表的基本字段结构
-- =============================================================================
SELECT
    ordinal_position,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name = 'prompt_versions'
  AND table_schema = 'public'
ORDER BY ordinal_position;


