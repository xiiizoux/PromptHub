-- 修复 prompts 表外键约束问题
-- 确保所有外键都指向正确的 users 表，而不是 auth.users

-- 1. 检查当前外键约束
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    a.attname AS column_name,
    af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f'
AND conrelid::regclass::text IN ('prompts', 'prompt_versions', 'prompt_usage', 'prompt_feedback', 'api_keys')
ORDER BY table_name, constraint_name;

-- 2. 删除可能存在的错误外键约束（指向auth.users的）
-- 这些命令是安全的，如果约束不存在，PostgreSQL会忽略
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_user_id_fkey;
ALTER TABLE prompt_versions DROP CONSTRAINT IF EXISTS prompt_versions_user_id_fkey;
ALTER TABLE prompt_usage DROP CONSTRAINT IF EXISTS prompt_usage_user_id_fkey;
ALTER TABLE prompt_feedback DROP CONSTRAINT IF EXISTS prompt_feedback_user_id_fkey;

-- 3. 重新创建正确的外键约束（指向users表）
ALTER TABLE prompts 
ADD CONSTRAINT prompts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE prompt_versions 
ADD CONSTRAINT prompt_versions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE prompt_usage 
ADD CONSTRAINT prompt_usage_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE prompt_feedback 
ADD CONSTRAINT prompt_feedback_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. 验证修复结果
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    a.attname AS column_name,
    af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f'
AND conrelid::regclass::text IN ('prompts', 'prompt_versions', 'prompt_usage', 'prompt_feedback')
ORDER BY table_name, constraint_name;

-- 5. 检查是否有孤立的用户数据
SELECT 
    'api_keys中存在但users表中不存在的用户ID:' as check_type,
    ak.user_id
FROM api_keys ak
LEFT JOIN users u ON ak.user_id = u.id
WHERE u.id IS NULL;

SELECT 
    'prompts中存在但users表中不存在的用户ID:' as check_type,
    p.user_id
FROM prompts p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL
LIMIT 10;