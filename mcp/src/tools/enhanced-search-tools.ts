/**
 * 增强的搜索和展示工具
 * 提供清晰的用户界面和选择逻辑，支持公开和私有提示词搜索
 */

import { StorageFactory } from '../storage/storage-factory.js';
import { ToolDescription, ToolParameter, MCPToolResponse, Prompt, StorageAdapter, PromptFilters } from '../types.js';

const storage: StorageAdapter = StorageFactory.getStorage();

/**
 * 增强搜索工具定义
 */
export const enhancedSearchTool: ToolDescription = {
  name: 'enhanced_search_prompts',
  description: '增强的提示词搜索功能，支持多种搜索条件和清晰的结果展示。自动包含公开提示词和用户私有提示词。',
  schema_version: 'v1',
  parameters: {
    query: {
      type: 'string',
      description: '搜索关键词，支持模糊匹配提示词名称、描述、标签等',
      required: false,
    } as ToolParameter,
    category: {
      type: 'string',
      description: '按分类筛选，例如："编程"、"文案"、"翻译"等',
      required: false,
    } as ToolParameter,
    tags: {
      type: 'array',
      description: '按标签筛选，支持多个标签',
      items: { type: 'string' },
      required: false,
    } as ToolParameter,
    difficulty: {
      type: 'string',
      description: '按难度筛选：beginner、intermediate、advanced',
      required: false,
    } as ToolParameter,
    include_public: {
      type: 'boolean',
      description: '是否包含公开提示词，默认为true',
      required: false,
    } as ToolParameter,
    include_private: {
      type: 'boolean',
      description: '是否包含用户私有提示词，默认为true（需要认证）',
      required: false,
    } as ToolParameter,
    sort_by: {
      type: 'string',
      description: '排序方式：latest（最新）、popular（热门）、name（名称）、relevance（相关性）',
      required: false,
    } as ToolParameter,
    max_results: {
      type: 'number',
      description: '最大返回结果数，默认为10，最大50',
      required: false,
    } as ToolParameter,
    show_preview: {
      type: 'boolean',
      description: '是否显示提示词内容预览，默认为true',
      required: false,
    } as ToolParameter,
    format: {
      type: 'string',
      description: '结果格式：detailed（详细）、summary（摘要）、list（列表）',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 提示词选择工具定义
 */
export const promptSelectionTool: ToolDescription = {
  name: 'select_prompt_by_index',
  description: '根据搜索结果的索引选择特定的提示词，获取完整内容',
  schema_version: 'v1',
  parameters: {
    search_id: {
      type: 'string',
      description: '搜索会话ID（从搜索结果中获取）',
      required: true,
    } as ToolParameter,
    index: {
      type: 'number',
      description: '要选择的提示词索引（从0开始）',
      required: true,
    } as ToolParameter,
    include_versions: {
      type: 'boolean',
      description: '是否包含版本历史信息',
      required: false,
    } as ToolParameter,
    include_usage_stats: {
      type: 'boolean',
      description: '是否包含使用统计信息',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 快速访问工具定义
 */
export const quickAccessTool: ToolDescription = {
  name: 'quick_access_prompts',
  description: '快速访问常用提示词分类和热门提示词',
  schema_version: 'v1',
  parameters: {
    access_type: {
      type: 'string',
      description: '访问类型：categories（分类列表）、popular（热门提示词）、recent（最近使用）、favorites（收藏）',
      required: true,
    } as ToolParameter,
    limit: {
      type: 'number',
      description: '返回数量限制，默认为10',
      required: false,
    } as ToolParameter,
  },
};

// 搜索会话缓存
const searchSessions = new Map<string, {
  results: Prompt[];
  query: any;
  timestamp: number;
}>();

/**
 * 处理增强搜索
 */
export async function handleEnhancedSearch(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const {
      query = '',
      category,
      tags = [],
      difficulty,
      include_public = true,
      include_private = true,
      sort_by = 'relevance',
      max_results = 10,
      show_preview = true,
      format = 'detailed'
    } = params;

    console.log('[增强搜索] 处理搜索请求:', { 
      query, category, tags, userId: userId ? 'authenticated' : 'anonymous' 
    });

    // 构建搜索过滤器
    const filters: PromptFilters = {
      search: query || undefined,
      category: category || undefined,
      tags: tags.length > 0 ? tags : undefined,
      sortBy: sort_by === 'latest' ? 'latest' : 'popular',
      page: 1,
      pageSize: Math.min(max_results, 50),
      userId: (include_private && userId) ? userId : undefined,
      isPublic: include_public ? true : undefined
    };

    // 执行搜索
    let searchResults: Prompt[] = [];
    
    if (query) {
      // 关键词搜索
      const keywordResults = await storage.searchPrompts(query, userId, include_public);
      searchResults.push(...keywordResults);
    }
    
    if (category) {
      // 分类搜索
      const categoryResults = await storage.getPromptsByCategory(category, userId, include_public);
      searchResults.push(...categoryResults);
    }

    if (searchResults.length === 0) {
      // 如果没有特定搜索条件，获取通用结果
      const generalResults = await storage.getPrompts(filters);
      searchResults = generalResults.data;
    }

    // 去重和过滤
    const uniqueResults = Array.from(new Map(searchResults.map(p => [p.id || p.name, p])).values());
    
    // 应用难度过滤
    let filteredResults = uniqueResults;
    if (difficulty) {
      filteredResults = uniqueResults.filter(p => p.difficulty === difficulty);
    }
    
    // 应用标签过滤
    if (tags.length > 0) {
      filteredResults = filteredResults.filter(p => 
        tags.some(tag => p.tags?.includes(tag))
      );
    }

    // 排序
    filteredResults = sortResults(filteredResults, sort_by, query);
    
    // 限制结果数量
    const finalResults = filteredResults.slice(0, max_results);

    // 生成搜索会话ID
    const searchId = generateSearchId();
    searchSessions.set(searchId, {
      results: finalResults,
      query: params,
      timestamp: Date.now()
    });

    // 清理过期会话（保留1小时）
    cleanupExpiredSessions();

    // 格式化结果
    const formattedResults = formatSearchResults(finalResults, format, show_preview, userId);

    const response = {
      success: true,
      searchId: searchId,
      query: {
        keyword: query,
        category: category,
        tags: tags,
        difficulty: difficulty
      },
      filters: {
        includePublic: include_public,
        includePrivate: include_private && !!userId,
        sortBy: sort_by,
        maxResults: max_results
      },
      summary: {
        totalFound: filteredResults.length,
        showing: finalResults.length,
        hasMore: filteredResults.length > max_results,
        userAuthenticated: !!userId
      },
      results: formattedResults,
      instructions: {
        selectPrompt: `使用 select_prompt_by_index 工具选择提示词，参数：{"search_id": "${searchId}", "index": 0}`,
        refineSearch: '修改搜索参数重新搜索',
        quickAccess: '使用 quick_access_prompts 工具快速访问分类和热门内容'
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };

  } catch (error: any) {
    console.error('[增强搜索] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          suggestion: '请检查搜索参数或尝试使用基础搜索功能'
        })
      }]
    };
  }
}

/**
 * 处理提示词选择
 */
export async function handlePromptSelection(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const {
      search_id,
      index,
      include_versions = false,
      include_usage_stats = false
    } = params;

    if (!search_id || index === undefined) {
      throw new Error('缺少必需参数: search_id 和 index');
    }

    // 获取搜索会话
    const session = searchSessions.get(search_id);
    if (!session) {
      throw new Error('搜索会话已过期或不存在，请重新搜索');
    }

    // 验证索引
    if (index < 0 || index >= session.results.length) {
      throw new Error(`无效的索引 ${index}，有效范围：0-${session.results.length - 1}`);
    }

    const selectedPrompt = session.results[index];

    // 获取完整的提示词信息
    const fullPrompt = await storage.getPrompt(selectedPrompt.name, userId);
    if (!fullPrompt) {
      throw new Error('提示词不存在或无权访问');
    }

    // 构建响应
    const response: any = {
      success: true,
      selected: {
        index: index,
        searchId: search_id
      },
      prompt: {
        id: fullPrompt.id,
        name: fullPrompt.name,
        description: fullPrompt.description,
        category: fullPrompt.category,
        tags: fullPrompt.tags,
        messages: fullPrompt.messages,
        version: fullPrompt.version,
        difficulty: fullPrompt.difficulty,
        isPublic: fullPrompt.is_public,
        createdAt: fullPrompt.created_at,
        updatedAt: fullPrompt.updated_at,
        variables: fullPrompt.variables || extractVariables(fullPrompt),
        estimatedTokens: estimateTokens(fullPrompt),
        compatibleModels: fullPrompt.compatible_models || ['llm-large']
      },
      usage: {
        canEdit: fullPrompt.user_id === userId || userId === 'system-user',
        canDelete: fullPrompt.user_id === userId || userId === 'system-user',
        canShare: true,
        canFork: true
      }
    };

    // 添加版本信息
    if (include_versions && fullPrompt.id) {
      try {
        const versions = await storage.getPromptVersions(fullPrompt.id, userId);
        response.versions = versions.map(v => ({
          version: v.version,
          createdAt: v.created_at,
          description: v.description
        }));
      } catch (error) {
        console.warn('获取版本信息失败:', error);
      }
    }

    // 添加使用统计
    if (include_usage_stats) {
      // 这里可以添加使用统计逻辑
      response.stats = {
        views: 0,
        uses: 0,
        likes: 0,
        forks: 0
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };

  } catch (error: any) {
    console.error('[提示词选择] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          suggestion: '请检查搜索ID和索引，或重新执行搜索'
        })
      }]
    };
  }
}

/**
 * 处理快速访问
 */
export async function handleQuickAccess(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const {
      access_type,
      limit = 10
    } = params;

    let response: any = {
      success: true,
      accessType: access_type,
      timestamp: new Date().toISOString()
    };

    switch (access_type) {
      case 'categories':
        const categories = await storage.getCategories();
        response.categories = categories.map(cat => ({
          name: cat,
          searchCommand: `enhanced_search_prompts {"category": "${cat}"}`
        }));
        break;

      case 'popular':
        const popularPrompts = await storage.getPrompts({ 
          sortBy: 'popular', 
          pageSize: limit,
          isPublic: true 
        });
        response.prompts = formatSearchResults(popularPrompts.data, 'summary', true, userId);
        break;

      case 'recent':
        const recentPrompts = await storage.getPrompts({ 
          sortBy: 'latest', 
          pageSize: limit,
          userId: userId,
          isPublic: true 
        });
        response.prompts = formatSearchResults(recentPrompts.data, 'summary', true, userId);
        break;

      case 'favorites':
        // 这里可以实现收藏功能
        response.message = '收藏功能正在开发中';
        response.prompts = [];
        break;

      default:
        throw new Error(`不支持的访问类型: ${access_type}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };

  } catch (error: any) {
    console.error('[快速访问] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message
        })
      }]
    };
  }
}

/**
 * 格式化搜索结果
 */
function formatSearchResults(results: Prompt[], format: string, showPreview: boolean, userId?: string) {
  return results.map((prompt, index) => {
    const base = {
      index: index,
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
      tags: prompt.tags || [],
      isPublic: prompt.is_public,
      isOwner: prompt.user_id === userId,
      version: prompt.version || 1.0,
      difficulty: prompt.difficulty || 'intermediate'
    };

    if (format === 'list') {
      return {
        index: index,
        name: prompt.name,
        category: prompt.category,
        isPublic: prompt.is_public
      };
    }

    if (format === 'summary') {
      return {
        ...base,
        preview: showPreview ? truncateText(getPromptPreview(prompt), 100) : undefined
      };
    }

    // detailed format
    return {
      ...base,
      preview: showPreview ? getPromptPreview(prompt) : undefined,
      estimatedTokens: estimateTokens(prompt),
      variables: extractVariables(prompt),
      createdAt: prompt.created_at,
      updatedAt: prompt.updated_at
    };
  });
}

/**
 * 排序结果
 */
function sortResults(results: Prompt[], sortBy: string, query?: string): Prompt[] {
  switch (sortBy) {
    case 'name':
      return results.sort((a, b) => a.name.localeCompare(b.name));
    
    case 'latest':
      return results.sort((a, b) => 
        new Date(b.updated_at || b.created_at || 0).getTime() - 
        new Date(a.updated_at || a.created_at || 0).getTime()
      );
    
    case 'popular':
      // 这里可以根据使用统计排序，暂时按创建时间
      return results.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    
    case 'relevance':
    default:
      if (query) {
        return results.sort((a, b) => {
          const scoreA = calculateRelevanceScore(a, query);
          const scoreB = calculateRelevanceScore(b, query);
          return scoreB - scoreA;
        });
      }
      return results;
  }
}

/**
 * 计算相关性分数
 */
function calculateRelevanceScore(prompt: Prompt, query: string): number {
  const queryLower = query.toLowerCase();
  let score = 0;

  // 名称匹配
  if (prompt.name.toLowerCase().includes(queryLower)) {
    score += 10;
  }

  // 描述匹配
  if (prompt.description.toLowerCase().includes(queryLower)) {
    score += 5;
  }

  // 标签匹配
  if (prompt.tags?.some(tag => tag.toLowerCase().includes(queryLower))) {
    score += 3;
  }

  // 分类匹配
  if (prompt.category.toLowerCase().includes(queryLower)) {
    score += 2;
  }

  return score;
}

/**
 * 获取提示词预览
 */
function getPromptPreview(prompt: Prompt): string {
  if (prompt.messages && prompt.messages.length > 0) {
    const firstMessage = prompt.messages[0];
    if (firstMessage.content?.text) {
      return firstMessage.content.text;
    }
  }
  return prompt.description;
}

/**
 * 截断文本
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * 提取变量
 */
function extractVariables(prompt: Prompt): string[] {
  const content = getPromptPreview(prompt);
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const variable = match[1].trim();
    if (variable && !variables.includes(variable)) {
      variables.push(variable);
    }
  }
  
  return variables;
}

/**
 * 估算token数
 */
function estimateTokens(prompt: Prompt): number {
  const content = getPromptPreview(prompt);
  return Math.ceil(content.length / 4);
}

/**
 * 生成搜索ID
 */
function generateSearchId(): string {
  return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 清理过期会话
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  const expireTime = 60 * 60 * 1000; // 1小时
  
  for (const [id, session] of searchSessions.entries()) {
    if (now - session.timestamp > expireTime) {
      searchSessions.delete(id);
    }
  }
}