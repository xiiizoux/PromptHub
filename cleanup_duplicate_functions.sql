-- 清理重复和未正确配置的函数
-- 执行日期：2025-07-01

-- =============================================================================
-- 查看所有函数的详细信息
-- =============================================================================
-- 查看所有相关函数的完整信息，包括参数类型
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    proconfig as function_config,
    oid
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
    'increment_usage_count',
    'get_prompts_by_type', 
    'get_category_stats',
    'update_updated_at_column',
    'increment_template_usage',
    'update_template_rating',
    'get_file_url',
    'delete_file_if_exists',
    'cleanup_orphaned_files',
    'migrate_messages_to_content'
)
ORDER BY proname, oid;

-- =============================================================================
-- 清理没有正确配置search_path的函数版本
-- =============================================================================
-- 注意：只删除那些function_config为null的版本，保留正确配置的版本

-- 查找并删除没有search_path配置的函数
DO $$
DECLARE
    func_record RECORD;
    func_signature TEXT;
BEGIN
    -- 遍历所有没有正确配置的函数
    FOR func_record IN 
        SELECT 
            proname,
            oid,
            pg_get_function_identity_arguments(oid) as args
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND proname IN (
            'increment_usage_count',
            'get_prompts_by_type', 
            'get_category_stats',
            'increment_template_usage',
            'update_template_rating',
            'get_file_url',
            'delete_file_if_exists',
            'cleanup_orphaned_files',
            'migrate_messages_to_content'
        )
        AND (proconfig IS NULL OR NOT ('search_path=public' = ANY(proconfig)))
    LOOP
        -- 构建函数签名
        func_signature := func_record.proname || '(' || func_record.args || ')';
        
        -- 输出将要删除的函数信息
        RAISE NOTICE 'Dropping function: %', func_signature;
        
        -- 删除函数
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || func_signature;
    END LOOP;
END $$;

-- =============================================================================
-- 验证清理结果
-- =============================================================================
-- 再次检查所有函数，确保只保留正确配置的版本
SELECT 
    'After cleanup:' as status,
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    proconfig as function_config
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
    'increment_usage_count',
    'get_prompts_by_type', 
    'get_category_stats',
    'update_updated_at_column',
    'increment_template_usage',
    'update_template_rating',
    'get_file_url',
    'delete_file_if_exists',
    'cleanup_orphaned_files',
    'migrate_messages_to_content'
)
ORDER BY proname;

-- =============================================================================
-- 执行说明：
-- 1. 先执行查看函数信息的查询，了解当前状态
-- 2. 执行清理脚本删除未正确配置的函数版本
-- 3. 执行验证查询确认清理结果
-- =============================================================================
