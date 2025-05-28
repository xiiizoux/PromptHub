-- 修复2: multiple_permissive_policies - 多个同类型权限策略问题
-- 合并同一表上同一角色和操作的多个permissive策略，提高查询性能

-- 1. 合并prompt_versions表的重复策略
DROP POLICY IF EXISTS "Users can view own prompt versions" ON prompt_versions;
DROP POLICY IF EXISTS "Everyone can view public prompt versions" ON prompt_versions;
DROP POLICY IF EXISTS "Users can manage own prompt versions" ON prompt_versions;

-- 使用不同的名称为每个操作创建策略
CREATE POLICY "Comprehensive prompt versions access" ON prompt_versions
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM prompts WHERE id = prompt_id)
    OR prompt_id IN (SELECT id FROM prompts WHERE is_public = true)
  );

CREATE POLICY "Users can insert own prompt versions" ON prompt_versions
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM prompts WHERE id = prompt_id)
  );

CREATE POLICY "Users can update own prompt versions" ON prompt_versions
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM prompts WHERE id = prompt_id)
  );

CREATE POLICY "Users can delete own prompt versions" ON prompt_versions
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM prompts WHERE id = prompt_id)
  );

-- 2. 合并prompt_performance表的重复策略
DROP POLICY IF EXISTS "Users can view performance of own prompts" ON prompt_performance;
DROP POLICY IF EXISTS "Everyone can view performance of public prompts" ON prompt_performance;

CREATE POLICY "Comprehensive performance view access" ON prompt_performance
  FOR SELECT USING (
    prompt_id IN (SELECT id FROM prompts WHERE user_id = auth.uid() OR is_public = true)
  );

-- 3. 合并prompt_ab_tests表的重复策略
DROP POLICY IF EXISTS "Users can view own AB tests" ON prompt_ab_tests;
DROP POLICY IF EXISTS "Users can manage own AB tests" ON prompt_ab_tests;

-- 使用一个策略替代多个
CREATE POLICY "Users comprehensive AB tests management" ON prompt_ab_tests
  FOR ALL USING (created_by = auth.uid());
