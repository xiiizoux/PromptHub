-- PromptHub 完整数据库结构
-- 在 Supabase SQL 编辑器中执行此脚本以创建完整的数据库结构
-- 此文件用于一次性创建全新的数据库，包含用户数据同步功能

-- 启用UUID扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 基础表结构
-- =============================================

-- 用户表 - 用于身份验证和权限控制，与auth.users同步
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  display_name VARCHAR(255),
  username VARCHAR(255),
  role VARCHAR(255) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 类别表 - 必须在prompts表之前创建
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 提示词表 - 存储所有提示词的主表
CREATE TABLE prompts (
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
  user_id UUID REFERENCES users(id),
  allow_collaboration BOOLEAN DEFAULT FALSE,
  edit_permission VARCHAR(255) DEFAULT 'owner_only',
  created_by UUID REFERENCES users(id),
  last_modified_by UUID REFERENCES users(id),
  category_id UUID REFERENCES categories(id),
  usage_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  input_variables TEXT[],
  compatible_models TEXT[],
  template_format TEXT DEFAULT 'text',
  UNIQUE(name, user_id)
);

-- 提示词版本表 - 存储提示词的所有历史版本
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id),
  version NUMERIC NOT NULL,
  messages JSONB NOT NULL,
  description TEXT,
  tags TEXT[],
  category TEXT,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id),
  UNIQUE(prompt_id, version)
);



-- =============================================
-- 权限管理表结构
-- =============================================

-- 协作者表
CREATE TABLE prompt_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id),
  user_id UUID REFERENCES users(id),
  permission_level VARCHAR(255) DEFAULT 'edit' CHECK (permission_level IN ('edit', 'review', 'admin')),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- 审计日志表
CREATE TABLE prompt_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API密钥表
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, name)
);

-- =============================================
-- 社交功能表结构
-- =============================================

-- 提示词点赞表
CREATE TABLE prompt_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- 提示词收藏表
CREATE TABLE prompt_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- 提示词评分表
CREATE TABLE prompt_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- 提示词评论表
CREATE TABLE prompt_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  parent_id UUID REFERENCES prompt_comments(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 社交互动表
CREATE TABLE social_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id, type)
);

-- =============================================
-- 模板系统表结构
-- =============================================

-- 模板类别表
CREATE TABLE template_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  color VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 提示词模板表
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(255) NOT NULL,
  subcategory VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  difficulty VARCHAR(255) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  variables JSONB DEFAULT '[]',
  fields JSONB DEFAULT '[]',
  author VARCHAR(255),
  likes INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0.0,
  estimated_time VARCHAR(255),
  language VARCHAR(255) DEFAULT 'zh-CN',
  is_featured BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_official BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- 模板评分表
CREATE TABLE template_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES prompt_templates(id),
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- 模板使用统计表
CREATE TABLE template_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES prompt_templates(id),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  variables_used JSONB,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 通知和社区表结构
-- =============================================

-- 通知表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'system')),
  title TEXT,
  content TEXT NOT NULL,
  resource_id UUID,
  trigger_user_id UUID REFERENCES users(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户关注表
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 话题表
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 话题帖子表
CREATE TABLE topic_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 评论表（通用）
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 索引创建
-- =============================================

-- 用户表索引
CREATE INDEX idx_users_username ON users(username);

-- 类别表索引
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- 提示词表索引
CREATE INDEX idx_prompts_allow_collaboration ON prompts(allow_collaboration);
CREATE INDEX idx_prompts_created_by ON prompts(created_by);
CREATE INDEX idx_prompts_edit_permission ON prompts(edit_permission);
CREATE INDEX idx_prompts_category_id ON prompts(category_id);

-- 提示词版本表索引
CREATE INDEX idx_prompt_versions_category_id ON prompt_versions(category_id);



-- 协作者表索引
CREATE INDEX idx_prompt_collaborators_prompt_id ON prompt_collaborators(prompt_id);
CREATE INDEX idx_prompt_collaborators_user_id ON prompt_collaborators(user_id);

-- 审计日志表索引
CREATE INDEX idx_prompt_audit_logs_prompt_id ON prompt_audit_logs(prompt_id);
CREATE INDEX idx_prompt_audit_logs_user_id ON prompt_audit_logs(user_id);
CREATE INDEX idx_prompt_audit_logs_created_at ON prompt_audit_logs(created_at);

-- 社交功能索引
CREATE INDEX idx_prompt_likes_prompt_id ON prompt_likes(prompt_id);
CREATE INDEX idx_prompt_likes_user_id ON prompt_likes(user_id);
CREATE INDEX idx_prompt_bookmarks_prompt_id ON prompt_bookmarks(prompt_id);
CREATE INDEX idx_prompt_bookmarks_user_id ON prompt_bookmarks(user_id);
CREATE INDEX idx_prompt_ratings_prompt_id ON prompt_ratings(prompt_id);
CREATE INDEX idx_prompt_ratings_user_id ON prompt_ratings(user_id);
CREATE INDEX idx_prompt_comments_prompt_id ON prompt_comments(prompt_id);
CREATE INDEX idx_prompt_comments_user_id ON prompt_comments(user_id);
CREATE INDEX idx_social_interactions_prompt_id ON social_interactions(prompt_id);
CREATE INDEX idx_social_interactions_user_id ON social_interactions(user_id);
CREATE INDEX idx_social_interactions_type ON social_interactions(type);

-- 模板系统索引
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_difficulty ON prompt_templates(difficulty);
CREATE INDEX idx_prompt_templates_active ON prompt_templates(is_active);
CREATE INDEX idx_prompt_templates_featured ON prompt_templates(is_featured);
CREATE INDEX idx_prompt_templates_official ON prompt_templates(is_official);
CREATE INDEX idx_prompt_templates_tags ON prompt_templates USING gin(tags);
CREATE INDEX idx_prompt_templates_variables ON prompt_templates USING gin(variables);

-- 通知系统索引
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- 用户关注索引
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);

-- 话题系统索引
CREATE INDEX idx_topics_creator_id ON topics(creator_id);
CREATE INDEX idx_topic_posts_topic_id ON topic_posts(topic_id);
CREATE INDEX idx_topic_posts_user_id ON topic_posts(user_id);

-- 评论系统索引
CREATE INDEX idx_comments_prompt_id ON comments(prompt_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

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

-- =============================================
-- 触发器函数
-- =============================================

-- 用户数据同步触发器函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, username, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'username',
    'user',
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(
      EXCLUDED.display_name,
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    username = NEW.raw_user_meta_data->>'username',
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 创建触发器
-- =============================================

-- 用户数据同步触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 用户表更新时间触发器
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 类别表更新时间触发器
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 提示词表更新时间触发器
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 提示词评分表更新时间触发器
CREATE TRIGGER update_prompt_ratings_updated_at
  BEFORE UPDATE ON prompt_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 提示词评论表更新时间触发器
CREATE TRIGGER update_prompt_comments_updated_at
  BEFORE UPDATE ON prompt_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 模板表更新时间触发器
CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 模板评分表更新时间触发器
CREATE TRIGGER update_template_ratings_updated_at
  BEFORE UPDATE ON template_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 模板类别表更新时间触发器
CREATE TRIGGER update_template_categories_updated_at
  BEFORE UPDATE ON template_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 话题表更新时间触发器
CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 话题帖子表更新时间触发器
CREATE TRIGGER update_topic_posts_updated_at
  BEFORE UPDATE ON topic_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 评论表更新时间触发器
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 启用行级安全
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

ALTER TABLE prompt_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Public prompts are viewable by everyone" ON prompts
  FOR SELECT USING (is_public = true OR created_by = get_auth_uid() OR user_id = get_auth_uid());

CREATE POLICY "Users can insert their own prompts" ON prompts
  FOR INSERT WITH CHECK (created_by = get_auth_uid() OR user_id = get_auth_uid());

CREATE POLICY "Users can update their own prompts or collaborate" ON prompts
  FOR UPDATE USING (
    created_by = get_auth_uid() OR
    user_id = get_auth_uid() OR
    (is_public = true AND allow_collaboration = true) OR
    EXISTS (
      SELECT 1 FROM prompt_collaborators
      WHERE prompt_collaborators.prompt_id = prompts.id
      AND prompt_collaborators.user_id = get_auth_uid()
    )
  );

CREATE POLICY "Users can delete their own prompts" ON prompts
  FOR DELETE USING (created_by = get_auth_uid() OR user_id = get_auth_uid());

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
CREATE POLICY "Users can view all likes" ON prompt_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own likes" ON prompt_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view all bookmarks" ON prompt_bookmarks
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own bookmarks" ON prompt_bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view all ratings" ON prompt_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own ratings" ON prompt_ratings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view all comments" ON prompt_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own comments" ON prompt_comments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view all social interactions" ON social_interactions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own social interactions" ON social_interactions
  FOR ALL USING (auth.uid() = user_id);

-- 模板系统策略
CREATE POLICY "Everyone can view template categories" ON template_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can view active templates" ON prompt_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own templates" ON prompt_templates
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can view all template ratings" ON template_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own template ratings" ON template_ratings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own template usage stats" ON template_usage_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert template usage stats" ON template_usage_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 通知系统策略
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户关注策略
CREATE POLICY "Users can view all follows" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON user_follows
  FOR ALL USING (auth.uid() = follower_id);

-- 话题系统策略
CREATE POLICY "Everyone can view topics" ON topics
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own topics" ON topics
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Everyone can view topic posts" ON topic_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own topic posts" ON topic_posts
  FOR ALL USING (auth.uid() = user_id);

-- 评论系统策略
CREATE POLICY "Everyone can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own comments" ON comments
  FOR ALL USING (auth.uid() = user_id);

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
('科技', 'technology', 'cpu-chip', '科技趋势、技术分析、创新思维类提示词', 190)

ON CONFLICT (name) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- =============================================
-- 表字段注释
-- =============================================

-- 添加注释
COMMENT ON TABLE users IS '用户表 - 与auth.users同步';
COMMENT ON TABLE categories IS '提示词类别管理表';
COMMENT ON TABLE prompts IS '提示词主表';
COMMENT ON TABLE prompt_versions IS '提示词版本历史表';

COMMENT ON TABLE prompt_collaborators IS '提示词协作者表';
COMMENT ON TABLE prompt_audit_logs IS '提示词操作审计日志表';
COMMENT ON TABLE api_keys IS 'API密钥表';
COMMENT ON TABLE prompt_likes IS '提示词点赞表';
COMMENT ON TABLE prompt_bookmarks IS '提示词收藏表';
COMMENT ON TABLE prompt_ratings IS '提示词评分表';
COMMENT ON TABLE prompt_comments IS '提示词评论表';
COMMENT ON TABLE social_interactions IS '社交互动表';
COMMENT ON TABLE template_categories IS '模板类别表';
COMMENT ON TABLE prompt_templates IS '提示词模板表';
COMMENT ON TABLE template_ratings IS '模板评分表';
COMMENT ON TABLE template_usage_stats IS '模板使用统计表';
COMMENT ON TABLE notifications IS '通知表';
COMMENT ON TABLE user_follows IS '用户关注表';
COMMENT ON TABLE topics IS '话题表';
COMMENT ON TABLE topic_posts IS '话题帖子表';
COMMENT ON TABLE comments IS '评论表（通用）';

COMMENT ON COLUMN prompts.allow_collaboration IS '是否允许协作编辑';
COMMENT ON COLUMN prompts.edit_permission IS '编辑权限级别: owner_only, collaborators, public';
COMMENT ON COLUMN prompts.created_by IS '创建者用户ID';
COMMENT ON COLUMN prompts.last_modified_by IS '最后修改者用户ID';
COMMENT ON COLUMN prompts.usage_count IS '使用次数';
COMMENT ON COLUMN prompts.view_count IS '查看次数';
COMMENT ON COLUMN prompts.input_variables IS '输入变量';
COMMENT ON COLUMN prompts.compatible_models IS '兼容模型';
COMMENT ON COLUMN prompts.template_format IS '模板格式';
