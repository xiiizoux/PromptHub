-- 清理数据库中的messages字段
-- 执行前请确保已经完成数据迁移并验证应用正常运行

-- 1. 首先备份当前数据（可选，但强烈推荐）
-- CREATE TABLE prompts_backup AS SELECT * FROM prompts;
-- CREATE TABLE prompt_versions_backup AS SELECT * FROM prompt_versions;

-- 2. 删除prompts表中的messages字段
BEGIN;

-- 检查是否还有依赖messages字段的代码
-- 如果有任何错误，事务会回滚
DO $$
BEGIN
    -- 验证content字段存在且有数据
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prompts' AND column_name = 'content'
    ) THEN
        RAISE EXCEPTION 'content字段不存在，无法删除messages字段';
    END IF;
    
    -- 检查是否有content为空但messages有数据的记录
    IF EXISTS (
        SELECT 1 FROM prompts 
        WHERE (content IS NULL OR content = '') 
        AND messages IS NOT NULL
    ) THEN
        RAISE EXCEPTION '发现content为空但messages有数据的记录，请先完成数据迁移';
    END IF;
    
    RAISE NOTICE '验证通过，可以安全删除messages字段';
END $$;

-- 删除prompts表的messages字段
ALTER TABLE prompts DROP COLUMN IF EXISTS messages;

-- 3. 删除prompt_versions表中的messages字段
-- 检查prompt_versions表
DO $$
BEGIN
    -- 验证content字段存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prompt_versions' AND column_name = 'content'
    ) THEN
        RAISE EXCEPTION 'prompt_versions表的content字段不存在';
    END IF;
    
    -- 检查是否有content为空但messages有数据的记录
    IF EXISTS (
        SELECT 1 FROM prompt_versions 
        WHERE (content IS NULL OR content = '') 
        AND messages IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'prompt_versions表中发现content为空但messages有数据的记录';
    END IF;
    
    RAISE NOTICE 'prompt_versions表验证通过';
END $$;

-- 删除prompt_versions表的messages字段
ALTER TABLE prompt_versions DROP COLUMN IF EXISTS messages;

-- 4. 更新相关索引（如果有的话）
-- 删除可能存在的messages字段索引
DROP INDEX IF EXISTS idx_prompts_messages;
DROP INDEX IF EXISTS idx_prompt_versions_messages;

-- 删除可能导致问题的B-tree索引
DROP INDEX IF EXISTS idx_prompts_content_basic;
DROP INDEX IF EXISTS idx_prompt_versions_content_basic;

-- 确保content字段有适当的索引（使用GIN索引支持全文搜索，不受长度限制）
CREATE INDEX IF NOT EXISTS idx_prompts_content_gin ON prompts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_prompt_versions_content_gin ON prompt_versions USING gin(to_tsvector('english', content));

-- 为短内容创建部分B-tree索引（只索引前100个字符）
CREATE INDEX IF NOT EXISTS idx_prompts_content_prefix ON prompts (left(content, 100)) WHERE length(content) <= 100;
CREATE INDEX IF NOT EXISTS idx_prompt_versions_content_prefix ON prompt_versions (left(content, 100)) WHERE length(content) <= 100;

-- 5. 更新表注释
COMMENT ON TABLE prompts IS '提示词表 - 已移除messages字段，使用content字段存储内容';
COMMENT ON TABLE prompt_versions IS '提示词版本表 - 已移除messages字段，使用content字段存储内容';

COMMIT;

-- 6. 验证清理结果
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
    
    RAISE NOTICE '✅ messages字段清理完成！';
    RAISE NOTICE '📊 当前prompts表记录数: %', (SELECT COUNT(*) FROM prompts);
    RAISE NOTICE '📊 当前prompt_versions表记录数: %', (SELECT COUNT(*) FROM prompt_versions);
END $$;
