/**
 * 共享类型定义
 * 这个文件包含MCP服务和Web服务之间共享的类型定义
 */
export interface User {
    id: string;
    email: string;
    display_name?: string;
    created_at?: string;
}
export interface PromptContentJsonb {
    type: 'context_engineering' | 'legacy_text' | 'simple_text';
    static_content?: string;
    dynamic_context?: {
        adaptation_rules?: Record<string, any>;
        examples?: {
            selection_strategy?: string;
            max_examples?: number;
            example_pool?: any[];
        };
        tools?: {
            available_tools?: any[];
            tool_selection_criteria?: string;
        };
        state?: {
            conversation_history?: any[];
            user_preferences?: Record<string, any>;
            context_variables?: Record<string, any>;
        };
    };
    legacy_content?: string;
    migrated_at?: string;
}
export interface OptimizationTemplateJsonb {
    type: 'legacy_text' | 'structured' | 'context_engineering';
    template?: string;
    structure?: {
        system_prompt?: string;
        optimization_rules?: any[];
        context_variables?: Record<string, any>;
        adaptation_strategies?: Record<string, any>;
    };
    context_engineering?: {
        dynamic_adaptation?: boolean;
        user_context_integration?: boolean;
        example_selection_strategy?: string;
        tool_integration?: boolean;
    };
    migrated_at?: string;
}
export type CategoryType = 'chat' | 'image' | 'video';
export interface Category {
    id: string;
    name: string;
    name_en?: string;
    icon?: string;
    description?: string;
    type: CategoryType;
    sort_order?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    optimization_template?: OptimizationTemplateJsonb | null;
}
export interface Prompt {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    variables?: string[];
    content: PromptContentJsonb | string;
    user_id?: string;
    is_public: boolean;
    created_at?: string;
    updated_at?: string;
    version?: number;
    author?: string;
    rating?: number;
    usageCount?: number;
    category_id?: string;
    category_type?: CategoryType;
    allow_collaboration?: boolean;
    edit_permission?: 'owner' | 'collaborators' | 'public';
    created_by?: string;
    last_modified_by?: string;
    view_count?: number;
    input_variables?: any[] | string[];
    compatible_models?: string[];
    template_format?: string;
    preview_asset_url?: string;
    parameters?: Record<string, any>;
    migration_status?: string;
    context_engineering_enabled?: boolean;
    context_variables?: Record<string, any>;
    adaptation_rules?: any[];
    effectiveness_score?: number;
}
export interface PromptVersion {
    id: string;
    prompt_id: string;
    version: number;
    description: string;
    category: string;
    tags: string[];
    variables?: string[];
    content: PromptContentJsonb | string;
    created_at: string;
    user_id?: string;
    category_id?: string;
    preview_asset_url?: string;
    parameters?: Record<string, any>;
}
export interface ApiKey {
    id: string;
    user_id: string;
    name: string;
    created_at: string;
    last_used_at?: string;
    expires_at?: string;
}
export interface AuthResponse {
    user: User | null;
    token?: string;
    error?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface PromptFilters {
    category?: string;
    category_type?: CategoryType;
    tags?: string[];
    search?: string;
    userId?: string;
    isPublic?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: 'latest' | 'popular' | 'rating';
}
export interface ContentConversionResult {
    success: boolean;
    data?: PromptContentJsonb;
    isLegacy?: boolean;
    error?: string;
}
export interface OptimizationTemplateConversionResult {
    success: boolean;
    data?: OptimizationTemplateJsonb | null;
    isLegacy?: boolean;
    error?: string;
}
export interface ContentConversionResult {
    success: boolean;
    data?: PromptContentJsonb;
    error?: string;
    isLegacy?: boolean;
}
export interface OptimizationTemplateConversionResult {
    success: boolean;
    data?: OptimizationTemplateJsonb;
    error?: string;
    isLegacy?: boolean;
}
export interface PromptUsage {
    usage_id: string;
    prompt_id: string;
    user_id?: string;
    session_id: string;
    input_tokens?: number;
    output_tokens?: number;
    duration_ms?: number;
    created_at: string;
    model?: string;
}
export interface PromptFeedback {
    id: string;
    usage_id: string;
    prompt_id: string;
    user_id?: string;
    rating: number;
    comment?: string;
    categories?: string[];
    created_at: string;
}
export interface PromptPerformance {
    prompt_id: string;
    average_rating?: number;
    total_usages?: number;
    average_tokens?: number;
    average_duration_ms?: number;
    usage_by_day?: Record<string, number>;
    ratings_distribution?: Record<string, number>;
}
//# sourceMappingURL=types.d.ts.map