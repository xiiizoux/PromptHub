-- =============================================
-- 移除数据库中的System模板，只保留User模板
-- System模板现在由代码管理（locales/目录）
-- 数据库只存储分类特定的User模板
-- =============================================

-- 第一步：备份现有数据
CREATE TABLE IF NOT EXISTS categories_optimization_backup_user_only AS 
SELECT id, name, optimization_template 
FROM categories 
WHERE optimization_template IS NOT NULL;

-- 第二步：提取User模板的函数
-- 从System+User结构中提取User部分，如果没有system字段则直接使用原模板
CREATE OR REPLACE FUNCTION extract_user_only_template(template_data JSONB) RETURNS TEXT AS $$
DECLARE
    user_template TEXT;
BEGIN
    -- 如果是新的System+User结构，提取user字段
    IF template_data ? 'user' THEN
        user_template := template_data->>'user';
        -- 如果有user字段且不为空，直接返回
        IF user_template IS NOT NULL AND user_template != '' THEN
            RETURN user_template;
        END IF;
    END IF;
    
    -- 如果是legacy_text结构，提取template字段
    IF template_data ? 'template' THEN
        user_template := template_data->>'template';
    -- 如果有structure.system_prompt，使用它（这是旧格式）
    ELSIF template_data->'structure' ? 'system_prompt' THEN
        user_template := template_data->'structure'->>'system_prompt';
    -- 否则转换为字符串（可能是旧格式的纯文本）
    ELSE
        user_template := template_data::TEXT;
    END IF;
    
    -- 如果提取的模板为空，返回默认User模板
    RETURN COALESCE(user_template, '你是该领域的专业优化专家。请根据以下分类特点，将用户提供的提示词优化为更清晰、具体、结构合理且易于执行的高质量提示词。

核心优化维度：
1. 明确性：理清模糊措辞，使意图清晰易懂，避免歧义表达
2. 具体性：补充背景信息、上下文、目标对象和预期输出的详细描述
3. 结构性：调整语言组织逻辑，使提示更具条理性和层次感
4. 实用性：确保提示能被AI准确理解和执行，提供可操作的指导
5. 完整性：包含必要的约束条件、输出格式要求和质量标准

请优化以下提示词：{prompt}

{requirements}');
END;
$$ LANGUAGE plpgsql;

-- 第三步：更新所有分类的optimization_template，只保留User模板（纯文本）
-- 如果是System+User结构，只提取user部分；如果是其他格式，提取对应的模板文本
UPDATE categories 
SET optimization_template = extract_user_only_template(optimization_template)::JSONB
WHERE optimization_template IS NOT NULL;

-- 第四步：对于已经是纯文本的情况，保持不变
-- （如果optimization_template已经是字符串格式，直接保留）

-- 第五步：更新字段注释，说明现在只存储User模板
COMMENT ON COLUMN categories.optimization_template IS 
'优化模板文本（纯文本或JSONB格式的User角色模板）。System模板由代码管理（locales/目录），不在数据库中存储。';

-- 第六步：清理临时函数
DROP FUNCTION IF EXISTS extract_user_only_template(JSONB);

-- 验证迁移结果：检查是否成功移除了system字段
SELECT 
    name,
    CASE 
        WHEN optimization_template::text LIKE '{%system%}' THEN 'Has system field (needs cleanup)'
        WHEN optimization_template::text LIKE '"# Role: System%' THEN 'Has system template text (needs cleanup)'
        ELSE 'User-only template (correct)'
    END as template_status,
    length(optimization_template::text) as template_length
FROM categories 
WHERE optimization_template IS NOT NULL
LIMIT 10;

