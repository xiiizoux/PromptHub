-- =============================================
-- 021_unify_category_icons.sql
-- 统一 categories 表中的 icon 字段，将所有 emoji 图标替换为对应的英文图标名
-- 根据项目使用的 Heroicons 图标库，统一使用 kebab-case 格式的英文图标名
-- =============================================

-- 更新 emoji 图标为对应的英文图标名
-- 根据分类名称和 ID 精确匹配

-- 人像摄影 (Portrait Photography) -> camera
UPDATE categories
SET icon = 'camera'
WHERE icon = '👤' AND name = '人像摄影';

-- 产品展示 (Product Showcase) -> cube
UPDATE categories
SET icon = 'cube'
WHERE icon = '📦' AND name = '产品展示';

-- 故事叙述 (Storytelling) -> book-open
UPDATE categories
SET icon = 'book-open'
WHERE icon = '📖' AND name = '故事叙述';

-- 教学视频 (Educational Video) -> academic-cap
UPDATE categories
SET icon = 'academic-cap'
WHERE icon = '🎓' AND name = '教学视频';

-- 自然风景 (Nature Scenery) -> photo
UPDATE categories
SET icon = 'photo'
WHERE icon = '🌄' AND name = '自然风景';

-- 验证更新结果
-- 检查是否还有 emoji 图标（通过检查是否包含非 ASCII 字符）
DO $$
DECLARE
    emoji_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO emoji_count
    FROM categories
    WHERE icon IS NOT NULL 
    AND icon !~ '^[a-z0-9\-]+$';  -- 只允许小写字母、数字和连字符
    
    IF emoji_count > 0 THEN
        RAISE NOTICE '警告: 仍有 % 条记录包含非标准图标名', emoji_count;
    ELSE
        RAISE NOTICE '成功: 所有图标已统一为英文图标名 (kebab-case)';
    END IF;
END $$;

-- 显示更新后的图标统计
SELECT 
    icon,
    COUNT(*) as count,
    string_agg(name, ', ' ORDER BY name) as categories
FROM categories
WHERE icon IS NOT NULL
GROUP BY icon
ORDER BY icon;

