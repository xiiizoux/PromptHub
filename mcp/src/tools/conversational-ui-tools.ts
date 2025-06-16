/**
 * 对话界面优化工具
 * 专为第三方AI客户端对话窗口设计的简洁高效呈现方式
 */

import { StorageFactory } from '../storage/storage-factory.js';
import { ToolDescription, ToolParameter, MCPToolResponse, Prompt } from '../types.js';

const storage = StorageFactory.getStorage();

/**
 * 简洁搜索工具 - 优化对话界面呈现
 */
export const conversationalSearchTool: ToolDescription = {
  name: 'search',
  description: '🔍 智能搜索提示词 - 简洁对话界面，快速选择使用',
  schema_version: 'v1',
  parameters: {
    query: {
      type: 'string',
      description: '搜索需求，例如："写道歉邮件"、"分析代码"、"创意文案"',
      required: true,
    } as ToolParameter,
    mode: {
      type: 'string',
      description: '展示模式：quick（快速3个）、normal（常规5个）、detailed（详细8个）',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 直接使用工具 - 一步到位
 */
export const directUseTool: ToolDescription = {
  name: 'use',
  description: '📋 直接使用提示词 - 输入编号或名称，立即获得可用格式',
  schema_version: 'v1',
  parameters: {
    selection: {
      type: 'string',
      description: '选择方式：编号(1-8)、提示词名称、或ID',
      required: true,
    } as ToolParameter,
    vars: {
      type: 'object',
      description: '变量值，例如：{"name":"张三","topic":"项目进度"}',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 快速浏览工具 - 发现更多
 */
export const browseTool: ToolDescription = {
  name: 'browse',
  description: '👀 浏览提示词 - 按分类或热度快速发现',
  schema_version: 'v1',
  parameters: {
    type: {
      type: 'string',
      description: '浏览类型：hot（热门）、new（最新）、business（商务）、tech（技术）、creative（创意）',
      required: false,
    } as ToolParameter,
  },
};

// 缓存最近的搜索结果，供用户选择使用
const recentSearchCache = new Map<string, {
  results: any[];
  timestamp: number;
  query: string;
}>();

/**
 * 处理对话式搜索
 */
export async function handleConversationalSearch(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const { query, mode = 'normal' } = params;
    
    // 执行搜索
    const searchResults = await performOptimizedSearch(query, userId);
    
    // 根据模式限制结果数量
    const limitedResults = limitResultsByMode(searchResults, mode);
    
    // 缓存结果供后续使用
    const sessionId = generateSessionId();
    cacheSearchResults(sessionId, limitedResults, query);
    
    // 生成对话友好的响应
    const response = formatConversationalResponse(limitedResults, query, mode, sessionId);
    
    return {
      content: [{
        type: 'text',
        text: response
      }]
    };

  } catch (error) {
    console.error('[对话搜索] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '🔍 搜索遇到问题，请尝试更简单的关键词'
      }]
    };
  }
}

/**
 * 处理直接使用
 */
export async function handleDirectUse(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const { selection, vars = {} } = params;
    
    // 解析用户选择
    const prompt = await resolveUserSelection(selection, userId);
    
    if (!prompt) {
      return {
        content: [{
          type: 'text',
          text: '❌ 未找到该提示词，请检查编号或名称\n💡 可以重新搜索：search("你的需求")'
        }]
      };
    }

    // 生成可直接使用的格式
    const readyFormat = generateDirectUseFormat(prompt, vars);
    
    return {
      content: [{
        type: 'text',
        text: readyFormat
      }]
    };

  } catch (error) {
    console.error('[直接使用] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '❌ 获取失败，请重试'
      }]
    };
  }
}

/**
 * 处理快速浏览
 */
export async function handleBrowse(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const { type = 'hot' } = params;
    
    const browseResults = await getBrowseContent(type, userId);
    const response = formatBrowseResponse(browseResults, type);
    
    return {
      content: [{
        type: 'text',
        text: response
      }]
    };

  } catch (error) {
    console.error('[快速浏览] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '❌ 浏览失败，请重试'
      }]
    };
  }
}

// ==================== 优化算法 ====================

/**
 * 优化搜索算法
 */
async function performOptimizedSearch(query: string, userId?: string) {
  // 简化的搜索逻辑，专注于准确性
  const results = await storage.searchPrompts(query, userId);
  
  // 按相关性和实用性排序
  return results
    .map(prompt => ({
      ...prompt,
      score: calculateSimpleScore(prompt, query)
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * 简化评分算法
 */
function calculateSimpleScore(prompt: Prompt, query: string): number {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // 名称匹配 40%
  if (prompt.name.toLowerCase().includes(queryLower)) score += 0.4;
  
  // 描述匹配 30%
  if (prompt.description?.toLowerCase().includes(queryLower)) score += 0.3;
  
  // 标签匹配 20%
  if (prompt.tags?.some(tag => tag.toLowerCase().includes(queryLower))) score += 0.2;
  
  // 热度加分 10%
  if (prompt.usage_count && prompt.usage_count > 10) score += 0.1;
  
  return score;
}

/**
 * 根据模式限制结果
 */
function limitResultsByMode(results: any[], mode: string): any[] {
  const limits = {
    'quick': 3,
    'normal': 5,
    'detailed': 8
  };
  
  return results.slice(0, limits[mode as keyof typeof limits] || 5);
}

/**
 * 生成对话友好的响应格式
 */
function formatConversationalResponse(results: any[], query: string, mode: string, sessionId: string): string {
  if (results.length === 0) {
    return `🔍 "${query}" 没找到匹配结果\n\n` +
           `💡 试试这些:\n` +
           `• browse("hot") - 看看热门的\n` +
           `• search("更简单的关键词")\n` +
           `• browse("business") - 浏览商务类`;
  }

  let response = `🎯 找到 ${results.length} 个匹配的提示词:\n\n`;
  
  results.forEach((result, index) => {
    const num = index + 1;
    const matchPercent = Math.round(result.score * 100);
    
    response += `${num}. **${result.name}** (${matchPercent}%匹配)\n`;
    response += `   ${getTruncatedDescription(result.description, 50)}\n`;
    
    // 显示主要标签
    if (result.tags?.length) {
      const mainTags = result.tags.slice(0, 3).join(' · ');
      response += `   🏷️ ${mainTags}\n`;
    }
    response += '\n';
  });

  // 简化的使用说明
  response += `💡 选择使用:\n`;
  response += `• use("1") - 使用第1个\n`;
  response += `• use("${results[0].name}") - 使用"${results[0].name}"\n`;
  
  if (mode === 'quick') {
    response += `• search("${query}", "normal") - 查看更多结果`;
  }

  return response;
}

/**
 * 生成直接可用的格式
 */
function generateDirectUseFormat(prompt: Prompt, vars: any): string {
  let content = prompt.content || '';
  
  // 处理变量替换
  if (Object.keys(vars).length > 0) {
    content = replaceVariables(content, vars);
  }

  // 超简洁格式
  let response = `📋 **${prompt.name}** - 可直接复制使用\n\n`;
  response += `${'─'.repeat(40)}\n`;
  response += content;
  response += `\n${'─'.repeat(40)}\n\n`;
  
  // 简化的提示信息
  if (prompt.variables?.length && Object.keys(vars).length === 0) {
    response += `🔧 支持自定义变量: ${prompt.variables.map(v => v.name).join(', ')}\n`;
    response += `💡 示例: use("${prompt.name}", {"${prompt.variables[0].name}": "你的值"})\n`;
  }
  
  response += `\n✅ 直接复制上面的内容到AI对话框即可使用`;
  
  return response;
}

/**
 * 解析用户选择
 */
async function resolveUserSelection(selection: string, userId?: string): Promise<Prompt | null> {
  // 如果是数字，从缓存中获取
  if (/^\d+$/.test(selection)) {
    const index = parseInt(selection) - 1;
    const cached = getLatestCachedResults();
    if (cached && cached.results[index]) {
      return cached.results[index];
    }
  }
  
  // 否则按名称或ID搜索
  try {
    let prompt = await storage.getPrompt(selection, userId);
    if (prompt) return prompt;
    
    const searchResults = await storage.searchPrompts(selection, userId);
    return searchResults.find(p => p.name === selection) || searchResults[0] || null;
  } catch (error) {
    console.error('解析选择失败:', error);
    return null;
  }
}

/**
 * 获取浏览内容
 */
async function getBrowseContent(type: string, userId?: string) {
  switch (type) {
    case 'hot':
      const hot = await storage.getPrompts({ sortBy: 'popular', pageSize: 6, isPublic: true });
      return hot.data;
    
    case 'new':
      const latest = await storage.getPrompts({ sortBy: 'latest', pageSize: 6, isPublic: true });
      return latest.data;
    
    case 'business':
      return await storage.getPromptsByCategory('商业', userId, true, 6);
    
    case 'tech':
      return await storage.getPromptsByCategory('技术', userId, true, 6);
    
    case 'creative':
      return await storage.getPromptsByCategory('创意', userId, true, 6);
    
    default:
      const trending = await storage.getPrompts({ sortBy: 'popular', pageSize: 6, isPublic: true });
      return trending.data;
  }
}

/**
 * 格式化浏览响应
 */
function formatBrowseResponse(results: any[], type: string): string {
  const typeNames: any = {
    'hot': '🔥 热门',
    'new': '✨ 最新',
    'business': '💼 商务',
    'tech': '💻 技术',
    'creative': '🎨 创意'
  };

  let response = `${typeNames[type] || '📂 推荐'} 提示词:\n\n`;
  
  results.forEach((result, index) => {
    const num = index + 1;
    response += `${num}. **${result.name}**\n`;
    response += `   ${getTruncatedDescription(result.description, 60)}\n\n`;
  });

  response += `💡 使用方法:\n`;
  response += `• use("1") - 直接使用第1个\n`;
  response += `• search("关键词") - 精确搜索`;

  return response;
}

// ==================== 辅助函数 ====================

function getTruncatedDescription(desc: string | undefined, maxLength: number): string {
  if (!desc) return '暂无描述';
  return desc.length > maxLength ? desc.substring(0, maxLength) + '...' : desc;
}

function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function cacheSearchResults(sessionId: string, results: any[], query: string) {
  recentSearchCache.set('latest', {
    results,
    timestamp: Date.now(),
    query
  });
  
  // 清理过期缓存
  setTimeout(() => {
    recentSearchCache.delete(sessionId);
  }, 10 * 60 * 1000); // 10分钟过期
}

function getLatestCachedResults() {
  return recentSearchCache.get('latest');
}

function replaceVariables(content: string, variables: any): string {
  let result = content;
  
  Object.entries(variables).forEach(([key, value]) => {
    const patterns = [
      new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
      new RegExp(`\\$\\{${key}\\}`, 'g'),
      new RegExp(`\\[${key}\\]`, 'g'),
      new RegExp(`{${key}}`, 'g')
    ];
    
    patterns.forEach(pattern => {
      result = result.replace(pattern, String(value));
    });
  });
  
  return result;
} 