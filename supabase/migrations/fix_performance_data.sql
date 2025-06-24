-- 修复性能数据问题
-- 清理无效的性能记录（prompt_id为null的记录）

-- 1. 删除prompt_performance表中prompt_id为null的记录
DELETE FROM prompt_performance WHERE prompt_id IS NULL;

-- 2. 更新触发器函数，确保不会为搜索操作创建性能记录
-- 这些函数已经在schema.sql中更新了

-- 3. 添加注释说明搜索操作的数据结构
COMMENT ON COLUMN prompt_usage.prompt_id IS '提示词ID，搜索操作时为null';
COMMENT ON COLUMN prompt_usage.model IS '模型名称，MCP工具调用时为mcp_tool';
COMMENT ON COLUMN prompt_usage.client_metadata IS '客户端元数据，搜索操作时包含search_operation=true和toolName';

-- 4. 创建视图来分离搜索操作和提示词使用数据
CREATE OR REPLACE VIEW search_operations_view AS
SELECT 
  id,
  user_id,
  session_id,
  model,
  input_tokens,
  output_tokens,
  latency_ms,
  client_metadata,
  created_at,
  (client_metadata->>'toolName') as tool_name,
  (client_metadata->>'search_operation')::boolean as is_search_operation
FROM prompt_usage 
WHERE prompt_id IS NULL 
  AND model = 'mcp_tool';

CREATE OR REPLACE VIEW prompt_usage_view AS
SELECT 
  id,
  prompt_id,
  prompt_version,
  user_id,
  session_id,
  model,
  input_tokens,
  output_tokens,
  latency_ms,
  client_metadata,
  created_at
FROM prompt_usage 
WHERE prompt_id IS NOT NULL;

-- 5. 创建搜索操作统计函数
CREATE OR REPLACE FUNCTION get_search_operation_stats(
  time_range_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  total_searches BIGINT,
  avg_response_time NUMERIC,
  tool_stats JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_time TIMESTAMPTZ;
BEGIN
  start_time := NOW() - (time_range_hours || ' hours')::INTERVAL;
  
  SELECT 
    COUNT(*) as total_searches,
    ROUND(AVG(latency_ms), 2) as avg_response_time,
    jsonb_agg(
      jsonb_build_object(
        'tool', tool_name,
        'count', tool_count,
        'avg_time', tool_avg_time
      )
    ) as tool_stats
  INTO total_searches, avg_response_time, tool_stats
  FROM (
    SELECT 
      COALESCE(client_metadata->>'toolName', 'unknown') as tool_name,
      COUNT(*) as tool_count,
      ROUND(AVG(latency_ms), 2) as tool_avg_time
    FROM search_operations_view
    WHERE created_at >= start_time
    GROUP BY client_metadata->>'toolName'
    ORDER BY tool_count DESC
  ) tool_summary;
  
  RETURN QUERY SELECT total_searches, avg_response_time, tool_stats;
END;
$$;

-- 6. 创建提示词性能统计函数
CREATE OR REPLACE FUNCTION get_prompt_performance_stats(
  prompt_id_param UUID,
  time_range_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  usage_count BIGINT,
  avg_response_time NUMERIC,
  avg_input_tokens NUMERIC,
  avg_output_tokens NUMERIC,
  success_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_time TIMESTAMPTZ;
BEGIN
  start_time := NOW() - (time_range_hours || ' hours')::INTERVAL;
  
  SELECT 
    COUNT(*) as usage_count,
    ROUND(AVG(latency_ms), 2) as avg_response_time,
    ROUND(AVG(input_tokens), 2) as avg_input_tokens,
    ROUND(AVG(output_tokens), 2) as avg_output_tokens,
    ROUND(
      COUNT(CASE WHEN latency_ms IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
      2
    ) as success_rate
  INTO usage_count, avg_response_time, avg_input_tokens, avg_output_tokens, success_rate
  FROM prompt_usage_view
  WHERE prompt_id = prompt_id_param
    AND created_at >= start_time;
  
  RETURN QUERY SELECT usage_count, avg_response_time, avg_input_tokens, avg_output_tokens, success_rate;
END;
$$;

-- 7. 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_prompt_usage_search_operations 
ON prompt_usage (model, created_at) 
WHERE prompt_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_prompt_usage_prompt_stats 
ON prompt_usage (prompt_id, created_at) 
WHERE prompt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prompt_usage_client_metadata 
ON prompt_usage USING GIN (client_metadata) 
WHERE prompt_id IS NULL;

-- 8. 更新现有的性能记录，重新计算统计数据
-- 这将基于清理后的数据重新生成性能统计
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
SELECT 
  prompt_id,
  prompt_version,
  COUNT(*) as usage_count,
  ROUND(AVG(input_tokens)) as avg_input_tokens,
  ROUND(AVG(output_tokens)) as avg_output_tokens,
  ROUND(AVG(latency_ms)) as avg_latency_ms,
  MAX(created_at) as last_used_at,
  NOW() as updated_at
FROM prompt_usage_view
WHERE prompt_id IS NOT NULL
GROUP BY prompt_id, prompt_version
ON CONFLICT (prompt_id, prompt_version) DO UPDATE SET
  usage_count = EXCLUDED.usage_count,
  avg_input_tokens = EXCLUDED.avg_input_tokens,
  avg_output_tokens = EXCLUDED.avg_output_tokens,
  avg_latency_ms = EXCLUDED.avg_latency_ms,
  last_used_at = EXCLUDED.last_used_at,
  updated_at = EXCLUDED.updated_at;
