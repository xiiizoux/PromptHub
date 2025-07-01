-- =============================================
-- 验证迁移结果 - 第四步
-- =============================================

-- 1. 总体迁移统计
SELECT 
  '总体统计' as check_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN content IS NOT NULL AND content != '' THEN 1 END) as records_with_content,
  COUNT(CASE WHEN content IS NULL OR content = '' THEN 1 END) as records_without_content,
  COUNT(CASE WHEN migration_status = 'completed' THEN 1 END) as migration_completed,
  COUNT(CASE WHEN migration_status = 'error' THEN 1 END) as migration_errors
FROM prompts;

-- 2. 内容长度分析
SELECT 
  '内容长度分析' as check_type,
  MIN(length(content)) as min_length,
  MAX(length(content)) as max_length,
  AVG(length(content))::INTEGER as avg_length,
  COUNT(CASE WHEN length(content) = 0 THEN 1 END) as empty_content_count
FROM prompts 
WHERE content IS NOT NULL;

-- 3. 对比原始messages和新content（样本检查）
SELECT 
  id,
  name,
  jsonb_array_length(messages) as original_message_count,
  length(content) as content_length,
  -- 显示原始messages的第一个内容
  (messages->0->>'content') as first_message_content,
  -- 显示新content的前100字符
  left(content, 100) as content_preview
FROM prompts 
WHERE migration_status = 'completed'
LIMIT 10;

-- 4. 检查是否有迁移失败的记录
SELECT 
  id,
  name,
  migration_status,
  messages,
  content
FROM prompts 
WHERE migration_status = 'error' OR (content IS NULL AND messages IS NOT NULL);

-- 5. 搜索功能测试
-- 测试新的content字段搜索
SELECT 
  '搜索测试' as test_type,
  COUNT(*) as matching_records
FROM prompts 
WHERE content ILIKE '%AI%' OR content ILIKE '%助手%';

-- 6. 索引使用情况检查
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'prompts' 
  AND indexname LIKE '%content%';

-- 7. 创建迁移报告
CREATE OR REPLACE VIEW migration_report AS
SELECT 
  'PromptHub Messages to Content Migration Report' as title,
  NOW() as report_time,
  (SELECT COUNT(*) FROM prompts) as total_prompts,
  (SELECT COUNT(*) FROM prompts WHERE migration_status = 'completed') as successful_migrations,
  (SELECT COUNT(*) FROM prompts WHERE migration_status = 'error') as failed_migrations,
  (SELECT AVG(length(content))::INTEGER FROM prompts WHERE content IS NOT NULL) as avg_content_length,
  (SELECT COUNT(*) FROM prompts WHERE content IS NOT NULL AND content != '') as non_empty_content_count;

SELECT * FROM migration_report;
