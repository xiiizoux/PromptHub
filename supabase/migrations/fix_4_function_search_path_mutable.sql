-- 修复4: function_search_path_mutable - 函数搜索路径可变问题
-- 为所有函数设置固定的search_path参数，提高安全性

-- 修复 update_prompt_performance 函数
CREATE OR REPLACE FUNCTION update_prompt_performance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 修复 update_prompt_performance_rating 函数
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
$$;

-- 修复 log_prompt_changes 函数
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
$$;
