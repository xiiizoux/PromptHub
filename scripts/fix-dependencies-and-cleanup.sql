-- 修复依赖关系并清理messages字段
-- 1. 重新创建视图使用content字段替代messages字段
-- 2. 删除messages字段

BEGIN;

-- 步骤1: 备份并重新创建prompts_with_category_type视图
-- 首先删除现有视图
DROP VIEW IF EXISTS prompts_with_category_type CASCADE;

-- 重新创建视图，使用content字段替代messages字段
CREATE VIEW prompts_with_category_type AS
SELECT
    p.*,
    COALESCE(c.type::text, p.category_type::text) as category_type_resolved,
    c.name_en as category_name_en,
    c.icon as category_icon,
    c.description as category_description
FROM prompts p
LEFT JOIN categories c ON p.category_id = c.id OR p.category = c.name;

-- 步骤2: 检查是否还有其他依赖messages字段的对象
DO $$
DECLARE
    dep_count integer;
BEGIN
    -- 检查是否还有依赖messages字段的对象
    SELECT COUNT(*) INTO dep_count
    FROM pg_depend 
    JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
    JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
    JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid 
    JOIN pg_attribute ON pg_depend.refobjid = pg_attribute.attrelid 
        AND pg_depend.refobjsubid = pg_attribute.attnum 
    WHERE source_table.relname = 'prompts'
        AND pg_attribute.attname = 'messages';
    
    IF dep_count > 0 THEN
        RAISE EXCEPTION '仍有 % 个对象依赖于prompts.messages字段，请手动处理', dep_count;
    ELSE
        RAISE NOTICE '✅ 没有对象依赖于prompts.messages字段，可以安全删除';
    END IF;
END $$;

-- 步骤3: 检查prompt_versions表的依赖
DO $$
DECLARE
    dep_count integer;
BEGIN
    SELECT COUNT(*) INTO dep_count
    FROM pg_depend 
    JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
    JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
    JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid 
    JOIN pg_attribute ON pg_depend.refobjid = pg_attribute.attrelid 
        AND pg_depend.refobjsubid = pg_attribute.attnum 
    WHERE source_table.relname = 'prompt_versions'
        AND pg_attribute.attname = 'messages';
    
    IF dep_count > 0 THEN
        RAISE NOTICE '⚠️ 有 % 个对象依赖于prompt_versions.messages字段', dep_count;
    ELSE
        RAISE NOTICE '✅ 没有对象依赖于prompt_versions.messages字段';
    END IF;
END $$;

-- 步骤4: 最终验证数据完整性
DO $$
DECLARE
    prompts_empty integer;
    versions_empty integer;
BEGIN
    -- 验证所有记录都有content内容
    SELECT COUNT(*) INTO prompts_empty 
    FROM prompts 
    WHERE content IS NULL OR content = '';
    
    SELECT COUNT(*) INTO versions_empty 
    FROM prompt_versions 
    WHERE content IS NULL OR content = '';
    
    IF prompts_empty > 0 OR versions_empty > 0 THEN
        RAISE EXCEPTION '发现content为空的记录: prompts表 % 条, prompt_versions表 % 条', prompts_empty, versions_empty;
    END IF;
    
    RAISE NOTICE '✅ 数据验证通过，所有记录都有content内容';
END $$;

-- 步骤5: 删除messages字段
-- 删除可能存在的messages字段索引
DROP INDEX IF EXISTS idx_prompts_messages;
DROP INDEX IF EXISTS idx_prompt_versions_messages;

-- 删除messages字段
DO $$
BEGIN
    -- 删除prompts表的messages字段
    ALTER TABLE prompts DROP COLUMN messages;
    RAISE NOTICE '✅ 已删除prompts表的messages字段';

    -- 删除prompt_versions表的messages字段
    ALTER TABLE prompt_versions DROP COLUMN messages;
    RAISE NOTICE '✅ 已删除prompt_versions表的messages字段';
END $$;

-- 步骤6: 确保content字段有适当的索引
-- 删除可能导致问题的B-tree索引
DROP INDEX IF EXISTS idx_prompts_content_basic;
DROP INDEX IF EXISTS idx_prompt_versions_content_basic;

-- 创建GIN索引支持全文搜索
CREATE INDEX IF NOT EXISTS idx_prompts_content_gin ON prompts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_prompt_versions_content_gin ON prompt_versions USING gin(to_tsvector('english', content));

-- 为短内容创建部分B-tree索引
CREATE INDEX IF NOT EXISTS idx_prompts_content_prefix ON prompts (left(content, 100)) WHERE length(content) <= 100;
CREATE INDEX IF NOT EXISTS idx_prompt_versions_content_prefix ON prompt_versions (left(content, 100)) WHERE length(content) <= 100;

-- 步骤7: 更新表注释
COMMENT ON TABLE prompts IS '提示词表 - 已移除messages字段，使用content字段存储内容';
COMMENT ON TABLE prompt_versions IS '提示词版本表 - 已移除messages字段，使用content字段存储内容';
COMMENT ON VIEW prompts_with_category_type IS '提示词与分类类型关联视图 - 已更新为使用content字段';

COMMIT;

-- 步骤8: 最终验证
DO $$
BEGIN
    -- 检查messages字段是否已删除
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prompts' AND column_name = 'messages'
    ) THEN
        RAISE EXCEPTION 'prompts表的messages字段删除失败';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prompt_versions' AND column_name = 'messages'
    ) THEN
        RAISE EXCEPTION 'prompt_versions表的messages字段删除失败';
    END IF;
    
    -- 检查视图是否正常工作
    IF NOT EXISTS (SELECT 1 FROM prompts_with_category_type LIMIT 1) THEN
        RAISE NOTICE '⚠️ prompts_with_category_type视图可能有问题';
    ELSE
        RAISE NOTICE '✅ prompts_with_category_type视图工作正常';
    END IF;
    
    RAISE NOTICE '🎉 messages字段清理完成！';
    RAISE NOTICE '📊 当前prompts表记录数: %', (SELECT COUNT(*) FROM prompts);
    RAISE NOTICE '📊 当前prompt_versions表记录数: %', (SELECT COUNT(*) FROM prompt_versions);
    RAISE NOTICE '📊 当前视图记录数: %', (SELECT COUNT(*) FROM prompts_with_category_type);
END $$;
