-- 修复3: rls_disabled_in_public - 公共表未启用RLS问题
-- 为users表启用行级安全并添加适当的策略

-- 为users表启用行级安全
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 为users表创建适当的策略
-- 1. 用户只能查看自己的数据
CREATE POLICY "Users can view own user data" ON public.users
  FOR SELECT USING (id = auth.uid());

-- 2. 用户只能更新自己的数据
CREATE POLICY "Users can update own user data" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- 3. 不允许普通用户删除任何用户记录
CREATE POLICY "Users cannot delete user data" ON public.users
  FOR DELETE USING (false);

-- 4. 新用户注册时允许插入
CREATE POLICY "Users can insert on signup" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());
