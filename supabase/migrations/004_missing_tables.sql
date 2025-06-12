-- 创建缺失的数据库表

-- 点赞表
CREATE TABLE IF NOT EXISTS prompt_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(prompt_id, user_id)
);

-- 收藏表
CREATE TABLE IF NOT EXISTS prompt_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(prompt_id, user_id)
);

-- 使用历史表
CREATE TABLE IF NOT EXISTS prompt_usage_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    prompt_name TEXT NOT NULL,
    prompt_version INTEGER DEFAULT 1,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT,
    model TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,
    action TEXT DEFAULT 'use',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_metadata JSONB
);

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

-- 评论表
CREATE TABLE IF NOT EXISTS prompt_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES prompt_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 增加索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt_id ON prompt_likes(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_user_id ON prompt_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_prompt_bookmarks_prompt_id ON prompt_bookmarks(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_bookmarks_user_id ON prompt_bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_prompt_usage_history_prompt_id ON prompt_usage_history(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_history_user_id ON prompt_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_history_timestamp ON prompt_usage_history(timestamp);

CREATE INDEX IF NOT EXISTS idx_prompt_ratings_prompt_id ON prompt_ratings(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ratings_user_id ON prompt_ratings(user_id);

CREATE INDEX IF NOT EXISTS idx_prompt_comments_prompt_id ON prompt_comments(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_user_id ON prompt_comments(user_id);

-- 创建数据库函数来增加使用次数
CREATE OR REPLACE FUNCTION increment_usage_count(prompt_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE prompts 
    SET usage_count = COALESCE(usage_count, 0) + 1,
        updated_at = NOW()
    WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql;

-- 确保prompts表有必要的字段
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 更新触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加更新触发器（先删除再创建避免冲突）
DROP TRIGGER IF EXISTS update_prompt_ratings_updated_at ON prompt_ratings;
CREATE TRIGGER update_prompt_ratings_updated_at 
    BEFORE UPDATE ON prompt_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prompt_comments_updated_at ON prompt_comments;
CREATE TRIGGER update_prompt_comments_updated_at 
    BEFORE UPDATE ON prompt_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 