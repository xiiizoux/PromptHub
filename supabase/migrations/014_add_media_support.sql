-- =============================================
-- 014_add_media_support.sql
-- 添加图像和视频生成提示词支持
-- 扩展categories和prompts表以支持多媒体内容
-- =============================================

-- 创建类别类型枚举
DO $$ BEGIN
    CREATE TYPE category_type AS ENUM ('chat', 'image', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 扩展categories表，添加type字段
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS type category_type DEFAULT 'chat';

-- 更新现有categories的默认类型
UPDATE categories SET type = 'chat' WHERE type IS NULL;

-- 扩展prompts表，添加媒体相关字段
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS category_type category_type DEFAULT 'chat',
ADD COLUMN IF NOT EXISTS preview_asset_url TEXT,
ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;

-- 扩展prompt_versions表，添加媒体相关字段
ALTER TABLE prompt_versions 
ADD COLUMN IF NOT EXISTS preview_asset_url TEXT,
ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;

-- 创建预定义的分类数据
INSERT INTO categories (name, name_en, icon, description, type, sort_order) VALUES
-- 对话类分类
('通用对话', 'General Chat', '💬', '通用对话提示词', 'chat', 100),
('学术研究', 'Academic', '🎓', '学术研究相关提示词', 'chat', 110),
('编程开发', 'Programming', '💻', '编程开发相关提示词', 'chat', 120),
('文案写作', 'Writing', '✍️', '文案写作提示词', 'chat', 130),
('翻译语言', 'Translation', '🌐', '翻译相关提示词', 'chat', 140),

-- 图像生成分类  
('真实摄影', 'Photorealistic', '📸', '真实摄影风格图像生成', 'image', 200),
('艺术绘画', 'Artistic', '🎨', '艺术绘画风格图像生成', 'image', 210),
('动漫插画', 'Anime', '🎭', '动漫插画风格图像生成', 'image', 220),
('抽象艺术', 'Abstract', '🌈', '抽象艺术风格图像生成', 'image', 230),
('Logo设计', 'Logo Design', '🏷️', 'Logo和标识设计', 'image', 240),
('建筑空间', 'Architecture', '🏛️', '建筑和空间设计', 'image', 250),
('时尚设计', 'Fashion', '👗', '时尚和服装设计', 'image', 260),

-- 视频生成分类
('故事叙述', 'Storytelling', '📖', '故事叙述类视频生成', 'video', 300),
('动画特效', 'Animation', '🎬', '动画特效类视频生成', 'video', 310),
('产品展示', 'Product Demo', '📦', '产品展示类视频生成', 'video', 320),
('自然风景', 'Nature Scene', '🌅', '自然风景类视频生成', 'video', 330),
('人物肖像', 'Portrait', '👤', '人物肖像类视频生成', 'video', 340),
('广告营销', 'Marketing', '📢', '广告营销类视频生成', 'video', 350)

ON CONFLICT (name) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    sort_order = EXCLUDED.sort_order;

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_prompts_preview_asset_url ON prompts(preview_asset_url) WHERE preview_asset_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_type_sort_order ON categories(type, sort_order);
CREATE INDEX IF NOT EXISTS idx_prompts_category_type ON prompts(category_id);

-- 创建视图以便于查询带类型的提示词
CREATE OR REPLACE VIEW prompts_with_category_type AS
SELECT 
    p.*,
    c.type as category_type,
    c.name as category_name,
    c.name_en as category_name_en,
    c.icon as category_icon
FROM prompts p
LEFT JOIN categories c ON p.category_id = c.id;

-- 创建函数：根据类型获取提示词
CREATE OR REPLACE FUNCTION get_prompts_by_type(
    p_type category_type DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    tags TEXT[],
    messages JSONB,
    preview_asset_url TEXT,
    parameters JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    version NUMERIC,
    is_public BOOLEAN,
    user_id UUID,
    category_id UUID,
    usage_count INTEGER,
    view_count INTEGER,
    category_type category_type,
    category_name TEXT,
    category_name_en TEXT,
    category_icon TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.tags,
        p.messages,
        p.preview_asset_url,
        p.parameters,
        p.created_at,
        p.updated_at,
        p.version,
        p.is_public,
        p.user_id,
        p.category_id,
        p.usage_count,
        p.view_count,
        c.type as category_type,
        c.name as category_name,
        c.name_en as category_name_en,
        c.icon as category_icon
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 
        (p_type IS NULL OR c.type = p_type)
        AND (p.is_public = true OR p.user_id = p_user_id)
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：获取分类统计信息
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE (
    type category_type,
    total_categories BIGINT,
    total_prompts BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.type,
        COUNT(DISTINCT c.id) as total_categories,
        COUNT(p.id) as total_prompts
    FROM categories c
    LEFT JOIN prompts p ON c.id = p.category_id
    WHERE c.is_active = true
    GROUP BY c.type
    ORDER BY c.type;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为categories表创建更新时间触发器（如果不存在）
DO $$ BEGIN
    CREATE TRIGGER update_categories_updated_at
        BEFORE UPDATE ON categories
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 为prompts表创建更新时间触发器（如果不存在）
DO $$ BEGIN
    CREATE TRIGGER update_prompts_updated_at
        BEFORE UPDATE ON prompts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 设置RLS策略
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories表的RLS策略 - 所有用户都可以查看活跃分类，只有认证用户可以创建
CREATE POLICY "Anyone can view active categories" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can insert categories" ON categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update categories" ON categories
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 添加一些示例数据（可选）
COMMENT ON TABLE categories IS '分类表，支持chat、image、video三种类型';
COMMENT ON COLUMN categories.type IS '分类类型：chat(对话)、image(图像)、video(视频)';
COMMENT ON COLUMN prompts.preview_asset_url IS '预览资源URL，用于图像或视频的预览';
COMMENT ON COLUMN prompts.parameters IS '生成参数，存储JSON格式的参数信息';