-- =============================================
-- Fix Function Search Path Security Warnings
-- 修复函数 search_path 安全警告
-- Created: 2025-11-04
-- 
-- 修复 Supabase 数据库 linter 警告：
-- Function Search Path Mutable (SECURITY)
-- 
-- 为所有上下文工程函数添加 SET search_path = '' 以增强安全性
-- 注意：当 search_path = '' 时，需要使用 schema 限定的表名和类型
-- =============================================

-- =============================================
-- 修复函数：get_or_create_context_state
-- =============================================
CREATE OR REPLACE FUNCTION get_or_create_context_state(
    p_session_id TEXT,
    p_user_id UUID,
    p_context_level TEXT DEFAULT 'session'
)
RETURNS public.context_states
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_context_state public.context_states;
BEGIN
    -- 尝试获取现有状态
    SELECT * INTO v_context_state
    FROM public.context_states
    WHERE session_id = p_session_id
      AND user_id = p_user_id
      AND context_level = p_context_level
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY updated_at DESC
    LIMIT 1;

    -- 如果不存在，创建新状态
    IF v_context_state IS NULL THEN
        INSERT INTO public.context_states (
            session_id,
            user_id,
            context_level,
            context_data,
            metadata
        )
        VALUES (
            p_session_id,
            p_user_id,
            p_context_level,
            '{}'::jsonb,
            jsonb_build_object('created_by', 'system')
        )
        ON CONFLICT (session_id, user_id, context_level)
        DO UPDATE SET
            updated_at = NOW(),
            expires_at = NULL
        RETURNING * INTO v_context_state;
    END IF;

    RETURN v_context_state;
END;
$$;

-- =============================================
-- 修复函数：update_context_state
-- =============================================
CREATE OR REPLACE FUNCTION update_context_state(
    p_session_id TEXT,
    p_user_id UUID,
    p_context_level TEXT,
    p_context_updates JSONB
)
RETURNS public.context_states
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_context_state public.context_states;
BEGIN
    UPDATE public.context_states
    SET
        context_data = context_data || p_context_updates,
        updated_at = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || 
                   jsonb_build_object('last_update', NOW())
    WHERE session_id = p_session_id
      AND user_id = p_user_id
      AND context_level = p_context_level
    RETURNING * INTO v_context_state;

    -- 如果不存在，创建新状态
    IF v_context_state IS NULL THEN
        INSERT INTO public.context_states (
            session_id,
            user_id,
            context_level,
            context_data,
            metadata
        )
        VALUES (
            p_session_id,
            p_user_id,
            p_context_level,
            p_context_updates,
            jsonb_build_object('created_by', 'update_function')
        )
        RETURNING * INTO v_context_state;
    END IF;

    RETURN v_context_state;
END;
$$;

-- =============================================
-- 修复函数：retrieve_relevant_memories
-- =============================================
CREATE OR REPLACE FUNCTION retrieve_relevant_memories(
    p_user_id UUID,
    p_query_text TEXT DEFAULT NULL,
    p_memory_types TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    memory_type TEXT,
    title TEXT,
    content JSONB,
    relevance_score DECIMAL(3,2),
    importance_score DECIMAL(3,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cm.id,
        cm.memory_type,
        cm.title,
        cm.content,
        -- 简化的相关性评分：基于重要性、访问频率和时间
        (
            cm.importance_score * 0.5 +
            LEAST(cm.access_count::DECIMAL / 100.0, 0.3) +
            CASE 
                WHEN cm.last_accessed_at > NOW() - INTERVAL '7 days' THEN 0.2
                WHEN cm.last_accessed_at > NOW() - INTERVAL '30 days' THEN 0.1
                ELSE 0.0
            END
        )::DECIMAL(3,2) AS relevance_score,
        cm.importance_score
    FROM public.context_memories cm
    WHERE cm.user_id = p_user_id
      AND (p_memory_types IS NULL OR cm.memory_type = ANY(p_memory_types))
      AND (cm.expires_at IS NULL OR cm.expires_at > NOW())
      AND (
          p_query_text IS NULL OR
          cm.title ILIKE '%' || p_query_text || '%' OR
          cm.content::TEXT ILIKE '%' || p_query_text || '%' OR
          EXISTS (
              SELECT 1 FROM unnest(cm.relevance_tags) AS tag
              WHERE tag ILIKE '%' || p_query_text || '%'
          )
      )
    ORDER BY relevance_score DESC, cm.importance_score DESC, cm.last_accessed_at DESC
    LIMIT p_limit;
END;
$$;

-- =============================================
-- 修复函数：store_context_memory
-- =============================================
CREATE OR REPLACE FUNCTION store_context_memory(
    p_user_id UUID,
    p_memory_type TEXT,
    p_title TEXT,
    p_content JSONB,
    p_importance_score DECIMAL DEFAULT 0.5,
    p_relevance_tags TEXT[] DEFAULT '{}',
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS public.context_memories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_memory public.context_memories;
BEGIN
    INSERT INTO public.context_memories (
        user_id,
        memory_type,
        title,
        content,
        importance_score,
        relevance_tags,
        expires_at,
        metadata
    )
    VALUES (
        p_user_id,
        p_memory_type,
        p_title,
        p_content,
        p_importance_score,
        p_relevance_tags,
        p_expires_at,
        jsonb_build_object('created_by', 'store_function', 'created_at', NOW())
    )
    RETURNING * INTO v_memory;

    RETURN v_memory;
END;
$$;

-- =============================================
-- 修复函数：cleanup_expired_contexts
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_expired_contexts()
RETURNS TABLE (
    deleted_states INTEGER,
    deleted_memories INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_deleted_states INTEGER := 0;
    v_deleted_memories INTEGER := 0;
BEGIN
    -- 删除过期的上下文状态
    DELETE FROM public.context_states
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted_states = ROW_COUNT;

    -- 删除过期的上下文记忆（但保留重要性高的记忆）
    DELETE FROM public.context_memories
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW()
      AND importance_score < 0.7; -- 保留重要性高的记忆
    
    GET DIAGNOSTICS v_deleted_memories = ROW_COUNT;

    RETURN QUERY SELECT v_deleted_states, v_deleted_memories;
END;
$$;

-- =============================================
-- Migration completed successfully
-- =============================================
