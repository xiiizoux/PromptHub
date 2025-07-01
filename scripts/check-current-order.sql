-- 检查当前prompts表的字段顺序
SELECT 
    ordinal_position,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prompts' 
ORDER BY ordinal_position;
