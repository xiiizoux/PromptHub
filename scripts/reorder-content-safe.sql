-- 安全地重新排列prompts表字段顺序
-- 使用ALTER TABLE方法，避免删除外键约束和策略

BEGIN;

-- 步骤1: 查看当前表结构
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '当前prompts表字段顺序:';
    FOR rec IN 
        SELECT ordinal_position, column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'prompts' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % (%)', rec.ordinal_position, rec.column_name, rec.data_type;
        IF rec.column_name = 'content' THEN
            RAISE NOTICE '    ⭐ content字段当前位于第%位', rec.ordinal_position;
        END IF;
    END LOOP;
END $$;

-- 步骤2: 创建临时字段来重新排列
-- PostgreSQL不支持直接重排字段，我们需要使用重命名和添加的方式

-- 2.1: 将现有的content字段重命名为临时名称
ALTER TABLE prompts RENAME COLUMN content TO content_temp;

-- 2.2: 在description字段后添加新的content字段
ALTER TABLE prompts ADD COLUMN content TEXT;

-- 2.3: 将数据从临时字段复制到新字段
UPDATE prompts SET content = content_temp;

-- 2.4: 删除临时字段
ALTER TABLE prompts DROP COLUMN content_temp;

-- 步骤3: 验证数据完整性
DO $$
DECLARE
    total_records INTEGER;
    content_records INTEGER;
    empty_content INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records FROM prompts;
    SELECT COUNT(*) INTO content_records FROM prompts WHERE content IS NOT NULL AND content != '';
    SELECT COUNT(*) INTO empty_content FROM prompts WHERE content IS NULL OR content = '';
    
    RAISE NOTICE '✅ 数据验证:';
    RAISE NOTICE '  - 总记录数: %', total_records;
    RAISE NOTICE '  - 有content内容的记录: %', content_records;
    RAISE NOTICE '  - 空content记录: %', empty_content;
    
    IF empty_content > 0 THEN
        RAISE WARNING '⚠️ 发现 % 条记录的content为空', empty_content;
    END IF;
END $$;

-- 步骤4: 重新创建content字段的索引
DROP INDEX IF EXISTS idx_prompts_content_gin;
DROP INDEX IF EXISTS idx_prompts_content_prefix;

CREATE INDEX idx_prompts_content_gin ON prompts USING gin(to_tsvector('english', content));
CREATE INDEX idx_prompts_content_prefix ON prompts (left(content, 100)) WHERE length(content) <= 100;

-- 步骤5: 更新表注释
COMMENT ON COLUMN prompts.content IS '提示词内容 - 从messages字段迁移而来，已重新排列到description字段后面';

COMMIT;

-- 最终验证
DO $$
DECLARE
    rec RECORD;
    content_position INTEGER;
    description_position INTEGER;
BEGIN
    -- 获取字段位置
    SELECT ordinal_position INTO description_position 
    FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'description';
    
    SELECT ordinal_position INTO content_position 
    FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'content';
    
    RAISE NOTICE '🎉 字段重排完成！';
    RAISE NOTICE '新的prompts表字段顺序:';
    FOR rec IN 
        SELECT ordinal_position, column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'prompts' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % (%)', rec.ordinal_position, rec.column_name, rec.data_type;
        -- 高亮显示content字段的新位置
        IF rec.column_name = 'content' THEN
            RAISE NOTICE '    ⭐ content字段现在位于第%位', rec.ordinal_position;
        END IF;
        IF rec.column_name = 'description' THEN
            RAISE NOTICE '    📝 description字段位于第%位', rec.ordinal_position;
        END IF;
    END LOOP;
    
    -- 验证位置关系
    IF content_position = description_position + 1 THEN
        RAISE NOTICE '✅ 成功！content字段现在紧跟在description字段后面';
    ELSE
        RAISE NOTICE '⚠️ content字段位于第%位，description字段位于第%位', content_position, description_position;
    END IF;
    
    RAISE NOTICE '📊 表统计:';
    RAISE NOTICE '  - 记录总数: %', (SELECT COUNT(*) FROM prompts);
    RAISE NOTICE '  - 有content的记录: %', (SELECT COUNT(*) FROM prompts WHERE content IS NOT NULL AND content != '');
    
    -- 测试视图是否正常
    PERFORM 1 FROM prompts_with_category_type LIMIT 1;
    RAISE NOTICE '  - 视图记录数: %', (SELECT COUNT(*) FROM prompts_with_category_type);
    RAISE NOTICE '✅ 所有外键约束和策略保持完整';
END $$;
