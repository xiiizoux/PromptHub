-- =============================================
-- PromptHub Database Schema (Complete)
-- Generated: 2025-07-10
-- Updated to match actual Supabase database structure
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- Custom Types
-- =============================================

-- Category type enum (matches actual database)
CREATE TYPE category_type AS ENUM ('chat', 'image', 'video');

-- Prompt category enum (matches actual database with all Chinese categories)
CREATE TYPE prompt_category AS ENUM (
    '全部', '学术', '职业', '文案', '设计', '教育', '情感', '娱乐', '游戏',
    '通用', '生活', '商业', '办公', '编程', '翻译', '绘图', '视频', '播客',
    '音乐', '健康', '科技', '金融投资'
);

-- =============================================
-- Core Tables (in dependency order)
-- =============================================

-- Users table (matches actual database structure)
CREATE TABLE users (
    id UUID PRIMARY KEY NOT NULL,
    email VARCHAR,
    display_name VARCHAR,
    role VARCHAR DEFAULT 'user'::character varying,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    username VARCHAR
);

-- Categories table (matches actual database structure)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_en TEXT,
    icon TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    type category_type DEFAULT 'chat'::category_type,
    optimization_template JSONB
);

-- API Keys table (matches actual database structure)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Prompts table (matches actual database structure with correct field order)
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT '通用对话'::text,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_public BOOLEAN DEFAULT false,
    user_id UUID REFERENCES users(id),
    allow_collaboration BOOLEAN DEFAULT false,
    edit_permission VARCHAR DEFAULT 'owner_only'::character varying,
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id),
    category_id UUID REFERENCES categories(id),
    view_count INTEGER DEFAULT 0,
    input_variables TEXT[],
    compatible_models TEXT[],
    template_format TEXT DEFAULT 'text'::text,
    preview_asset_url TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    category_type VARCHAR,
    content JSONB,
    context_config JSONB DEFAULT '{"personalization": {"user_level_adaptation": true, "context_aware_examples": true, "dynamic_tool_selection": true}, "adaptation_rules": {"style_adaptation": true, "content_filtering": true, "expertise_adjustment": true}, "memory_management": {"short_term_window": 5, "long_term_retention": ["user_preferences", "project_context"]}}'::jsonb,
    usage_stats JSONB DEFAULT '{"total_uses": 0, "last_updated": null, "success_rate": 0.0, "user_ratings": [], "avg_response_time": 0}'::jsonb,
    dependencies JSONB DEFAULT '{"data_sources": [], "required_tools": [], "api_dependencies": [], "prerequisite_prompts": []}'::jsonb,
    effectiveness_score NUMERIC DEFAULT 0.0,
    context_engineering_enabled BOOLEAN DEFAULT false,
    context_complexity_level VARCHAR DEFAULT 'basic'::character varying,
    version_config JSONB DEFAULT '{"created_at": null, "last_modified": null, "template_version": "1.0", "experiment_version": null, "context_config_version": "1.0", "behavior_strategy_version": "1.0"}'::jsonb,
    version NUMERIC NOT NULL DEFAULT 1.0
);

-- Comments table (matches actual database structure)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES prompts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications table (matches actual database structure)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    resource_id UUID,
    trigger_user_id UUID REFERENCES users(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Social interactions table (matches actual database structure)
CREATE TABLE social_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES prompts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User follows table (matches actual database structure)
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id),
    following_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Prompt versions table (matches actual database structure)
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID REFERENCES prompts(id),
    version NUMERIC NOT NULL,
    description TEXT,
    tags TEXT[],
    category TEXT,
    category_id UUID REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID REFERENCES users(id),
    preview_asset_url TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    content TEXT
);

-- Prompt audit logs table (matches actual database structure)
CREATE TABLE prompt_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID REFERENCES prompts(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR NOT NULL,
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Topics table (matches actual database structure)
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Topic posts table (matches actual database structure)
CREATE TABLE topic_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id),
    user_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- Context Engineering Tables
-- =============================================

-- User context profiles table (matches actual database structure)
CREATE TABLE user_context_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    privacy_level VARCHAR DEFAULT 'private'::character varying,
    data_retention_days INTEGER DEFAULT 365,
    allow_anonymous_analytics BOOLEAN DEFAULT false,
    expertise_level VARCHAR DEFAULT 'intermediate'::character varying,
    skill_domains JSONB DEFAULT '[]'::jsonb,
    learning_goals JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{"detail_level": "medium", "example_preference": "practical", "communication_style": "balanced", "language_preference": "auto", "context_memory_enabled": true}'::jsonb,
    interaction_patterns JSONB DEFAULT '{"usage_frequency": {}, "success_patterns": {}, "common_modifications": [], "preferred_prompt_types": []}'::jsonb,
    learning_progress JSONB DEFAULT '{"knowledge_gaps": [], "learning_velocity": 0.0, "skill_improvements": {}, "completed_tutorials": []}'::jsonb,
    context_memory JSONB DEFAULT '{"recurring_tasks": [], "project_contexts": {}, "personal_templates": {}, "conversation_themes": []}'::jsonb,
    data_export_requested_at TIMESTAMP WITH TIME ZONE,
    data_deletion_scheduled_at TIMESTAMP WITH TIME ZONE,
    profile_completeness NUMERIC DEFAULT 0.0,
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Context sessions table (matches actual database structure)
CREATE TABLE context_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    is_private BOOLEAN DEFAULT true,
    anonymize_after_days INTEGER DEFAULT 30,
    session_type VARCHAR DEFAULT 'general'::character varying,
    session_goal TEXT,
    conversation_history JSONB DEFAULT '[]'::jsonb,
    conversation_summary JSONB DEFAULT '{}'::jsonb,
    context_state JSONB DEFAULT '{"user_intent": "unknown", "active_tools": [], "current_task": null, "conversation_flow": "linear", "context_complexity": "basic"}'::jsonb,
    used_public_prompts JSONB DEFAULT '[]'::jsonb,
    session_metadata JSONB DEFAULT '{"device_type": "unknown", "session_quality": 0.0, "interaction_mode": "text"}'::jsonb,
    total_exchanges INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    user_satisfaction_score NUMERIC,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR DEFAULT 'active'::character varying
);

-- Context cache table (matches actual database structure)
CREATE TABLE context_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR NOT NULL,
    prompt_id UUID REFERENCES prompts(id),
    user_context_hash VARCHAR,
    cached_content JSONB NOT NULL,
    cache_metadata JSONB DEFAULT '{"cache_strategy": "lru", "compression_used": false, "generation_time_ms": 0}'::jsonb,
    hit_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_valid BOOLEAN DEFAULT true,
    invalidation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Context experiments table (matches actual database structure)
CREATE TABLE context_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_name VARCHAR NOT NULL,
    experiment_type VARCHAR NOT NULL,
    experiment_config JSONB DEFAULT '{"variants": [], "duration_days": 7, "min_sample_size": 100, "success_metrics": [], "traffic_allocation": {}}'::jsonb,
    target_prompts JSONB DEFAULT '[]'::jsonb,
    experiment_conditions JSONB DEFAULT '{"user_segments": [], "context_filters": {}, "time_constraints": {}}'::jsonb,
    experiment_results JSONB DEFAULT '{"winner_variant": null, "confidence_level": 0.95, "variants_performance": {}, "statistical_significance": false}'::jsonb,
    status VARCHAR DEFAULT 'draft'::character varying,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Experiment participations table (matches actual database structure)
CREATE TABLE experiment_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID REFERENCES context_experiments(id),
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES context_sessions(session_id),
    assigned_variant VARCHAR NOT NULL,
    assignment_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    interactions_count INTEGER DEFAULT 0,
    success_events INTEGER DEFAULT 0,
    conversion_events INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    user_satisfaction NUMERIC,
    completion_rate NUMERIC,
    user_agent TEXT,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance metrics table (matches actual database structure)
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR NOT NULL,
    prompt_id UUID REFERENCES prompts(id),
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES context_sessions(session_id),
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR DEFAULT 'ms'::character varying,
    context_data JSONB DEFAULT '{}'::jsonb,
    aggregation_level VARCHAR DEFAULT 'individual'::character varying,
    aggregation_period TIMESTAMP WITH TIME ZONE,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User prompt usage logs table (matches actual database structure)
CREATE TABLE user_prompt_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES context_sessions(session_id),
    public_prompt_id UUID REFERENCES prompts(id),
    user_context_snapshot JSONB NOT NULL,
    personalized_content TEXT,
    user_feedback INTEGER,
    private_notes TEXT,
    improvement_suggestions TEXT,
    response_time INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_details JSONB,
    allow_anonymous_analytics BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Public prompt analytics table (matches actual database structure)
CREATE TABLE public_prompt_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID REFERENCES prompts(id),
    anonymous_usage_stats JSONB DEFAULT '{"usage_count": 0, "success_rate": 0.0, "avg_response_time": 0, "common_modifications": [], "user_satisfaction_avg": 0.0, "complexity_distribution": {}}'::jsonb,
    aggregation_period VARCHAR DEFAULT 'daily'::character varying,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    sample_size INTEGER DEFAULT 0,
    confidence_level NUMERIC DEFAULT 0.95,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- System Management and Compliance Tables
-- =============================================

-- System health metrics table (matches actual database structure)
CREATE TABLE system_health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_category VARCHAR NOT NULL,
    metric_name VARCHAR NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_threshold NUMERIC,
    status VARCHAR DEFAULT 'normal'::character varying,
    alert_triggered BOOLEAN DEFAULT false,
    details JSONB DEFAULT '{}'::jsonb,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Query optimization stats table (matches actual database structure)
CREATE TABLE query_optimization_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_type VARCHAR NOT NULL,
    query_hash VARCHAR NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    rows_examined INTEGER DEFAULT 0,
    rows_returned INTEGER DEFAULT 0,
    execution_plan JSONB,
    index_usage JSONB DEFAULT '{}'::jsonb,
    optimization_suggestions JSONB DEFAULT '[]'::jsonb,
    execution_count INTEGER DEFAULT 1,
    last_executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- GDPR compliance logs table (matches actual database structure)
CREATE TABLE gdpr_compliance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type VARCHAR NOT NULL,
    user_id UUID REFERENCES users(id),
    affected_tables JSONB NOT NULL DEFAULT '[]'::jsonb,
    request_details JSONB DEFAULT '{}'::jsonb,
    legal_basis VARCHAR,
    status VARCHAR DEFAULT 'pending'::character varying,
    processing_results JSONB DEFAULT '{}'::jsonb,
    evidence_data JSONB DEFAULT '{}'::jsonb,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    retention_until TIMESTAMP WITH TIME ZONE,
    compliance_officer_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data retention policies table (matches actual database structure)
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_name VARCHAR NOT NULL,
    table_name VARCHAR NOT NULL,
    retention_config JSONB NOT NULL DEFAULT '{"cleanup_strategy": "delete", "anonymization_rules": {}, "archive_before_delete": false, "retention_period_days": 365}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    next_execution_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Version management config table (matches actual database structure)
CREATE TABLE version_management_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID REFERENCES prompts(id),
    versioning_strategy JSONB DEFAULT '{"auto_versioning": true, "rollback_policy": "performance_based", "version_retention_days": 90, "max_versions_per_dimension": 10}'::jsonb,
    deployment_config JSONB DEFAULT '{"deployment_type": "gradual", "rollback_threshold": {"error_rate": 0.05, "user_satisfaction_drop": 0.1, "performance_degradation": 0.2}, "traffic_split_strategy": "user_based"}'::jsonb,
    monitoring_config JSONB DEFAULT '{"alert_thresholds": {}, "metrics_to_track": ["response_time", "success_rate", "user_feedback"], "monitoring_window_hours": 24}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- Views (matches actual database views)
-- =============================================

-- Category statistics view
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

-- Category type statistics view
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

-- Public prompt statistics view
CREATE VIEW public_prompt_stats AS
SELECT
    p.id,
    p.name,
    p.category_type,
    p.is_public,
    p.view_count,
    p.created_at,
    COUNT(uul.id) AS usage_count,
    AVG(uul.user_feedback) AS avg_feedback
FROM prompts p
LEFT JOIN user_prompt_usage_logs uul ON p.id = uul.public_prompt_id
WHERE p.is_public = true
GROUP BY p.id, p.name, p.category_type, p.is_public, p.view_count, p.created_at;

-- Storage statistics view
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

-- Context engineering dashboard view
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

-- Context engineering health view
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

-- Experiment analytics view
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

-- System performance dashboard view
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
GROUP BY DATE_TRUNC('hour', COALESCE(measured_at, NOW()));

-- =============================================
-- Indexes for Performance
-- =============================================

-- Core table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_optimization_template ON categories USING GIN(optimization_template);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_category_id ON prompts(category_id);
CREATE INDEX idx_prompts_is_public ON prompts(is_public);
CREATE INDEX idx_prompts_created_at ON prompts(created_at);
CREATE INDEX idx_prompts_category_type ON prompts(category_type);
CREATE INDEX idx_prompts_context_engineering_enabled ON prompts(context_engineering_enabled);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX idx_prompts_parameters ON prompts USING GIN(parameters);
CREATE INDEX idx_prompts_content ON prompts USING GIN(content);
CREATE INDEX idx_prompts_context_config ON prompts USING GIN(context_config);

-- Context Engineering indexes
CREATE INDEX idx_user_context_profiles_user_id ON user_context_profiles(user_id);
CREATE INDEX idx_user_context_profiles_preferences ON user_context_profiles USING GIN(preferences);

CREATE INDEX idx_context_sessions_user_id ON context_sessions(user_id);
CREATE INDEX idx_context_sessions_status ON context_sessions(status);
CREATE INDEX idx_context_sessions_started_at ON context_sessions(started_at);

-- Context Engineering and analytics indexes
CREATE INDEX idx_context_experiments_status ON context_experiments(status);
CREATE INDEX idx_context_experiments_created_by ON context_experiments(created_by);
CREATE INDEX idx_context_experiments_experiment_config ON context_experiments USING GIN(experiment_config);

CREATE INDEX idx_experiment_participations_experiment_id ON experiment_participations(experiment_id);
CREATE INDEX idx_experiment_participations_user_id ON experiment_participations(user_id);
CREATE INDEX idx_experiment_participations_session_id ON experiment_participations(session_id);

CREATE INDEX idx_performance_metrics_prompt_id ON performance_metrics(prompt_id);
CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX idx_performance_metrics_metric_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_measured_at ON performance_metrics(measured_at);
CREATE INDEX idx_performance_metrics_context_data ON performance_metrics USING GIN(context_data);

CREATE INDEX idx_user_prompt_usage_logs_user_id ON user_prompt_usage_logs(user_id);
CREATE INDEX idx_user_prompt_usage_logs_session_id ON user_prompt_usage_logs(session_id);
CREATE INDEX idx_user_prompt_usage_logs_public_prompt_id ON user_prompt_usage_logs(public_prompt_id);
CREATE INDEX idx_user_prompt_usage_logs_user_context_snapshot ON user_prompt_usage_logs USING GIN(user_context_snapshot);

CREATE INDEX idx_public_prompt_analytics_prompt_id ON public_prompt_analytics(prompt_id);
CREATE INDEX idx_public_prompt_analytics_period_start ON public_prompt_analytics(period_start);
CREATE INDEX idx_public_prompt_analytics_anonymous_usage_stats ON public_prompt_analytics USING GIN(anonymous_usage_stats);

-- Version management indexes
CREATE INDEX idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX idx_prompt_versions_version ON prompt_versions(version);
CREATE INDEX idx_prompt_versions_user_id ON prompt_versions(user_id);

CREATE INDEX idx_prompt_audit_logs_prompt_id ON prompt_audit_logs(prompt_id);
CREATE INDEX idx_prompt_audit_logs_user_id ON prompt_audit_logs(user_id);
CREATE INDEX idx_prompt_audit_logs_action ON prompt_audit_logs(action);

-- System management indexes
CREATE INDEX idx_system_health_metrics_metric_category ON system_health_metrics(metric_category);
CREATE INDEX idx_system_health_metrics_measured_at ON system_health_metrics(measured_at);

CREATE INDEX idx_query_optimization_stats_query_type ON query_optimization_stats(query_type);
CREATE INDEX idx_query_optimization_stats_execution_time_ms ON query_optimization_stats(execution_time_ms);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_posts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Context Engineering tables
ALTER TABLE user_context_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompt_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_prompt_analytics ENABLE ROW LEVEL SECURITY;

-- Enable RLS on system management tables
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_optimization_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_management_config ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for core functionality

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Categories table policies
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (is_active = true);

-- API Keys table policies
CREATE POLICY "Users can view their own API keys" ON api_keys FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own API keys" ON api_keys FOR ALL USING (user_id = auth.uid());

-- Prompts table policies
CREATE POLICY "Public prompts are viewable by everyone" ON prompts FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own prompts" ON prompts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own prompts" ON prompts FOR ALL USING (user_id = auth.uid());

-- Comments table policies
CREATE POLICY "Comments on public prompts are viewable" ON comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM prompts WHERE id = comments.prompt_id AND is_public = true)
);
CREATE POLICY "Users can manage their own comments" ON comments FOR ALL USING (user_id = auth.uid());

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Social interactions policies
CREATE POLICY "Users can manage their own social interactions" ON social_interactions FOR ALL USING (user_id = auth.uid());

-- User follows policies
CREATE POLICY "Users can manage their own follows" ON user_follows FOR ALL USING (follower_id = auth.uid());
CREATE POLICY "Follow relationships are viewable" ON user_follows FOR SELECT USING (true);

-- Context Engineering policies
CREATE POLICY "Users can manage their own context profiles" ON user_context_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own context sessions" ON context_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view their own usage logs" ON user_prompt_usage_logs FOR SELECT USING (user_id = auth.uid());

-- Performance metrics policies (admin only)
CREATE POLICY "Only admins can view performance metrics" ON performance_metrics FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- Schema Complete
-- =============================================
-- This schema file now matches the actual Supabase database structure
-- with all tables, fields, types, and relationships correctly defined.
