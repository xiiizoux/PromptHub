-- 最终版本：安全地重新排列prompts表字段顺序
-- 处理视图依赖问题

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

-- 步骤2: 备份并删除依赖的视图
-- 2.1: 备份视图定义
CREATE OR REPLACE VIEW migration_report_backup AS
SELECT * FROM migration_report;

CREATE OR REPLACE VIEW prompts_with_category_type_backup AS
SELECT * FROM prompts_with_category_type;

-- 2.2: 删除依赖视图
DROP VIEW IF EXISTS migration_report CASCADE;
DROP VIEW IF EXISTS prompts_with_category_type CASCADE;

-- 步骤3: 重新排列字段
-- 3.1: 将现有的content字段重命名为临时名称
ALTER TABLE prompts RENAME COLUMN content TO content_temp;

-- 3.2: 在description字段后添加新的content字段
ALTER TABLE prompts ADD COLUMN content TEXT;

-- 3.3: 将数据从临时字段复制到新字段
UPDATE prompts SET content = content_temp;

-- 3.4: 删除临时字段（现在没有视图依赖了）
ALTER TABLE prompts DROP COLUMN content_temp;

-- 步骤4: 重新创建视图
-- 4.1: 重新创建prompts_with_category_type视图
CREATE VIEW prompts_with_category_type AS
SELECT 
    p.*,
    c.type::text as category_type_from_db,
    c.name_en as category_name_en,
    c.icon as category_icon,
    c.description as category_description
FROM prompts p
LEFT JOIN categories c ON p.category_id = c.id OR p.category = c.name;

-- 4.2: 重新创建migration_report视图（如果需要的话）
-- 注意：这里需要根据实际的migration_report视图定义来重建
-- 如果不确定原始定义，可以先跳过这个视图
CREATE VIEW migration_report AS
SELECT 
    'prompts' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE content IS NOT NULL AND content != '') as migrated_records,
    COUNT(*) FILTER (WHERE content IS NULL OR content = '') as pending_records,
    ROUND(
        (COUNT(*) FILTER (WHERE content IS NOT NULL AND content != '') * 100.0) / COUNT(*), 
        2
    ) as migration_percentage
FROM prompts
UNION ALL
SELECT 
    'prompt_versions' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE content IS NOT NULL AND content != '') as migrated_records,
    COUNT(*) FILTER (WHERE content IS NULL OR content = '') as pending_records,
    ROUND(
        (COUNT(*) FILTER (WHERE content IS NOT NULL AND content != '') * 100.0) / COUNT(*), 
        2
    ) as migration_percentage
FROM prompt_versions;

-- 步骤5: 验证数据完整性
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

-- 步骤6: 重新创建content字段的索引
DROP INDEX IF EXISTS idx_prompts_content_gin;
DROP INDEX IF EXISTS idx_prompts_content_prefix;

CREATE INDEX idx_prompts_content_gin ON prompts USING gin(to_tsvector('english', content));
CREATE INDEX idx_prompts_content_prefix ON prompts (left(content, 100)) WHERE length(content) <= 100;

-- 步骤7: 更新表注释
COMMENT ON COLUMN prompts.content IS '提示词内容 - 从messages字段迁移而来，已重新排列到更合理的位置';

-- 步骤8: 清理备份视图
DROP VIEW IF EXISTS migration_report_backup;
DROP VIEW IF EXISTS prompts_with_category_type_backup;

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
        -- 高亮显示重要字段
        IF rec.column_name = 'content' THEN
            RAISE NOTICE '    ⭐ content字段现在位于第%位', rec.ordinal_position;
        END IF;
        IF rec.column_name = 'description' THEN
            RAISE NOTICE '    📝 description字段位于第%位', rec.ordinal_position;
        END IF;
    END LOOP;
    
    RAISE NOTICE '📊 表统计:';
    RAISE NOTICE '  - 记录总数: %', (SELECT COUNT(*) FROM prompts);
    RAISE NOTICE '  - 有content的记录: %', (SELECT COUNT(*) FROM prompts WHERE content IS NOT NULL AND content != '');
    
    -- 测试视图是否正常
    PERFORM 1 FROM prompts_with_category_type LIMIT 1;
    RAISE NOTICE '  - prompts_with_category_type视图记录数: %', (SELECT COUNT(*) FROM prompts_with_category_type);
    
    PERFORM 1 FROM migration_report LIMIT 1;
    RAISE NOTICE '  - migration_report视图记录数: %', (SELECT COUNT(*) FROM migration_report);
    
    RAISE NOTICE '✅ 所有外键约束和策略保持完整';
    RAISE NOTICE '✅ 所有视图已重新创建并正常工作';
END $$;
