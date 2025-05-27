-- MCP Prompt Server 完整数据库结构
-- 在 Supabase SQL 编辑器中执行此脚本以创建完整的数据库结构
-- 此文件合并了基础表结构、性能分析表结构和多用户支持

-- 启用UUID扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 基础表结构
-- =============================================

-- 创建提示词分类枚举类型
DO $$
BEGIN
  -- 检查枚举类型是否已存在
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prompt_category') THEN
    -- 创建枚举类型
    CREATE TYPE prompt_category AS ENUM (
      '全部', '学术', '职业', '文案', '设计', '教育', '情感', 
      '娱乐', '游戏', '通用', '生活', '商业', '办公', 
      '编程', '翻译', '绘图', '视频', '播客', '音乐', 
      '健康', '科技'
    );
  END IF;
END
$$;

-- 提示词表 - 存储所有提示词的主表
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                  -- 提示词名称
  description TEXT,                    -- 提示词描述
  category TEXT NOT NULL DEFAULT '通用', -- 分类
  tags TEXT[],                         -- 标签数组
  messages JSONB NOT NULL,             -- 提示词内容（符合ChatGPT格式的消息数组）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 创建时间
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 更新时间
  version INT DEFAULT 1,               -- 当前版本号
  is_public BOOLEAN DEFAULT FALSE,     -- 是否公开
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- 所有者用户ID
  allow_collaboration BOOLEAN DEFAULT false, -- 是否允许协作编辑
  edit_permission VARCHAR(20) DEFAULT 'owner_only', -- 编辑权限级别
  created_by UUID REFERENCES auth.users(id), -- 创建者用户ID
  last_modified_by UUID REFERENCES auth.users(id), -- 最后修改者用户ID
  UNIQUE(name, user_id)                -- 同一用户不能有重名提示词
);

-- 提示词版本表 - 存储提示词的所有历史版本
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,  -- 关联到prompts表
  version INT NOT NULL,                -- 版本号
  messages JSONB NOT NULL,             -- 该版本的提示词内容
  description TEXT,                    -- 该版本的描述
  tags TEXT[],                         -- 该版本的标签
  category TEXT,                       -- 该版本的分类
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 版本创建时间
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- 创建此版本的用户
  UNIQUE(prompt_id, version)           -- 确保每个提示词的版本号唯一
);

-- 用户表 - 用于身份验证和权限控制
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users PRIMARY KEY,  -- 关联到Supabase认证系统
  email TEXT UNIQUE,                   -- 用户邮箱
  display_name TEXT,                   -- 显示名称
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- 创建时间
);

-- =============================================
-- 性能分析表结构
-- =============================================

-- 提示词使用记录表 - 记录每次提示词使用的基本信息
CREATE TABLE IF NOT EXISTS prompt_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  prompt_version INT,                     -- 使用的提示词版本
  user_id UUID REFERENCES auth.users(id), -- 可选，关联到用户
  session_id TEXT,                        -- 会话标识符
  model TEXT,                             -- 使用的模型，如"gpt-4"
  input_tokens INT,                       -- 输入token数量
  output_tokens INT,                      -- 输出token数量
  latency_ms INT,                         -- 响应延迟(毫秒)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_metadata JSONB                   -- 客户端信息，如浏览器、设备等
);

-- 性能反馈表 - 存储用户对提示词生成结果的评价
CREATE TABLE IF NOT EXISTS prompt_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usage_id UUID REFERENCES prompt_usage(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5), -- 1-5星评分
  feedback_text TEXT,                        -- 文本反馈
  categories TEXT[],                         -- 反馈分类标签
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)     -- 提交反馈的用户
);

-- 提示词性能汇总表 - 存储聚合的性能数据，便于快速查询
CREATE TABLE IF NOT EXISTS prompt_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  prompt_version INT,                      -- 提示词版本
  usage_count INT DEFAULT 0,               -- 使用次数
  avg_rating NUMERIC(3,2),                 -- 平均评分
  avg_latency_ms INT,                      -- 平均响应时间
  avg_input_tokens INT,                    -- 平均输入token数
  avg_output_tokens INT,                   -- 平均输出token数
  feedback_count INT DEFAULT 0,            -- 收到的反馈数量
  last_used_at TIMESTAMP WITH TIME ZONE,   -- 最后使用时间
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prompt_id, prompt_version)        -- 添加唯一约束，用于ON CONFLICT子句
);

-- 提示词A/B测试表 - 用于比较不同提示词版本的性能
CREATE TABLE IF NOT EXISTS prompt_ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                      -- 测试名称
  description TEXT,                        -- 测试描述
  prompt_id UUID REFERENCES prompts(id),   -- 测试的提示词
  version_a INT NOT NULL,                  -- 比较的版本A
  version_b INT NOT NULL,                  -- 比较的版本B
  metric TEXT NOT NULL,                    -- 主要比较指标
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,       -- 测试结束时间
  status TEXT DEFAULT 'active',            -- active, completed, cancelled
  result JSONB,                            -- 测试结果数据
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 索引和触发器
-- =============================================

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
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 索引和触发器
-- =============================================

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_prompt_usage_prompt_id ON prompt_usage(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_created_at ON prompt_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_usage_id ON prompt_feedback(usage_id);
CREATE INDEX IF NOT EXISTS idx_prompt_performance_prompt_id ON prompt_performance(prompt_id, prompt_version);

-- 权限管理相关索引
CREATE INDEX IF NOT EXISTS idx_prompts_allow_collaboration ON prompts(allow_collaboration);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_prompts_edit_permission ON prompts(edit_permission);
CREATE INDEX IF NOT EXISTS idx_prompt_collaborators_prompt_id ON prompt_collaborators(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_collaborators_user_id ON prompt_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_audit_logs_prompt_id ON prompt_audit_logs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_audit_logs_user_id ON prompt_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_audit_logs_created_at ON prompt_audit_logs(created_at);

-- 创建触发器函数，在添加新的使用记录时自动更新性能汇总
CREATE OR REPLACE FUNCTION update_prompt_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- 插入或更新性能汇总记录
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
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER after_prompt_usage_insert
AFTER INSERT ON prompt_usage
FOR EACH ROW
EXECUTE FUNCTION update_prompt_performance();

-- 创建触发器函数，在添加新的反馈时更新性能汇总
CREATE OR REPLACE FUNCTION update_prompt_performance_rating()
RETURNS TRIGGER AS $$
DECLARE
  prompt_id_val UUID;
  prompt_version_val INT;
BEGIN
  -- 获取关联的prompt_id和version
  SELECT pu.prompt_id, pu.prompt_version INTO prompt_id_val, prompt_version_val
  FROM prompt_usage pu
  WHERE pu.id = NEW.usage_id;
  
  -- 更新性能汇总表中的评分数据
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
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER after_prompt_feedback_insert
AFTER INSERT ON prompt_feedback
FOR EACH ROW
EXECUTE FUNCTION update_prompt_performance_rating();

-- 创建审计日志触发器函数
CREATE OR REPLACE FUNCTION log_prompt_changes()
RETURNS TRIGGER AS $$
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
    -- 更新last_modified_by字段
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建审计日志触发器
CREATE TRIGGER prompt_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON prompts
  FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();

-- =============================================
-- =============================================
-- 行级安全策略
-- =============================================

-- 启用表的行级安全
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_ab_tests ENABLE ROW LEVEL SECURITY;

-- 为prompts表创建策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can view own prompts') THEN
    CREATE POLICY "Users can view own prompts" ON prompts FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Everyone can view public prompts') THEN
    CREATE POLICY "Everyone can view public prompts" ON prompts FOR SELECT USING (is_public = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can update own prompts') THEN
    CREATE POLICY "Users can update own prompts" ON prompts FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can delete own prompts') THEN
    CREATE POLICY "Users can delete own prompts" ON prompts FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can insert own prompts') THEN
    CREATE POLICY "Users can insert own prompts" ON prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 为prompt_versions表创建策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_versions' AND policyname = 'Users can view own prompt versions') THEN
    CREATE POLICY "Users can view own prompt versions" ON prompt_versions FOR SELECT USING (
      auth.uid() IN (SELECT user_id FROM prompts WHERE id = prompt_id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_versions' AND policyname = 'Everyone can view public prompt versions') THEN
    CREATE POLICY "Everyone can view public prompt versions" ON prompt_versions FOR SELECT USING (
      prompt_id IN (SELECT id FROM prompts WHERE is_public = true)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_versions' AND policyname = 'Users can manage own prompt versions') THEN
    CREATE POLICY "Users can manage own prompt versions" ON prompt_versions FOR ALL USING (
      auth.uid() IN (SELECT user_id FROM prompts WHERE id = prompt_id)
    );
  END IF;
END $$;

-- 为prompt_usage表创建策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_usage' AND policyname = 'Users can view own usage stats') THEN
    CREATE POLICY "Users can view own usage stats" ON prompt_usage FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_usage' AND policyname = 'Users can insert usage data') THEN
    CREATE POLICY "Users can insert usage data" ON prompt_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 为prompt_feedback表创建策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_feedback' AND policyname = 'Users can view own feedback') THEN
    CREATE POLICY "Users can view own feedback" ON prompt_feedback FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_feedback' AND policyname = 'Users can insert feedback') THEN
    CREATE POLICY "Users can insert feedback" ON prompt_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 为prompt_performance表创建策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_performance' AND policyname = 'Users can view performance of own prompts') THEN
    CREATE POLICY "Users can view performance of own prompts" ON prompt_performance FOR SELECT USING (
      prompt_id IN (SELECT id FROM prompts WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_performance' AND policyname = 'Everyone can view performance of public prompts') THEN
    CREATE POLICY "Everyone can view performance of public prompts" ON prompt_performance FOR SELECT USING (
      prompt_id IN (SELECT id FROM prompts WHERE is_public = true)
    );
  END IF;
END $$;

-- 为prompt_ab_tests表创建策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_ab_tests' AND policyname = 'Users can view own AB tests') THEN
    CREATE POLICY "Users can view own AB tests" ON prompt_ab_tests FOR SELECT USING (created_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_ab_tests' AND policyname = 'Users can manage own AB tests') THEN
    CREATE POLICY "Users can manage own AB tests" ON prompt_ab_tests FOR ALL USING (created_by = auth.uid());
  END IF;
END $$;

-- =============================================
-- API密钥管理
-- =============================================

-- 创建API密钥表
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now()),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, name)
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- 启用行级安全策略
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 添加行级安全策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users can only view their own API keys') THEN
    CREATE POLICY "Users can only view their own API keys" 
      ON api_keys FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users can only insert their own API keys') THEN
    CREATE POLICY "Users can only insert their own API keys" 
      ON api_keys FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users can only update their own API keys') THEN
    CREATE POLICY "Users can only update their own API keys" 
      ON api_keys FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users can only delete their own API keys') THEN
    CREATE POLICY "Users can only delete their own API keys" 
      ON api_keys FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Service role has full access to API keys') THEN
    CREATE POLICY "Service role has full access to API keys" 
      ON api_keys FOR ALL 
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- =============================================
-- 类别管理系统
-- =============================================

-- 创建类别表
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,           -- 类别名称（中文）
  name_en TEXT,                        -- 英文名称（可选）
  icon TEXT,                           -- 图标名称或类名
  description TEXT,                    -- 类别描述
  sort_order INT DEFAULT 0,            -- 排序顺序
  is_active BOOLEAN DEFAULT TRUE,      -- 是否启用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- 启用行级安全策略
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 添加行级安全策略 - 所有人都可以查看类别
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Everyone can view categories') THEN
    CREATE POLICY "Everyone can view categories" 
      ON categories FOR SELECT 
      USING (is_active = true);
  END IF;
END $$;

-- 只有管理员可以管理类别（这里暂时允许所有认证用户，后续可以调整）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Authenticated users can manage categories') THEN
    CREATE POLICY "Authenticated users can manage categories" 
      ON categories FOR ALL 
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 为现有的prompts表添加category_id外键（可选，保持向后兼容）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE prompts ADD COLUMN category_id UUID REFERENCES categories(id);
    CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON prompts(category_id);
  END IF;
END $$;

-- 为prompt_versions表也添加category_id（可选）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompt_versions' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE prompt_versions ADD COLUMN category_id UUID REFERENCES categories(id);
    CREATE INDEX IF NOT EXISTS idx_prompt_versions_category_id ON prompt_versions(category_id);
  END IF;
END $$;

-- =============================================
-- 初始化示例数据
-- =============================================

-- 插入预置类别数据
INSERT INTO categories (name, name_en, icon, description, sort_order) VALUES
-- 基础类别
('全部', 'all', 'grid-3x3', '显示所有类别的提示词', 0),
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
-- 注意：需要有至少一个用户才能插入这些数据
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
  true,  -- 设为公开
  id     -- 使用第一个找到的用户ID
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
  '[{"role":"system","content":{"type":"text","text":"你是一个专业的编程助手，能够帮助用户解决各种编程问题，提供代码示例和解释。\n\n请遵循以下原则：\n1. 提供清晰、简洁的代码示例\n2. 解释代码的工作原理\n3. 指出潜在的问题和优化方向\n4. 使用最佳实践和设计模式\n\n你精通多种编程语言，包括但不限于：JavaScript、TypeScript、Python、Java、C++、Go等。"}}]'::JSONB,
  NOW(),
  NOW(),
  1,
  true,  -- 设为公开
  id     -- 使用第一个找到的用户ID
FROM auth.users
ORDER BY created_at
LIMIT 1
ON CONFLICT (name, user_id) DO NOTHING;

-- 为默认提示词创建初始版本记录
INSERT INTO prompt_versions (prompt_id, version, messages, description, category, tags, user_id)
SELECT 
  p.id,            -- 提示词ID
  1,             -- 初始版本号
  p.messages,      -- 提示词内容
  p.description,   -- 描述
  p.category,      -- 分类
  p.tags,          -- 标签
  p.user_id        -- 用户ID
FROM prompts p
WHERE p.name IN ('general_assistant', 'code_assistant')
  AND NOT EXISTS (
    SELECT 1 FROM prompt_versions pv 
    WHERE pv.prompt_id = p.id AND pv.version = 1
  );
