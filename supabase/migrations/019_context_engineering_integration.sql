-- =============================================
-- Context Engineering Integration Migration
-- 实现上下文工程与MCP工具的深度集成
-- Created: 2025-01-XX
-- 
-- 注意：
-- - 本迁移文件基于现有数据库结构扩展，而非重复建设
-- - context_states 表是对 context_sessions.context_state 的结构化扩展
--   context_sessions 存储完整会话记录，context_states 专门管理多层级上下文状态
-- - context_memories 表是对 user_context_profiles.context_memory 的结构化扩展
--   user_context_profiles.context_memory 是JSONB字段，context_memories 提供更细粒度的查询和分析能力
-- =============================================

-- =============================================
-- 1. 上下文状态表 (context_states)
-- 存储会话级、用户级和全局级的上下文状态
-- 
-- 与现有表的关系：
-- - context_sessions: 存储完整会话信息，包含 context_state JSONB 字段
-- - context_states: 专门的结构化表，支持多层级上下文管理和高效查询
--   两者可以并存，context_states 提供更细粒度的上下文管理能力
-- =============================================
CREATE TABLE IF NOT EXISTS context_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context_level TEXT NOT NULL CHECK (context_level IN ('session', 'user', 'global')),
    context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    -- 对于会话级上下文，同一个会话只能有一个活跃状态
    UNIQUE(session_id, user_id, context_level)
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_context_states_user_id ON context_states(user_id);
CREATE INDEX IF NOT EXISTS idx_context_states_session_id ON context_states(session_id);
CREATE INDEX IF NOT EXISTS idx_context_states_context_level ON context_states(context_level);
CREATE INDEX IF NOT EXISTS idx_context_states_created_at ON context_states(created_at);
CREATE INDEX IF NOT EXISTS idx_context_states_expires_at ON context_states(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_context_states_context_data ON context_states USING GIN(context_data);
CREATE INDEX IF NOT EXISTS idx_context_states_metadata ON context_states USING GIN(metadata);

-- =============================================
-- 2. 上下文记忆表 (context_memories)
-- 存储重要的长期上下文记忆，支持跨会话访问
-- 
-- 与现有表的关系：
-- - user_context_profiles: 包含 context_memory JSONB 字段，存储用户级上下文记忆
-- - context_memories: 结构化表，提供：
--   * 按类型、重要性、标签等字段进行查询
--   * 访问统计和相关性评分
--   * 更细粒度的记忆管理（过期时间、重要性评分等）
--   两者可以并存，context_memories 提供更强大的查询和分析能力
-- =============================================
CREATE TABLE IF NOT EXISTS context_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('preference', 'pattern', 'knowledge', 'interaction')),
    title TEXT,
    content JSONB NOT NULL,
    importance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
    relevance_tags TEXT[] DEFAULT '{}',
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_context_memories_user_id ON context_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_context_memories_memory_type ON context_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_context_memories_importance_score ON context_memories(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_context_memories_relevance_tags ON context_memories USING GIN(relevance_tags);
CREATE INDEX IF NOT EXISTS idx_context_memories_content ON context_memories USING GIN(content);
CREATE INDEX IF NOT EXISTS idx_context_memories_last_accessed_at ON context_memories(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_context_memories_expires_at ON context_memories(expires_at) WHERE expires_at IS NOT NULL;

-- =============================================
-- 3. 工具执行上下文记录表 (tool_execution_contexts)
-- 记录工具执行的上下文信息，用于学习和优化
-- 
-- 这是一个新表，用于：
-- - 记录每次工具调用时的上下文快照
-- - 追踪上下文增强对工具执行的影响
-- - 分析和优化工具调用策略
-- =============================================
CREATE TABLE IF NOT EXISTS tool_execution_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_name TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT,
    request_id TEXT,
    input_params JSONB,
    context_snapshot JSONB,
    execution_result JSONB,
    execution_time_ms INTEGER,
    context_enhanced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_tool_execution_contexts_tool_name ON tool_execution_contexts(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_execution_contexts_user_id ON tool_execution_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_execution_contexts_session_id ON tool_execution_contexts(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_execution_contexts_created_at ON tool_execution_contexts(created_at);
CREATE INDEX IF NOT EXISTS idx_tool_execution_contexts_context_enhanced ON tool_execution_contexts(context_enhanced);

-- =============================================
-- 4. 工具组合模式表 (tool_composition_patterns)
-- 记录和学习常用的工具组合模式
-- 
-- 这是一个新表，用于：
-- - 学习用户常用的工具组合模式
-- - 根据上下文推荐合适的工具链
-- - 优化工具调用顺序和参数传递
-- =============================================
CREATE TABLE IF NOT EXISTS tool_composition_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pattern_name TEXT,
    tool_chain JSONB NOT NULL, -- 工具链定义：[{tool_name, params, order}]
    trigger_context JSONB, -- 触发此模式的上下文条件
    success_rate DECIMAL(5,4) DEFAULT 0.0 CHECK (success_rate >= 0 AND success_rate <= 1),
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_tool_composition_patterns_user_id ON tool_composition_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_composition_patterns_success_rate ON tool_composition_patterns(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_tool_composition_patterns_usage_count ON tool_composition_patterns(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tool_composition_patterns_trigger_context ON tool_composition_patterns USING GIN(trigger_context);

-- =============================================
-- 5. 辅助函数：获取或创建上下文状态
-- =============================================
CREATE OR REPLACE FUNCTION get_or_create_context_state(
    p_session_id TEXT,
    p_user_id UUID,
    p_context_level TEXT DEFAULT 'session'
)
RETURNS context_states
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_context_state context_states;
BEGIN
    -- 尝试获取现有状态
    SELECT * INTO v_context_state
    FROM context_states
    WHERE session_id = p_session_id
      AND user_id = p_user_id
      AND context_level = p_context_level
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY updated_at DESC
    LIMIT 1;

    -- 如果不存在，创建新状态
    IF v_context_state IS NULL THEN
        INSERT INTO context_states (
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
-- 6. 辅助函数：更新上下文状态
-- =============================================
CREATE OR REPLACE FUNCTION update_context_state(
    p_session_id TEXT,
    p_user_id UUID,
    p_context_level TEXT,
    p_context_updates JSONB
)
RETURNS context_states
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_context_state context_states;
BEGIN
    UPDATE context_states
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
        INSERT INTO context_states (
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
-- 7. 辅助函数：检索相关上下文记忆
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
    FROM context_memories cm
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
-- 8. 辅助函数：存储上下文记忆
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
RETURNS context_memories
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_memory context_memories;
BEGIN
    INSERT INTO context_memories (
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
-- 9. 辅助函数：清理过期的上下文状态和记忆
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_expired_contexts()
RETURNS TABLE (
    deleted_states INTEGER,
    deleted_memories INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_states INTEGER := 0;
    v_deleted_memories INTEGER := 0;
BEGIN
    -- 删除过期的上下文状态
    DELETE FROM context_states
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted_states = ROW_COUNT;

    -- 删除过期的上下文记忆（但保留重要性高的记忆）
    DELETE FROM context_memories
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW()
      AND importance_score < 0.7; -- 保留重要性高的记忆
    
    GET DIAGNOSTICS v_deleted_memories = ROW_COUNT;

    RETURN QUERY SELECT v_deleted_states, v_deleted_memories;
END;
$$;

-- =============================================
-- 10. 添加表注释
-- =============================================
COMMENT ON TABLE context_states IS '上下文状态表：存储会话级、用户级和全局级的上下文状态';
COMMENT ON TABLE context_memories IS '上下文记忆表：存储重要的长期上下文记忆，支持跨会话访问和学习';
COMMENT ON TABLE tool_execution_contexts IS '工具执行上下文记录表：记录工具执行的上下文信息，用于学习和优化';
COMMENT ON TABLE tool_composition_patterns IS '工具组合模式表：记录和学习常用的工具组合模式';

COMMENT ON FUNCTION get_or_create_context_state(TEXT, UUID, TEXT) IS '获取或创建上下文状态';
COMMENT ON FUNCTION update_context_state(TEXT, UUID, TEXT, JSONB) IS '更新上下文状态，支持JSONB合并';
COMMENT ON FUNCTION retrieve_relevant_memories(UUID, TEXT, TEXT[], INTEGER) IS '检索相关的上下文记忆，按相关性排序';
COMMENT ON FUNCTION store_context_memory(UUID, TEXT, TEXT, JSONB, DECIMAL, TEXT[], TIMESTAMP WITH TIME ZONE) IS '存储上下文记忆';
COMMENT ON FUNCTION cleanup_expired_contexts() IS '清理过期的上下文状态和记忆';

-- =============================================
-- Migration completed successfully
-- =============================================

