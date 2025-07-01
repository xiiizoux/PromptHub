-- 检查migration_status字段的实际值
SELECT 
    migration_status,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM prompts), 2) as percentage
FROM prompts 
GROUP BY migration_status 
ORDER BY count DESC;

-- 查看前几条记录的实际值
SELECT 
    id,
    name,
    migration_status,
    LENGTH(migration_status) as status_length,
    ASCII(SUBSTRING(migration_status, 1, 1)) as first_char_ascii
FROM prompts 
LIMIT 5;
