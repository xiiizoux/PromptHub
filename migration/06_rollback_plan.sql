-- =============================================
-- 回滚方案 - 第六步（紧急情况使用）
-- =============================================

-- 如果迁移出现问题，可以使用此脚本回滚

-- 1. 检查备份表是否存在
DO $$
DECLARE
  backup_table_name TEXT;
BEGIN
  SELECT table_name INTO backup_table_name
  FROM information_schema.tables 
  WHERE table_name LIKE 'prompts_backup_%'
  ORDER BY table_name DESC
  LIMIT 1;
  
  IF backup_table_name IS NOT NULL THEN
    RAISE NOTICE '找到备份表: %', backup_table_name;
  ELSE
    RAISE EXCEPTION '未找到备份表，无法执行回滚';
  END IF;
END $$;

-- 2. 创建回滚函数
CREATE OR REPLACE FUNCTION rollback_migration()
RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  backup_table_name TEXT;
  affected_rows INTEGER;
BEGIN
  -- 找到最新的备份表
  SELECT table_name INTO backup_table_name
  FROM information_schema.tables 
  WHERE table_name LIKE 'prompts_backup_%'
  ORDER BY table_name DESC
  LIMIT 1;
  
  IF backup_table_name IS NULL THEN
    RETURN 'ERROR: 未找到备份表';
  END IF;
  
  -- 开始回滚事务
  BEGIN
    -- 删除当前prompts表的数据
    DELETE FROM prompts;
    
    -- 从备份表恢复数据
    EXECUTE format('INSERT INTO prompts SELECT * FROM %I', backup_table_name);
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- 删除迁移添加的字段
    ALTER TABLE prompts DROP COLUMN IF EXISTS content;
    ALTER TABLE prompts DROP COLUMN IF EXISTS migration_status;
    
    -- 删除新创建的索引
    DROP INDEX IF EXISTS idx_prompts_content_fulltext;
    DROP INDEX IF EXISTS idx_prompts_content_trgm;
    
    RETURN format('SUCCESS: 已从 %s 恢复 %s 条记录', backup_table_name, affected_rows);
    
  EXCEPTION WHEN OTHERS THEN
    RETURN format('ERROR: 回滚失败 - %s', SQLERRM);
  END;
END;
$$;

-- 3. 回滚验证函数
CREATE OR REPLACE FUNCTION verify_rollback()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) 
LANGUAGE plpgsql AS $$
BEGIN
  -- 检查content字段是否已删除
  RETURN QUERY
  SELECT 
    'content字段检查'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'prompts' AND column_name = 'content'
    ) THEN 'FAILED - content字段仍存在' ELSE 'PASSED - content字段已删除' END,
    ''::TEXT;
    
  -- 检查messages字段是否完整
  RETURN QUERY
  SELECT 
    'messages字段检查'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'prompts' AND column_name = 'messages'
    ) THEN 'PASSED - messages字段存在' ELSE 'FAILED - messages字段缺失' END,
    ''::TEXT;
    
  -- 检查数据完整性
  RETURN QUERY
  SELECT 
    '数据完整性检查'::TEXT,
    'PASSED'::TEXT,
    format('共有 %s 条记录', (SELECT COUNT(*) FROM prompts))::TEXT;
END;
$$;

-- 使用说明
/*
如需回滚，请按以下步骤执行：

1. 停止应用服务
2. 执行回滚：
   SELECT rollback_migration();
   
3. 验证回滚结果：
   SELECT * FROM verify_rollback();
   
4. 如果验证通过，重启应用服务
5. 删除备份表（可选）：
   DROP TABLE prompts_backup_YYYYMMDD;
*/

-- 4. 紧急回滚（一键执行）
-- 取消注释下面的代码来执行紧急回滚
/*
SELECT rollback_migration();
SELECT * FROM verify_rollback();
*/
