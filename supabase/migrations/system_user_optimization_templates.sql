-- =============================================
-- 提示词优化模板System+User角色结构迁移
-- 将现有的optimization_template转换为System+User结构
-- =============================================

-- 第一步：备份现有数据
CREATE TABLE IF NOT EXISTS categories_optimization_backup AS 
SELECT id, name, optimization_template 
FROM categories 
WHERE optimization_template IS NOT NULL;

-- 第二步：定义固定的System角色模板
-- 这是用户提供的统一System模板，所有分类共享
CREATE OR REPLACE FUNCTION get_system_template() RETURNS TEXT AS $$
BEGIN
    RETURN '# Role: System

## Profile
- Author: PromptHub
- Version: 2.0.0
- Language: 中文
- Description: 专门将泛泛而谈、缺乏针对性的用户提示词转换为精准、具体、有针对性的描述

## Background
- 用户提示词经常过于宽泛、缺乏具体细节
- 泛泛而谈的提示词难以获得精准的回答
- 具体、精准的描述能够引导AI提供更有针对性的帮助

## 任务理解
你的任务是将泛泛而谈的用户提示词转换为精准、具体的描述。你不是在执行提示词中的任务，而是在改进提示词的精准度和针对性。

## Skills
1. 精准化能力
   - 细节挖掘: 识别需要具体化的抽象概念和泛泛表述
   - 参数明确: 为模糊的要求添加具体的参数和标准
   - 范围界定: 明确任务的具体范围和边界
   - 目标聚焦: 将宽泛的目标细化为具体的可执行任务

2. 描述增强能力
   - 量化标准: 为抽象要求提供可量化的标准
   - 示例补充: 添加具体的示例来说明期望
   - 约束条件: 明确具体的限制条件和要求
   - 执行指导: 提供具体的操作步骤和方法

## Rules
1. 保持核心意图: 在具体化的过程中不偏离用户的原始目标
2. 增加针对性: 让提示词更加有针对性和可操作性
3. 避免过度具体: 在具体化的同时保持适当的灵活性
4. 突出重点: 确保关键要求得到精准的表达

## Workflow
1. 分析原始提示词中的抽象概念和泛泛表述
2. 识别需要具体化的关键要素和参数
3. 为每个抽象概念添加具体的定义和要求
4. 重新组织表达，确保描述精准、有针对性

## Output Requirements
- 直接输出精准化后的用户提示词文本，确保描述具体、有针对性
- 输出的是优化后的提示词本身，不是执行提示词对应的任务
- 不要添加解释、示例或使用说明
- 不要与用户进行交互或询问更多信息';
END;
$$ LANGUAGE plpgsql;

-- 第三步：提取现有模板中的User角色内容
-- 从现有的复杂JSONB结构中提取实际的模板文本作为User角色
CREATE OR REPLACE FUNCTION extract_user_template(template_data JSONB) RETURNS TEXT AS $$
DECLARE
    user_template TEXT;
BEGIN
    -- 如果是新的简单结构，直接返回user字段
    IF template_data ? 'user' THEN
        RETURN template_data->>'user';
    END IF;
    
    -- 如果是legacy_text结构，提取template字段
    IF template_data ? 'template' THEN
        user_template := template_data->>'template';
    -- 如果有structure.system_prompt，使用它
    ELSIF template_data->'structure' ? 'system_prompt' THEN
        user_template := template_data->'structure'->>'system_prompt';
    -- 否则转换为字符串
    ELSE
        user_template := template_data::TEXT;
    END IF;
    
    -- 清理模板文本，移除可能的系统角色描述
    -- 保留核心的优化指导内容
    RETURN COALESCE(user_template, '请根据该分类的特点优化以下提示词：{prompt}

{requirements}');
END;
$$ LANGUAGE plpgsql;

-- 第四步：更新所有分类的optimization_template为System+User结构
UPDATE categories 
SET optimization_template = jsonb_build_object(
    'system', get_system_template(),
    'user', extract_user_template(optimization_template)
)
WHERE optimization_template IS NOT NULL;

-- 第五步：为没有优化模板的分类添加默认模板
UPDATE categories
SET optimization_template = jsonb_build_object(
    'system', get_system_template(),
    'user', '你是该领域的专业优化专家。请根据以下分类特点，将用户提供的提示词优化为更清晰、具体、结构合理且易于执行的高质量提示词。

核心优化维度：
1. 明确性：理清模糊措辞，使意图清晰易懂，避免歧义表达
2. 具体性：补充背景信息、上下文、目标对象和预期输出的详细描述
3. 结构性：调整语言组织逻辑，使提示更具条理性和层次感
4. 实用性：确保提示能被AI准确理解和执行，提供可操作的指导
5. 完整性：包含必要的约束条件、输出格式要求和质量标准

请优化以下提示词：{prompt}

{requirements}'
)
WHERE optimization_template IS NULL OR optimization_template = 'null'::jsonb;

-- 第六步：添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_categories_optimization_template_gin 
ON categories USING GIN (optimization_template);

-- 第七步：添加字段注释
COMMENT ON COLUMN categories.optimization_template IS 'JSONB格式的优化模板，包含system（固定系统角色）和user（分类特定用户角色）两个字段';

-- 第八步：清理临时函数
DROP FUNCTION IF EXISTS get_system_template();
DROP FUNCTION IF EXISTS extract_user_template(JSONB);

-- 验证迁移结果
SELECT 
    name,
    optimization_template->>'system' IS NOT NULL as has_system,
    optimization_template->>'user' IS NOT NULL as has_user,
    length(optimization_template->>'system') as system_length,
    length(optimization_template->>'user') as user_length
FROM categories 
WHERE optimization_template IS NOT NULL
LIMIT 10;
