-- 修复 prompts 表缺少 version 字段的问题
-- 恢复 version 字段以保持与API代码的一致性

-- 检查并添加 version 字段
DO $$
BEGIN
    -- 检查 version 字段是否存在
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'prompts' 
        AND column_name = 'version'
        AND table_schema = 'public'
    ) THEN
        -- 添加 version 字段
        ALTER TABLE prompts ADD COLUMN version NUMERIC(3,1) DEFAULT 1.0;
        
        -- 为现有记录设置版本号
        UPDATE prompts SET version = 1.0 WHERE version IS NULL;
        
        -- 添加非空约束
        ALTER TABLE prompts ALTER COLUMN version SET NOT NULL;
        
        RAISE NOTICE '✅ 已成功添加 version 字段到 prompts 表';
    ELSE
        RAISE NOTICE 'ℹ️  version 字段已存在，无需添加';
    END IF;
END $$;

-- 添加字段注释
COMMENT ON COLUMN prompts.version IS '版本号，支持一位小数格式（如1.0, 1.1, 6.1）';

-- 验证字段是否正确添加
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'prompts' 
AND column_name = 'version'
AND table_schema = 'public';
