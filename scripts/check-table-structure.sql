-- 检查表结构
-- 查看prompts和prompt_versions表的字段

-- 1. 检查prompts表结构
SELECT 
    'prompts' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'prompts' 
ORDER BY ordinal_position;

-- 2. 检查prompt_versions表结构
SELECT 
    'prompt_versions' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'prompt_versions' 
ORDER BY ordinal_position;

-- 3. 检查是否存在content字段
SELECT 
    table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = t.table_name AND column_name = 'content'
    ) THEN 'YES' ELSE 'NO' END as has_content_field,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = t.table_name AND column_name = 'messages'
    ) THEN 'YES' ELSE 'NO' END as has_messages_field
FROM (VALUES ('prompts'), ('prompt_versions')) as t(table_name);

-- 4. 如果prompt_versions表没有content字段，显示需要添加的SQL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prompt_versions' AND column_name = 'content'
    ) THEN
        RAISE NOTICE '需要为prompt_versions表添加content字段:';
        RAISE NOTICE 'ALTER TABLE prompt_versions ADD COLUMN content TEXT;';
    END IF;
END $$;
