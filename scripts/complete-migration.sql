-- 完成剩余的数据迁移
-- 将messages字段的数据迁移到content字段

BEGIN;

-- 首先检查并添加缺失的content字段
DO $$
BEGIN
    -- 检查prompts表是否有content字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'prompts' AND column_name = 'content'
    ) THEN
        ALTER TABLE prompts ADD COLUMN content TEXT;
        RAISE NOTICE '已为prompts表添加content字段';
    END IF;

    -- 检查prompt_versions表是否有content字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'prompt_versions' AND column_name = 'content'
    ) THEN
        ALTER TABLE prompt_versions ADD COLUMN content TEXT;
        RAISE NOTICE '已为prompt_versions表添加content字段';
    END IF;
END $$;

-- 处理索引问题 - 删除可能导致问题的索引
DROP INDEX IF EXISTS idx_prompts_content_basic;
DROP INDEX IF EXISTS idx_prompt_versions_content_basic;
DROP INDEX IF EXISTS idx_prompts_content_gin;
DROP INDEX IF EXISTS idx_prompt_versions_content_gin;

-- 创建迁移函数
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

-- 1. 迁移prompts表中的剩余记录
DO $$
DECLARE
    rec RECORD;
    extracted_content text;
    update_count integer := 0;
BEGIN
    RAISE NOTICE '开始迁移prompts表中的剩余记录...';
    
    FOR rec IN 
        SELECT id, name, messages 
        FROM prompts 
        WHERE (content IS NULL OR content = '') 
          AND messages IS NOT NULL 
          AND messages::text != '[]'
          AND messages::text != ''
    LOOP
        -- 提取content
        extracted_content := extract_content_from_messages(rec.messages);
        
        -- 更新记录
        IF extracted_content IS NOT NULL AND trim(extracted_content) != '' THEN
            UPDATE prompts 
            SET content = extracted_content,
                updated_at = NOW()
            WHERE id = rec.id;
            
            update_count := update_count + 1;
            RAISE NOTICE '更新记录: % - %', rec.id, rec.name;
        ELSE
            -- 如果提取失败，使用description作为备选
            UPDATE prompts 
            SET content = COALESCE(description, ''),
                updated_at = NOW()
            WHERE id = rec.id;
            
            update_count := update_count + 1;
            RAISE NOTICE '使用description作为content: % - %', rec.id, rec.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '完成prompts表迁移，更新了 % 条记录', update_count;
END $$;

-- 2. 迁移prompt_versions表中的剩余记录
DO $$
DECLARE
    rec RECORD;
    extracted_content text;
    update_count integer := 0;
    has_content_field boolean;
BEGIN
    -- 检查prompt_versions表是否有content字段
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'prompt_versions' AND column_name = 'content'
    ) INTO has_content_field;

    IF NOT has_content_field THEN
        RAISE NOTICE 'prompt_versions表没有content字段，跳过迁移';
        RETURN;
    END IF;

    RAISE NOTICE '开始迁移prompt_versions表中的剩余记录...';

    FOR rec IN
        SELECT id, prompt_id, version, messages
        FROM prompt_versions
        WHERE (content IS NULL OR content = '')
          AND messages IS NOT NULL
          AND messages::text != '[]'
          AND messages::text != ''
    LOOP
        -- 提取content
        extracted_content := extract_content_from_messages(rec.messages);
        
        -- 更新记录
        IF extracted_content IS NOT NULL AND trim(extracted_content) != '' THEN
            UPDATE prompt_versions 
            SET content = extracted_content,
                updated_at = NOW()
            WHERE id = rec.id;
            
            update_count := update_count + 1;
            RAISE NOTICE '更新版本记录: % (prompt_id: %, version: %)', rec.id, rec.prompt_id, rec.version;
        ELSE
            -- 如果提取失败，使用description作为备选
            UPDATE prompt_versions 
            SET content = COALESCE(description, ''),
                updated_at = NOW()
            WHERE id = rec.id;
            
            update_count := update_count + 1;
            RAISE NOTICE '使用description作为content (版本): % (prompt_id: %, version: %)', rec.id, rec.prompt_id, rec.version;
        END IF;
    END LOOP;
    
    RAISE NOTICE '完成prompt_versions表迁移，更新了 % 条记录', update_count;
END $$;

-- 3. 验证迁移结果
DO $$
DECLARE
    prompts_remaining integer;
    versions_remaining integer;
    has_versions_content_field boolean;
BEGIN
    -- 检查prompts表剩余记录
    SELECT COUNT(*) INTO prompts_remaining
    FROM prompts
    WHERE (content IS NULL OR content = '')
      AND messages IS NOT NULL
      AND messages::text != '[]'
      AND messages::text != '';

    -- 检查prompt_versions表是否有content字段
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'prompt_versions' AND column_name = 'content'
    ) INTO has_versions_content_field;

    -- 检查prompt_versions表剩余记录（如果有content字段）
    IF has_versions_content_field THEN
        SELECT COUNT(*) INTO versions_remaining
        FROM prompt_versions
        WHERE (content IS NULL OR content = '')
          AND messages IS NOT NULL
          AND messages::text != '[]'
          AND messages::text != '';
    ELSE
        versions_remaining := 0;
        RAISE NOTICE 'prompt_versions表没有content字段，无需检查';
    END IF;

    RAISE NOTICE '迁移完成验证:';
    RAISE NOTICE '- prompts表剩余未迁移记录: %', prompts_remaining;
    RAISE NOTICE '- prompt_versions表剩余未迁移记录: %', versions_remaining;

    IF prompts_remaining = 0 AND versions_remaining = 0 THEN
        RAISE NOTICE '✅ 所有记录迁移完成！';
    ELSE
        RAISE NOTICE '⚠️ 仍有记录需要手动处理';
    END IF;
END $$;

-- 清理迁移函数
DROP FUNCTION IF EXISTS extract_content_from_messages(jsonb);

-- 重新创建适合的索引（使用GIN索引支持全文搜索，不受长度限制）
CREATE INDEX IF NOT EXISTS idx_prompts_content_gin ON prompts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_prompt_versions_content_gin ON prompt_versions USING gin(to_tsvector('english', content));

-- 为短内容创建部分B-tree索引（只索引前100个字符）
CREATE INDEX IF NOT EXISTS idx_prompts_content_prefix ON prompts (left(content, 100)) WHERE length(content) <= 100;
CREATE INDEX IF NOT EXISTS idx_prompt_versions_content_prefix ON prompt_versions (left(content, 100)) WHERE length(content) <= 100;

COMMIT;
