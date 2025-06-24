-- 应用性能数据修复
-- 这个脚本需要在Supabase数据库控制台中手动执行

-- 1. 删除无效的性能记录（prompt_id为null的记录）
DELETE FROM prompt_performance WHERE prompt_id IS NULL;

-- 2. 更新触发器函数，确保不会为搜索操作创建性能记录
CREATE OR REPLACE FUNCTION update_prompt_performance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 只为有效的prompt_id创建性能记录，跳过搜索操作（prompt_id为null）
  IF NEW.prompt_id IS NOT NULL THEN
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
  END IF;

  RETURN NEW;
END;
$$;

-- 3. 更新反馈触发器函数
CREATE OR REPLACE FUNCTION update_prompt_performance_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prompt_id_val UUID;
  prompt_version_val NUMERIC(3,1);
BEGIN
  SELECT pu.prompt_id, pu.prompt_version INTO prompt_id_val, prompt_version_val
  FROM prompt_usage pu
  WHERE pu.id = NEW.usage_id;

  -- 只为有效的prompt_id更新性能记录，跳过搜索操作（prompt_id为null）
  IF prompt_id_val IS NOT NULL THEN
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
  END IF;

  RETURN NEW;
END;
$$;

-- 4. 添加注释说明数据结构
COMMENT ON COLUMN prompt_usage.prompt_id IS '提示词ID，搜索操作时为null';
COMMENT ON COLUMN prompt_usage.model IS '模型名称，MCP工具调用时为mcp_tool';
COMMENT ON COLUMN prompt_usage.client_metadata IS '客户端元数据，搜索操作时包含search_operation=true和toolName';

-- 5. 创建视图来分离搜索操作和提示词使用数据
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

-- 6. 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_prompt_usage_search_operations 
ON prompt_usage (model, created_at) 
WHERE prompt_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_prompt_usage_prompt_stats 
ON prompt_usage (prompt_id, created_at) 
WHERE prompt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prompt_usage_client_metadata 
ON prompt_usage USING GIN (client_metadata) 
WHERE prompt_id IS NULL;

-- 7. 重新计算现有的性能统计数据
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

-- 8. 验证修复结果
SELECT 
  'prompt_performance表中prompt_id为null的记录数' as description,
  COUNT(*) as count
FROM prompt_performance 
WHERE prompt_id IS NULL

UNION ALL

SELECT 
  'prompt_usage表中搜索操作记录数' as description,
  COUNT(*) as count
FROM prompt_usage 
WHERE prompt_id IS NULL AND model = 'mcp_tool'

UNION ALL

SELECT 
  'prompt_usage表中提示词使用记录数' as description,
  COUNT(*) as count
FROM prompt_usage 
WHERE prompt_id IS NOT NULL

UNION ALL

SELECT 
  'prompt_performance表中有效记录数' as description,
  COUNT(*) as count
FROM prompt_performance 
WHERE prompt_id IS NOT NULL;
