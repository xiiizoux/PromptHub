-- 首先删除现有的api_keys表上的RLS策略（如果有）
DROP POLICY IF EXISTS "用户可以查看自己的API密钥" ON api_keys;
DROP POLICY IF EXISTS "用户可以创建自己的API密钥" ON api_keys;
DROP POLICY IF EXISTS "用户可以删除自己的API密钥" ON api_keys;

-- 确保启用RLS保护
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 创建新的策略，允许SELECT自己的记录
CREATE POLICY "用户可以查看自己的API密钥"
ON api_keys
FOR SELECT
USING (auth.uid() = user_id);

-- 创建新的策略，允许INSERT自己的记录
CREATE POLICY "用户可以创建自己的API密钥"
ON api_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 创建新的策略，允许DELETE自己的记录
CREATE POLICY "用户可以删除自己的API密钥"
ON api_keys
FOR DELETE
USING (auth.uid() = user_id);