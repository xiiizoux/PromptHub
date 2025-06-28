-- =============================================================================
-- 最终修复SQL：更新prompts表中null的category_type字段
-- 这是一个保守安全的SQL脚本，只更新必要的数据
-- =============================================================================

-- 1. 更新基于category字段的category_type
-- 根据prompts表的category字段，匹配categories表来设置正确的category_type

UPDATE prompts 
SET category_type = (
  SELECT c.type 
  FROM categories c 
  WHERE c.name = prompts.category 
  AND c.is_active = true
)
WHERE category_type IS NULL 
AND category IN (
  SELECT name FROM categories WHERE is_active = true
);

-- 2. 验证修复结果的查询语句（请在修复后运行这些查询来确认结果）

-- 查看修复后的统计
-- SELECT 
--   category_type,
--   COUNT(*) as count
-- FROM prompts 
-- GROUP BY category_type 
-- ORDER BY category_type;

-- 查看图片类型的提示词
-- SELECT name, category, category_type 
-- FROM prompts 
-- WHERE category_type = 'image'
-- ORDER BY name;

-- 查看视频类型的提示词  
-- SELECT name, category, category_type 
-- FROM prompts 
-- WHERE category_type = 'video'
-- ORDER BY name;

-- 检查是否还有null的category_type
-- SELECT COUNT(*) as null_count
-- FROM prompts 
-- WHERE category_type IS NULL;