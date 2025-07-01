-- 检查依赖messages字段的对象
-- 查看哪些视图、函数等依赖于messages字段

-- 1. 查看prompts_with_category_type视图的定义
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'prompts_with_category_type';

-- 2. 查找所有依赖messages字段的视图
SELECT DISTINCT
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition ILIKE '%messages%';

-- 3. 查找所有依赖prompts表的对象
SELECT 
    dependent_ns.nspname as dependent_schema,
    dependent_view.relname as dependent_view, 
    source_ns.nspname as source_schema,
    source_table.relname as source_table,
    pg_attribute.attname as column_name
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid 
JOIN pg_attribute ON pg_depend.refobjid = pg_attribute.attrelid 
    AND pg_depend.refobjsubid = pg_attribute.attnum 
JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
JOIN pg_namespace source_ns ON source_ns.oid = source_table.relnamespace
WHERE source_table.relname = 'prompts'
    AND pg_attribute.attname = 'messages';
