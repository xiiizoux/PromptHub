-- 添加统一的社交互动表
-- 替换分离的 prompt_likes 和 prompt_bookmarks 表

-- 创建统一的社交互动表
CREATE TABLE IF NOT EXISTS social_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'bookmark', 'share')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prompt_id, user_id, type)
);

-- 评论表 (重命名以保持一致性)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户关注表
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 话题表
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 话题帖子表
CREATE TABLE IF NOT EXISTS topic_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'reply', 'mention', 'system')),
  title TEXT,
  content TEXT NOT NULL,
  resource_id UUID,
  trigger_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_social_interactions_prompt_id ON social_interactions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_social_interactions_user_id ON social_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_social_interactions_type ON social_interactions(type);

CREATE INDEX IF NOT EXISTS idx_comments_prompt_id ON comments(prompt_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

CREATE INDEX IF NOT EXISTS idx_topics_creator_id ON topics(creator_id);
CREATE INDEX IF NOT EXISTS idx_topic_posts_topic_id ON topic_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_posts_user_id ON topic_posts(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 如果存在旧的分离表，迁移数据到新的统一表
DO $$
BEGIN
  -- 迁移点赞数据
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prompt_likes') THEN
    INSERT INTO social_interactions (prompt_id, user_id, type, created_at)
    SELECT prompt_id, user_id, 'like', created_at
    FROM prompt_likes
    ON CONFLICT (prompt_id, user_id, type) DO NOTHING;
  END IF;

  -- 迁移收藏数据
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prompt_bookmarks') THEN
    INSERT INTO social_interactions (prompt_id, user_id, type, created_at)
    SELECT prompt_id, user_id, 'bookmark', created_at
    FROM prompt_bookmarks
    ON CONFLICT (prompt_id, user_id, type) DO NOTHING;
  END IF;

  -- 迁移评论数据
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prompt_comments') THEN
    INSERT INTO comments (prompt_id, user_id, content, parent_id, created_at, updated_at)
    SELECT prompt_id, user_id, content, parent_id, created_at, updated_at
    FROM prompt_comments
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加更新触发器
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
CREATE TRIGGER update_topics_updated_at 
    BEFORE UPDATE ON topics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topic_posts_updated_at ON topic_posts;
CREATE TRIGGER update_topic_posts_updated_at 
    BEFORE UPDATE ON topic_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 