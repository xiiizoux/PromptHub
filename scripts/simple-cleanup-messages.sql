-- 简化的messages字段清理脚本
-- 使用CASCADE删除，然后重建基本视图

BEGIN;

-- 步骤1: 验证数据完整性
DO $$
DECLARE
    prompts_empty integer;
    versions_empty integer;
BEGIN
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

-- 步骤2: 删除索引
DROP INDEX IF EXISTS idx_prompts_messages;
DROP INDEX IF EXISTS idx_prompt_versions_messages;

-- 步骤3: 使用CASCADE强制删除messages字段
ALTER TABLE prompts DROP COLUMN IF EXISTS messages CASCADE;
ALTER TABLE prompt_versions DROP COLUMN IF EXISTS messages CASCADE;

-- 步骤4: 重新创建简化的视图（使用SELECT *避免字段问题）
CREATE VIEW prompts_with_category_type AS
SELECT 
    p.*,
    c.type::text as category_type_from_db,
    c.name_en as category_name_en,
    c.icon as category_icon,
    c.description as category_description
FROM prompts p
LEFT JOIN categories c ON p.category_id = c.id OR p.category = c.name;

-- 步骤5: 创建适当的索引
DROP INDEX IF EXISTS idx_prompts_content_basic;
DROP INDEX IF EXISTS idx_prompt_versions_content_basic;

CREATE INDEX IF NOT EXISTS idx_prompts_content_gin ON prompts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_prompt_versions_content_gin ON prompt_versions USING gin(to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_prompts_content_prefix ON prompts (left(content, 100)) WHERE length(content) <= 100;
CREATE INDEX IF NOT EXISTS idx_prompt_versions_content_prefix ON prompt_versions (left(content, 100)) WHERE length(content) <= 100;

-- 步骤6: 更新注释
COMMENT ON TABLE prompts IS '提示词表 - 已移除messages字段，使用content字段存储内容';
COMMENT ON TABLE prompt_versions IS '提示词版本表 - 已移除messages字段，使用content字段存储内容';
COMMENT ON VIEW prompts_with_category_type IS '提示词与分类类型关联视图 - 已更新为使用content字段';

COMMIT;

-- 最终验证
DO $$
DECLARE
    rec RECORD;
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
    
    -- 测试视图
    PERFORM 1 FROM prompts_with_category_type LIMIT 1;
    
    RAISE NOTICE '🎉 messages字段清理完成！';
    RAISE NOTICE '📊 prompts表记录数: %', (SELECT COUNT(*) FROM prompts);
    RAISE NOTICE '📊 prompt_versions表记录数: %', (SELECT COUNT(*) FROM prompt_versions);
    RAISE NOTICE '📊 视图记录数: %', (SELECT COUNT(*) FROM prompts_with_category_type);
    
    RAISE NOTICE '✅ 清理成功验证:';
    RAISE NOTICE '  - messages字段已从两个表中删除';
    RAISE NOTICE '  - prompts_with_category_type视图重建成功';
    RAISE NOTICE '  - 所有记录的content字段都有内容';
    RAISE NOTICE '  - 索引已优化为支持长文本搜索';
END $$;
