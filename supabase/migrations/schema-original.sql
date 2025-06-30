-- MCP Prompt Server 完整数据库结构
-- 在 Supabase SQL 编辑器中执行此脚本以创建完整的数据库结构
-- 此文件用于一次性创建全新的数据库，包含用户数据同步功能

-- 启用UUID扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 基础表结构
-- =============================================

-- 注意：prompt_category 枚举类型已废弃
-- 此文件为历史schema文件，仅作参考
-- 现在使用 categories 表进行动态分类管理，不再使用硬编码的枚举类型
-- 旧的2字分类名（如'通用', '学术', '职业'等）已被更详细的分类名称替代

-- CREATE TYPE prompt_category AS ENUM (
--   '通用', '学术', '职业', '文案', '设计', '教育', '情感',
--   '娱乐', '游戏', '生活', '商业', '办公',
--   '编程', '翻译', '绘画', '视频', '播客', '音乐',
--   '健康', '科技'
-- );

-- 用户表 - 用于身份验证和权限控制，与auth.users同步
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email VARCHAR(255),
  display_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
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
  sort_order INT DEFAULT 0,
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
  version INT DEFAULT 1,
  is_public BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_collaboration BOOLEAN DEFAULT false,
  edit_permission VARCHAR(20) DEFAULT 'owner_only',
  created_by UUID REFERENCES auth.users(id),
  last_modified_by UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES categories(id),
  UNIQUE(name, user_id)
);

-- 提示词版本表 - 存储提示词的所有历史版本
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  version INT NOT NULL,
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
-- 性能分析表结构
-- =============================================

-- 提示词使用记录表
CREATE TABLE prompt_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  prompt_version INT,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  model TEXT,
  input_tokens INT,
  output_tokens INT,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_metadata JSONB
);

-- 性能反馈表
CREATE TABLE prompt_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usage_id UUID REFERENCES prompt_usage(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  categories TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- 提示词性能汇总表
CREATE TABLE prompt_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  prompt_version INT,
  usage_count INT DEFAULT 0,
  avg_rating NUMERIC(3,2),
  avg_latency_ms INT,
  avg_input_tokens INT,
  avg_output_tokens INT,
  feedback_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, prompt_version)
);

-- 提示词A/B测试表
CREATE TABLE prompt_ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  prompt_id UUID REFERENCES prompts(id),
  version_a INT NOT NULL,
  version_b INT NOT NULL,
  metric TEXT NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  result JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 权限管理表结构
-- =============================================

-- 协作者表
CREATE TABLE prompt_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) DEFAULT 'edit' CHECK (permission_level IN ('edit', 'review', 'admin')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- 审计日志表
CREATE TABLE prompt_audit_logs (
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
CREATE TABLE api_keys (
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
-- 索引创建
-- =============================================

CREATE INDEX idx_prompt_usage_prompt_id ON prompt_usage(prompt_id);
CREATE INDEX idx_prompt_usage_created_at ON prompt_usage(created_at);
CREATE INDEX idx_prompt_feedback_usage_id ON prompt_feedback(usage_id);
CREATE INDEX idx_prompt_performance_prompt_id ON prompt_performance(prompt_id, prompt_version);
CREATE INDEX idx_prompts_allow_collaboration ON prompts(allow_collaboration);
CREATE INDEX idx_prompts_created_by ON prompts(created_by);
CREATE INDEX idx_prompts_edit_permission ON prompts(edit_permission);
CREATE INDEX idx_prompt_collaborators_prompt_id ON prompt_collaborators(prompt_id);
CREATE INDEX idx_prompt_collaborators_user_id ON prompt_collaborators(user_id);
CREATE INDEX idx_prompt_audit_logs_prompt_id ON prompt_audit_logs(prompt_id);
CREATE INDEX idx_prompt_audit_logs_user_id ON prompt_audit_logs(user_id);
CREATE INDEX idx_prompt_audit_logs_created_at ON prompt_audit_logs(created_at);

-- 类别表索引
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_prompts_category_id ON prompts(category_id);
CREATE INDEX idx_prompt_versions_category_id ON prompt_versions(category_id);

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
  INSERT INTO public.users (id, email, display_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user',
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(
      EXCLUDED.display_name,
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
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

-- 性能统计更新触发器函数
CREATE OR REPLACE FUNCTION update_prompt_performance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO prompt_performance (
    prompt_id, 
    prompt_version, 
    usage_count, 
    avg_input_tokens,
    avg_output_tokens,
    avg_latency_ms,
    last_used_at,
    updated_at
  )
  VALUES (
    NEW.prompt_id,
    NEW.prompt_version,
    1,
    NEW.input_tokens,
    NEW.output_tokens,
    NEW.latency_ms,
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (prompt_id, prompt_version) DO UPDATE SET
    usage_count = prompt_performance.usage_count + 1,
    avg_input_tokens = (prompt_performance.avg_input_tokens * prompt_performance.usage_count + NEW.input_tokens) / (prompt_performance.usage_count + 1),
    avg_output_tokens = (prompt_performance.avg_output_tokens * prompt_performance.usage_count + NEW.output_tokens) / (prompt_performance.usage_count + 1),
    avg_latency_ms = (prompt_performance.avg_latency_ms * prompt_performance.usage_count + NEW.latency_ms) / (prompt_performance.usage_count + 1),
    last_used_at = NEW.created_at,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$;

-- 性能评分更新触发器函数
CREATE OR REPLACE FUNCTION update_prompt_performance_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prompt_id_val UUID;
  prompt_version_val INT;
BEGIN
  SELECT pu.prompt_id, pu.prompt_version INTO prompt_id_val, prompt_version_val
  FROM prompt_usage pu
  WHERE pu.id = NEW.usage_id;
  
  UPDATE prompt_performance
  SET 
    feedback_count = feedback_count + 1,
    avg_rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM prompt_feedback pf
      JOIN prompt_usage pu ON pf.usage_id = pu.id
      WHERE pu.prompt_id = prompt_id_val AND pu.prompt_version = prompt_version_val
    ),
    updated_at = NOW()
  WHERE prompt_id = prompt_id_val AND prompt_version = prompt_version_val;
  
  RETURN NEW;
END;
$$;

-- 审计日志触发器函数
CREATE OR REPLACE FUNCTION log_prompt_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO prompt_audit_logs (prompt_id, user_id, action, changes)
    VALUES (
      NEW.id,
      auth.uid(),
      'prompt_updated',
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
    );
    NEW.last_modified_by = auth.uid();
    NEW.updated_at = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO prompt_audit_logs (prompt_id, user_id, action, changes)
    VALUES (
      NEW.id,
      auth.uid(),
      'prompt_created',
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO prompt_audit_logs (prompt_id, user_id, action, changes)
    VALUES (
      OLD.id,
      auth.uid(),
      'prompt_deleted',
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

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

-- 性能统计触发器
CREATE TRIGGER after_prompt_usage_insert
  AFTER INSERT ON prompt_usage
  FOR EACH ROW EXECUTE FUNCTION update_prompt_performance();

CREATE TRIGGER after_prompt_feedback_insert
  AFTER INSERT ON prompt_feedback
  FOR EACH ROW EXECUTE FUNCTION update_prompt_performance_rating();

-- 审计日志触发器
CREATE TRIGGER prompt_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON prompts
  FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();

-- =============================================
-- 启用行级安全
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

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

-- 使用统计表策略
CREATE POLICY "Users can view own usage stats" ON prompt_usage 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert usage data" ON prompt_usage 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 反馈表策略
CREATE POLICY "Users can view own feedback" ON prompt_feedback 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert feedback" ON prompt_feedback 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 性能汇总表策略
CREATE POLICY "Comprehensive performance view access" ON prompt_performance
  FOR SELECT USING (
    prompt_id IN (SELECT id FROM prompts WHERE user_id = auth.uid() OR is_public = true)
  );

-- A/B测试表策略
CREATE POLICY "Users comprehensive AB tests management" ON prompt_ab_tests
  FOR ALL USING (created_by = auth.uid());

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
DROP POLICY IF EXISTS "Users can view own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can manage own API keys" ON api_keys;

-- 分离的详细策略（替换原来的通用策略）
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

-- 类别表策略 - 所有人都可以查看类别
CREATE POLICY "Everyone can view categories" ON categories
  FOR SELECT USING (is_active = true);

-- 只有认证用户可以管理类别
CREATE POLICY "Authenticated users can manage categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- 初始化示例数据
-- =============================================

-- 注意：此文件为历史schema文件，以下分类数据已过时
-- 旧的2字分类名（如'通用', '学术', '职业'等）已被删除，现在使用更详细的分类名称
-- 当前数据库已包含重构后的分类数据，请勿执行以下INSERT语句

-- 历史分类数据（已废弃，仅作参考）：
/*
INSERT INTO categories (name, name_en, icon, description, sort_order) VALUES
-- 以下为已废弃的旧分类数据
('通用', 'general', 'layers', '通用助手和日常对话类提示词', 10),
('学术', 'academic', 'academic-cap', '学术研究、论文写作、学术分析类提示词', 20),
('职业', 'professional', 'briefcase', '职场沟通、简历优化、面试准备类提示词', 30),
('文案', 'copywriting', 'pencil', '广告文案、营销内容、产品描述类提示词', 40),
('设计', 'design', 'color-swatch', '设计思维、创意构思、视觉设计类提示词', 50),
('绘画', 'painting', 'paint-brush', '绘画创作、艺术指导、风格描述类提示词', 55),
('教育', 'education', 'book-open', '教学辅导、知识解释、学习指导类提示词', 60),
('情感', 'emotional', 'heart', '情感支持、心理咨询、人际关系类提示词', 70),
('娱乐', 'entertainment', 'sparkles', '游戏、故事创作、趣味对话类提示词', 80),
('游戏', 'gaming', 'puzzle-piece', '游戏策略、角色扮演、游戏设计类提示词', 90),
('生活', 'lifestyle', 'home', '日常生活、健康建议、生活技巧类提示词', 100),
('商业', 'business', 'chart-bar', '商业分析、市场策略、企业管理类提示词', 110),
('办公', 'office', 'document-text', '办公自动化、文档处理、会议记录类提示词', 120),
('编程', 'programming', 'code', '代码编写、程序调试、技术解答类提示词', 130),
('翻译', 'translation', 'language', '多语言翻译、本地化、语言学习类提示词', 140),
('视频', 'video', 'video-camera', '视频制作、脚本编写、视频策划类提示词', 150),
('播客', 'podcast', 'microphone', '播客制作、音频内容、访谈策划类提示词', 160),
('音乐', 'music', 'musical-note', '音乐创作、歌词编写、音乐分析类提示词', 170),
('健康', 'health', 'heart-pulse', '健康咨询、医疗信息、养生建议类提示词', 180),
('科技', 'technology', 'cpu-chip', '科技趋势、技术分析、创新思维类提示词', 190);
*/

-- 当前分类数据管理说明：
-- 1. 数据库已包含重构后的实际分类数据，使用更详细和专业的分类名称
-- 2. 分类数据通过API动态管理，不再使用硬编码方式
-- 3. 如需查看当前分类，请查询：SELECT * FROM categories ORDER BY sort_order;

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

-- 添加默认提示词示例
INSERT INTO prompts (name, description, category, tags, messages, created_at, updated_at, version, is_public, user_id)
SELECT
  'general_assistant',
  '通用助手提示词，用于日常对话和问答',
  '通用',
  ARRAY['对话', '助手', '基础'],
  '[{"role":"system","content":{"type":"text","text":"你是一个有用的AI助手，能够回答用户的各种问题并提供帮助。"}}]'::JSONB,
  NOW(),
  NOW(),
  1,
  true,
  id
FROM auth.users
ORDER BY created_at
LIMIT 1
ON CONFLICT (name, user_id) DO NOTHING;

-- 代码助手示例
INSERT INTO prompts (name, description, category, tags, messages, created_at, updated_at, version, is_public, user_id)
SELECT
  'code_assistant',
  '代码助手提示词，用于编程和代码相关问题',
  '编程',
  ARRAY['代码', '编程', '开发'],
  '[{"role":"system","content":{"type":"text","text":"你是一个专业的编程助手，能够帮助用户解决各种编程问题，提供代码示例和解释。\\n\\n请遵循以下原则：\\n1. 提供清晰、简洁的代码示例\\n2. 解释代码的工作原理\\n3. 指出潜在的问题和优化方向\\n4. 使用最佳实践和设计模式\\n\\n你精通多种编程语言，包括但不限于：JavaScript、TypeScript、Python、Java、C++、Go等。"}}]'::JSONB,
  NOW(),
  NOW(),
  1,
  true,
  id
FROM auth.users
ORDER BY created_at
LIMIT 1
ON CONFLICT (name, user_id) DO NOTHING;

-- 为默认提示词创建初始版本记录
INSERT INTO prompt_versions (prompt_id, version, messages, description, category, tags, user_id)
SELECT 
  p.id,
  1,
  p.messages,
  p.description,
  p.category,
  p.tags,
  p.user_id
FROM prompts p
WHERE p.name IN ('general_assistant', 'code_assistant')
  AND NOT EXISTS (
    SELECT 1 FROM prompt_versions pv 
    WHERE pv.prompt_id = p.id AND pv.version = 1
  );

-- =============================================
-- 表字段注释
-- =============================================

-- 添加注释
COMMENT ON COLUMN prompts.allow_collaboration IS '是否允许协作编辑';
COMMENT ON COLUMN prompts.edit_permission IS '编辑权限级别: owner_only, collaborators, public';
COMMENT ON COLUMN prompts.created_by IS '创建者用户ID（新字段，与user_id字段功能类似）';
COMMENT ON COLUMN prompts.last_modified_by IS '最后修改者用户ID';

COMMENT ON TABLE prompt_collaborators IS '提示词协作者表';
COMMENT ON TABLE prompt_audit_logs IS '提示词操作审计日志表';
COMMENT ON TABLE categories IS '提示词类别管理表';
