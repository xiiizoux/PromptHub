-- =============================================
-- 将optimization_template中的user_template字段重命名为user
-- 简化字段名称，保持与之前的命名约定一致
-- =============================================

-- 第一步：备份当前数据（可选）
CREATE TABLE IF NOT EXISTS categories_rename_backup AS 
SELECT id, name, optimization_template 
FROM categories 
WHERE optimization_template IS NOT NULL
LIMIT 5; -- 只备份几条记录作为样本

-- 第二步：将user_template字段重命名为user
UPDATE categories 
SET optimization_template = jsonb_build_object(
    'user', optimization_template ->> 'user_template'
)
WHERE optimization_template ? 'user_template';

-- 第三步：验证重命名结果
SELECT 
    name,
    optimization_template ? 'user' as has_user_field,
    optimization_template ? 'user_template' as has_old_field,
    length(optimization_template ->> 'user') as user_field_length
FROM categories 
WHERE optimization_template IS NOT NULL
LIMIT 10;

-- 第四步：更新索引（如果需要）
DROP INDEX IF EXISTS idx_categories_optimization_user_template;
CREATE INDEX IF NOT EXISTS idx_categories_optimization_user 
ON categories USING gin ((optimization_template -> 'user')) 
WHERE optimization_template IS NOT NULL;

-- 第五步：更新字段注释
COMMENT ON COLUMN categories.optimization_template IS 'JSONB格式存储的User角色优化模板，包含user字段，System角色模板硬编码在代码中';

-- 输出重命名统计
SELECT 
    COUNT(*) as total_categories,
    COUNT(CASE WHEN optimization_template ? 'user' THEN 1 END) as categories_with_user_field,
    COUNT(CASE WHEN optimization_template ? 'user_template' THEN 1 END) as categories_with_old_field
FROM categories;
