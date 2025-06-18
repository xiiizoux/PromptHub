-- 修复分类一致性问题
-- 将所有"未分类"记录更新为"通用"

-- 更新 prompts 表中的分类
UPDATE prompts 
SET category = '通用' 
WHERE category = '未分类';

-- 更新 prompt_versions 表中的分类
UPDATE prompt_versions 
SET category = '通用' 
WHERE category = '未分类';

-- 添加注释说明此次修复
COMMENT ON TABLE prompts IS '提示词主表，category字段统一使用"通用"作为默认分类';
COMMENT ON TABLE prompt_versions IS '提示词版本表，category字段统一使用"通用"作为默认分类'; 