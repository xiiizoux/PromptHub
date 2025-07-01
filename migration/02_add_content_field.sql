-- =============================================
-- 添加content字段 - 第二步
-- =============================================

-- 1. 添加新的content字段
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS content TEXT;

-- 2. 添加临时字段用于迁移验证
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS migration_status VARCHAR(20) DEFAULT 'pending';

-- 3. 创建索引（先创建，数据迁移后会自动生效）
-- 检查并创建全文搜索索引
DO $$
BEGIN
  -- 尝试使用中文配置，如果不存在则使用默认配置
  IF EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'chinese') THEN
    CREATE INDEX IF NOT EXISTS idx_prompts_content_fulltext
    ON prompts USING gin(to_tsvector('chinese', content));
    RAISE NOTICE '使用中文全文搜索配置创建索引';
  ELSE
    -- 使用默认的simple配置（适用于多语言）
    CREATE INDEX IF NOT EXISTS idx_prompts_content_fulltext
    ON prompts USING gin(to_tsvector('simple', content));
    RAISE NOTICE '使用simple全文搜索配置创建索引';
  END IF;
END $$;

-- 创建模糊搜索索引（需要pg_trgm扩展）
DO $$
BEGIN
  -- 检查pg_trgm扩展是否存在
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_prompts_content_trgm
    ON prompts USING gin(content gin_trgm_ops);
    RAISE NOTICE '创建模糊搜索索引成功';
  ELSE
    -- 尝试创建扩展
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE INDEX IF NOT EXISTS idx_prompts_content_trgm
      ON prompts USING gin(content gin_trgm_ops);
      RAISE NOTICE '创建pg_trgm扩展和模糊搜索索引成功';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '无法创建pg_trgm扩展，跳过模糊搜索索引: %', SQLERRM;
      -- 创建基本的btree索引作为备选
      CREATE INDEX IF NOT EXISTS idx_prompts_content_basic
      ON prompts USING btree(content);
      RAISE NOTICE '创建基本btree索引作为备选';
    END;
  END IF;
END $$;

-- 4. 验证字段添加成功
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'prompts' 
  AND column_name IN ('content', 'migration_status', 'messages')
ORDER BY ordinal_position;
