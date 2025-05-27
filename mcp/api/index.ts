import express from 'express';
import cors from 'cors';
import { config, validateConfig } from '../src/config.js';
import { StorageFactory } from '../src/storage/storage-factory.js';
import { Prompt, ApiResponse, StorageAdapter } from '../src/types.js';
import mcpRouter from '../src/api/mcp-router.js';

const app = express();
const storage: StorageAdapter = StorageFactory.getStorage();

// 中间件
app.use(cors({
  origin: '*', // 允许所有来源
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key', 'Server-Key']
}));
app.use(express.json({ limit: '10mb' }));

// 错误处理中间件
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 认证中间件
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  try {
    // 验证JWT token (这里简化处理，实际应该验证JWT)
    if (token === config.apiKey || token === config.serverKey) {
      next();
    } else {
      res.status(403).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'MCP Prompt Server API is running',
    version: config.mcp.version,
    timestamp: new Date().toISOString(),
    storageType: config.storage.type,
    transportType: process.env.TRANSPORT_TYPE || 'stdio',
  });
});

// 集成MCP路由
app.use('/', mcpRouter);

// 获取所有提示词名称
app.get('/api/prompts/names', asyncHandler(async (req: any, res: any) => {
  const prompts = await storage.getPrompts();
  const names = prompts.data.map(p => p.name);
  
  res.json({
    success: true,
    data: { names }
  });
}));

// 获取提示词详情
app.get('/api/prompts/:name', asyncHandler(async (req: any, res: any) => {
  const { name } = req.params;
  const prompt = await storage.getPrompt(name);
  
  if (!prompt) {
    return res.status(404).json({
      success: false,
      error: `Prompt not found: ${name}`
    });
  }
  
  res.json({
    success: true,
    data: prompt
  });
}));

// 创建提示词
app.post('/api/prompts', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { name, description, category, tags, messages } = req.body;
  
  if (!name || !description || !messages) {
    return res.status(400).json({
      success: false,
      error: 'Name, description, and messages are required'
    });
  }

  const prompt: Prompt = {
    name,
    description,
    category: category || '未分类',
    tags: tags || [],
    messages,
  };

  await storage.createPrompt(prompt);
  
  res.status(201).json({
    success: true,
    message: `Prompt "${name}" created successfully`,
    data: prompt
  });
}));

// 更新提示词
app.put('/api/prompts/:name', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { name } = req.params;
  const promptData = req.body;
  
  const existingPrompt = await storage.getPrompt(name);
  if (!existingPrompt) {
    return res.status(404).json({
      success: false,
      error: `Prompt not found: ${name}`
    });
  }

  await storage.updatePrompt(name, promptData);
  
  res.json({
    success: true,
    message: `Prompt "${name}" updated successfully`
  });
}));

// 删除提示词
app.delete('/api/prompts/:name', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { name } = req.params;
  
  const existingPrompt = await storage.getPrompt(name);
  if (!existingPrompt) {
    return res.status(404).json({
      success: false,
      error: `Prompt not found: ${name}`
    });
  }

  await storage.deletePrompt(name);
  
  res.json({
    success: true,
    message: `Prompt "${name}" deleted successfully`
  });
}));

// 搜索提示词
app.get('/api/prompts/search/:query', asyncHandler(async (req: any, res: any) => {
  const { query } = req.params;
  const prompts = await storage.searchPrompts(query);
  
  res.json({
    success: true,
    data: { prompts }
  });
}));

// AI提取和优化功能已移除

// 获取提示词模板
app.get('/api/template', (req, res) => {
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

  res.json({
    success: true,
    data: template
  });
});

// 用户认证相关路由
app.post('/api/auth/register', asyncHandler(async (req: any, res: any) => {
  const { email, password, displayName } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  try {
    const result = await storage.signUp(email, password, displayName);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    });
  }
}));

app.post('/api/auth/login', asyncHandler(async (req: any, res: any) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  try {
    const result = await storage.signIn(email, password);
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    });
  }
}));

app.post('/api/auth/logout', authenticateToken, asyncHandler(async (req: any, res: any) => {
  try {
    await storage.signOut();
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed'
    });
  }
}));

// 错误处理
app.use((error: any, req: any, res: any, next: any) => {
  console.error('API Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// 服务器初始化
try {
  validateConfig();
  console.log('MCP Prompt Server API initialized');
  console.log('Storage type:', config.storage.type);
  console.log('Transport type:', process.env.TRANSPORT_TYPE || 'stdio');
} catch (error) {
  console.error('Failed to initialize server:', error);
}

// 本地开发环境启动服务器
// 在ES模块中，直接启动服务器
if (process.env.NODE_ENV !== 'production') {
  const port = config.port;
  app.listen(port, () => {
    console.log(`MCP Prompt Server API running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
    console.log('\nAvailable API endpoints:');
    console.log('- GET  /api/health');
    console.log('- GET  /api/prompts/names');
    console.log('- GET  /api/prompts/:name');
    console.log('- POST /api/prompts');
    console.log('- PUT  /api/prompts/:name');
    console.log('- DELETE /api/prompts/:name');
    console.log('- GET  /api/prompts/search/:query');
    console.log('- POST /api/extract');
    console.log('- POST /api/optimize/:name');
    console.log('- GET  /api/template');
    console.log('- POST /api/auth/register');
    console.log('- POST /api/auth/login');
    console.log('- POST /api/auth/logout');
    
    console.log('\nAvailable MCP endpoints:');
    console.log('- GET  /tools');
    console.log('- POST /tools/:name/invoke');
    console.log('- GET  /sse');
  });
}

// 导出为Vercel serverless函数
export default app;
