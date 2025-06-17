-- =============================================
-- Migration 010: Add username field to users table
-- 添加username字段到users表，解决用户名显示问题
-- 只从Authentication users获取Display name，不使用邮箱备用方案
-- 创建时间: 2024-12-17
-- =============================================

-- 添加username字段到users表
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);

-- 为现有用户设置display_name，严格使用Authentication users的Display name
UPDATE users 
SET display_name = (
  SELECT COALESCE(
    raw_user_meta_data->>'display_name',
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name'
  ) FROM auth.users WHERE auth.users.id = users.id
)
WHERE EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = users.id 
  AND (
    raw_user_meta_data->>'display_name' IS NOT NULL OR
    raw_user_meta_data->>'full_name' IS NOT NULL OR
    raw_user_meta_data->>'name' IS NOT NULL
  )
);

-- 设置username，严格使用Authentication users的用户名字段
UPDATE users 
SET username = (
  SELECT COALESCE(
    raw_user_meta_data->>'username',
    raw_user_meta_data->>'preferred_username',
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'display_name',
    raw_user_meta_data->>'full_name'
  ) FROM auth.users WHERE auth.users.id = users.id
)
WHERE EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = users.id 
  AND (
    raw_user_meta_data->>'username' IS NOT NULL OR
    raw_user_meta_data->>'preferred_username' IS NOT NULL OR
    raw_user_meta_data->>'name' IS NOT NULL OR
    raw_user_meta_data->>'display_name' IS NOT NULL OR
    raw_user_meta_data->>'full_name' IS NOT NULL
  )
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 更新handle_new_user函数，确保新用户创建时设置username
-- 只从Authentication users metadata获取，不使用邮箱备用方案
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, username, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'preferred_username',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name'
    ),
    'user',
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(
      EXCLUDED.display_name,
      users.display_name
    ),
    username = COALESCE(
      EXCLUDED.username,
      users.username
    ),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- 注释：只从Authentication users获取真实的用户名/显示名称
-- 如果Authentication users中没有设置这些字段，则保持为NULL
-- 这样可以确保显示的是真实的用户身份，而不是从邮箱生成的假名 