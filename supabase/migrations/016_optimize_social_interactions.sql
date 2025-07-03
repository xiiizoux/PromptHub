-- 创建优化的社交互动查询函数
-- 这个函数将大幅提高获取提示词互动数据的性能

-- 创建高性能的聚合函数
CREATE OR REPLACE FUNCTION get_prompt_interactions(
  p_prompt_id TEXT,
  p_user_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  likes INTEGER,
  bookmarks INTEGER,
  shares INTEGER,
  user_liked BOOLEAN,
  user_bookmarked BOOLEAN,
  user_shared BOOLEAN
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH interaction_counts AS (
    -- 使用单个查询获取所有类型的数量统计
    SELECT 
      COUNT(CASE WHEN type = 'like' THEN 1 END)::INTEGER AS likes_count,
      COUNT(CASE WHEN type = 'bookmark' THEN 1 END)::INTEGER AS bookmarks_count,
      COUNT(CASE WHEN type = 'share' THEN 1 END)::INTEGER AS shares_count
    FROM social_interactions 
    WHERE prompt_id = p_prompt_id
  ),
  user_interactions AS (
    -- 只有在提供用户ID时才查询用户状态
    SELECT 
      BOOL_OR(type = 'like') AS user_liked_status,
      BOOL_OR(type = 'bookmark') AS user_bookmarked_status,
      BOOL_OR(type = 'share') AS user_shared_status
    FROM social_interactions
    WHERE prompt_id = p_prompt_id 
      AND user_id = COALESCE(p_user_id, '00000000-0000-0000-0000-000000000000')
      AND p_user_id IS NOT NULL
  )
  SELECT 
    ic.likes_count,
    ic.bookmarks_count,
    ic.shares_count,
    COALESCE(ui.user_liked_status, FALSE),
    COALESCE(ui.user_bookmarked_status, FALSE),
    COALESCE(ui.user_shared_status, FALSE)
  FROM interaction_counts ic
  LEFT JOIN user_interactions ui ON TRUE;
END;
$$;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_social_interactions_prompt_type 
ON social_interactions (prompt_id, type);

CREATE INDEX IF NOT EXISTS idx_social_interactions_user_prompt 
ON social_interactions (user_id, prompt_id);

-- 创建复合索引以支持常见查询模式
CREATE INDEX IF NOT EXISTS idx_social_interactions_compound 
ON social_interactions (prompt_id, type, user_id);

-- 添加注释
COMMENT ON FUNCTION get_prompt_interactions(TEXT, TEXT) IS 
'高性能函数，用于获取提示词的社交互动统计数据。通过单次查询返回点赞、收藏、分享数量以及用户的互动状态。';

-- 更新表注释
COMMENT ON INDEX idx_social_interactions_prompt_type IS 
'优化按提示词ID和类型查询的复合索引';

COMMENT ON INDEX idx_social_interactions_user_prompt IS 
'优化按用户ID和提示词ID查询的复合索引';

COMMENT ON INDEX idx_social_interactions_compound IS 
'支持复合查询的综合索引，显著提升查询性能';