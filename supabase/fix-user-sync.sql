-- 修复用户数据同步问题
-- 此脚本修复触发器函数并更新现有用户的display_name

-- 修复触发器函数，改进用户名提取逻辑
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'username', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    ),
    'user',
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'full_name',
      EXCLUDED.display_name,
      split_part(NEW.email, '@', 1)
    ),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新现有用户的display_name（如果有更好的数据可用）
-- 先检查auth.users表中是否有更好的用户名数据
DO $$
DECLARE
  user_record RECORD;
  better_name TEXT;
BEGIN
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data, u.display_name as current_name
    FROM auth.users au
    JOIN public.users u ON au.id = u.id
  LOOP
    -- 尝试从metadata中获取更好的用户名
    better_name := COALESCE(
      user_record.raw_user_meta_data->>'display_name',
      user_record.raw_user_meta_data->>'username',
      user_record.raw_user_meta_data->>'full_name'
    );
    
    -- 如果找到更好的名称且与当前不同，更新之
    IF better_name IS NOT NULL AND better_name != user_record.current_name THEN
      UPDATE public.users 
      SET display_name = better_name, updated_at = NOW()
      WHERE id = user_record.id;
      
      RAISE NOTICE '更新用户 % 的display_name: % -> %', 
        user_record.email, user_record.current_name, better_name;
    END IF;
  END LOOP;
END $$; 