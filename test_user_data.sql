-- 测试用户数据的SQL查询
-- 用于检查数据库中的用户和提示词数据

-- 1. 检查 users 表中的数据
SELECT 
    id,
    email,
    display_name,
    username,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. 检查 prompts 表中的数据
SELECT 
    id,
    name,
    user_id,
    created_by,
    is_public,
    created_at
FROM prompts 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. 检查是否有提示词的 user_id 在 users 表中不存在
SELECT 
    p.id as prompt_id,
    p.name as prompt_name,
    p.user_id,
    u.id as user_exists,
    u.display_name
FROM prompts p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.user_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. 检查是否有用户没有 display_name
SELECT 
    id,
    email,
    display_name,
    username
FROM users 
WHERE display_name IS NULL OR display_name = ''
LIMIT 10;

-- 5. 统计数据
SELECT 
    'prompts' as table_name,
    COUNT(*) as total_count,
    COUNT(user_id) as with_user_id,
    COUNT(*) - COUNT(user_id) as without_user_id
FROM prompts
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as total_count,
    COUNT(display_name) as with_display_name,
    COUNT(*) - COUNT(display_name) as without_display_name
FROM users;

-- 6. 检查特定提示词的详细信息（替换为实际的提示词ID）
-- SELECT 
--     p.*,
--     u.display_name,
--     u.email
-- FROM prompts p
-- LEFT JOIN users u ON p.user_id = u.id
-- WHERE p.id = 'your-prompt-id-here';
