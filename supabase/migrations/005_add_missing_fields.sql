-- 添加缺失的字段到prompts表
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS input_variables TEXT[];
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS compatible_models TEXT[];
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS template_format TEXT DEFAULT 'text';

-- 更新现有记录的默认值
UPDATE prompts 
SET input_variables = ARRAY[]::TEXT[]
WHERE input_variables IS NULL;

UPDATE prompts 
SET compatible_models = ARRAY['GPT-4', 'GPT-3.5', 'Claude-2']::TEXT[]
WHERE compatible_models IS NULL;

UPDATE prompts 
SET template_format = 'text'
WHERE template_format IS NULL;

-- 添加注释
COMMENT ON COLUMN prompts.input_variables IS '提示词输入变量数组';
COMMENT ON COLUMN prompts.compatible_models IS '兼容的AI模型列表';
COMMENT ON COLUMN prompts.template_format IS '模板格式：text, json等'; 