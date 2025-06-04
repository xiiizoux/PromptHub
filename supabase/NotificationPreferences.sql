-- 创建通知偏好设置表
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follow_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  like_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  comment_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  reply_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  mention_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  system_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  push_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  digest_notifications BOOLEAN NOT NULL DEFAULT FALSE, -- 是否接收汇总通知
  digest_frequency TEXT DEFAULT 'daily', -- 汇总通知频率 'daily', 'weekly'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 创建函数，当新用户注册时自动创建默认通知偏好
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器，当新用户注册时自动创建默认通知偏好
DROP TRIGGER IF EXISTS on_user_created_set_notification_preferences ON auth.users;
CREATE TRIGGER on_user_created_set_notification_preferences
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_preferences();

-- 更新现有用户的通知偏好
DO $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  SELECT id FROM auth.users
  WHERE id NOT IN (SELECT user_id FROM notification_preferences)
  ON CONFLICT (user_id) DO NOTHING;
END $$;