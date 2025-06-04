import express from 'express';
import { config } from '../config.js';
import { StorageFactory } from '../storage/storage-factory.js';
import { 
  Prompt, 
  ToolDescription, 
  ToolParameter,
  StorageAdapter,
  PromptFilters
} from '../types.js';
import { performanceTools, performanceToolHandlers } from '../performance/performance-tools.js';
import { getMcpServerInfo } from './mcp-info.js';
import { authenticateRequest, optionalAuthMiddleware } from './auth-middleware.js';

// 创建路由器
const router = express.Router();
const storage: StorageAdapter = StorageFactory.getStorage();

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

// MCP 工具描述
router.get('/tools', optionalAuthMiddleware, (req, res) => {
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
        messages: {
          type: 'array',
          description: '提示词消息',
          required: true,
          items: {
            type: 'object',
          },
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
        messages: {
          type: 'array',
          description: '提示词消息',
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
    
    // 性能分析工具
    {
      name: 'track_prompt_usage',
      description: '记录提示词使用数据',
      schema_version: 'v1',
      parameters: {
        prompt_id: {
          type: 'string',
          description: '提示词ID',
          required: true,
        } as ToolParameter,
        prompt_version: {
          type: 'number',
          description: '提示词版本',
          required: false,
        } as ToolParameter,
        input_tokens: {
          type: 'number',
          description: '输入令牌数',
          required: true,
        } as ToolParameter,
        output_tokens: {
          type: 'number',
          description: '输出令牌数',
          required: true,
        } as ToolParameter,
        total_tokens: {
          type: 'number',
          description: '总令牌数',
          required: true,
        } as ToolParameter,
        latency_ms: {
          type: 'number',
          description: '延迟时间（毫秒）',
          required: true,
        } as ToolParameter,
        user_id: {
          type: 'string',
          description: '用户ID',
          required: false,
        } as ToolParameter,
        session_id: {
          type: 'string',
          description: '会话ID',
          required: false,
        } as ToolParameter,
        metadata: {
          type: 'object',
          description: '额外元数据',
          required: false,
        } as ToolParameter,
      },
    },
    {
      name: 'submit_prompt_feedback',
      description: '提交提示词反馈',
      schema_version: 'v1',
      parameters: {
        usage_id: {
          type: 'string',
          description: '使用记录ID',
          required: true,
        } as ToolParameter,
        rating: {
          type: 'number',
          description: '评分（1-5）',
          required: true,
        } as ToolParameter,
        comments: {
          type: 'string',
          description: '评论',
          required: false,
        } as ToolParameter,
        user_id: {
          type: 'string',
          description: '用户ID',
          required: false,
        } as ToolParameter,
      },
    },
    {
      name: 'get_prompt_performance',
      description: '获取提示词性能数据',
      schema_version: 'v1',
      parameters: {
        prompt_id: {
          type: 'string',
          description: '提示词ID',
          required: true,
        } as ToolParameter,
        version: {
          type: 'number',
          description: '提示词版本',
          required: false,
        } as ToolParameter,
      },
    },
    {
      name: 'generate_performance_report',
      description: '生成提示词性能报告',
      schema_version: 'v1',
      parameters: {
        prompt_id: {
          type: 'string',
          description: '提示词ID',
          required: true,
        } as ToolParameter,
      },
    },
    {
      name: 'create_ab_test',
      description: '创建A/B测试',
      schema_version: 'v1',
      parameters: {
        name: {
          type: 'string',
          description: '测试名称',
          required: true,
        } as ToolParameter,
        description: {
          type: 'string',
          description: '测试描述',
          required: false,
        } as ToolParameter,
        prompt_a: {
          type: 'string',
          description: '提示词A的ID',
          required: true,
        } as ToolParameter,
        prompt_b: {
          type: 'string',
          description: '提示词B的ID',
          required: true,
        } as ToolParameter,
        version_a: {
          type: 'number',
          description: '提示词A的版本',
          required: false,
        } as ToolParameter,
        version_b: {
          type: 'number',
          description: '提示词B的版本',
          required: false,
        } as ToolParameter,
        traffic_split: {
          type: 'number',
          description: '流量分配比例（0-1）',
          required: false,
        } as ToolParameter,
      },
    },
    {
      name: 'get_ab_test_results',
      description: '获取A/B测试结果',
      schema_version: 'v1',
      parameters: {
        test_id: {
          type: 'string',
          description: '测试ID',
          required: true,
        } as ToolParameter,
      },
    },
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

    console.log(`[MCP Router] 调用工具: ${name}`, params);

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
      case 'track_prompt_usage':
        result = await performanceToolHandlers.track_prompt_usage(params, req);
        break;
      case 'submit_prompt_feedback':
        result = await performanceToolHandlers.submit_prompt_feedback(params, req);
        break;
      case 'get_prompt_performance':
        result = await performanceToolHandlers.get_prompt_performance(params, req);
        break;
      case 'generate_performance_report':
        result = await performanceToolHandlers.get_performance_report(params);
        break;
      case 'create_ab_test':
        result = await performanceToolHandlers.create_ab_test(params, req);
        break;
      case 'get_ab_test_results':
        result = await performanceToolHandlers.get_ab_test_results(params, req);
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
async function handleGetPromptNames(params: any = {}, req?: express.Request) {
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

async function handleGetPromptDetails(params: any, req?: express.Request) {
  if (!params.name) {
    throw new Error('缺少必需参数: name');
  }

  const prompt = await storage.getPrompt(params.name, req?.user?.id);
  if (!prompt) {
    throw new Error(`提示词未找到: ${params.name}`);
  }

  // 检查权限
  if (req?.user?.id && prompt.user_id !== req.user.id && req.user.id !== 'system-user') {
    throw new Error(`无权访问此提示词: ${params.name}`);
  }

  return {
    content: {
      type: 'text',
      text: JSON.stringify(prompt, null, 2),
    },
  };
}

async function handleCreatePrompt(params: any, req?: express.Request) {
  const { name, description, category, tags, messages } = params;
  
  if (!name || !description || !messages) {
    throw new Error('缺少必需参数: name, description, messages');
  }

  const prompt: Prompt = {
    name,
    description,
    category: category || '未分类',
    tags: tags || [],
    messages,
    user_id: req?.user?.id,
  };

  await storage.createPrompt(prompt);

  return {
    content: {
      type: 'text',
      text: `提示词 "${name}" 创建成功`,
    },
  };
}

// 处理更新提示词请求
async function handleUpdatePrompt(params: any, req?: express.Request) {
  if (!params.name) {
    throw new Error('缺少必需参数: name');
  }

  // 获取当前提示词信息检查权限
  const existingPrompt = await storage.getPrompt(params.name, req?.user?.id);
  if (!existingPrompt) {
    throw new Error(`提示词未找到: ${params.name}`);
  }

  // 检查权限
  if (req?.user?.id && existingPrompt.user_id !== req.user.id && req.user.id !== 'system-user') {
    throw new Error(`无权更新此提示词: ${params.name}`);
  }

  // 构建部分更新对象
  const updateData: Partial<Prompt> = {};
  if (params.name) updateData.name = params.name;
  if (params.description) updateData.description = params.description;
  if (params.category) updateData.category = params.category;
  if (params.tags) updateData.tags = params.tags;
  if (params.messages) updateData.messages = params.messages;
  if (params.is_public !== undefined) updateData.is_public = params.is_public;

  const updatedPrompt = await storage.updatePrompt(params.name, updateData, req?.user?.id);

  return {
    content: {
      type: 'text',
      text: JSON.stringify(updatedPrompt, null, 2),
    },
  };
}

// 处理删除提示词请求
async function handleDeletePrompt(params: any, req?: express.Request) {
  if (!params.name) {
    throw new Error('缺少必需参数: name');
  }

  // 获取当前提示词信息检查权限
  const existingPrompt = await storage.getPrompt(params.name, req?.user?.id);
  if (!existingPrompt) {
    throw new Error(`提示词未找到: ${params.name}`);
  }

  // 检查权限
  if (req?.user?.id && existingPrompt.user_id !== req.user.id && req.user.id !== 'system-user') {
    throw new Error(`无权删除此提示词: ${params.name}`);
  }

  await storage.deletePrompt(params.name, req?.user?.id);

  return {
    content: {
      type: 'text',
      text: `提示词 "${params.name}" 删除成功`,
    },
  };
}

// 处理搜索提示词请求
async function handleSearchPrompts(params: any, req?: express.Request) {
  if (!params.query) {
    throw new Error('缺少必需参数: query');
  }

  // 默认包含公开提示词
  const includePublic = params.includePublic !== false;
  const prompts = await storage.searchPrompts(params.query, req?.user?.id, includePublic);

  return {
    content: {
      type: 'text',
      text: JSON.stringify({ prompts }, null, 2),
    },
  };
}

// 获取提示词版本历史
async function handleGetPromptVersions(params: any, req?: express.Request) {
  if (!params.name) {
    throw new Error('缺少必需参数: name');
  }

  // 先获取提示词ID
  const prompt = await storage.getPrompt(params.name, req?.user?.id);
  if (!prompt || !prompt.id) {
    throw new Error(`提示词未找到: ${params.name}`);
  }

  // 检查权限
  if (!prompt.is_public && prompt.user_id !== req?.user?.id && req?.user?.id !== 'system-user') {
    throw new Error(`无权访问此提示词版本: ${params.name}`);
  }

  // 获取版本历史
  const versions = await storage.getPromptVersions(prompt.id, req?.user?.id);

  return {
    content: {
      type: 'text',
      text: JSON.stringify({ versions }, null, 2),
    },
  };
}

// 获取提示词特定版本
async function handleGetPromptVersion(params: any, req?: express.Request) {
  if (!params.name || params.version === undefined) {
    throw new Error('缺少必需参数: name 或 version');
  }

  // 先获取提示词ID
  const prompt = await storage.getPrompt(params.name, req?.user?.id);
  if (!prompt || !prompt.id) {
    throw new Error(`提示词未找到: ${params.name}`);
  }

  // 检查权限
  if (!prompt.is_public && prompt.user_id !== req?.user?.id && req?.user?.id !== 'system-user') {
    throw new Error(`无权访问此提示词版本: ${params.name}`);
  }

  // 获取特定版本
  const versionNum = typeof params.version === 'string' ? parseInt(params.version) : params.version;
  const versionData = await storage.getPromptVersion(prompt.id, versionNum, req?.user?.id);
  if (!versionData) {
    throw new Error(`版本 ${versionNum} 未找到: ${params.name}`);
  }

  return {
    content: {
      type: 'text',
      text: JSON.stringify(versionData, null, 2),
    },
  };
}

// 恢复提示词到特定版本
async function handleRestorePromptVersion(params: any, req?: express.Request) {
  if (!params.name || params.version === undefined) {
    throw new Error('缺少必需参数: name 或 version');
  }

  // 先获取提示词ID
  const prompt = await storage.getPrompt(params.name, req?.user?.id);
  if (!prompt || !prompt.id) {
    throw new Error(`提示词未找到: ${params.name}`);
  }

  // 检查权限
  if (req?.user?.id && prompt.user_id !== req.user.id && req.user.id !== 'system-user') {
    throw new Error(`无权恢复此提示词版本: ${params.name}`);
  }

  // 恢复到特定版本
  const versionNum = typeof params.version === 'string' ? parseInt(params.version) : params.version;
  const restoredPrompt = await storage.restorePromptVersion(prompt.id, versionNum, req?.user?.id);

  return {
    content: {
      type: 'text',
      text: `提示词 ${params.name} 已恢复到版本 ${versionNum}`,
    },
  };
}

// 导出提示词
async function handleExportPrompts(params: any, req?: express.Request) {
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
async function handleImportPrompts(params: any, req?: express.Request) {
  if (!params.prompts || !Array.isArray(params.prompts)) {
    throw new Error('无效的提示词数据');
  }

  const result = await storage.importPrompts(params.prompts, req?.user?.id);

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

// 获取提示词模板
async function handleGetPromptTemplate() {
  const template = {
    name: 'example_prompt',
    description: '示例提示词描述',
    category: '通用',  // 默认分类为通用
    tags: ['示例', '模板'],
    messages: [
      {
        role: 'system',
        content: {
          type: 'text',
          text: '你是一个有用的AI助手。请根据用户的需求提供帮助。',
        },
      },
    ],
    is_public: false  // 默认为私有提示词
  };
  
  return {
    content: {
      type: 'text',
      text: JSON.stringify(template, null, 2),
    },
  };
}

export default router;
