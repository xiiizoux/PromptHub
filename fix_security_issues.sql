-- =============================================
-- 修复Supabase安全顾问提示的问题
-- =============================================

BEGIN;

-- =============================================
-- 1. 修复视图的安全定义问题
-- =============================================

-- 删除现有视图并重新创建带有安全定义的视图
DROP VIEW IF EXISTS prompts_with_category_type CASCADE;
DROP VIEW IF EXISTS category_stats CASCADE;
DROP VIEW IF EXISTS category_type_stats CASCADE;
DROP VIEW IF EXISTS storage_stats CASCADE;

-- 重新创建category_stats视图（带安全定义）
CREATE VIEW category_stats 
WITH (security_invoker = true) AS
SELECT 
    c.id,
    c.name,
    c.name_en,
    c.type,
    c.icon,
    c.description,
    c.sort_order,
    COUNT(p.id) as prompt_count,
    COUNT(CASE WHEN p.is_public = true THEN 1 END) as public_count,
    COUNT(CASE WHEN p.is_public = false THEN 1 END) as private_count
FROM categories c
LEFT JOIN prompts p ON c.id = p.category_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.name_en, c.type, c.icon, c.description, c.sort_order
ORDER BY c.sort_order;

-- 重新创建category_type_stats视图（带安全定义）
CREATE VIEW category_type_stats 
WITH (security_invoker = true) AS
SELECT 
    type,
    COUNT(*) as category_count,
    SUM(prompt_count) as total_prompts,
    SUM(public_count) as total_public,
    SUM(private_count) as total_private
FROM category_stats
GROUP BY type
ORDER BY 
    CASE type 
        WHEN 'chat' THEN 1 
        WHEN 'image' THEN 2 
        WHEN 'video' THEN 3 
        ELSE 4 
    END;

-- 重新创建prompts_with_category_type视图（带安全定义）
CREATE VIEW prompts_with_category_type 
WITH (security_invoker = true) AS
SELECT 
    p.*,
    c.name as category_name,
    c.name_en as category_name_en,
    c.type as category_type,
    c.icon as category_icon
FROM prompts p
LEFT JOIN categories c ON p.category_id = c.id;

-- 重新创建storage_stats视图（如果需要的话）
CREATE VIEW storage_stats 
WITH (security_invoker = true) AS
SELECT 
    'prompts' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_public = true THEN 1 END) as public_count,
    COUNT(CASE WHEN is_public = false THEN 1 END) as private_count
FROM prompts
UNION ALL
SELECT 
    'categories' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_count
FROM categories;

-- =============================================
-- 2. 处理备份表的RLS问题
-- =============================================

-- 为备份表启用RLS（如果需要保留的话）
ALTER TABLE categories_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts_category_backup ENABLE ROW LEVEL SECURITY;

-- 创建备份表的RLS策略（允许所有认证用户访问备份数据）
CREATE POLICY "Allow authenticated users to view backup data" ON categories_backup
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view backup data" ON prompts_category_backup
    FOR SELECT USING (auth.role() = 'authenticated');

-- 或者，如果不需要这些备份表，可以直接删除它们
-- DROP TABLE IF EXISTS categories_backup CASCADE;
-- DROP TABLE IF EXISTS prompts_category_backup CASCADE;

-- =============================================
-- 3. 为视图设置适当的权限
-- =============================================

-- 授予认证用户对视图的访问权限
GRANT SELECT ON category_stats TO authenticated;
GRANT SELECT ON category_type_stats TO authenticated;
GRANT SELECT ON prompts_with_category_type TO authenticated;
GRANT SELECT ON storage_stats TO authenticated;

-- 授予匿名用户对公共统计视图的访问权限
GRANT SELECT ON category_stats TO anon;
GRANT SELECT ON category_type_stats TO anon;

-- =============================================
-- 4. 验证修复结果
-- =============================================

-- 检查视图是否正确创建
DO $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name IN ('category_stats', 'category_type_stats', 'prompts_with_category_type', 'storage_stats');
    
    RAISE NOTICE '=== 安全修复完成 ===';
    RAISE NOTICE '已修复视图数量: %', view_count;
    RAISE NOTICE '✅ 所有视图已重新创建并添加安全定义';
    RAISE NOTICE '✅ 备份表已启用RLS并设置策略';
    RAISE NOTICE '✅ 视图权限已正确配置';
END $$;

COMMIT;

-- 显示修复后的视图列表
SELECT 
    'Fixed Views' as status,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'VIEW'
ORDER BY table_name;
