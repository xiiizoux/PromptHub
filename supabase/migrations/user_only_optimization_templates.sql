-- =============================================
-- 优化模板简化迁移：只存储User角色模板
-- System角色模板硬编码到代码中，提高性能和维护性
-- =============================================

-- 第一步：备份现有数据
CREATE TABLE IF NOT EXISTS categories_optimization_backup_v2 AS 
SELECT id, name, optimization_template 
FROM categories 
WHERE optimization_template IS NOT NULL;

-- 第二步：提取User角色模板的函数
CREATE OR REPLACE FUNCTION extract_user_only_template(template_data JSONB) RETURNS TEXT AS $$
DECLARE
    user_template TEXT;
BEGIN
    -- 如果模板为空，返回默认模板
    IF template_data IS NULL THEN
        RETURN '你是该领域的专业优化专家。请根据以下分类特点，将用户提供的提示词优化为更清晰、具体、结构合理且易于执行的高质量提示词。

核心优化维度：
1. 明确性：理清模糊措辞，使意图清晰易懂，避免歧义表达
2. 具体性：补充背景信息、上下文、目标对象和预期输出的详细描述
3. 结构性：调整语言组织逻辑，使提示更具条理性和层次感
4. 实用性：确保提示能被AI准确理解和执行，提供可操作的指导
5. 完整性：包含必要的约束条件、输出格式要求和质量标准

请优化以下提示词：{prompt}

{requirements}';
    END IF;
    
    -- 如果已经是简化的user-only格式（字符串）
    IF jsonb_typeof(template_data) = 'string' THEN
        RETURN template_data #>> '{}';
    END IF;
    
    -- 如果有user字段，直接使用
    IF template_data ? 'user' THEN
        RETURN template_data->>'user';
    END IF;
    
    -- 如果是legacy_text结构，提取template字段
    IF template_data ? 'template' THEN
        user_template := template_data->>'template';
    -- 如果有structure.system_prompt，使用它
    ELSIF template_data->'structure' ? 'system_prompt' THEN
        user_template := template_data->'structure'->>'system_prompt';
    -- 否则尝试提取其他可能的字段
    ELSIF template_data ? 'system_prompt' THEN
        user_template := template_data->>'system_prompt';
    ELSE
        -- 如果都没有，使用默认模板
        user_template := '你是该领域的专业优化专家。请根据以下分类特点，将用户提供的提示词优化为更清晰、具体、结构合理且易于执行的高质量提示词。

核心优化维度：
1. 明确性：理清模糊措辞，使意图清晰易懂，避免歧义表达
2. 具体性：补充背景信息、上下文、目标对象和预期输出的详细描述
3. 结构性：调整语言组织逻辑，使提示更具条理性和层次感
4. 实用性：确保提示能被AI准确理解和执行，提供可操作的指导
5. 完整性：包含必要的约束条件、输出格式要求和质量标准

请优化以下提示词：{prompt}

{requirements}';
    END IF;
    
    RETURN COALESCE(user_template, '请优化以下提示词：{prompt}

{requirements}');
END;
$$ LANGUAGE plpgsql;

-- 第三步：创建临时表存储转换结果
CREATE TEMP TABLE temp_user_templates AS
SELECT
    id,
    name,
    extract_user_only_template(optimization_template) as user_template
FROM categories
WHERE optimization_template IS NOT NULL;

-- 第四步：更新categories表，使用明确的类型转换
UPDATE categories
SET optimization_template = ('"' || replace(replace(t.user_template, '"', '\"'), E'\n', '\\n') || '"')::jsonb
FROM temp_user_templates t
WHERE categories.id = t.id;

-- 第五步：为没有优化模板的分类添加默认User模板
UPDATE categories
SET optimization_template = '"你是该领域的专业优化专家。请根据以下分类特点，将用户提供的提示词优化为更清晰、具体、结构合理且易于执行的高质量提示词。\\n\\n核心优化维度：\\n1. 明确性：理清模糊措辞，使意图清晰易懂，避免歧义表达\\n2. 具体性：补充背景信息、上下文、目标对象和预期输出的详细描述\\n3. 结构性：调整语言组织逻辑，使提示更具条理性和层次感\\n4. 实用性：确保提示能被AI准确理解和执行，提供可操作的指导\\n5. 完整性：包含必要的约束条件、输出格式要求和质量标准\\n\\n请优化以下提示词：{prompt}\\n\\n{requirements}"'::jsonb
WHERE optimization_template IS NULL OR optimization_template = 'null'::jsonb;

-- 第五步：添加字段注释
COMMENT ON COLUMN categories.optimization_template IS 'JSONB格式存储的User角色优化模板（纯文本），System角色模板硬编码在代码中';

-- 第六步：清理临时函数
DROP FUNCTION IF EXISTS extract_user_only_template(JSONB);

-- 第七步：验证迁移结果
SELECT 
    name,
    optimization_template IS NOT NULL as has_template,
    jsonb_typeof(optimization_template) as template_type,
    length(optimization_template #>> '{}') as template_length
FROM categories 
WHERE optimization_template IS NOT NULL
ORDER BY name
LIMIT 10;

-- 第八步：性能优化 - 由于现在是简单的文本存储，可以使用更简单的索引
DROP INDEX IF EXISTS idx_categories_optimization_template_gin;
CREATE INDEX IF NOT EXISTS idx_categories_optimization_template_text 
ON categories USING btree ((optimization_template #>> '{}')) 
WHERE optimization_template IS NOT NULL;

-- 输出迁移统计
SELECT 
    COUNT(*) as total_categories,
    COUNT(optimization_template) as categories_with_templates,
    ROUND(COUNT(optimization_template) * 100.0 / COUNT(*), 2) as template_coverage_percent
FROM categories;
