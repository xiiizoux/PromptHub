-- 检查未完成迁移的记录
-- 查找content为空但messages有数据的记录

-- 1. 检查prompts表
SELECT 
    'prompts' as table_name,
    id,
    name,
    CASE 
        WHEN content IS NULL THEN 'NULL'
        WHEN content = '' THEN 'EMPTY'
        ELSE 'HAS_CONTENT'
    END as content_status,
    CASE 
        WHEN messages IS NULL THEN 'NULL'
        WHEN messages::text = '[]' THEN 'EMPTY_ARRAY'
        WHEN messages::text = '' THEN 'EMPTY_STRING'
        ELSE 'HAS_MESSAGES'
    END as messages_status,
    LENGTH(messages::text) as messages_length,
    created_at
FROM prompts 
WHERE (content IS NULL OR content = '') 
  AND messages IS NOT NULL 
  AND messages::text != '[]'
  AND messages::text != ''
ORDER BY created_at DESC;

-- 2. 检查prompt_versions表
SELECT 
    'prompt_versions' as table_name,
    id,
    prompt_id,
    version,
    CASE 
        WHEN content IS NULL THEN 'NULL'
        WHEN content = '' THEN 'EMPTY'
        ELSE 'HAS_CONTENT'
    END as content_status,
    CASE 
        WHEN messages IS NULL THEN 'NULL'
        WHEN messages::text = '[]' THEN 'EMPTY_ARRAY'
        WHEN messages::text = '' THEN 'EMPTY_STRING'
        ELSE 'HAS_MESSAGES'
    END as messages_status,
    LENGTH(messages::text) as messages_length,
    created_at
FROM prompt_versions 
WHERE (content IS NULL OR content = '') 
  AND messages IS NOT NULL 
  AND messages::text != '[]'
  AND messages::text != ''
ORDER BY created_at DESC;

-- 3. 显示具体的messages内容（前5条记录）
SELECT 
    'Sample messages content' as info,
    id,
    name,
    messages::text as messages_content
FROM prompts 
WHERE (content IS NULL OR content = '') 
  AND messages IS NOT NULL 
  AND messages::text != '[]'
  AND messages::text != ''
LIMIT 5;
