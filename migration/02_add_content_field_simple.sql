-- =============================================
-- 添加content字段 - 简化版（适用于Supabase）
-- =============================================

-- 1. 添加新的content字段
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS content TEXT;

-- 2. 添加临时字段用于迁移验证
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS migration_status VARCHAR(20) DEFAULT 'pending';

-- 3. 创建基本索引（确保兼容性）
-- 基本的btree索引用于LIKE查询
CREATE INDEX IF NOT EXISTS idx_prompts_content_basic 
ON prompts USING btree(content);

-- 4. 尝试创建高级索引（如果支持的话）
DO $$
BEGIN
  -- 尝试创建GIN索引用于更快的文本搜索
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_prompts_content_gin 
    ON prompts USING gin(content gin_trgm_ops);
    RAISE NOTICE '✅ GIN索引创建成功 - 支持高性能模糊搜索';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  GIN索引创建失败，使用基本索引: %', SQLERRM;
  END;
  
  -- 尝试创建全文搜索索引
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_prompts_content_fulltext 
    ON prompts USING gin(to_tsvector('simple', content));
    RAISE NOTICE '✅ 全文搜索索引创建成功';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  全文搜索索引创建失败: %', SQLERRM;
  END;
END $$;

-- 5. 验证字段和索引创建
SELECT 
  '字段验证' as check_type,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'prompts' 
  AND column_name IN ('content', 'migration_status', 'messages')
ORDER BY ordinal_position;

-- 6. 显示创建的索引
SELECT 
  '索引验证' as check_type,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'prompts' 
  AND indexname LIKE '%content%';

-- 7. 显示完成信息
SELECT 
  '添加字段完成' as status,
  'content字段已添加，准备进行数据迁移' as message,
  NOW() as completed_at;
