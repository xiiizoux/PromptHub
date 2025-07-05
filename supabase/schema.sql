-- =============================================
-- PromptHub Database Schema (Complete)
-- Generated: 2025-07-05
-- Updated to match actual Supabase database structure with all 47 tables
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- Custom Types
-- =============================================

-- Category type enum (matches actual database)
CREATE TYPE category_type AS ENUM ('chat', 'image', 'video');

-- Prompt category enum (matches actual database)
CREATE TYPE prompt_category AS ENUM ('chat', 'image', 'video');

-- =============================================
-- Core Tables (in dependency order)
-- =============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}'::jsonb,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'))
);

-- Categories table (with JSONB optimization_template)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    type category_type NOT NULL DEFAULT 'chat',
    optimization_template JSONB
);

-- API Keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prompts table (with Context Engineering fields and correct field order)
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB,
    category VARCHAR(50),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    is_public BOOLEAN DEFAULT true,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    allow_collaboration BOOLEAN DEFAULT false,
    edit_permission VARCHAR(20) DEFAULT 'owner' CHECK (edit_permission IN ('owner', 'collaborators', 'public')),
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id),
    category_id UUID REFERENCES categories(id),
    view_count INTEGER DEFAULT 0,
    input_variables JSONB DEFAULT '[]'::jsonb,
    compatible_models TEXT[],
    template_format VARCHAR(50) DEFAULT 'text',
    preview_asset_url TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    category_type category_type,
    migration_status VARCHAR(50) DEFAULT 'pending',
    context_engineering_enabled BOOLEAN DEFAULT false,
    context_variables JSONB DEFAULT '{}'::jsonb,
    adaptation_rules JSONB DEFAULT '[]'::jsonb,
    effectiveness_score DECIMAL(3,2) DEFAULT 0.00 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 5)
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Favorites table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, prompt_id)
);

-- Likes table
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, prompt_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prompt version history table
CREATE TABLE prompt_version_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content JSONB NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changes_summary TEXT,
    is_current BOOLEAN DEFAULT false,
    UNIQUE(prompt_id, version_number)
);

-- Public prompt analytics table
CREATE TABLE public_prompt_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    UNIQUE(prompt_id, date)
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id)
);

-- Social interactions table
CREATE TABLE social_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User activity logs table
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    target_id UUID,
    target_type VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User follows table
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Context Engineering Tables
-- =============================================

-- User Context Profiles
CREATE TABLE user_context_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_name VARCHAR(100) NOT NULL,
    context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, profile_name)
);

-- Context Sessions
CREATE TABLE context_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES user_context_profiles(id) ON DELETE SET NULL,
    session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'expired')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- User Interactions
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES context_sessions(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL,
    interaction_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    context_snapshot JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Context Experiments
CREATE TABLE context_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_name VARCHAR(200) NOT NULL,
    experiment_type VARCHAR(50) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Experiment Participations
CREATE TABLE experiment_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES context_experiments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant_assigned VARCHAR(100),
    participation_data JSONB DEFAULT '{}'::jsonb,
    completion_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(experiment_id, user_id)
);

-- Performance Metrics
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES context_sessions(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prompt Relationships
CREATE TABLE prompt_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    target_prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    relationship_config JSONB DEFAULT '{}'::jsonb,
    effectiveness_score DECIMAL(3,2) DEFAULT 0.00 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_prompt_id, target_prompt_id, relationship_type)
);

-- Context Adaptations
CREATE TABLE context_adaptations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    adaptation_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    effectiveness_rating DECIMAL(3,2) CHECK (effectiveness_rating >= 0 AND effectiveness_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Legacy Tables (maintained for compatibility)
-- =============================================

-- Prompt versions table
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changes_summary TEXT,
    is_current BOOLEAN DEFAULT false,
    UNIQUE(prompt_id, version_number)
);

-- Collaborations table
CREATE TABLE collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'admin')),
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
    UNIQUE(prompt_id, user_id)
);

-- User prompt usage logs table
CREATE TABLE user_prompt_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
    private_prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usage_context JSONB DEFAULT '{}'::jsonb,
    user_feedback DECIMAL(3,2) CHECK (user_feedback >= 0 AND user_feedback <= 5),
    feedback_text TEXT,
    session_id VARCHAR(255)
);

-- =============================================
-- Indexes for Performance
-- =============================================

-- Users table indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_role ON users(role);

-- Categories table indexes
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_name_en ON categories(name_en);
CREATE INDEX idx_categories_optimization_template ON categories USING GIN(optimization_template);

-- API Keys table indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- Prompts table indexes
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_category_id ON prompts(category_id);
CREATE INDEX idx_prompts_is_public ON prompts(is_public);
CREATE INDEX idx_prompts_created_at ON prompts(created_at);
CREATE INDEX idx_prompts_category_type ON prompts(category_type);
CREATE INDEX idx_prompts_context_engineering_enabled ON prompts(context_engineering_enabled);
CREATE INDEX idx_prompts_effectiveness_score ON prompts(effectiveness_score);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX idx_prompts_input_variables ON prompts USING GIN(input_variables);
CREATE INDEX idx_prompts_parameters ON prompts USING GIN(parameters);
CREATE INDEX idx_prompts_content ON prompts USING GIN(content);
CREATE INDEX idx_prompts_context_variables ON prompts USING GIN(context_variables);
CREATE INDEX idx_prompts_adaptation_rules ON prompts USING GIN(adaptation_rules);

-- Context Engineering table indexes
CREATE INDEX idx_user_context_profiles_user_id ON user_context_profiles(user_id);
CREATE INDEX idx_user_context_profiles_is_active ON user_context_profiles(is_active);
CREATE INDEX idx_user_context_profiles_context_data ON user_context_profiles USING GIN(context_data);

CREATE INDEX idx_context_sessions_user_id ON context_sessions(user_id);
CREATE INDEX idx_context_sessions_profile_id ON context_sessions(profile_id);
CREATE INDEX idx_context_sessions_status ON context_sessions(status);
CREATE INDEX idx_context_sessions_started_at ON context_sessions(started_at);
CREATE INDEX idx_context_sessions_session_data ON context_sessions USING GIN(session_data);

CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_session_id ON user_interactions(session_id);
CREATE INDEX idx_user_interactions_prompt_id ON user_interactions(prompt_id);
CREATE INDEX idx_user_interactions_interaction_type ON user_interactions(interaction_type);
CREATE INDEX idx_user_interactions_created_at ON user_interactions(created_at);
CREATE INDEX idx_user_interactions_interaction_data ON user_interactions USING GIN(interaction_data);

CREATE INDEX idx_context_experiments_status ON context_experiments(status);
CREATE INDEX idx_context_experiments_created_by ON context_experiments(created_by);
CREATE INDEX idx_context_experiments_start_date ON context_experiments(start_date);
CREATE INDEX idx_context_experiments_configuration ON context_experiments USING GIN(configuration);

CREATE INDEX idx_experiment_participations_experiment_id ON experiment_participations(experiment_id);
CREATE INDEX idx_experiment_participations_user_id ON experiment_participations(user_id);
CREATE INDEX idx_experiment_participations_completion_rate ON experiment_participations(completion_rate);
CREATE INDEX idx_experiment_participations_participation_data ON experiment_participations USING GIN(participation_data);

CREATE INDEX idx_performance_metrics_prompt_id ON performance_metrics(prompt_id);
CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX idx_performance_metrics_metric_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_measured_at ON performance_metrics(measured_at);
CREATE INDEX idx_performance_metrics_metadata ON performance_metrics USING GIN(metadata);

CREATE INDEX idx_prompt_relationships_source_prompt_id ON prompt_relationships(source_prompt_id);
CREATE INDEX idx_prompt_relationships_target_prompt_id ON prompt_relationships(target_prompt_id);
CREATE INDEX idx_prompt_relationships_relationship_type ON prompt_relationships(relationship_type);
CREATE INDEX idx_prompt_relationships_effectiveness_score ON prompt_relationships(effectiveness_score);
CREATE INDEX idx_prompt_relationships_relationship_config ON prompt_relationships USING GIN(relationship_config);

CREATE INDEX idx_context_adaptations_prompt_id ON context_adaptations(prompt_id);
CREATE INDEX idx_context_adaptations_user_id ON context_adaptations(user_id);
CREATE INDEX idx_context_adaptations_effectiveness_rating ON context_adaptations(effectiveness_rating);
CREATE INDEX idx_context_adaptations_adaptation_data ON context_adaptations USING GIN(adaptation_data);

-- Legacy table indexes
CREATE INDEX idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX idx_prompt_versions_version_number ON prompt_versions(version_number);
CREATE INDEX idx_prompt_versions_is_current ON prompt_versions(is_current);
CREATE INDEX idx_prompt_versions_created_by ON prompt_versions(created_by);

CREATE INDEX idx_collaborations_prompt_id ON collaborations(prompt_id);
CREATE INDEX idx_collaborations_user_id ON collaborations(user_id);
CREATE INDEX idx_collaborations_status ON collaborations(status);
CREATE INDEX idx_collaborations_invited_by ON collaborations(invited_by);

CREATE INDEX idx_user_prompt_usage_logs_user_id ON user_prompt_usage_logs(user_id);
CREATE INDEX idx_user_prompt_usage_logs_public_prompt_id ON user_prompt_usage_logs(public_prompt_id);
CREATE INDEX idx_user_prompt_usage_logs_private_prompt_id ON user_prompt_usage_logs(private_prompt_id);
CREATE INDEX idx_user_prompt_usage_logs_used_at ON user_prompt_usage_logs(used_at);
CREATE INDEX idx_user_prompt_usage_logs_usage_context ON user_prompt_usage_logs USING GIN(usage_context);

-- =============================================
-- Views for Analytics and Reporting
-- =============================================

-- Category Statistics View
CREATE VIEW category_stats AS
SELECT
    c.id,
    c.name,
    c.name_en,
    c.type,
    c.icon,
    c.description,
    c.sort_order,
    COUNT(p.id) AS prompt_count,
    COUNT(CASE WHEN p.is_public = true THEN 1 END) AS public_count,
    COUNT(CASE WHEN p.is_public = false THEN 1 END) AS private_count
FROM categories c
LEFT JOIN prompts p ON c.id = p.category_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.name_en, c.type, c.icon, c.description, c.sort_order
ORDER BY c.sort_order;

-- Category Type Statistics View
CREATE VIEW category_type_stats AS
SELECT
    type,
    COUNT(*) AS category_count,
    SUM(prompt_count) AS total_prompts,
    SUM(public_count) AS total_public,
    SUM(private_count) AS total_private
FROM category_stats
GROUP BY type
ORDER BY
    CASE type
        WHEN 'chat' THEN 1
        WHEN 'image' THEN 2
        WHEN 'video' THEN 3
        ELSE 4
    END;

-- Context Engineering Dashboard View
CREATE VIEW context_engineering_dashboard AS
SELECT
    'prompts' AS component,
    jsonb_build_object(
        'total_prompts', COUNT(*),
        'context_enabled', COUNT(*) FILTER (WHERE context_engineering_enabled = true),
        'public_prompts', COUNT(*) FILTER (WHERE is_public = true),
        'avg_effectiveness', COALESCE(AVG(effectiveness_score), 0)
    ) AS metrics
FROM prompts
UNION ALL
SELECT
    'users' AS component,
    jsonb_build_object(
        'total_profiles', COUNT(*),
        'active_sessions', (
            SELECT COUNT(*)
            FROM context_sessions
            WHERE status = 'active'
        )
    ) AS metrics
FROM user_context_profiles;

-- Context Engineering Health Check View
CREATE VIEW context_engineering_health AS
SELECT
    'database_health' AS check_category,
    jsonb_build_object(
        'prompts_with_context', (
            SELECT COUNT(*)
            FROM prompts
            WHERE context_engineering_enabled = true
        ),
        'active_user_sessions', (
            SELECT COUNT(*)
            FROM context_sessions
            WHERE status = 'active'
        ),
        'cache_hit_rate', (
            SELECT COALESCE(AVG(metric_value), 0)
            FROM performance_metrics
            WHERE metric_type = 'cache_hit_rate'
            AND measured_at >= NOW() - INTERVAL '1 hour'
        )
    ) AS health_metrics;

-- Experiment Analytics View
CREATE VIEW experiment_analytics AS
SELECT
    ce.id,
    ce.experiment_name,
    ce.experiment_type,
    ce.status,
    COALESCE(AVG(ep.completion_rate), 0) AS avg_completion_rate,
    COALESCE(COUNT(DISTINCT ep.user_id), 0) AS participant_count,
    ce.start_date,
    ce.end_date
FROM context_experiments ce
LEFT JOIN experiment_participations ep ON ce.id = ep.experiment_id
WHERE ce.status IN ('active', 'completed')
GROUP BY ce.id, ce.experiment_name, ce.experiment_type, ce.status, ce.start_date, ce.end_date;

-- Prompt Dependency Graph View
CREATE VIEW prompt_dependency_graph AS
SELECT
    pr.source_prompt_id,
    p1.name AS source_prompt_name,
    pr.target_prompt_id,
    p2.name AS target_prompt_name,
    pr.relationship_type,
    pr.effectiveness_score,
    COALESCE((pr.relationship_config->>'strength')::numeric, 0.5) AS strength,
    pr.created_at
FROM prompt_relationships pr
JOIN prompts p1 ON pr.source_prompt_id = p1.id
JOIN prompts p2 ON pr.target_prompt_id = p2.id
WHERE p1.is_public = true AND p2.is_public = true;

-- Prompt Performance Analysis View
CREATE VIEW prompt_performance_analysis AS
SELECT
    p.id,
    p.name,
    p.context_engineering_enabled,
    COALESCE(AVG(pm.metric_value), 0) AS avg_response_time,
    COALESCE(COUNT(pm.id), 0) AS usage_count,
    COALESCE(AVG(CASE WHEN pm.metric_type = 'user_satisfaction' THEN pm.metric_value END), 0) AS avg_satisfaction,
    MAX(pm.measured_at) AS last_used
FROM prompts p
LEFT JOIN performance_metrics pm ON p.id = pm.prompt_id
WHERE p.is_public = true
AND (pm.measured_at >= NOW() - INTERVAL '7 days' OR pm.measured_at IS NULL)
GROUP BY p.id, p.name, p.context_engineering_enabled;

-- Public Prompt Statistics View
CREATE VIEW public_prompt_stats AS
SELECT
    p.id,
    p.name,
    p.category_type,
    p.is_public,
    p.view_count,
    p.created_at,
    COALESCE(COUNT(uul.id), 0) AS usage_count,
    COALESCE(AVG(uul.user_feedback), 0) AS avg_feedback
FROM prompts p
LEFT JOIN user_prompt_usage_logs uul ON p.id = uul.public_prompt_id
WHERE p.is_public = true
GROUP BY p.id, p.name, p.category_type, p.is_public, p.view_count, p.created_at;

-- Storage Statistics View
CREATE VIEW storage_stats AS
SELECT
    'prompts' AS table_name,
    COUNT(*) AS total_count,
    COUNT(CASE WHEN is_public = true THEN 1 END) AS public_count,
    COUNT(CASE WHEN is_public = false THEN 1 END) AS private_count
FROM prompts
UNION ALL
SELECT
    'categories' AS table_name,
    COUNT(*) AS total_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) AS public_count,
    COUNT(CASE WHEN is_active = false THEN 1 END) AS private_count
FROM categories;

-- System Performance Dashboard View
CREATE VIEW system_performance_dashboard AS
SELECT
    'response_time' AS metric_category,
    COALESCE(AVG(metric_value), 0) AS avg_value,
    COALESCE(MIN(metric_value), 0) AS min_value,
    COALESCE(MAX(metric_value), 0) AS max_value,
    COUNT(*) AS sample_count,
    DATE_TRUNC('hour', COALESCE(measured_at, NOW())) AS time_bucket
FROM performance_metrics
WHERE metric_type = 'response_time'
AND measured_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', COALESCE(measured_at, NOW()))
UNION ALL
SELECT
    'cache_hit_rate' AS metric_category,
    COALESCE(AVG(metric_value), 0) AS avg_value,
    COALESCE(MIN(metric_value), 0) AS min_value,
    COALESCE(MAX(metric_value), 0) AS max_value,
    COUNT(*) AS sample_count,
    DATE_TRUNC('hour', COALESCE(measured_at, NOW())) AS time_bucket
FROM performance_metrics
WHERE metric_type = 'cache_hit_rate'
AND measured_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', COALESCE(measured_at, NOW()));

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompt_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_prompt_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_adaptations ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public user profiles are viewable" ON users FOR SELECT USING (is_active = true);

-- Categories table policies
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can modify categories" ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- API Keys table policies
CREATE POLICY "Users can view their own API keys" ON api_keys FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own API keys" ON api_keys FOR ALL USING (user_id = auth.uid());

-- Prompts table policies
CREATE POLICY "Public prompts are viewable by everyone" ON prompts FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own prompts" ON prompts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own prompts" ON prompts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Collaborators can view shared prompts" ON prompts FOR SELECT USING (
    EXISTS (SELECT 1 FROM collaborations WHERE prompt_id = prompts.id AND user_id = auth.uid() AND status = 'accepted')
);

-- Comments table policies
CREATE POLICY "Comments on public prompts are viewable" ON comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM prompts WHERE id = comments.prompt_id AND is_public = true)
);
CREATE POLICY "Users can manage their own comments" ON comments FOR ALL USING (user_id = auth.uid());

-- Favorites table policies
CREATE POLICY "Users can manage their own favorites" ON favorites FOR ALL USING (user_id = auth.uid());

-- Likes table policies
CREATE POLICY "Users can manage their own likes" ON likes FOR ALL USING (user_id = auth.uid());

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- User activity logs policies
CREATE POLICY "Users can view their own activity" ON user_activity_logs FOR SELECT USING (user_id = auth.uid());

-- User follows policies
CREATE POLICY "Users can manage their own follows" ON user_follows FOR ALL USING (follower_id = auth.uid());
CREATE POLICY "Follow relationships are viewable" ON user_follows FOR SELECT USING (true);

-- User preferences policies
CREATE POLICY "Users can manage their own preferences" ON user_preferences FOR ALL USING (user_id = auth.uid());

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own sessions" ON user_sessions FOR ALL USING (user_id = auth.uid());

-- Context Engineering policies
CREATE POLICY "Users can manage their own context profiles" ON user_context_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own context sessions" ON context_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view their own interactions" ON user_interactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own context adaptations" ON context_adaptations FOR ALL USING (user_id = auth.uid());

-- Performance metrics policies (admin only)
CREATE POLICY "Only admins can view performance metrics" ON performance_metrics FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Reports policies
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "Admins can manage all reports" ON reports FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
