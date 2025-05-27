import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { authenticateRequest, optionalAuthMiddleware, publicAccessMiddleware } from './api/auth-middleware.js';

// 错误码枚举
enum ErrorCode {
  InvalidParams = 1,
  MethodNotFound = 2,
  InternalError = 3,
  Unauthorized = 4
}

// 自定义错误类
class PromptServerError extends Error {
  code: number;
  constructor(message: string, code: ErrorCode) {
    super(message);
    this.code = code;
    this.name = 'PromptServerError';
  }
}

import { config } from './config.js';
import { StorageFactory } from './storage/storage-factory.js';
import { Prompt, PromptVersion, StorageAdapter } from './types.js';
import mcpRouter from './api/mcp-router.js';
import apiKeysRouter from './api/api-keys-router.js';

// 自定义身份验证工具函数
function getAuthValue(request: any, key: string): string {
  // 从查询参数获取值
  if (request.query && request.query[key.toLowerCase()]) {
    return request.query[key.toLowerCase()] as string;
  }
  
  // 从headers获取值
  if (request.headers && request.headers[key.toLowerCase()]) {
    return request.headers[key.toLowerCase()] as string;
  }
  
  // 从Bearer令牌获取API密钥
  if (key.toLowerCase() === 'api_key' && request.headers && request.headers.authorization) {
    const authHeader = request.headers.authorization as string;
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }
  
  return '';
}

export class PromptServer {
  private app: express.Application;
  private server: any;
  private storage: StorageAdapter;
  private port: number;

  constructor() {
    this.storage = StorageFactory.getStorage();
    this.port = config.port || 9010;
    
    // 初始化Express服务器
    this.app = express();
    this.configureServer();
  }

  // 配置Express服务器
  private configureServer(): void {
    // 配置中间件
    this.app.use(cors());
    this.app.use(express.json());
    
    // 配置路由
    this.setupRoutes();
  }
  
  // 设置API路由
  private setupRoutes(): void {
    // API根路径
    this.app.get('/', (req, res) => {
      res.json({ message: 'Welcome to Prompt Server API' });
    });
    
    // 健康检查端点
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        storage: this.storage.getType()
      });
    });

    // 获取分类列表端点
    this.app.get('/api/categories', async (req, res) => {
      try {
        const categories = await this.storage.getCategories();
        res.json({ categories });
      } catch (error) {
        console.error('获取分类失败:', error);
        res.status(500).json({ error: '获取分类失败' });
      }
    });
    
    // 获取标签列表端点
    this.app.get('/api/tags', async (req, res) => {
      try {
        const tags = await this.storage.getTags();
        res.json({ tags });
      } catch (error) {
        console.error('获取标签失败:', error);
        res.status(500).json({ error: '获取标签失败' });
      }
    });

    // API文档端点
    this.app.get('/api/docs', (req, res) => {
      res.json({
        apiVersion: '1.0.0',
        endpoints: [
          { path: '/', method: 'GET', description: 'API欢迎页' },
          { path: '/api/health', method: 'GET', description: '健康检查端点' },
          { path: '/api/docs', method: 'GET', description: 'API文档' },
          { path: '/api/categories', method: 'GET', description: '获取提示词分类列表' },
          { path: '/api/tags', method: 'GET', description: '获取提示词标签列表' },
          { path: '/api/prompts', method: 'GET', description: '获取所有提示词名称' },
          { path: '/api/prompts/:name', method: 'GET', description: '获取特定提示词详情' },
          { path: '/api/prompts', method: 'POST', description: '创建新提示词' },
          { path: '/api/prompts/:name', method: 'PUT', description: '更新现有提示词' },
          { path: '/api/prompts/search/:query', method: 'GET', description: '搜索提示词' },
          { path: '/api/prompts/:name/versions', method: 'GET', description: '获取提示词版本列表' },
          { path: '/api/prompts/:name/versions/:version', method: 'GET', description: '获取特定版本的提示词' },
          { path: '/api/export', method: 'GET', description: '导出提示词' },
          { path: '/api/import', method: 'POST', description: '导入提示词' },
          { path: '/tools', method: 'GET', description: '获取MCP工具列表' },
          { path: '/tools/:name/invoke', method: 'POST', description: '调用MCP工具' },
          { path: '/sse', method: 'GET', description: 'SSE事件流端点' }
        ]
      });
    });
    
    // 获取所有提示词名称
    this.app.get('/api/prompts', optionalAuthMiddleware, async (req, res) => {
      try {
        const result = await this.handleGetPromptNames();
        res.json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
    
    // 搜索提示词 - 注意：这个路由必须放在具体ID路由之前
    this.app.get('/api/prompts/search/:query', optionalAuthMiddleware, async (req, res) => {
      try {
        const query = req.params.query;
        if (!query) {
          throw new PromptServerError("Missing required parameter: query", ErrorCode.InvalidParams);
        }
        const result = await this.handleSearchPrompts(query);
        res.json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
    
    // 导出提示词
    this.app.get('/api/export', authenticateRequest, async (req, res) => {
      try {
        const promptIds = req.query.ids ? (req.query.ids as string).split(',') : undefined;
        const result = await this.handleExportPrompts(promptIds);
        res.json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
    
    // 导入提示词
    this.app.post('/api/import', authenticateRequest, async (req, res) => {
      try {
        const { prompts } = req.body;
        if (!prompts || !Array.isArray(prompts)) {
          throw new PromptServerError("Invalid prompts data", ErrorCode.InvalidParams);
        }
        const result = await this.handleImportPrompts(prompts);
        res.json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
    
    // 获取提示词版本列表
    this.app.get('/api/prompts/:name/versions', optionalAuthMiddleware, async (req, res) => {
      try {
        const name = req.params.name;
        if (!name) {
          throw new PromptServerError("Missing required parameter: name", ErrorCode.InvalidParams);
        }
        const result = await this.handleGetPromptVersions(name);
        res.json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
    
    // 获取提示词特定版本
    this.app.get('/api/prompts/:name/versions/:version', optionalAuthMiddleware, async (req, res) => {
      try {
        const { name, version } = req.params;
        if (!name || !version) {
          throw new PromptServerError("Missing required parameters", ErrorCode.InvalidParams);
        }
        const versionNum = parseInt(version);
        if (isNaN(versionNum)) {
          throw new PromptServerError("Version must be a number", ErrorCode.InvalidParams);
        }
        const result = await this.handleGetPromptVersion(name, versionNum);
        res.json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
    
    // 恢复提示词到特定版本
    this.app.post('/api/prompts/:name/versions/:version/restore', authenticateRequest, async (req, res) => {
      try {
        const { name, version } = req.params;
        if (!name || !version) {
          throw new PromptServerError("Missing required parameters", ErrorCode.InvalidParams);
        }
        const versionNum = parseInt(version);
        if (isNaN(versionNum)) {
          throw new PromptServerError("Version must be a number", ErrorCode.InvalidParams);
        }
        const result = await this.handleRestorePromptVersion(name, versionNum);
        res.json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
    
    // 获取特定提示词详情
    this.app.get('/api/prompts/:name', optionalAuthMiddleware, async (req, res) => {
      try {
        const name = req.params.name;
        if (!name) {
          throw new PromptServerError("Missing required parameter: name", ErrorCode.InvalidParams);
        }
        const result = await this.handleGetPromptDetails(name);
        res.json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
    
    // 创建新提示词
    this.app.post('/api/prompts', authenticateRequest, async (req, res) => {
      try {
        const { name, description, category, tags, messages } = req.body;
        if (!name || typeof name !== 'string' || !description || !messages) {
          throw new PromptServerError("Missing required parameters for create_prompt", ErrorCode.InvalidParams);
        }
        const result = await this.handleCreatePrompt(name, description, category, tags, messages);
        res.json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
    
    // 更新提示词
    this.app.put('/api/prompts/:name', authenticateRequest, async (req, res) => {
      try {
        const name = req.params.name;
        if (!name) {
          throw new PromptServerError("Missing required parameter: name", ErrorCode.InvalidParams);
        }
        const result = await this.handleUpdatePrompt(name, req.body);
        res.json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
    
    // AI提取和优化功能已移除
    
    // API密钥管理路由
    this.app.use('/api/api-keys', apiKeysRouter);
    
    // 获取MCP工具
    this.app.use('/api/mcp', mcpRouter);

    // 获取提示词模板
    this.app.get('/api/template', async (req, res) => {
      try {
        const result = await this.handleGetPromptTemplate();
        res.json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
  }
  
  // 统一错误处理
  private handleError(error: any, res: express.Response): void {
    console.error('API Error:', error);
    
    if (error instanceof PromptServerError) {
      res.status(400).json({
        error: error.message,
        code: error.code
      });
    } else {
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        code: ErrorCode.InternalError
      });
    }
  }



  // 启动服务器
  async start(): Promise<void> {
    try {
      // 创建HTTP服务器
      this.server = createServer(this.app);
      
      // 启动服务器监听
      this.server.listen(this.port, () => {
        console.log(`Prompt Server started on port ${this.port}`);
      });
      
      // 设置错误处理
      this.server.on('error', (err) => {
        console.error('Server error:', err);
        throw err;
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to start server:', error);
      return Promise.reject(error);
    }
  }
  
  // 停止服务器
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server.close((err) => {
          if (err) {
            console.error('Error shutting down server:', err);
            reject(err);
          } else {
            console.log('Server stopped successfully');
            resolve();
          }
        });
      });
    }
    return Promise.resolve();
  }

  private async handleGetPromptNames() {
    const response = await this.storage.getPrompts();
    // 处理分页响应
    const prompts = response.data || [];
    const names = prompts.map(p => p.name);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ names })
        }
      ]
    };
  }

  private async handleGetPromptDetails(name: string) {
    const prompt = await this.storage.getPrompt(name);
    
    if (!prompt) {
      throw new PromptServerError(`Prompt not found: ${name}`, ErrorCode.MethodNotFound);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(prompt)
        }
      ]
    };
  }

  private async handleCreatePrompt(
    name: string,
    description: string,
    category?: string,
    tags?: string[],
    messages?: any[]
  ): Promise<any> {
    // 验证提示词名称
    if (!name || !this.isValidName(name)) {
      throw new PromptServerError(`Invalid prompt name: ${name}`, ErrorCode.InvalidParams);
    }
    
    // 格式化标签
    const formattedTags = (tags || []).map(tag => tag.trim()).filter(Boolean);
    
    // 创建提示词对象
    const prompt: Prompt = {
      name,
      description: description || '',
      category: category || 'General',
      tags: formattedTags,
      messages: messages || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 调用存储适配器创建提示词
    await this.storage.createPrompt(prompt);
    
    return {
      success: true,
      data: { prompt }
    };
  }
  
  // 处理更新提示词请求
  private async handleUpdatePrompt(name: string, updates: Partial<Prompt>): Promise<any> {
    // 验证提示词是否存在
    const existingPrompt = await this.storage.getPrompt(name);
    if (!existingPrompt) {
      throw new PromptServerError(`Prompt not found: ${name}`, ErrorCode.MethodNotFound);
    }
    
    // 格式化标签（如果有更新）
    if (updates.tags) {
      updates.tags = updates.tags.map(tag => tag.trim()).filter(Boolean);
    }
    
    // 添加更新时间
    updates.updated_at = new Date().toISOString();
    
    // 调用存储适配器更新提示词
    await this.storage.updatePrompt(name, updates);
    
    // 获取更新后的提示词
    const updatedPrompt = await this.storage.getPrompt(name);
    
    return {
      success: true,
      data: { prompt: updatedPrompt }
    };
  }

  // 验证提示词名称是否合法
  private isValidName(name: string): boolean {
    // 只允许字母、数字、连字符、下划线和空格
    const nameRegex = /^[a-zA-Z0-9\-_\s]+$/;
    return nameRegex.test(name);
  }

  // 处理搜索提示词请求
  private async handleSearchPrompts(query: string): Promise<any> {
    if (!query) {
      throw new PromptServerError("Search query cannot be empty", ErrorCode.InvalidParams);
    }
    
    // 调用存储适配器搜索提示词
    const prompts = await this.storage.searchPrompts(query);
    
    return {
      success: true,
      data: { prompts }
    };
  }

  // 版本控制相关方法
  private async handleGetPromptVersions(name: string): Promise<any> {
    // 先获取提示词ID
    const prompt = await this.storage.getPrompt(name);
    if (!prompt || !prompt.id) {
      throw new PromptServerError(`Prompt not found: ${name}`, ErrorCode.MethodNotFound);
    }
    
    // 获取版本历史
    const versions = await this.storage.getPromptVersions(prompt.id);
    
    return {
      success: true,
      data: { versions }
    };
  }
  
  private async handleGetPromptVersion(name: string, version: number): Promise<any> {
    // 先获取提示词ID
    const prompt = await this.storage.getPrompt(name);
    if (!prompt || !prompt.id) {
      throw new PromptServerError(`Prompt not found: ${name}`, ErrorCode.MethodNotFound);
    }
    
    // 获取特定版本
    const versionData = await this.storage.getPromptVersion(prompt.id, version);
    if (!versionData) {
      throw new PromptServerError(`Version ${version} not found for prompt: ${name}`, ErrorCode.MethodNotFound);
    }
    
    return {
      success: true,
      data: { version: versionData }
    };
  }
  
  private async handleRestorePromptVersion(name: string, version: number): Promise<any> {
    // 先获取提示词ID
    const prompt = await this.storage.getPrompt(name);
    if (!prompt || !prompt.id) {
      throw new PromptServerError(`Prompt not found: ${name}`, ErrorCode.MethodNotFound);
    }
    
    // 恢复到特定版本
    await this.storage.restorePromptVersion(prompt.id, version);
    
    return {
      success: true,
      message: `Prompt ${name} restored to version ${version}`
    };
  }
  
  // 导入导出相关方法
  private async handleExportPrompts(promptIds?: string[]): Promise<any> {
    // 如果提供了多个ID，则转换为逗号分隔的字符串
    const idParam = promptIds && promptIds.length > 0 ? promptIds.join(',') : undefined;
    const prompts = await this.storage.exportPrompts(idParam);
    
    return {
      success: true,
      data: { prompts }
    };
  }
  
  private async handleImportPrompts(prompts: Prompt[]): Promise<any> {
    const result = await this.storage.importPrompts(prompts);
    
    return {
      success: true,
      data: result
    };
  }

  private async handleGetPromptTemplate() {
    const template = {
      name: 'example_prompt',
      description: '示例提示词描述',
      category: '示例',
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
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(template)
        }
      ]
    };
  }
}
