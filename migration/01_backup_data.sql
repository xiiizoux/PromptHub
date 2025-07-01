-- =============================================
-- 数据备份脚本 - 执行迁移前必须运行
-- =============================================

-- 1. 创建备份表名（使用当前时间戳）
DO $$
DECLARE
  backup_table_name TEXT;
BEGIN
  backup_table_name := 'prompts_backup_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');

  -- 创建备份表
  EXECUTE format('CREATE TABLE %I AS SELECT * FROM prompts', backup_table_name);

  -- 添加注释
  EXECUTE format('COMMENT ON TABLE %I IS ''迁移前的prompts表备份 - 包含原始messages JSONB数据''', backup_table_name);

  RAISE NOTICE '备份表已创建: %', backup_table_name;
END $$;

-- 2. 验证备份数据（查找最新的备份表）
DO $$
DECLARE
  backup_table_name TEXT;
  total_records INTEGER;
  records_with_messages INTEGER;
  records_without_messages INTEGER;
BEGIN
  -- 找到最新的备份表
  SELECT table_name INTO backup_table_name
  FROM information_schema.tables
  WHERE table_name LIKE 'prompts_backup_%'
  ORDER BY table_name DESC
  LIMIT 1;

  IF backup_table_name IS NOT NULL THEN
    -- 统计备份数据
    EXECUTE format('SELECT COUNT(*) FROM %I', backup_table_name) INTO total_records;
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE messages IS NOT NULL', backup_table_name) INTO records_with_messages;
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE messages IS NULL', backup_table_name) INTO records_without_messages;

    RAISE NOTICE '备份验证 - 表名: %, 总记录: %, 有messages: %, 无messages: %',
      backup_table_name, total_records, records_with_messages, records_without_messages;
  ELSE
    RAISE EXCEPTION '未找到备份表';
  END IF;
END $$;

-- 3. 检查messages字段的数据格式
SELECT
  '数据格式检查' as check_type,
  id,
  name,
  jsonb_typeof(messages) as messages_type,
  CASE
    WHEN jsonb_typeof(messages) = 'array' THEN jsonb_array_length(messages)
    ELSE NULL
  END as message_count,
  left(messages::text, 100) || '...' as messages_preview
FROM prompts
ORDER BY created_at DESC
LIMIT 5;

-- 4. 分析messages字段的结构
SELECT
  '结构分析' as analysis_type,
  jsonb_typeof(messages) as messages_data_type,
  COUNT(*) as record_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM prompts), 2) as percentage
FROM prompts
WHERE messages IS NOT NULL
GROUP BY jsonb_typeof(messages)
UNION ALL
SELECT
  '结构分析' as analysis_type,
  'NULL' as messages_data_type,
  COUNT(*) as record_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM prompts), 2) as percentage
FROM prompts
WHERE messages IS NULL;

-- 5. 显示备份完成信息
SELECT
  '备份完成' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'prompts_backup_%') as backup_tables_count,
  (SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'prompts_backup_%' ORDER BY table_name DESC LIMIT 1) as latest_backup_table;
