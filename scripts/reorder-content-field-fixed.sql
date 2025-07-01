-- 重新排列prompts表字段顺序（基于实际表结构）
-- 将content字段移到description字段后面

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
    END LOOP;
END $$;

-- 步骤2: 创建新表结构（按理想顺序，content在description后面）
CREATE TABLE prompts_new (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT,  -- content字段放在description后面
    category TEXT NOT NULL DEFAULT '通用对话'::text,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version NUMERIC DEFAULT 1,
    is_public BOOLEAN DEFAULT false,
    user_id UUID,
    allow_collaboration BOOLEAN DEFAULT false,
    edit_permission VARCHAR(20) DEFAULT 'owner_only'::character varying,
    created_by UUID,
    last_modified_by UUID,
    category_id UUID,
    view_count INTEGER DEFAULT 0,
    input_variables TEXT[],
    compatible_models TEXT[],
    template_format TEXT DEFAULT 'text'::text,
    preview_asset_url TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    category_type VARCHAR(20),
    migration_status VARCHAR(20) DEFAULT 'pending'::character varying
);

-- 步骤3: 复制数据到新表
INSERT INTO prompts_new (
    id, name, description, content, category, tags, created_at, updated_at, 
    version, is_public, user_id, allow_collaboration, edit_permission, 
    created_by, last_modified_by, category_id, view_count, input_variables, 
    compatible_models, template_format, preview_asset_url, parameters, 
    category_type, migration_status
)
SELECT 
    id, name, description, content, category, tags, created_at, updated_at, 
    version, is_public, user_id, allow_collaboration, edit_permission, 
    created_by, last_modified_by, category_id, view_count, input_variables, 
    compatible_models, template_format, preview_asset_url, parameters, 
    category_type, migration_status
FROM prompts;

-- 步骤4: 验证数据完整性
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
    content_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM prompts;
    SELECT COUNT(*) INTO new_count FROM prompts_new;
    SELECT COUNT(*) INTO content_count FROM prompts_new WHERE content IS NOT NULL AND content != '';
    
    IF old_count != new_count THEN
        RAISE EXCEPTION '数据复制失败: 原表 % 条记录, 新表 % 条记录', old_count, new_count;
    END IF;
    
    RAISE NOTICE '✅ 数据复制成功: % 条记录', new_count;
    RAISE NOTICE '✅ 有content内容的记录: % 条', content_count;
END $$;

-- 步骤5: 删除依赖视图
DROP VIEW IF EXISTS prompts_with_category_type CASCADE;

-- 步骤6: 重命名表
DROP TABLE prompts;
ALTER TABLE prompts_new RENAME TO prompts;

-- 步骤7: 重新创建索引
CREATE INDEX IF NOT EXISTS idx_prompts_content_gin ON prompts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_prompts_content_prefix ON prompts (left(content, 100)) WHERE length(content) <= 100;
CREATE INDEX IF NOT EXISTS idx_prompts_name ON prompts (name);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts (category);
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts (user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts (created_at);
CREATE INDEX IF NOT EXISTS idx_prompts_is_public ON prompts (is_public);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON prompts (category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_view_count ON prompts (view_count);

-- 步骤8: 重新创建视图
CREATE VIEW prompts_with_category_type AS
SELECT 
    p.*,
    c.type::text as category_type_from_db,
    c.name_en as category_name_en,
    c.icon as category_icon,
    c.description as category_description
FROM prompts p
LEFT JOIN categories c ON p.category_id = c.id OR p.category = c.name;

-- 步骤9: 更新表注释
COMMENT ON TABLE prompts IS '提示词表 - content字段已移到description字段后面';
COMMENT ON COLUMN prompts.content IS '提示词内容 - 从messages字段迁移而来，现在位于description字段后面';

COMMIT;

-- 最终验证
DO $$
DECLARE
    rec RECORD;
BEGIN
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
            RAISE NOTICE '    ⭐ content字段现在位于第%位（description后面）', rec.ordinal_position;
        END IF;
    END LOOP;
    
    RAISE NOTICE '📊 表统计:';
    RAISE NOTICE '  - 记录总数: %', (SELECT COUNT(*) FROM prompts);
    RAISE NOTICE '  - 有content的记录: %', (SELECT COUNT(*) FROM prompts WHERE content IS NOT NULL AND content != '');
    RAISE NOTICE '  - 视图记录数: %', (SELECT COUNT(*) FROM prompts_with_category_type);
END $$;
