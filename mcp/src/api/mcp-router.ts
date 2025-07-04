import express from 'express';
import { storage } from '../shared/services.js';
import { 
  ToolDescription, 
  ToolParameter,
  PromptFilters,
  McpArguments
} from '../types.js';

// Context Engineering工具导入
import {
  contextEngineeringToolDef,
  contextStateToolDef,
  contextConfigToolDef,
  contextPipelineToolDef,
  handleContextEngineering,
  handleContextState,
  handleContextConfig,
  handleContextPipeline
} from '../tools/context-engineering/context-engineering-tools.js';

// MCP 路由参数类型定义
interface McpRouterParams extends Record<string, McpArguments> {
  // 通用参数
  name?: string;
  category?: string;
  tags?: string[];
  search?: string;
  query?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  isPublic?: boolean;
  
  // 提示词相关参数
  content?: string;
  description?: string;
  is_public?: boolean;
  allow_collaboration?: boolean;
  
  // 版本相关参数
  version?: number;
  
  // 导入导出参数  
  ids?: string[];
}

// MCP服务器信息内联定义
const getMcpServerInfo = () => ({
  name: 'MCP Prompt Server',
  version: '1.0.0',
  description: 'AI自动提取和添加提示词的MCP服务器',
  protocolVersion: '1.0.0',
  vendor: 'MCP 团队',
  capabilities: [
    'prompt_management',
    'version_control',
    'intelligent_ai_tools',
    'enhanced_search',
    'unified_search_engine',
    'context_engineering'
  ]
});
import { authenticateRequest, optionalAuthMiddleware } from './auth-middleware.js';
import {
  intelligentPromptSelectionToolDef,
  intelligentPromptStorageToolDef,
  externalAIAnalysisToolDef,
  handleIntelligentPromptSelection,
  handleIntelligentPromptStorage,
  handleExternalAIAnalysis
} from '../tools/ui/intelligent-ui.js';
import {
  quickStoreToolDef,
  smartStoreToolDef,
  analyzeAndStoreToolDef,
  handleQuickStore,
  handleSmartStore,
  handleAnalyzeAndStore
} from '../tools/storage/auto-storage.js';
// 导入统一搜索工具
import {
  unifiedSearchToolDef,
  handleUnifiedSearch
} from '../tools/search/unified-search.js';
import {
  unifiedStoreToolDef,
  handleUnifiedStore
} from '../tools/storage/unified-store.js';
import {
  promptOptimizerMCPToolDef,
  handlePromptOptimization
} from '../tools/optimization/prompt-optimizer.js';


// 创建路由器
const router = express.Router();

// MCP服务器信息端点
router.get('/info', (req, res) => {
  const serverInfo = getMcpServerInfo();
  res.json(serverInfo);
});

// SSE连接端点
router.get('/sse', (req, res) => {
  // 设置SSE必要的头信息
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 发送初始化事件
  res.write(`data: ${JSON.stringify({ type: 'connection_established' })}\n\n`);
  
  // 在测试环境中使用更短的心跳间隔
  const heartbeatInterval = process.env.NODE_ENV === 'test' ? 1000 : 30000;
  
  // 保持连接并周期性发送心跳包
  const heartbeat = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
    } catch (e) {
      // 如果写入失败，清理定时器
      clearInterval(heartbeat);
    }
  }, heartbeatInterval);
  
  // 如果是测试环境，在短时间后自动断开连接
  if (process.env.NODE_ENV === 'test') {
    setTimeout(() => {
      res.end();
      clearInterval(heartbeat);
    }, 2000);
  }
  
  // 处理客户端断开连接
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// MCP 工具描述 - 需要认证才能访问完整工具列表
router.get('/tools', authenticateRequest, (req, res) => {
  const tools: ToolDescription[] = [
    // 核心提示词管理工具
    {
      name: 'get_categories',
      description: '获取所有提示词分类',
      schema_version: 'v1',
      parameters: {},
    },
    {
      name: 'get_tags',
      description: '获取所有提示词标签',
      schema_version: 'v1',
      parameters: {},
    },
    {
      name: 'get_prompt_names',
      description: '获取所有可用的提示词名称',
      schema_version: 'v1',
      parameters: {},
    },
    {
      name: 'get_prompt_details',
      description: '获取特定提示词的详细信息',
      schema_version: 'v1',
      parameters: {
        name: {
          type: 'string',
          description: '提示词名称',
          required: true,
        } as ToolParameter,
      },
    },
    {
      name: 'create_prompt',
      description: '创建新的提示词',
      schema_version: 'v1',
      parameters: {
        name: {
          type: 'string',
          description: '提示词名称',
          required: true,
        } as ToolParameter,
        description: {
          type: 'string',
          description: '提示词描述',
          required: true,
        } as ToolParameter,
        category: {
          type: 'string',
          description: '提示词分类',
          required: false,
        } as ToolParameter,
        tags: {
          type: 'array',
          description: '提示词标签',
          required: false,
          items: {
            type: 'string',
          },
        } as ToolParameter,
        content: {
          type: 'string',
          description: '提示词内容',
          required: true,
        } as ToolParameter,
      },
    },
    {
      name: 'update_prompt',
      description: '更新现有提示词',
      schema_version: 'v1',
      parameters: {
        name: {
          type: 'string',
          description: '提示词名称',
          required: true,
        } as ToolParameter,
        description: {
          type: 'string',
          description: '提示词描述',
          required: false,
        } as ToolParameter,
        category: {
          type: 'string',
          description: '提示词分类',
          required: false,
        } as ToolParameter,
        tags: {
          type: 'array',
          description: '提示词标签',
          required: false,
          items: {
            type: 'string',
          },
        } as ToolParameter,
        content: {
          type: 'string',
          description: '提示词内容',
          required: false,
          items: {
            type: 'object',
          },
        } as ToolParameter,
        is_public: {
          type: 'boolean',
          description: '是否公开可见',
          required: false,
        } as ToolParameter,
        allow_collaboration: {
          type: 'boolean',
          description: '是否允许协作编辑',
          required: false,
        } as ToolParameter,
      },
    },
    {
      name: 'search_prompts',
      description: '根据关键词搜索提示词',
      schema_version: 'v1',
      parameters: {
        query: {
          type: 'string',
          description: '搜索关键词',
          required: true,
        } as ToolParameter,
      },
    },
    {
      name: 'get_prompt_versions',
      description: '获取提示词的版本历史',
      schema_version: 'v1',
      parameters: {
        name: {
          type: 'string',
          description: '提示词名称',
          required: true,
        } as ToolParameter,
      },
    },
    {
      name: 'get_prompt_version',
      description: '获取提示词的特定版本',
      schema_version: 'v1',
      parameters: {
        name: {
          type: 'string',
          description: '提示词名称',
          required: true,
        } as ToolParameter,
        version: {
          type: 'number',
          description: '版本号',
          required: true,
        } as ToolParameter,
      },
    },
    {
      name: 'restore_prompt_version',
      description: '将提示词恢复到特定版本',
      schema_version: 'v1',
      parameters: {
        name: {
          type: 'string',
          description: '提示词名称',
          required: true,
        } as ToolParameter,
        version: {
          type: 'number',
          description: '版本号',
          required: true,
        } as ToolParameter,
      },
    },
    {
      name: 'export_prompts',
      description: '导出提示词',
      schema_version: 'v1',
      parameters: {
        ids: {
          type: 'array',
          description: '要导出的提示词 ID 列表，如果不提供则导出所有提示词',
          required: false,
          items: {
            type: 'string',
          },
        } as ToolParameter,
      },
    },
    {
      name: 'import_prompts',
      description: '导入提示词',
      schema_version: 'v1',
      parameters: {
        prompts: {
          type: 'array',
          description: '要导入的提示词数组',
          required: true,
          items: {
            type: 'object',
          },
        } as ToolParameter,
      },
    },
    {
      name: 'get_prompt_template',
      description: '获取提示词模板',
      schema_version: 'v1',
      parameters: {},
    },
    
    // 智能AI工具 - 支持第三方客户端AI分析
    intelligentPromptSelectionToolDef,
    intelligentPromptStorageToolDef,
    externalAIAnalysisToolDef,
    
    // 自动存储工具 - 简化的提示词存储体验
    quickStoreToolDef,
    smartStoreToolDef,
    analyzeAndStoreToolDef,
    
    // 🚀 统一搜索工具 (⭐⭐⭐⭐⭐ 唯一推荐的搜索入口)
    unifiedSearchToolDef,  // 统一搜索 - 语义理解，智能搜索，完美结果展示

    // 🚀 统一存储工具
    unifiedStoreToolDef,     // 统一存储入口 - AI智能分析存储

    // 🎯 提示词优化工具
    promptOptimizerMCPToolDef,  // 提示词优化器 - 为第三方AI客户端提供结构化优化指导

    // 🚀 Context Engineering工具 - 智能上下文处理和个性化
    contextEngineeringToolDef,  // Context Engineering核心工具 - 动态上下文编排和个性化适应
    contextStateToolDef,        // Context Engineering状态查询 - 获取用户上下文状态和会话信息
    contextConfigToolDef,       // Context Engineering配置管理 - 管理用户偏好和适应规则
    contextPipelineToolDef,     // Context Engineering流水线管理 - 配置和管理处理流水线

  ];

  res.json({
    schema_version: 'v1',
    tools,
  });
});





// MCP 工具调用
router.post('/tools/:name/invoke', optionalAuthMiddleware, async (req, res) => {
  try {
    const { name } = req.params;
    // 安全处理请求体，确保params存在
    const params = (req.body && (req.body.params || req.body)) || {};


    // 🔥 记录开始时间用于性能统计
    const _startTime = Date.now();
    
    let result;
    switch (name) {
      case 'get_categories':
        result = await handleGetCategories();
        break;
      case 'get_tags':
        result = await handleGetTags();
        break;
      case 'get_prompt_names':
        result = await handleGetPromptNames(params, req);
        break;
      case 'get_prompt_details':
        result = await handleGetPromptDetails(params, req);
        break;
      case 'create_prompt':
        result = await handleCreatePrompt(params, req);
        break;
      case 'update_prompt':
        result = await handleUpdatePrompt(params, req);
        break;
      case 'delete_prompt':
        result = await handleDeletePrompt(params, req);
        break;
      case 'search_prompts':
        result = await handleSearchPrompts(params, req);
        break;
      case 'get_prompt_versions':
        result = await handleGetPromptVersions(params, req);
        break;
      case 'get_prompt_version':
        result = await handleGetPromptVersion(params, req);
        break;
      case 'restore_prompt_version':
        result = await handleRestorePromptVersion(params, req);
        break;
      case 'export_prompts':
        result = await handleExportPrompts(params, req);
        break;
      case 'import_prompts':
        result = await handleImportPrompts(params, req);
        break;
      case 'get_prompt_template':
        result = await handleGetPromptTemplate();
        break;

      
      // 智能AI工具处理
      case 'intelligent_prompt_selection':
        result = await handleIntelligentPromptSelection(params);
        break;
      case 'intelligent_prompt_storage':
        result = await handleIntelligentPromptStorage(params);
        break;
      case 'analyze_prompt_with_external_ai':
        result = await handleExternalAIAnalysis(params);
        break;
      
      // 自动存储工具处理
      case 'quick_store':
        result = await handleQuickStore(params);
        break;
      case 'smart_store':
        result = await handleSmartStore(params);
        break;
      case 'analyze_and_store':
        result = await handleAnalyzeAndStore(params);
        break;
      
      // 增强搜索和展示工具处理 (通过统一搜索实现)
      case 'enhanced_search_prompts':
        result = await handleUnifiedSearch(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent']
        });
        break;
      case 'select_prompt_by_index':
        result = await handleUnifiedSearch(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent']
        });
        break;
      case 'quick_access_prompts':
        result = await handleUnifiedSearch(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent']
        });
        break;
      
      // 🔍 统一搜索引擎处理 (已弃用，推荐使用unified_search)
      case 'unified_search_engine':
        result = await handleUnifiedSearch(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent']
        });
        break;
      case 'search':
        result = await handleUnifiedSearch(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent']
        });
        break;
      
      // 🚀 统一搜索处理 (唯一推荐的搜索入口)
      case 'unified_search':
        result = await handleUnifiedSearch(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent']
        });
        break;
      
      case 'unified_store':
        result = await handleUnifiedStore(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent']
        });
        break;
      
      // 🎯 智能语义搜索处理 (通过统一搜索实现)
      case 'smart_semantic_search':
        result = await handleUnifiedSearch(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent']
        });
        break;
      
      // 🎯 提示词优化处理
      case 'prompt_optimizer':
        result = await handlePromptOptimization(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent'],
          timestamp: Date.now()
        });
        break;

      // 🚀 Context Engineering工具处理
      case 'context_engineering':
        result = await handleContextEngineering(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent'],
          timestamp: Date.now()
        });
        break;

      case 'context_state':
        result = await handleContextState(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent'],
          timestamp: Date.now()
        });
        break;

      case 'context_config':
        result = await handleContextConfig(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent'],
          timestamp: Date.now()
        });
        break;

      case 'context_pipeline':
        result = await handleContextPipeline(params, {
          userId: req?.user?.id,
          requestId: Array.isArray(req?.headers?.['x-request-id'])
            ? req.headers['x-request-id'][0]
            : req?.headers?.['x-request-id'],
          userAgent: Array.isArray(req?.headers?.['user-agent'])
            ? req.headers['user-agent'][0]
            : req?.headers?.['user-agent'],
          timestamp: Date.now()
        });
        break;

      default:
        throw new Error(`未知工具: ${name}`);
    }



    res.json({
      schema_version: 'v1',
      ...result,
    });
  } catch (error) {
    console.error(`[MCP Router] 工具调用错误:`, error);
    res.status(400).json({
      schema_version: 'v1',
      error: {
        message: error instanceof Error ? error.message : '未知错误',
      },
    });
  }
});

// 处理获取所有提示词名称请求
async function handleGetPromptNames(params: McpRouterParams = {}, req?: express.Request) {
  // 构造过滤条件
  const filters: PromptFilters = {
    category: params.category,
    tags: params.tags,
    search: params.search,
    isPublic: params.isPublic,
    userId: req?.user?.id,
    page: params.page || 1,
    pageSize: params.pageSize || 50
  };

  const result = await storage.getPrompts(filters);
  const names = result.data.map(p => p.name);

  return {
    content: {
      type: 'text',
      text: JSON.stringify({ 
        names, 
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }, null, 2),
    },
  };
}

async function handleGetPromptDetails(params: McpRouterParams, req?: express.Request) {
  if (!params.name) {
    throw new Error('缺少必需参数: name');
  }

  const prompt = await storage.getPrompt(params.name as string, req?.user?.id);
  if (!prompt) {
    throw new Error(`提示词未找到: ${params.name}`);
  }

  return {
    content: {
      type: 'text',
      text: JSON.stringify(prompt, null, 2),
    },
  };
}

// 导出提示词
async function handleExportPrompts(params: McpRouterParams, req?: express.Request) {
  const promptIds = params?.ids;
  const prompts = await storage.exportPrompts(req?.user?.id, promptIds);

  return {
    content: {
      type: 'text',
      text: JSON.stringify({ prompts }, null, 2),
    },
  };
}

// 导入提示词
async function handleImportPrompts(params: McpRouterParams, req?: express.Request) {
  // 处理 prompts 参数，它可能在 params 的任何地方
  const prompts = (params as unknown as { prompts?: unknown[] }).prompts;
  
  if (!prompts || !Array.isArray(prompts)) {
    throw new Error('无效的提示词数据');
  }
  
  // 类型断言：确保 prompts 是正确的类型
  const promptsArray = prompts as unknown[];

  // 这里需要进行类型转换，因为我们不能完全确保输入数据的结构
  const result = await storage.importPrompts(promptsArray as unknown as any[], req?.user?.id);

  return {
    content: {
      type: 'text',
      text: JSON.stringify(result, null, 2),
    },
  };
}

// 获取所有分类
async function handleGetCategories() {
  try {
    const categories = await storage.getCategories();
    return {
      content: {
        type: 'text',
        text: JSON.stringify({ categories }, null, 2),
      },
    };
  } catch (error) {
    console.error('获取分类失败:', error);
    throw new Error('获取分类失败');
  }
}

// 获取所有标签
async function handleGetTags() {
  try {
    const tags = await storage.getTags();
    return {
      content: {
        type: 'text',
        text: JSON.stringify({ tags }, null, 2),
      },
    };
  } catch (error) {
    console.error('获取标签失败:', error);
    throw new Error('获取标签失败');
  }
}

// 搜索提示词
async function handleSearchPrompts(params: McpRouterParams, req?: express.Request) {
  const { query, category, tags, limit = 20 } = params;

  const filters: PromptFilters = {
    search: query,
    category,
    tags,
    isPublic: true,
    userId: req?.user?.id,
    pageSize: limit
  };

  const result = await storage.getPrompts(filters);

  return {
    content: {
      type: 'text',
      text: JSON.stringify(result, null, 2),
    },
  };
}

// 创建提示词
async function handleCreatePrompt(params: McpRouterParams, req?: express.Request) {
  if (!req?.user?.id) {
    throw new Error('需要登录才能创建提示词');
  }

  // 确保必需的字段存在
  if (!params.name || !params.description || !params.content) {
    throw new Error('缺少必需参数: name, description, content');
  }

  const promptData = {
    name: params.name as string,
    description: params.description as string,
    content: params.content as string,
    category: (params.category as string) || '通用',
    tags: (params.tags as string[]) || [],
    is_public: (params.is_public as boolean) || false,
    allow_collaboration: (params.allow_collaboration as boolean) || false,
    user_id: req.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const newPrompt = await storage.createPrompt(promptData);

  return {
    content: {
      type: 'text',
      text: JSON.stringify(newPrompt, null, 2),
    },
  };
}

// 更新提示词
async function handleUpdatePrompt(params: McpRouterParams, req?: express.Request) {
  if (!req?.user?.id) {
    throw new Error('需要登录才能更新提示词');
  }

  if (!params.id && !params.name) {
    throw new Error('缺少必需参数: id 或 name');
  }

  const promptId = (params.id as string) || (params.name as string);
  const updateData = { ...params };
  delete updateData.id;
  delete updateData.name;

  const updatedPrompt = await storage.updatePrompt(promptId, updateData, req.user.id);

  return {
    content: {
      type: 'text',
      text: JSON.stringify(updatedPrompt, null, 2),
    },
  };
}

// 删除提示词
async function handleDeletePrompt(params: McpRouterParams, req?: express.Request) {
  if (!req?.user?.id) {
    throw new Error('需要登录才能删除提示词');
  }

  if (!params.id && !params.name) {
    throw new Error('缺少必需参数: id 或 name');
  }

  const promptId = (params.id as string) || (params.name as string);
  await storage.deletePrompt(promptId, req.user.id);

  return {
    content: {
      type: 'text',
      text: JSON.stringify({ success: true, message: '提示词删除成功' }, null, 2),
    },
  };
}

// 获取提示词版本
async function handleGetPromptVersions(params: McpRouterParams, req?: express.Request) {
  if (!params.name) {
    throw new Error('缺少必需参数: name');
  }

  const versions = await storage.getPromptVersions(params.name as string, req?.user?.id);

  return {
    content: {
      type: 'text',
      text: JSON.stringify({ versions }, null, 2),
    },
  };
}

// 获取特定版本
async function handleGetPromptVersion(params: McpRouterParams, req?: express.Request) {
  if (!params.name || !params.version) {
    throw new Error('缺少必需参数: name, version');
  }

  const prompt = await storage.getPromptVersion(params.name as string, params.version as number, req?.user?.id);

  return {
    content: {
      type: 'text',
      text: JSON.stringify(prompt, null, 2),
    },
  };
}

// 恢复提示词版本
async function handleRestorePromptVersion(params: McpRouterParams, req?: express.Request) {
  if (!params.name || !params.version) {
    throw new Error('缺少必需参数: name, version');
  }

  const prompt = await storage.getPrompt(params.name as string, req?.user?.id);
  if (!prompt) {
    throw new Error(`提示词未找到: ${params.name}`);
  }

  // 检查权限
  if (req?.user?.id && prompt.user_id !== req.user.id) {
    throw new Error(`无权恢复此提示词版本: ${params.name}`);
  }

  // 恢复到特定版本
  const versionNum = typeof params.version === 'string' ? parseFloat(params.version as string) : (params.version as number);
  const _restoredPrompt = await storage.restorePromptVersion(prompt.id!, versionNum, req?.user?.id);

  return {
    content: {
      type: 'text',
      text: `提示词 ${params.name} 已恢复到版本 ${versionNum}`,
    },
  };
}

// 获取提示词模板
async function handleGetPromptTemplate() {
  const template = {
    name: 'example_prompt',
    description: '示例提示词描述',
    category: '通用',  // 默认分类为通用
    tags: ['示例', '模板'],
    content: '你是一个有用的AI助手。请根据用户的需求提供帮助。',
    is_public: true,  // 默认为公开提示词，便于分享和发现
    allow_collaboration: false, // 默认不允许协作编辑，保护创建者权益
    edit_permission: 'owner_only' // 默认仅创建者可编辑
  };

  return {
    content: {
      type: 'text',
      text: JSON.stringify(template, null, 2),
    },
  };
}

export default router;
