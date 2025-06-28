-- =============================================
-- PromptHub 完整数据库结构 (整合版本)
-- 基于真实Supabase数据库结构重新整合
-- 在 Supabase SQL 编辑器中执行此脚本以创建完整的数据库结构
-- 此文件用于一次性创建全新的数据库，包含所有功能模块
-- 也可以在现有数据库上运行以添加缺失的表和字段
-- =============================================

-- 启用UUID扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 基础枚举类型
-- =============================================

-- 创建分类类型枚举（基于真实数据库）
CREATE TYPE IF NOT EXISTS category_type AS ENUM ('chat', 'image', 'video');

-- 创建提示词分类枚举类型（保持兼容性）
CREATE TYPE IF NOT EXISTS prompt_category AS ENUM (
  '全部', '学术', '职业', '文案', '设计', '教育', '情感',
  '娱乐', '游戏', '通用', '生活', '商业', '金融投资', '办公',
  '编程', '翻译', '绘画', '视频', '播客', '音乐',
  '健康', '科技'
);

-- =============================================
-- 核心表结构
-- =============================================

-- 用户表 - 用于身份验证和权限控制，与auth.users同步
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email VARCHAR(255),
  display_name VARCHAR(100),
  username VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 类别表 - 必须在prompts表之前创建，包含新的type字段
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  icon TEXT,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  type category_type DEFAULT 'chat'
);

-- 提示词表 - 存储所有提示词的主表，基于真实数据库结构
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT '通用',
  tags TEXT[],
  messages JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version NUMERIC DEFAULT 1,
  is_public BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  allow_collaboration BOOLEAN DEFAULT false,
  edit_permission VARCHAR(20) DEFAULT 'owner_only',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_modified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id),
  view_count INTEGER DEFAULT 0,
  input_variables TEXT[],
  compatible_models TEXT[],
  template_format TEXT DEFAULT 'text',
  preview_asset_url TEXT,
  parameters JSONB DEFAULT '{}',
  category_type VARCHAR,
  UNIQUE(name, user_id)
);

-- 提示词版本表 - 存储提示词的所有历史版本，基于真实数据库结构
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  version NUMERIC NOT NULL,
  messages JSONB NOT NULL,
  description TEXT,
  tags TEXT[],
  category TEXT,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preview_asset_url TEXT,
  parameters JSONB DEFAULT '{}',
  UNIQUE(prompt_id, version)
);

-- =============================================
-- 社交功能表结构
-- =============================================

-- 统一的社交互动表
CREATE TABLE IF NOT EXISTS social_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prompt_id, user_id, type)
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户关注表
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id),
  following_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 话题表
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 话题帖子表
CREATE TABLE IF NOT EXISTS topic_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  resource_id UUID,
  trigger_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 评分和社交功能表
-- =============================================

-- 评分表
CREATE TABLE IF NOT EXISTS prompt_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(prompt_id, user_id)
);

-- 提示词点赞表
CREATE TABLE IF NOT EXISTS prompt_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- 提示词收藏表
CREATE TABLE IF NOT EXISTS prompt_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- 提示词评论表
CREATE TABLE IF NOT EXISTS prompt_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES prompt_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 权限管理表结构
-- =============================================

-- 协作者表
CREATE TABLE IF NOT EXISTS prompt_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) DEFAULT 'edit',
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- 审计日志表
CREATE TABLE IF NOT EXISTS prompt_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API密钥表
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, name)
);



-- =============================================
-- 数据库视图
-- =============================================

-- 分类统计视图
CREATE OR REPLACE VIEW category_stats AS
SELECT
    c.id,
    c.name,
    c.name_en,
    c.type,
    c.icon,
    c.description,
    c.sort_order,
    COUNT(p.id) AS prompt_count,
    COUNT(CASE WHEN p.is_public = true THEN 1 END) AS public_count,
    COUNT(CASE WHEN p.is_public = false THEN 1 END) AS private_count
FROM categories c
LEFT JOIN prompts p ON c.id = p.category_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.name_en, c.type, c.icon, c.description, c.sort_order
ORDER BY c.sort_order;

-- 分类类型统计视图
CREATE OR REPLACE VIEW category_type_stats AS
SELECT
    type,
    COUNT(*) AS category_count,
    SUM(prompt_count) AS total_prompts,
    SUM(public_count) AS total_public,
    SUM(private_count) AS total_private
FROM category_stats
GROUP BY type
ORDER BY
    CASE type
        WHEN 'chat' THEN 1
        WHEN 'image' THEN 2
        WHEN 'video' THEN 3
        ELSE 4
    END;

-- 带分类类型的提示词视图
CREATE OR REPLACE VIEW prompts_with_category_type AS
SELECT
    p.*,
    c.name AS category_name,
    c.name_en AS category_name_en,
    c.type AS category_type,
    c.icon AS category_icon
FROM prompts p
LEFT JOIN categories c ON p.category_id = c.id;

-- 存储统计视图
CREATE OR REPLACE VIEW storage_stats AS
SELECT
    'prompts' AS table_name,
    COUNT(*) AS total_count,
    COUNT(CASE WHEN is_public = true THEN 1 END) AS public_count,
    COUNT(CASE WHEN is_public = false THEN 1 END) AS private_count
FROM prompts
UNION ALL
SELECT
    'categories' AS table_name,
    COUNT(*) AS total_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) AS public_count,
    COUNT(CASE WHEN is_active = false THEN 1 END) AS private_count
FROM categories;



-- =============================================
-- 更新现有表结构（兼容性处理）
-- =============================================

-- 为现有表添加缺失字段
DO $$
BEGIN
    -- 添加preview_asset_url字段到prompts表（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'preview_asset_url') THEN
        ALTER TABLE prompts ADD COLUMN preview_asset_url TEXT;
    END IF;

    -- 添加parameters字段到prompts表（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'parameters') THEN
        ALTER TABLE prompts ADD COLUMN parameters JSONB DEFAULT '{}';
    END IF;

    -- 添加category_type字段到prompts表（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'category_type') THEN
        ALTER TABLE prompts ADD COLUMN category_type VARCHAR;
    END IF;

    -- 添加type字段到categories表（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'type') THEN
        ALTER TABLE categories ADD COLUMN type category_type DEFAULT 'chat';
    END IF;
END $$;



-- =============================================
-- 索引创建（基于真实数据库结构）
-- =============================================

-- 核心表索引
CREATE INDEX IF NOT EXISTS idx_prompts_allow_collaboration ON prompts(allow_collaboration);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_prompts_edit_permission ON prompts(edit_permission);
CREATE INDEX IF NOT EXISTS idx_prompts_preview_asset_url ON prompts(preview_asset_url) WHERE preview_asset_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prompt_versions_category_id ON prompt_versions(category_id);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 类别表索引
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_type_sort_order ON categories(type, sort_order);

-- 社交功能索引
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

-- 评分和社交功能索引
CREATE INDEX IF NOT EXISTS idx_prompt_ratings_prompt_id ON prompt_ratings(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ratings_user_id ON prompt_ratings(user_id);

CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt_id ON prompt_likes(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_user_id ON prompt_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_prompt_bookmarks_prompt_id ON prompt_bookmarks(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_bookmarks_user_id ON prompt_bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_prompt_comments_prompt_id ON prompt_comments(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_user_id ON prompt_comments(user_id);

-- 权限管理索引
CREATE INDEX IF NOT EXISTS idx_prompt_collaborators_prompt_id ON prompt_collaborators(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_collaborators_user_id ON prompt_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_audit_logs_prompt_id ON prompt_audit_logs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_audit_logs_user_id ON prompt_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_audit_logs_created_at ON prompt_audit_logs(created_at);

-- =============================================
-- 辅助函数
-- =============================================

-- 优化auth.uid()调用的辅助函数
CREATE OR REPLACE FUNCTION get_auth_uid()
RETURNS uuid
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid()
$$;

-- 用户验证函数
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

-- 检查提示词是否公开的函数
CREATE OR REPLACE FUNCTION is_prompt_public(prompt_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_public FROM prompts WHERE id = prompt_id;
$$;



-- 递增视图计数的函数
CREATE OR REPLACE FUNCTION increment_view_count(prompt_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE prompts
    SET view_count = COALESCE(view_count, 0) + 1,
        updated_at = NOW()
    WHERE id = prompt_id;
END;
$$;

-- 获取提示词公共统计的函数
CREATE OR REPLACE FUNCTION get_prompt_public_stats(prompt_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}';
  likes_count int := 0;
  bookmarks_count int := 0;
  ratings_avg numeric(3,2) := 0;
  ratings_count int := 0;
BEGIN
  -- 获取点赞数和收藏数
  SELECT
    COUNT(*) FILTER (WHERE type = 'like'),
    COUNT(*) FILTER (WHERE type = 'bookmark')
  INTO likes_count, bookmarks_count
  FROM social_interactions
  WHERE prompt_id = prompt_uuid;

  -- 获取评分统计
  SELECT AVG(rating), COUNT(*)
  INTO ratings_avg, ratings_count
  FROM prompt_ratings
  WHERE prompt_id = prompt_uuid;

  result := jsonb_build_object(
    'likes', COALESCE(likes_count, 0),
    'bookmarks', COALESCE(bookmarks_count, 0),
    'avg_rating', COALESCE(ratings_avg, 0),
    'rating_count', COALESCE(ratings_count, 0)
  );

  RETURN result;
END;
$$;

-- 获取用户互动状态查询函数
CREATE OR REPLACE FUNCTION get_user_prompt_interactions(prompt_uuid uuid, user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}';
  is_liked boolean := false;
  is_bookmarked boolean := false;
  user_rating int := 0;
BEGIN
  -- 检查点赞和收藏状态
  SELECT
    EXISTS(SELECT 1 WHERE type = 'like'),
    EXISTS(SELECT 1 WHERE type = 'bookmark')
  INTO is_liked, is_bookmarked
  FROM social_interactions
  WHERE prompt_id = prompt_uuid AND user_id = user_uuid;

  -- 检查用户评分
  SELECT rating INTO user_rating
  FROM prompt_ratings
  WHERE prompt_id = prompt_uuid AND user_id = user_uuid
  LIMIT 1;

  result := jsonb_build_object(
    'liked', COALESCE(is_liked, false),
    'bookmarked', COALESCE(is_bookmarked, false),
    'rating', COALESCE(user_rating, 0)
  );

  RETURN result;
END;
$$;

-- =============================================
-- 触发器函数
-- =============================================

-- 用户数据同步触发器函数
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



-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;





-- =============================================
-- 创建触发器
-- =============================================

-- 用户数据同步触发器
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();



-- 用户表更新时间触发器
CREATE OR REPLACE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 评分表更新时间触发器
CREATE OR REPLACE TRIGGER update_prompt_ratings_updated_at
    BEFORE UPDATE ON prompt_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 评论表更新时间触发器
CREATE OR REPLACE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 话题表更新时间触发器
CREATE OR REPLACE TRIGGER update_topics_updated_at
    BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 话题帖子表更新时间触发器
CREATE OR REPLACE TRIGGER update_topic_posts_updated_at
    BEFORE UPDATE ON topic_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();





-- =============================================
-- 启用行级安全
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_comments ENABLE ROW LEVEL SECURITY;

ALTER TABLE prompt_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 行级安全策略
-- =============================================

-- 用户表策略
CREATE POLICY "Users can view own user data" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own user data" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users cannot delete user data" ON users
  FOR DELETE USING (false);

CREATE POLICY "Users can insert on signup" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- 类别表策略 - 所有人都可以查看类别
CREATE POLICY "Everyone can view categories" ON categories
  FOR SELECT USING (is_active = true);

-- 只有认证用户可以管理类别
CREATE POLICY "Authenticated users can manage categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

-- 提示词表策略
CREATE POLICY "prompts_read_public" ON prompts
FOR SELECT USING (
    is_public = true OR
    auth.uid() = user_id OR
    auth.uid() IS NULL
);

CREATE POLICY "prompts_manage_own" ON prompts
FOR ALL USING (
    auth.uid() = user_id OR
    auth.uid() IS NULL
);

-- 提示词版本表策略
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



-- 协作者表策略
CREATE POLICY "Users can view their own collaborations" ON prompt_collaborators
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Prompt owners can manage collaborators" ON prompt_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM prompts
      WHERE prompts.id = prompt_collaborators.prompt_id
      AND (prompts.created_by = auth.uid() OR prompts.user_id = auth.uid())
    )
  );

-- 审计日志表策略
CREATE POLICY "Users can view audit logs for their prompts" ON prompt_audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM prompts
      WHERE prompts.id = prompt_audit_logs.prompt_id
      AND (prompts.created_by = auth.uid() OR prompts.user_id = auth.uid())
    )
  );

-- API密钥表策略
CREATE POLICY "用户可以查看自己的API密钥" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的API密钥" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的API密钥" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- 社交功能表策略
CREATE POLICY "social_interactions_read_all" ON social_interactions FOR SELECT USING (true);
CREATE POLICY "social_interactions_manage_own" ON social_interactions
  FOR ALL USING (auth.uid() IS NULL OR auth.uid() = user_id);

-- 评论表策略
CREATE POLICY "comments_read_all" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_manage_own" ON comments
  FOR ALL USING (auth.uid() IS NULL OR auth.uid() = user_id);

-- 用户关注表策略
CREATE POLICY "user_follows_read_all" ON user_follows FOR SELECT USING (true);
CREATE POLICY "user_follows_manage_own" ON user_follows
  FOR ALL USING (auth.uid() IS NULL OR auth.uid() = follower_id);

-- 话题表策略
CREATE POLICY "topics_read_all" ON topics FOR SELECT USING (true);
CREATE POLICY "topics_manage_own" ON topics
  FOR ALL USING (auth.uid() IS NULL OR auth.uid() = creator_id);

-- 话题帖子表策略
CREATE POLICY "topic_posts_read_all" ON topic_posts FOR SELECT USING (true);
CREATE POLICY "topic_posts_manage_own" ON topic_posts
  FOR ALL USING (auth.uid() IS NULL OR auth.uid() = user_id);

-- 通知表策略
CREATE POLICY "notifications_own_only" ON notifications
  FOR ALL USING (auth.uid() IS NULL OR auth.uid() = user_id);

-- 评分表策略
CREATE POLICY "prompt_ratings_read_all" ON prompt_ratings FOR SELECT USING (true);
CREATE POLICY "prompt_ratings_manage_own" ON prompt_ratings
  FOR ALL USING (auth.uid() IS NULL OR auth.uid() = user_id);

-- 点赞表策略
CREATE POLICY "prompt_likes_read_all" ON prompt_likes FOR SELECT USING (true);
CREATE POLICY "prompt_likes_manage_own" ON prompt_likes
  FOR ALL USING (auth.uid() IS NULL OR auth.uid() = user_id);

-- 收藏表策略
CREATE POLICY "prompt_bookmarks_read_all" ON prompt_bookmarks FOR SELECT USING (true);
CREATE POLICY "prompt_bookmarks_manage_own" ON prompt_bookmarks
  FOR ALL USING (auth.uid() IS NULL OR auth.uid() = user_id);

-- 评论表策略
CREATE POLICY "prompt_comments_read_all" ON prompt_comments FOR SELECT USING (true);
CREATE POLICY "prompt_comments_manage_own" ON prompt_comments
  FOR ALL USING (auth.uid() IS NULL OR auth.uid() = user_id);



-- 协作者表策略
CREATE POLICY "Users can view their own collaborations" ON prompt_collaborators
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Prompt owners can manage collaborators" ON prompt_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM prompts
      WHERE prompts.id = prompt_collaborators.prompt_id
      AND (prompts.created_by = auth.uid() OR prompts.user_id = auth.uid())
    )
  );

-- 审计日志表策略
CREATE POLICY "Users can view audit logs for their prompts" ON prompt_audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM prompts
      WHERE prompts.id = prompt_audit_logs.prompt_id
      AND (prompts.created_by = auth.uid() OR prompts.user_id = auth.uid())
    )
  );

-- API密钥表策略
CREATE POLICY "用户可以查看自己的API密钥"
ON api_keys
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的API密钥"
ON api_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的API密钥"
ON api_keys
FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- 初始化示例数据
-- =============================================

-- 插入预置类别数据（基于新的三类型系统）
INSERT INTO categories (name, name_en, icon, description, sort_order, type) VALUES
-- Chat类型 (对话提示词)
('通用', 'general', 'chat-bubble-left-right', '通用助手和日常对话类提示词', 10, 'chat'),
('学术', 'academic', 'academic-cap', '学术研究、论文写作、学术分析类提示词', 20, 'chat'),
('职业', 'professional', 'briefcase', '职场沟通、简历优化、面试准备类提示词', 30, 'chat'),
('文案', 'copywriting', 'pencil', '广告文案、营销内容、产品描述类提示词', 40, 'chat'),
('教育', 'education', 'book-open', '教学辅导、知识解释、学习指导类提示词', 50, 'chat'),
('情感', 'emotional', 'heart', '情感支持、心理咨询、人际关系类提示词', 60, 'chat'),
('娱乐', 'entertainment', 'sparkles', '游戏、故事创作、趣味对话类提示词', 70, 'chat'),
('生活', 'lifestyle', 'home', '日常生活、健康建议、生活技巧类提示词', 80, 'chat'),
('商业', 'business', 'chart-bar', '商业分析、市场策略、企业管理类提示词', 90, 'chat'),
('金融投资', 'finance-investment', 'currency-dollar', '金融分析、投资策略、理财规划、风险评估类提示词', 95, 'chat'),
('办公', 'office', 'document-text', '办公自动化、文档处理、会议记录类提示词', 100, 'chat'),
('编程', 'programming', 'code', '代码编写、程序调试、技术解答类提示词', 110, 'chat'),
('翻译', 'translation', 'language', '多语言翻译、本地化、语言学习类提示词', 120, 'chat'),

-- Image类型 (图像提示词)
('绘画', 'painting', 'paint-brush', '绘画创作、艺术指导、风格描述类提示词', 210, 'image'),
('设计', 'design', 'color-swatch', '设计思维、创意构思、视觉设计类提示词', 220, 'image'),
('摄影', 'photography', 'camera', '摄影构图、光影效果、拍摄技巧类提示词', 230, 'image'),
('插画', 'illustration', 'pencil-square', '插画创作、角色设计、场景绘制类提示词', 240, 'image'),
('UI设计', 'ui-design', 'device-phone-mobile', 'UI界面设计、用户体验、交互设计类提示词', 250, 'image'),
('品牌设计', 'brand-design', 'building-storefront', '品牌视觉、标志设计、企业形象类提示词', 260, 'image'),
('海报设计', 'poster-design', 'rectangle-stack', '海报创作、宣传设计、视觉传达类提示词', 270, 'image'),
('3D建模', '3d-modeling', 'cube', '三维建模、渲染效果、空间设计类提示词', 280, 'image'),
('动漫风格', 'anime-style', 'face-smile', '动漫角色、二次元风格、卡通设计类提示词', 290, 'image'),
('写实风格', 'realistic-style', 'eye', '写实绘画、真实感渲染、细节刻画类提示词', 300, 'image'),
('抽象艺术', 'abstract-art', 'squares-plus', '抽象表现、概念艺术、创意视觉类提示词', 310, 'image'),
('建筑设计', 'architecture', 'building-office', '建筑设计、空间规划、结构美学类提示词', 320, 'image'),
('时尚设计', 'fashion-design', 'sparkles', '服装设计、时尚搭配、潮流趋势类提示词', 330, 'image'),
('游戏美术', 'game-art', 'puzzle-piece', '游戏场景、角色原画、概念设计类提示词', 340, 'image'),
('科幻风格', 'sci-fi-style', 'rocket-launch', '科幻场景、未来设计、科技感视觉类提示词', 350, 'image'),

-- Video类型 (视频提示词)
('视频制作', 'video-production', 'video-camera', '视频制作、脚本编写、视频策划类提示词', 410, 'video'),
('动画制作', 'animation', 'film', '动画创作、角色动画、特效制作类提示词', 420, 'video'),
('短视频', 'short-video', 'device-phone-mobile', '短视频创意、社交媒体、内容策划类提示词', 430, 'video'),
('纪录片', 'documentary', 'document-text', '纪录片制作、真实记录、深度报道类提示词', 440, 'video'),
('广告视频', 'commercial-video', 'megaphone', '广告创意、营销视频、品牌宣传类提示词', 450, 'video'),
('教学视频', 'educational-video', 'academic-cap', '教学内容、知识传播、在线教育类提示词', 460, 'video'),
('音乐视频', 'music-video', 'musical-note', '音乐MV、音频视觉、节奏表现类提示词', 470, 'video'),
('游戏视频', 'gaming-video', 'puzzle-piece', '游戏录制、解说内容、电竞视频类提示词', 480, 'video'),
('直播内容', 'live-streaming', 'signal', '直播策划、互动内容、实时传播类提示词', 490, 'video'),
('企业宣传', 'corporate-video', 'building-office', '企业形象、公司介绍、商务展示类提示词', 500, 'video'),
('旅行视频', 'travel-video', 'map', '旅行记录、风景展示、文化探索类提示词', 510, 'video'),
('生活记录', 'lifestyle-video', 'home', '日常生活、个人记录、生活分享类提示词', 520, 'video')

ON CONFLICT (name) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  type = EXCLUDED.type,
  updated_at = NOW();



-- 为现有数据设置created_by字段（使用user_id字段的值）
UPDATE prompts
SET created_by = user_id
WHERE created_by IS NULL AND user_id IS NOT NULL;

-- 更新现有提示词的category_id
UPDATE prompts
SET category_id = c.id
FROM categories c
WHERE prompts.category = c.name
  AND prompts.category_id IS NULL;

-- 更新现有提示词版本的category_id
UPDATE prompt_versions
SET category_id = c.id
FROM categories c
WHERE prompt_versions.category = c.name
  AND prompt_versions.category_id IS NULL;

-- 更新现有记录的默认值
UPDATE prompts
SET input_variables = ARRAY[]::TEXT[]
WHERE input_variables IS NULL;

UPDATE prompts
SET compatible_models = ARRAY['GPT-4', 'GPT-3.5', 'Claude-2']::TEXT[]
WHERE compatible_models IS NULL;

UPDATE prompts
SET template_format = 'text'
WHERE template_format IS NULL;

UPDATE prompts
SET parameters = '{}'::JSONB
WHERE parameters IS NULL;



-- =============================================
-- 表字段注释
-- =============================================

-- 添加注释
COMMENT ON COLUMN prompts.allow_collaboration IS '是否允许协作编辑';
COMMENT ON COLUMN prompts.edit_permission IS '编辑权限级别: owner_only, collaborators, public';
COMMENT ON COLUMN prompts.created_by IS '创建者用户ID';
COMMENT ON COLUMN prompts.last_modified_by IS '最后修改者用户ID';
COMMENT ON COLUMN prompts.input_variables IS '提示词输入变量数组';
COMMENT ON COLUMN prompts.compatible_models IS '兼容的AI模型列表';
COMMENT ON COLUMN prompts.template_format IS '模板格式：text, json等';
COMMENT ON COLUMN prompts.version IS '版本号';
COMMENT ON COLUMN prompts.preview_asset_url IS '预览资源URL，用于图像和视频类型提示词';
COMMENT ON COLUMN prompts.parameters IS '提示词参数，JSON格式存储各种配置';
COMMENT ON COLUMN prompts.category_type IS '分类类型，关联到categories表的type字段';

COMMENT ON TABLE prompt_collaborators IS '提示词协作者表';
COMMENT ON TABLE prompt_audit_logs IS '提示词操作审计日志表';
COMMENT ON TABLE categories IS '提示词类别管理表，支持chat/image/video三种类型';
COMMENT ON TABLE social_interactions IS '社交互动表，统一管理点赞、收藏等操作';
COMMENT ON TABLE prompt_versions IS '提示词版本历史表';

COMMENT ON COLUMN categories.type IS '分类类型：chat对话类、image图像类、video视频类';

-- 添加权限说明
COMMENT ON FUNCTION increment_view_count(UUID) IS '安全函数：递增提示词查看次数';
COMMENT ON FUNCTION get_prompt_public_stats(UUID) IS '安全函数：获取提示词公共统计信息';
COMMENT ON FUNCTION get_user_prompt_interactions(UUID, UUID) IS '安全函数：获取用户与提示词的互动状态';
COMMENT ON FUNCTION handle_new_user() IS '安全函数：处理新用户注册';
COMMENT ON FUNCTION update_updated_at_column() IS '安全函数：更新时间戳';
