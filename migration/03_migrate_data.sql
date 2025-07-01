-- =============================================
-- 数据迁移脚本 - 第三步
-- =============================================

-- 创建迁移函数
CREATE OR REPLACE FUNCTION migrate_messages_to_content()
RETURNS TABLE(
  processed_count INTEGER,
  success_count INTEGER,
  error_count INTEGER,
  sample_results TEXT
) 
LANGUAGE plpgsql AS $$
DECLARE
  rec RECORD;
  content_text TEXT;
  processed INTEGER := 0;
  success INTEGER := 0;
  error_count INTEGER := 0;
  sample_text TEXT := '';
BEGIN
  -- 遍历所有记录
  FOR rec IN SELECT id, name, messages FROM prompts WHERE content IS NULL LOOP
    BEGIN
      processed := processed + 1;
      content_text := '';
      
      -- 处理不同的messages格式
      IF rec.messages IS NOT NULL THEN
        -- 如果是JSONB数组
        IF jsonb_typeof(rec.messages) = 'array' THEN
          -- 提取所有消息的content字段并合并
          SELECT string_agg(
            CASE 
              WHEN jsonb_typeof(msg) = 'object' AND msg ? 'content' THEN 
                msg->>'content'
              WHEN jsonb_typeof(msg) = 'string' THEN 
                msg #>> '{}'
              ELSE 
                msg::text
            END, 
            E'\n\n'
          ) INTO content_text
          FROM jsonb_array_elements(rec.messages) AS msg;
          
        -- 如果是单个对象
        ELSIF jsonb_typeof(rec.messages) = 'object' THEN
          content_text := rec.messages->>'content';
          
        -- 如果是字符串
        ELSIF jsonb_typeof(rec.messages) = 'string' THEN
          content_text := rec.messages #>> '{}';
          
        ELSE
          content_text := rec.messages::text;
        END IF;
      END IF;
      
      -- 清理和格式化内容
      content_text := COALESCE(content_text, '');
      content_text := trim(content_text);
      
      -- 更新记录
      UPDATE prompts 
      SET 
        content = content_text,
        migration_status = 'completed',
        updated_at = NOW()
      WHERE id = rec.id;
      
      success := success + 1;
      
      -- 收集前3个样本用于验证
      IF success <= 3 THEN
        sample_text := sample_text || format(
          'ID: %s, Name: %s, Content Length: %s' || E'\n',
          rec.id, rec.name, length(content_text)
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      
      -- 记录错误
      UPDATE prompts 
      SET migration_status = 'error'
      WHERE id = rec.id;
      
      RAISE NOTICE '迁移记录 % 时出错: %', rec.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT processed, success, error_count, sample_text;
END;
$$;

-- 执行迁移
SELECT * FROM migrate_messages_to_content();

-- 验证迁移结果
SELECT 
  migration_status,
  COUNT(*) as count,
  AVG(length(content)) as avg_content_length,
  MIN(length(content)) as min_content_length,
  MAX(length(content)) as max_content_length
FROM prompts 
GROUP BY migration_status;

-- 显示迁移样本
SELECT 
  id,
  name,
  length(content) as content_length,
  left(content, 100) || '...' as content_preview
FROM prompts 
WHERE migration_status = 'completed'
LIMIT 5;
