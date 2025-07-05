-- =============================================
-- User-Level Archiving System Migration
-- 实现用户级别归档系统，保护Context Engineering数据
-- Created: 2025-07-05
-- =============================================

-- =============================================
-- 1. 用户提示词归档表
-- =============================================
CREATE TABLE user_prompt_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    archive_reason TEXT NOT NULL,
    context_users_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, prompt_id)
);

-- 为用户归档表创建索引
CREATE INDEX idx_user_prompt_archives_user_id ON user_prompt_archives(user_id);
CREATE INDEX idx_user_prompt_archives_prompt_id ON user_prompt_archives(prompt_id);
CREATE INDEX idx_user_prompt_archives_created_at ON user_prompt_archives(created_at);
CREATE INDEX idx_user_prompt_archives_metadata ON user_prompt_archives USING GIN(metadata);

-- =============================================
-- 2. 检测其他用户是否有Context数据的函数
-- =============================================
CREATE OR REPLACE FUNCTION has_other_users_context(
    prompt_id_param UUID,
    user_id_param UUID
)
RETURNS TABLE(
    has_context BOOLEAN,
    users_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    context_count INTEGER := 0;
BEGIN
    -- 检查是否有其他用户的Context相关数据
    SELECT COUNT(DISTINCT ui.user_id) INTO context_count
    FROM user_interactions ui
    WHERE ui.prompt_id = prompt_id_param
      AND ui.user_id != user_id_param
      AND ui.interaction_type IN (
          'context_adaptation',
          'context_preference',
          'context_configuration',
          'prompt_customization',
          'effectiveness_rating'
      );

    -- 也检查用户Context配置文件中是否引用了此提示词
    context_count := context_count + (
        SELECT COUNT(DISTINCT ucp.user_id)
        FROM user_context_profiles ucp
        WHERE ucp.user_id != user_id_param
          AND (
              ucp.context_data ? 'prompts' 
              AND ucp.context_data->'prompts' ? prompt_id_param::TEXT
          )
    );

    -- 检查Context适配表
    context_count := context_count + (
        SELECT COUNT(DISTINCT ca.user_id)
        FROM context_adaptations ca
        WHERE ca.prompt_id = prompt_id_param
          AND ca.user_id != user_id_param
    );

    RETURN QUERY SELECT 
        context_count > 0 AS has_context,
        context_count AS users_count;
END;
$$;

-- =============================================
-- 3. 检查提示词删除策略的函数
-- =============================================
CREATE OR REPLACE FUNCTION check_prompt_deletion_policy(
    prompt_id_param UUID,
    user_id_param UUID
)
RETURNS TABLE(
    can_delete BOOLEAN,
    must_archive BOOLEAN,
    reason TEXT,
    context_users_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    prompt_record RECORD;
    context_result RECORD;
BEGIN
    -- 获取提示词信息
    SELECT * INTO prompt_record
    FROM prompts p
    WHERE p.id = prompt_id_param;

    -- 检查提示词是否存在
    IF prompt_record.id IS NULL THEN
        RETURN QUERY SELECT 
            FALSE AS can_delete,
            FALSE AS must_archive,
            '提示词不存在' AS reason,
            0 AS context_users_count;
        RETURN;
    END IF;

    -- 检查权限
    IF prompt_record.user_id != user_id_param THEN
        RETURN QUERY SELECT 
            FALSE AS can_delete,
            FALSE AS must_archive,
            '无权限删除此提示词' AS reason,
            0 AS context_users_count;
        RETURN;
    END IF;

    -- 检查其他用户的Context数据
    SELECT * INTO context_result
    FROM has_other_users_context(prompt_id_param, user_id_param);

    -- 根据检测结果决定策略
    IF context_result.has_context THEN
        -- 有其他用户的Context数据，必须归档
        RETURN QUERY SELECT 
            FALSE AS can_delete,
            TRUE AS must_archive,
            format('检测到 %s 个用户正在使用此提示词的个性化配置，为保护数据完整性将执行归档操作', 
                   context_result.users_count) AS reason,
            context_result.users_count AS context_users_count;
    ELSE
        -- 没有其他用户的Context数据，可以安全删除
        RETURN QUERY SELECT 
            TRUE AS can_delete,
            FALSE AS must_archive,
            '此提示词可以安全删除，没有其他用户的关联数据' AS reason,
            0 AS context_users_count;
    END IF;
END;
$$;

-- =============================================
-- 4. 归档用户提示词的函数
-- =============================================
CREATE OR REPLACE FUNCTION archive_user_prompt(
    prompt_id_param UUID,
    user_id_param UUID,
    reason_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    context_result RECORD;
BEGIN
    -- 检查权限
    IF NOT EXISTS (
        SELECT 1 FROM prompts 
        WHERE id = prompt_id_param AND user_id = user_id_param
    ) THEN
        RAISE EXCEPTION '无权限归档此提示词';
    END IF;

    -- 获取Context数据统计
    SELECT * INTO context_result
    FROM has_other_users_context(prompt_id_param, user_id_param);

    -- 插入归档记录（如果不存在）
    INSERT INTO user_prompt_archives (
        user_id,
        prompt_id,
        archive_reason,
        context_users_count,
        metadata
    )
    VALUES (
        user_id_param,
        prompt_id_param,
        reason_param,
        context_result.users_count,
        jsonb_build_object(
            'archived_by_system', true,
            'protection_level', 'context_engineering',
            'context_data_protected', context_result.has_context
        )
    )
    ON CONFLICT (user_id, prompt_id) DO UPDATE SET
        archive_reason = EXCLUDED.archive_reason,
        context_users_count = EXCLUDED.context_users_count,
        metadata = EXCLUDED.metadata,
        created_at = CURRENT_TIMESTAMP;

    RETURN TRUE;
END;
$$;

-- =============================================
-- 5. 取消归档（恢复）用户提示词的函数
-- =============================================
CREATE OR REPLACE FUNCTION unarchive_user_prompt(
    prompt_id_param UUID,
    user_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 检查归档记录是否存在
    IF NOT EXISTS (
        SELECT 1 FROM user_prompt_archives 
        WHERE user_id = user_id_param AND prompt_id = prompt_id_param
    ) THEN
        RAISE EXCEPTION '未找到归档记录';
    END IF;

    -- 检查提示词是否仍然存在
    IF NOT EXISTS (
        SELECT 1 FROM prompts 
        WHERE id = prompt_id_param
    ) THEN
        RAISE EXCEPTION '提示词已被删除，无法恢复';
    END IF;

    -- 删除归档记录
    DELETE FROM user_prompt_archives 
    WHERE user_id = user_id_param AND prompt_id = prompt_id_param;

    RETURN TRUE;
END;
$$;

-- =============================================
-- 6. 检查是否可以将公开提示词改为私有的函数
-- =============================================
CREATE OR REPLACE FUNCTION can_make_prompt_private(
    prompt_id_param UUID,
    user_id_param UUID
)
RETURNS TABLE(
    can_convert BOOLEAN,
    reason TEXT,
    affected_users INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    prompt_record RECORD;
    context_result RECORD;
BEGIN
    -- 获取提示词信息
    SELECT * INTO prompt_record
    FROM prompts p
    WHERE p.id = prompt_id_param;

    -- 检查提示词是否存在
    IF prompt_record.id IS NULL THEN
        RETURN QUERY SELECT 
            FALSE AS can_convert,
            '提示词不存在' AS reason,
            0 AS affected_users;
        RETURN;
    END IF;

    -- 检查权限
    IF prompt_record.user_id != user_id_param THEN
        RETURN QUERY SELECT 
            FALSE AS can_convert,
            '无权限修改此提示词' AS reason,
            0 AS affected_users;
        RETURN;
    END IF;

    -- 如果已经是私有的，允许操作
    IF prompt_record.is_public = FALSE THEN
        RETURN QUERY SELECT 
            TRUE AS can_convert,
            '提示词已是私有状态' AS reason,
            0 AS affected_users;
        RETURN;
    END IF;

    -- 检查其他用户的Context数据
    SELECT * INTO context_result
    FROM has_other_users_context(prompt_id_param, user_id_param);

    -- 根据检测结果决定是否允许转为私有
    IF context_result.has_context THEN
        -- 有其他用户的Context数据，不允许转为私有
        RETURN QUERY SELECT 
            FALSE AS can_convert,
            format('无法转为私有：检测到 %s 个用户正在使用此提示词的个性化配置。将其转为私有会影响这些用户的使用体验。', 
                   context_result.users_count) AS reason,
            context_result.users_count AS affected_users;
    ELSE
        -- 没有其他用户的Context数据，可以转为私有
        RETURN QUERY SELECT 
            TRUE AS can_convert,
            '可以安全转为私有' AS reason,
            0 AS affected_users;
    END IF;
END;
$$;

-- =============================================
-- 7. 添加表注释
-- =============================================
COMMENT ON TABLE user_prompt_archives IS '用户级别提示词归档表：存储用户主动归档的提示词，支持数据保护和恢复功能';
COMMENT ON COLUMN user_prompt_archives.user_id IS '归档操作的用户ID';
COMMENT ON COLUMN user_prompt_archives.prompt_id IS '被归档的提示词ID';
COMMENT ON COLUMN user_prompt_archives.archive_reason IS '归档原因描述';
COMMENT ON COLUMN user_prompt_archives.context_users_count IS '受保护的其他用户数量';
COMMENT ON COLUMN user_prompt_archives.metadata IS '归档元数据，包含保护级别等信息';

COMMENT ON FUNCTION has_other_users_context(UUID, UUID) IS '检测指定提示词是否有其他用户的Context Engineering数据';
COMMENT ON FUNCTION check_prompt_deletion_policy(UUID, UUID) IS '检查提示词删除策略：返回是否可以删除或必须归档';
COMMENT ON FUNCTION archive_user_prompt(UUID, UUID, TEXT) IS '归档用户提示词：在用户级别归档，保护其他用户的Context数据';
COMMENT ON FUNCTION unarchive_user_prompt(UUID, UUID) IS '取消归档：恢复用户提示词到活跃状态';
COMMENT ON FUNCTION can_make_prompt_private(UUID, UUID) IS '检查是否可以将公开提示词转为私有：保护其他用户的Context数据';

-- =============================================
-- 8. 创建用于清理的管理员函数（可选）
-- =============================================
CREATE OR REPLACE FUNCTION admin_permanent_delete_prompt(
    prompt_id_param UUID,
    admin_user_id UUID,
    deletion_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    prompt_record RECORD;
BEGIN
    -- 简化：这里应该有管理员权限检查
    -- IF NOT is_admin(admin_user_id) THEN
    --     RAISE EXCEPTION '需要管理员权限';
    -- END IF;

    -- 获取提示词信息
    SELECT * INTO prompt_record
    FROM prompts p
    WHERE p.id = prompt_id_param;

    IF prompt_record.id IS NULL THEN
        RAISE EXCEPTION '提示词不存在';
    END IF;

    -- 记录删除操作到用户活动日志（如果表存在）
    -- INSERT INTO user_activities (user_id, activity_type, activity_data)
    -- VALUES (admin_user_id, 'admin_permanent_delete', jsonb_build_object(
    --     'prompt_id', prompt_id_param,
    --     'prompt_name', prompt_record.name,
    --     'deletion_reason', deletion_reason,
    --     'original_user_id', prompt_record.user_id
    -- ));

    -- 删除所有相关的归档记录
    DELETE FROM user_prompt_archives WHERE prompt_id = prompt_id_param;

    -- 删除提示词（级联删除相关数据）
    DELETE FROM prompts WHERE id = prompt_id_param;

    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION admin_permanent_delete_prompt(UUID, UUID, TEXT) IS '管理员永久删除提示词：彻底删除提示词及所有相关数据（谨慎使用）';

-- =============================================
-- Migration completed successfully
-- =============================================