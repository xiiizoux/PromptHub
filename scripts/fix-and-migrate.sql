-- 修复表结构并完成迁移
-- 1. 为prompt_versions表添加content字段
-- 2. 完成数据迁移

BEGIN;

-- 步骤1: 为prompt_versions表添加content字段
ALTER TABLE prompt_versions ADD COLUMN IF NOT EXISTS content TEXT;

-- 步骤2: 删除可能导致问题的索引
DROP INDEX IF EXISTS idx_prompts_content_basic;
DROP INDEX IF EXISTS idx_prompt_versions_content_basic;
DROP INDEX IF EXISTS idx_prompts_content_gin;
DROP INDEX IF EXISTS idx_prompt_versions_content_gin;

-- 步骤3: 创建内容提取函数
CREATE OR REPLACE FUNCTION extract_content_from_messages(messages_data jsonb)
RETURNS text AS $$
DECLARE
    result text := '';
    msg jsonb;
    content_text text;
BEGIN
    -- 如果messages为空或null，返回空字符串
    IF messages_data IS NULL OR jsonb_array_length(messages_data) = 0 THEN
        RETURN '';
    END IF;
    
    -- 遍历messages数组
    FOR msg IN SELECT * FROM jsonb_array_elements(messages_data)
    LOOP
        -- 提取content字段
        IF msg ? 'content' THEN
            -- 处理不同的content格式
            IF jsonb_typeof(msg->'content') = 'string' THEN
                content_text := msg->>'content';
            ELSIF jsonb_typeof(msg->'content') = 'object' AND msg->'content' ? 'text' THEN
                content_text := msg->'content'->>'text';
            ELSIF jsonb_typeof(msg->'content') = 'object' AND msg->'content' ? 'content' THEN
                content_text := msg->'content'->>'content';
            ELSE
                content_text := msg->>'content';
            END IF;
            
            -- 添加到结果中
            IF content_text IS NOT NULL AND trim(content_text) != '' THEN
                IF result != '' THEN
                    result := result || E'\n\n';
                END IF;
                result := result || trim(content_text);
            END IF;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 步骤4: 迁移prompts表中的剩余记录
UPDATE prompts 
SET content = extract_content_from_messages(messages),
    updated_at = NOW()
WHERE (content IS NULL OR content = '') 
  AND messages IS NOT NULL 
  AND messages::text != '[]'
  AND messages::text != '';

-- 步骤5: 迁移prompt_versions表中的记录
UPDATE prompt_versions 
SET content = extract_content_from_messages(messages)
WHERE (content IS NULL OR content = '') 
  AND messages IS NOT NULL 
  AND messages::text != '[]'
  AND messages::text != '';

-- 步骤6: 对于仍然为空的content，使用description作为备选
UPDATE prompts 
SET content = COALESCE(description, ''),
    updated_at = NOW()
WHERE content IS NULL OR content = '';

UPDATE prompt_versions 
SET content = COALESCE(description, '')
WHERE content IS NULL OR content = '';

-- 步骤7: 验证迁移结果
DO $$
DECLARE
    prompts_empty integer;
    versions_empty integer;
    prompts_total integer;
    versions_total integer;
BEGIN
    -- 统计空content的记录
    SELECT COUNT(*) INTO prompts_empty FROM prompts WHERE content IS NULL OR content = '';
    SELECT COUNT(*) INTO versions_empty FROM prompt_versions WHERE content IS NULL OR content = '';
    
    -- 统计总记录数
    SELECT COUNT(*) INTO prompts_total FROM prompts;
    SELECT COUNT(*) INTO versions_total FROM prompt_versions;
    
    RAISE NOTICE '=== 迁移完成统计 ===';
    RAISE NOTICE 'prompts表: 总记录 %, 空content记录 %', prompts_total, prompts_empty;
    RAISE NOTICE 'prompt_versions表: 总记录 %, 空content记录 %', versions_total, versions_empty;
    
    IF prompts_empty = 0 AND versions_empty = 0 THEN
        RAISE NOTICE '✅ 所有记录迁移完成！';
    ELSE
        RAISE NOTICE '⚠️ 仍有 % 条prompts记录和 % 条versions记录的content为空', prompts_empty, versions_empty;
    END IF;
END $$;

-- 步骤8: 重新创建适合的索引
CREATE INDEX IF NOT EXISTS idx_prompts_content_gin ON prompts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_prompt_versions_content_gin ON prompt_versions USING gin(to_tsvector('english', content));

-- 为短内容创建部分B-tree索引
CREATE INDEX IF NOT EXISTS idx_prompts_content_prefix ON prompts (left(content, 100)) WHERE length(content) <= 100;
CREATE INDEX IF NOT EXISTS idx_prompt_versions_content_prefix ON prompt_versions (left(content, 100)) WHERE length(content) <= 100;

-- 清理函数
DROP FUNCTION extract_content_from_messages(jsonb);

COMMIT;

-- 最终验证
SELECT 
    'prompts' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE content IS NOT NULL AND content != '') as has_content,
    COUNT(*) FILTER (WHERE content IS NULL OR content = '') as empty_content
FROM prompts
UNION ALL
SELECT 
    'prompt_versions' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE content IS NOT NULL AND content != '') as has_content,
    COUNT(*) FILTER (WHERE content IS NULL OR content = '') as empty_content
FROM prompt_versions;
