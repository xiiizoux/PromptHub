-- =============================================
-- PromptHub 完整数据库结构 (整合版本)
-- 整合了所有功能模块的完整数据库结构
-- 在 Supabase SQL 编辑器中执行此脚本以创建完整的数据库结构
-- 此文件用于一次性创建全新的数据库，包含所有功能模块
-- 也可以在现有数据库上运行以添加缺失的表和字段
-- =============================================

-- 启用UUID扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 基础枚举类型
-- =============================================

-- 创建提示词分类枚举类型
CREATE TYPE prompt_category AS ENUM (
  '通用', '学术', '职业', '文案', '设计', '教育', '情感',
  '娱乐', '游戏', '生活', '商业', '办公',
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

-- 类别表 - 必须在prompts表之前创建
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  icon TEXT,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 提示词表 - 存储所有提示词的主表
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT '通用',
  tags TEXT[],
  messages JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version NUMERIC(3,1) DEFAULT 1.0,
  is_public BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_collaboration BOOLEAN DEFAULT false,
  edit_permission VARCHAR(20) DEFAULT 'owner_only',
  created_by UUID REFERENCES auth.users(id),
  last_modified_by UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES categories(id),
  usage_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  current_version INTEGER DEFAULT 1,
  input_variables TEXT[],
  compatible_models TEXT[],
  template_format TEXT DEFAULT 'text',
  UNIQUE(name, user_id)
);

-- 提示词版本表 - 存储提示词的所有历史版本
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  version NUMERIC(3,1) NOT NULL,
  messages JSONB NOT NULL,
  description TEXT,
  tags TEXT[],
  category TEXT,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(prompt_id, version)
);

-- =============================================
-- 社交功能表结构
-- =============================================

-- 统一的社交互动表
CREATE TABLE IF NOT EXISTS social_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'bookmark', 'share')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prompt_id, user_id, type)
);

-- 评论表
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) DEFAULT 'edit' CHECK (permission_level IN ('edit', 'review', 'admin')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- 审计日志表
CREATE TABLE IF NOT EXISTS prompt_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API密钥表
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, name)
);



-- =============================================
-- 模板系统表结构
-- =============================================

-- 模板分类表
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 提示词模板表
CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    variables JSONB DEFAULT '[]',
    fields JSONB DEFAULT '[]',
    author VARCHAR(255),
    likes INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    estimated_time VARCHAR(50),
    language VARCHAR(10) DEFAULT 'zh-CN',
    is_featured BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_official BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 模板评分表
CREATE TABLE IF NOT EXISTS template_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, user_id)
);



-- =============================================
-- 更新现有表结构（兼容性处理）
-- =============================================

-- 为现有prompts表添加缺失字段
DO $$
BEGIN
    -- 添加usage_count字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'usage_count') THEN
        ALTER TABLE prompts ADD COLUMN usage_count INTEGER DEFAULT 0;
    END IF;

    -- 添加current_version字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'current_version') THEN
        ALTER TABLE prompts ADD COLUMN current_version INTEGER DEFAULT 1;
    END IF;

    -- 更新version字段类型
    ALTER TABLE prompts ALTER COLUMN version TYPE NUMERIC(3,1);

    -- 更新prompt_versions表的version字段类型
    ALTER TABLE prompt_versions ALTER COLUMN version TYPE NUMERIC(3,1);
END $$;



-- =============================================
-- 索引创建
-- =============================================

-- 核心表索引
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_is_public ON prompts(is_public);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_prompts_allow_collaboration ON prompts(allow_collaboration);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_prompts_edit_permission ON prompts(edit_permission);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON prompts(category_id);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_category_id ON prompt_versions(category_id);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 类别表索引
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

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
CREATE INDEX IF NOT EXISTS idx_prompt_comments_parent_id ON prompt_comments(parent_id);

-- 模板系统索引
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_difficulty ON prompt_templates(difficulty);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_featured ON prompt_templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_official ON prompt_templates(is_official);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_tags ON prompt_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_variables ON prompt_templates USING GIN(variables);

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

-- 递增使用次数的函数
CREATE OR REPLACE FUNCTION increment_usage_count(prompt_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE prompts
    SET usage_count = COALESCE(usage_count, 0) + 1,
        updated_at = NOW()
    WHERE id = prompt_id;
END;
$$;

-- 递增模板使用次数的函数
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE prompt_templates
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$;

-- 更新模板评分的函数
CREATE OR REPLACE FUNCTION update_template_rating(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT AVG(rating)::DECIMAL(3,2) INTO avg_rating
    FROM template_ratings
    WHERE template_id = update_template_rating.template_id;

    UPDATE prompt_templates
    SET rating = COALESCE(avg_rating, 0.0),
        updated_at = NOW()
    WHERE id = update_template_rating.template_id;
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

-- 模板更新时间触发器函数
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER
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

-- 模板表更新时间触发器
CREATE OR REPLACE TRIGGER update_prompt_templates_updated_at
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_template_updated_at();

CREATE OR REPLACE TRIGGER update_template_categories_updated_at
    BEFORE UPDATE ON template_categories
    FOR EACH ROW EXECUTE FUNCTION update_template_updated_at();

CREATE OR REPLACE TRIGGER update_template_ratings_updated_at
    BEFORE UPDATE ON template_ratings
    FOR EACH ROW EXECUTE FUNCTION update_template_updated_at();



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
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;
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

-- 模板表策略
CREATE POLICY "prompt_templates_read_active" ON prompt_templates
  FOR SELECT USING (is_active = true OR auth.uid() = created_by OR auth.uid() IS NULL);

CREATE POLICY "prompt_templates_manage_own" ON prompt_templates
  FOR ALL USING (auth.uid() IS NULL OR auth.uid() = created_by);

-- 模板分类表策略
CREATE POLICY "template_categories_read_all" ON template_categories FOR SELECT USING (true);

-- 模板评分表策略
CREATE POLICY "template_ratings_read_all" ON template_ratings FOR SELECT USING (true);
CREATE POLICY "template_ratings_manage_own" ON template_ratings
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

-- 插入预置类别数据
INSERT INTO categories (name, name_en, icon, description, sort_order) VALUES
-- 基础类别
('通用', 'general', 'layers', '通用助手和日常对话类提示词', 10),

-- 学术和专业类别
('学术', 'academic', 'academic-cap', '学术研究、论文写作、学术分析类提示词', 20),
('职业', 'professional', 'briefcase', '职场沟通、简历优化、面试准备类提示词', 30),

-- 创作和内容类别
('文案', 'copywriting', 'pencil', '广告文案、营销内容、产品描述类提示词', 40),
('设计', 'design', 'color-swatch', '设计思维、创意构思、视觉设计类提示词', 50),
('绘画', 'painting', 'paint-brush', '绘画创作、艺术指导、风格描述类提示词', 55),

-- 教育和娱乐类别
('教育', 'education', 'book-open', '教学辅导、知识解释、学习指导类提示词', 60),
('情感', 'emotional', 'heart', '情感支持、心理咨询、人际关系类提示词', 70),
('娱乐', 'entertainment', 'sparkles', '游戏、故事创作、趣味对话类提示词', 80),
('游戏', 'gaming', 'puzzle-piece', '游戏策略、角色扮演、游戏设计类提示词', 90),

-- 生活和实用类别
('生活', 'lifestyle', 'home', '日常生活、健康建议、生活技巧类提示词', 100),
('商业', 'business', 'chart-bar', '商业分析、市场策略、企业管理类提示词', 110),
('办公', 'office', 'document-text', '办公自动化、文档处理、会议记录类提示词', 120),

-- 技术类别
('编程', 'programming', 'code', '代码编写、程序调试、技术解答类提示词', 130),
('翻译', 'translation', 'language', '多语言翻译、本地化、语言学习类提示词', 140),

-- 多媒体类别
('视频', 'video', 'video-camera', '视频制作、脚本编写、视频策划类提示词', 150),
('播客', 'podcast', 'microphone', '播客制作、音频内容、访谈策划类提示词', 160),
('音乐', 'music', 'musical-note', '音乐创作、歌词编写、音乐分析类提示词', 170),

-- 专业领域类别
('健康', 'health', 'heart-pulse', '健康咨询、医疗信息、养生建议类提示词', 180),
('科技', 'technology', 'cpu-chip', '科技趋势、技术分析、创新思维类提示词', 190),
('金融', 'finance', 'currency-dollar', '金融分析、投资理财、财务管理类提示词', 200),
('写作', 'writing', 'pencil-square', '文章写作、内容创作、写作技巧类提示词', 210)

ON CONFLICT (name) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 插入模板分类数据
INSERT INTO template_categories (name, display_name, description, icon, color, sort_order) VALUES
('writing', '写作助手', '各种写作场景的专业模板', 'PencilIcon', 'text-blue-400', 1),
('creative', '创意设计', '激发创意灵感的模板集合', 'SparklesIcon', 'text-purple-400', 2),
('business', '商务应用', '提升工作效率的商务模板', 'BriefcaseIcon', 'text-green-400', 3),
('education', '教育培训', '教学和学习的专业模板', 'AcademicCapIcon', 'text-yellow-400', 4),
('analysis', '分析研究', '数据分析和研究类模板', 'ChartBarIcon', 'text-red-400', 5),
('communication', '沟通交流', '各种沟通场景的模板', 'ChatBubbleLeftRightIcon', 'text-indigo-400', 6),
('technical', '技术开发', '技术文档和开发相关模板', 'DocumentTextIcon', 'text-cyan-400', 7),
('personal', '个人生活', '日常生活和个人发展模板', 'UserGroupIcon', 'text-pink-400', 8)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order,
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



-- =============================================
-- 表字段注释
-- =============================================

-- 添加注释
COMMENT ON COLUMN prompts.allow_collaboration IS '是否允许协作编辑';
COMMENT ON COLUMN prompts.edit_permission IS '编辑权限级别: owner_only, collaborators, public';
COMMENT ON COLUMN prompts.created_by IS '创建者用户ID（新字段，与user_id字段功能类似）';
COMMENT ON COLUMN prompts.last_modified_by IS '最后修改者用户ID';
COMMENT ON COLUMN prompts.input_variables IS '提示词输入变量数组';
COMMENT ON COLUMN prompts.compatible_models IS '兼容的AI模型列表';
COMMENT ON COLUMN prompts.template_format IS '模板格式：text, json等';
COMMENT ON COLUMN prompts.version IS '版本号，支持一位小数格式（如1.0, 1.1, 6.1）';

COMMENT ON TABLE prompt_collaborators IS '提示词协作者表';
COMMENT ON TABLE prompt_audit_logs IS '提示词操作审计日志表';
COMMENT ON TABLE categories IS '提示词类别管理表';
COMMENT ON TABLE collaborative_sessions IS '协作编辑会话表';
COMMENT ON TABLE collaborative_participants IS '协作参与者表';
COMMENT ON TABLE collaborative_operations IS '协作操作记录表';
COMMENT ON TABLE collaborative_locks IS '协作区域锁定表';
COMMENT ON TABLE collaborative_conflicts IS '协作冲突记录表';
COMMENT ON TABLE collaborative_versions IS '协作版本历史表';
COMMENT ON TABLE prompt_templates IS '提示词模板表';
COMMENT ON TABLE template_categories IS '模板分类表';
COMMENT ON TABLE template_usage_stats IS '模板使用统计表';
COMMENT ON TABLE template_ratings IS '模板评分表';

COMMENT ON COLUMN prompt_templates.variables IS '模板变量定义，JSON格式，包含变量名、类型、描述等';
COMMENT ON COLUMN prompt_templates.fields IS '模板向导字段定义，JSON格式，用于动态生成表单';
COMMENT ON COLUMN prompt_templates.content IS '模板内容，包含{{变量名}}占位符';
COMMENT ON COLUMN prompt_templates.difficulty IS '模板难度：beginner初级、intermediate中级、advanced高级';
COMMENT ON COLUMN prompt_templates.estimated_time IS '预估使用时间，如"5分钟"、"10-15分钟"';
COMMENT ON COLUMN prompt_templates.is_official IS '是否为系统官方提供的模板';

-- 添加权限说明
COMMENT ON FUNCTION increment_usage_count(UUID) IS '安全函数：递增提示词使用次数';
COMMENT ON FUNCTION increment_template_usage(UUID) IS '安全函数：递增模板使用次数';
COMMENT ON FUNCTION update_template_rating(UUID) IS '安全函数：更新模板平均评分';
COMMENT ON FUNCTION get_prompt_public_stats(UUID) IS '安全函数：获取提示词公共统计信息';
COMMENT ON FUNCTION get_user_prompt_interactions(UUID, UUID) IS '安全函数：获取用户与提示词的互动状态';
COMMENT ON FUNCTION handle_new_user() IS '安全函数：处理新用户注册';
COMMENT ON FUNCTION update_updated_at_column() IS '安全函数：更新时间戳';
COMMENT ON FUNCTION update_template_updated_at() IS '安全函数：更新模板时间戳';
