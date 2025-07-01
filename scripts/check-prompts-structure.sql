-- 检查prompts表的实际结构
-- 查看所有字段，以便正确创建重排脚本

SELECT 
    ordinal_position,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'prompts' 
ORDER BY ordinal_position;
