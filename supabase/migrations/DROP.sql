-- 删除现有的策略
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || 
                quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- 删除所有表（按正确的依赖顺序）
DROP TABLE IF EXISTS prompt_usage, prompt_feedback, prompt_performance CASCADE;
DROP TABLE IF EXISTS prompt_versions, prompt_collaborators, prompt_audit_logs CASCADE;
DROP TABLE IF EXISTS prompt_ab_tests CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 删除自定义类型
DROP TYPE IF EXISTS prompt_category CASCADE;

-- 删除触发器和函数
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_prompt_performance CASCADE;
DROP FUNCTION IF EXISTS update_prompt_performance_rating CASCADE;
DROP FUNCTION IF EXISTS log_prompt_changes CASCADE;
DROP FUNCTION IF EXISTS get_auth_uid CASCADE;
DROP FUNCTION IF EXISTS user_owns_prompt CASCADE;
DROP FUNCTION IF EXISTS is_prompt_public CASCADE;