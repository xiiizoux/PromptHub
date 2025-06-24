-- 修复prompts表的外键约束问题
-- 将user_id外键从auth.users改为users表，解决API密钥用户认证与数据库约束不匹配的问题

-- 1. 删除现有的外键约束
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_user_id_fkey;

-- 2. 添加新的外键约束，引用users表而不是auth.users表
ALTER TABLE prompts 
ADD CONSTRAINT prompts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. 同样修复其他相关表的外键约束
ALTER TABLE prompt_versions DROP CONSTRAINT IF EXISTS prompt_versions_user_id_fkey;
ALTER TABLE prompt_versions 
ADD CONSTRAINT prompt_versions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE prompt_usage DROP CONSTRAINT IF EXISTS prompt_usage_user_id_fkey;
ALTER TABLE prompt_usage 
ADD CONSTRAINT prompt_usage_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE prompt_feedback DROP CONSTRAINT IF EXISTS prompt_feedback_user_id_fkey;
ALTER TABLE prompt_feedback 
ADD CONSTRAINT prompt_feedback_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE prompt_collaborators DROP CONSTRAINT IF EXISTS prompt_collaborators_user_id_fkey;
ALTER TABLE prompt_collaborators 
ADD CONSTRAINT prompt_collaborators_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE prompt_audit_logs DROP CONSTRAINT IF EXISTS prompt_audit_logs_user_id_fkey;
ALTER TABLE prompt_audit_logs 
ADD CONSTRAINT prompt_audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_user_id_fkey;
ALTER TABLE api_keys 
ADD CONSTRAINT api_keys_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 4. 修复created_by和last_modified_by字段的外键约束
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_created_by_fkey;
ALTER TABLE prompts 
ADD CONSTRAINT prompts_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_last_modified_by_fkey;
ALTER TABLE prompts 
ADD CONSTRAINT prompts_last_modified_by_fkey 
FOREIGN KEY (last_modified_by) REFERENCES users(id) ON DELETE SET NULL;

-- 5. 修复A/B测试表的外键约束
ALTER TABLE prompt_ab_tests DROP CONSTRAINT IF EXISTS prompt_ab_tests_created_by_fkey;
ALTER TABLE prompt_ab_tests 
ADD CONSTRAINT prompt_ab_tests_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE prompt_collaborators DROP CONSTRAINT IF EXISTS prompt_collaborators_granted_by_fkey;
ALTER TABLE prompt_collaborators 
ADD CONSTRAINT prompt_collaborators_granted_by_fkey 
FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL;

-- 6. 添加注释说明修复内容
COMMENT ON CONSTRAINT prompts_user_id_fkey ON prompts IS '外键约束已修复：现在引用users表而不是auth.users表，解决API密钥认证与数据库约束不匹配的问题';