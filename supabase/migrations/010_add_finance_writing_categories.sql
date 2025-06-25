-- 添加金融和写作分类
-- 为categories表添加两个新分类：金融和写作

-- 插入金融分类
INSERT INTO categories (name, name_en, icon, description, sort_order) VALUES
('金融', 'finance', 'currency-dollar', '金融分析、投资理财、财务管理类提示词', 200)
ON CONFLICT (name) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 插入写作分类
INSERT INTO categories (name, name_en, icon, description, sort_order) VALUES
('写作', 'writing', 'pencil-square', '文章写作、内容创作、写作技巧类提示词', 210)
ON CONFLICT (name) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 添加注释说明此次更新
COMMENT ON TABLE categories IS '分类表，现包含22个预设分类，新增金融和写作分类';
