-- =============================================
-- 简化版优化模板迁移：只存储User角色模板
-- System角色模板硬编码到代码中
-- 避免复杂的类型转换，使用分步处理
-- =============================================

-- 第一步：备份现有数据
CREATE TABLE IF NOT EXISTS categories_optimization_backup_v3 AS 
SELECT id, name, optimization_template 
FROM categories 
WHERE optimization_template IS NOT NULL;

-- 第二步：添加临时列用于存储提取的用户模板
ALTER TABLE categories ADD COLUMN IF NOT EXISTS temp_user_template TEXT;

-- 第三步：提取用户模板到临时列（分情况处理）
-- 处理字符串类型的模板
UPDATE categories 
SET temp_user_template = optimization_template #>> '{}'
WHERE optimization_template IS NOT NULL 
  AND jsonb_typeof(optimization_template) = 'string';

-- 处理有user字段的新格式
UPDATE categories 
SET temp_user_template = optimization_template ->> 'user'
WHERE optimization_template IS NOT NULL 
  AND optimization_template ? 'user'
  AND temp_user_template IS NULL;

-- 处理有template字段的legacy格式
UPDATE categories 
SET temp_user_template = optimization_template ->> 'template'
WHERE optimization_template IS NOT NULL 
  AND optimization_template ? 'template'
  AND temp_user_template IS NULL;

-- 处理有structure.system_prompt的格式
UPDATE categories 
SET temp_user_template = optimization_template -> 'structure' ->> 'system_prompt'
WHERE optimization_template IS NOT NULL 
  AND optimization_template -> 'structure' ? 'system_prompt'
  AND temp_user_template IS NULL;

-- 处理有system_prompt字段的格式
UPDATE categories 
SET temp_user_template = optimization_template ->> 'system_prompt'
WHERE optimization_template IS NOT NULL 
  AND optimization_template ? 'system_prompt'
  AND temp_user_template IS NULL;

-- 处理其他复杂格式，转为JSON字符串
UPDATE categories 
SET temp_user_template = optimization_template::text
WHERE optimization_template IS NOT NULL 
  AND temp_user_template IS NULL;

-- 第四步：为空的用户模板设置默认值
UPDATE categories
SET temp_user_template = '你是该领域的专业优化专家。请根据以下分类特点，将用户提供的提示词优化为更清晰、具体、结构合理且易于执行的高质量提示词。

核心优化维度：
1. 明确性：理清模糊措辞，使意图清晰易懂，避免歧义表达
2. 具体性：补充背景信息、上下文、目标对象和预期输出的详细描述
3. 结构性：调整语言组织逻辑，使提示更具条理性和层次感
4. 实用性：确保提示能被AI准确理解和执行，提供可操作的指导
5. 完整性：包含必要的约束条件、输出格式要求和质量标准

请优化以下提示词：{prompt}

{requirements}'
WHERE temp_user_template IS NULL OR temp_user_template = '' OR temp_user_template = 'null';

-- 第五步：将临时列的内容转换为JSONB格式存储到optimization_template
UPDATE categories
SET optimization_template = jsonb_build_object('user', temp_user_template)
WHERE temp_user_template IS NOT NULL;

-- 第六步：为完全没有模板的分类添加默认模板
UPDATE categories
SET optimization_template = jsonb_build_object('user', '你是该领域的专业优化专家。请根据以下分类特点，将用户提供的提示词优化为更清晰、具体、结构合理且易于执行的高质量提示词。

核心优化维度：
1. 明确性：理清模糊措辞，使意图清晰易懂，避免歧义表达
2. 具体性：补充背景信息、上下文、目标对象和预期输出的详细描述
3. 结构性：调整语言组织逻辑，使提示更具条理性和层次感
4. 实用性：确保提示能被AI准确理解和执行，提供可操作的指导
5. 完整性：包含必要的约束条件、输出格式要求和质量标准

请优化以下提示词：{prompt}

{requirements}')
WHERE optimization_template IS NULL;

-- 第七步：清理临时列
ALTER TABLE categories DROP COLUMN IF EXISTS temp_user_template;

-- 第八步：添加字段注释
COMMENT ON COLUMN categories.optimization_template IS 'JSONB格式存储的User角色优化模板，包含user_template字段，System角色模板硬编码在代码中';

-- 第九步：创建优化的索引
DROP INDEX IF EXISTS idx_categories_optimization_template_gin;
CREATE INDEX IF NOT EXISTS idx_categories_optimization_user_template 
ON categories USING gin ((optimization_template -> 'user_template')) 
WHERE optimization_template IS NOT NULL;

-- 第十步：验证迁移结果
SELECT 
    name,
    optimization_template IS NOT NULL as has_template,
    jsonb_typeof(optimization_template) as template_type,
    length(optimization_template ->> 'user_template') as user_template_length,
    left(optimization_template ->> 'user_template', 50) || '...' as user_template_preview
FROM categories 
WHERE optimization_template IS NOT NULL
ORDER BY name
LIMIT 10;

-- 输出迁移统计
SELECT 
    COUNT(*) as total_categories,
    COUNT(optimization_template) as categories_with_templates,
    ROUND(COUNT(optimization_template) * 100.0 / COUNT(*), 2) as template_coverage_percent,
    AVG(length(optimization_template ->> 'user_template')) as avg_template_length
FROM categories;
