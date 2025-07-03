-- 优化提示词查询性能
-- 这些优化将大幅提高账户管理页面的加载速度

-- 为prompts表添加必要的索引
CREATE INDEX IF NOT EXISTS idx_prompts_user_category_type 
ON prompts (user_id, category_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompts_user_public 
ON prompts (user_id, is_public, created_at DESC);

-- 移除is_active索引，因为prompts表没有is_active字段
-- CREATE INDEX IF NOT EXISTS idx_prompts_category_type_active 
-- ON prompts (category_type, is_active) 
-- WHERE is_active = true;

-- 改为基于用户ID和类型的索引
CREATE INDEX IF NOT EXISTS idx_prompts_category_type 
ON prompts (category_type, created_at DESC);

-- 创建用户提示词统计函数
CREATE OR REPLACE FUNCTION get_user_prompt_stats(
  p_user_id UUID
)
RETURNS TABLE(
  total_prompts INTEGER,
  public_prompts INTEGER,
  private_prompts INTEGER,
  chat_prompts INTEGER,
  image_prompts INTEGER,
  video_prompts INTEGER
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_prompts,
    COUNT(CASE WHEN is_public = true THEN 1 END)::INTEGER AS public_prompts,
    COUNT(CASE WHEN is_public = false OR is_public IS NULL THEN 1 END)::INTEGER AS private_prompts,
    COUNT(CASE WHEN category_type = 'chat' THEN 1 END)::INTEGER AS chat_prompts,
    COUNT(CASE WHEN category_type = 'image' THEN 1 END)::INTEGER AS image_prompts,
    COUNT(CASE WHEN category_type = 'video' THEN 1 END)::INTEGER AS video_prompts
  FROM prompts 
  WHERE user_id = p_user_id;
END;
$$;

-- 创建高效的用户提示词分页查询函数
CREATE OR REPLACE FUNCTION get_user_prompts_paginated(
  p_user_id UUID,
  p_category_type TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 10
)
RETURNS TABLE(
  id TEXT,
  name TEXT,
  description TEXT,
  category TEXT,
  category_type TEXT,
  tags TEXT[],
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  version INTEGER,
  view_count INTEGER,
  total_count BIGINT
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_offset INTEGER;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  RETURN QUERY
  WITH filtered_prompts AS (
    SELECT 
      p.id,
      p.name,
      p.description,
      p.category,
      p.category_type,
      p.tags,
      p.is_public,
      p.created_at,
      p.updated_at,
      p.version,
      COALESCE(p.view_count, 0) AS view_count,
      COUNT(*) OVER() AS total_count
    FROM prompts p
    WHERE p.user_id = p_user_id 
      AND (p_category_type IS NULL OR p.category_type = p_category_type)
    ORDER BY p.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset
  )
  SELECT 
    fp.id,
    fp.name,
    fp.description,
    fp.category,
    fp.category_type,
    fp.tags,
    fp.is_public,
    fp.created_at,
    fp.updated_at,
    fp.version,
    fp.view_count,
    fp.total_count
  FROM filtered_prompts fp;
END;
$$;

-- 为categories表添加索引
CREATE INDEX IF NOT EXISTS idx_categories_type_active 
ON categories (type, is_active) 
WHERE is_active = true;

-- 为tags相关查询优化GIN索引（TEXT[]类型）
CREATE INDEX IF NOT EXISTS idx_prompts_tags_gin 
ON prompts USING gin (tags);

-- 添加函数注释
COMMENT ON FUNCTION get_user_prompt_stats(UUID) IS 
'高效获取用户提示词统计信息，包括总数、公开/私有数量以及各类型数量';

COMMENT ON FUNCTION get_user_prompts_paginated(UUID, TEXT, INTEGER, INTEGER) IS 
'高效的用户提示词分页查询，支持按类型过滤，返回完整的分页信息';

-- 添加索引注释
COMMENT ON INDEX idx_prompts_user_category_type IS 
'优化用户按类型查询提示词的复合索引';

COMMENT ON INDEX idx_prompts_user_public IS 
'优化用户公开/私有提示词查询的复合索引';

COMMENT ON INDEX idx_prompts_tags_gin IS 
'GIN索引用于优化TEXT[]类型标签查询性能';