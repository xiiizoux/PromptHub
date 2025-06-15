-- 创建提示词模板表
CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    variables JSONB DEFAULT '[]', -- 存储模板变量信息
    fields JSONB DEFAULT '[]', -- 存储模板字段定义（用于模板向导）
    author VARCHAR(255),
    likes INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    estimated_time VARCHAR(50), -- 预估使用时间
    language VARCHAR(10) DEFAULT 'zh-CN',
    is_featured BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_official BOOLEAN DEFAULT FALSE, -- 是否为官方模板
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 创建模板分类表
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- 图标名称
    color VARCHAR(50), -- 颜色类名
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建模板使用统计表
CREATE TABLE IF NOT EXISTS template_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    variables_used JSONB, -- 记录使用的变量值（脱敏处理）
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建模板评分表
CREATE TABLE IF NOT EXISTS template_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, user_id) -- 每个用户只能对同一模板评分一次
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_difficulty ON prompt_templates(difficulty);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_featured ON prompt_templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_official ON prompt_templates(is_official);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_tags ON prompt_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_variables ON prompt_templates USING GIN(variables);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prompt_templates_updated_at
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

CREATE TRIGGER update_template_categories_updated_at
    BEFORE UPDATE ON template_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

CREATE TRIGGER update_template_ratings_updated_at
    BEFORE UPDATE ON template_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

-- 创建RLS策略
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;

-- 模板表的RLS策略
CREATE POLICY "所有人可以查看活跃的模板" ON prompt_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "认证用户可以创建模板" ON prompt_templates
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "用户可以更新自己创建的模板" ON prompt_templates
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "用户可以删除自己创建的模板" ON prompt_templates
    FOR DELETE USING (created_by = auth.uid());

-- 分类表的RLS策略
CREATE POLICY "所有人可以查看活跃的分类" ON template_categories
    FOR SELECT USING (is_active = true);

-- 使用统计表的RLS策略
CREATE POLICY "用户可以查看自己的使用统计" ON template_usage_stats
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "认证用户可以添加使用统计" ON template_usage_stats
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 评分表的RLS策略
CREATE POLICY "所有人可以查看评分" ON template_ratings
    FOR SELECT USING (true);

CREATE POLICY "认证用户可以添加评分" ON template_ratings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "用户可以更新自己的评分" ON template_ratings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "用户可以删除自己的评分" ON template_ratings
    FOR DELETE USING (user_id = auth.uid());

-- 添加注释
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