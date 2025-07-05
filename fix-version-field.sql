-- 移除 prompts 表中的 version 字段
-- 这个字段在新的架构中已被 prompt_versions 表替代

-- 首先检查字段是否存在
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'prompts' 
        AND column_name = 'version'
    ) THEN
        -- 移除 version 字段
        ALTER TABLE prompts DROP COLUMN version;
        RAISE NOTICE 'version 字段已成功移除';
    ELSE
        RAISE NOTICE 'version 字段不存在，无需移除';
    END IF;
END $$;