-- 修复1: auth_rls_initplan - Auth RLS函数重复评估问题
-- 创建辅助函数来优化auth.uid()调用，减少RLS策略中的重复计算

-- 创建辅助函数来优化auth.uid()调用
CREATE OR REPLACE FUNCTION get_auth_uid()
RETURNS uuid
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid()
$$;

-- 创建一个用于RLS策略的更高效的用户验证函数
CREATE OR REPLACE FUNCTION user_owns_prompt(prompt_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM prompts 
    WHERE id = prompt_id 
    AND (created_by = get_auth_uid() OR user_id = get_auth_uid())
  );
$$;

-- 创建检查提示词是否公开的函数
CREATE OR REPLACE FUNCTION is_prompt_public(prompt_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_public FROM prompts WHERE id = prompt_id;
$$;

-- 示例：如何在RLS策略中使用这些函数
-- DROP POLICY IF EXISTS "Users can update their own prompts or collaborate" ON prompts;
-- CREATE POLICY "Users can update their own prompts or collaborate" ON prompts
--   FOR UPDATE USING (
--     created_by = get_auth_uid() OR 
--     user_id = get_auth_uid() OR
--     (is_public = true AND allow_collaboration = true) OR
--     EXISTS (
--       SELECT 1 FROM prompt_collaborators 
--       WHERE prompt_collaborators.prompt_id = prompts.id 
--       AND prompt_collaborators.user_id = get_auth_uid()
--     )
--   );
