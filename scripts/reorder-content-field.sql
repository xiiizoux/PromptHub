-- 重新排列prompts表字段顺序
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

-- 步骤2: 创建新表结构（按理想顺序）
CREATE TABLE prompts_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,  -- content字段放在description后面
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    is_public BOOLEAN DEFAULT false,
    allow_collaboration BOOLEAN DEFAULT false,
    edit_permission TEXT DEFAULT 'owner_only',
    user_id UUID,
    difficulty TEXT,
    compatible_models TEXT[],
    variables TEXT[],
    improvements TEXT[],
    use_cases TEXT[],
    estimated_tokens INTEGER,
    usage_count INTEGER DEFAULT 0,
    examples JSONB,
    preview_asset_url TEXT,
    parameters JSONB,
    category_id UUID,
    category_type TEXT
);

-- 步骤3: 复制数据到新表
INSERT INTO prompts_new (
    id, name, description, content, category, tags, created_at, updated_at, 
    version, is_public, allow_collaboration, edit_permission, user_id, 
    difficulty, compatible_models, variables, improvements, use_cases, 
    estimated_tokens, usage_count, examples, preview_asset_url, 
    parameters, category_id, category_type
)
SELECT 
    id, name, description, content, category, tags, created_at, updated_at, 
    version, is_public, allow_collaboration, edit_permission, user_id, 
    difficulty, compatible_models, variables, improvements, use_cases, 
    estimated_tokens, usage_count, examples, preview_asset_url, 
    parameters, category_id, category_type
FROM prompts;

-- 步骤4: 验证数据完整性
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM prompts;
    SELECT COUNT(*) INTO new_count FROM prompts_new;
    
    IF old_count != new_count THEN
        RAISE EXCEPTION '数据复制失败: 原表 % 条记录, 新表 % 条记录', old_count, new_count;
    END IF;
    
    RAISE NOTICE '✅ 数据复制成功: % 条记录', new_count;
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

-- 步骤9: 重新创建外键约束（如果有的话）
-- ALTER TABLE prompts ADD CONSTRAINT fk_prompts_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id);
-- ALTER TABLE prompts ADD CONSTRAINT fk_prompts_category_id FOREIGN KEY (category_id) REFERENCES categories(id);

-- 步骤10: 更新表注释
COMMENT ON TABLE prompts IS '提示词表 - content字段已移到description字段后面';
COMMENT ON COLUMN prompts.content IS '提示词内容 - 从messages字段迁移而来';

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
    END LOOP;

    RAISE NOTICE '📊 表统计:';
    RAISE NOTICE '  - 记录总数: %', (SELECT COUNT(*) FROM prompts);
    RAISE NOTICE '  - 有content的记录: %', (SELECT COUNT(*) FROM prompts WHERE content IS NOT NULL AND content != '');
    RAISE NOTICE '  - 视图记录数: %', (SELECT COUNT(*) FROM prompts_with_category_type);
END $$;
