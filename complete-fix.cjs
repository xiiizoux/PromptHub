const fs = require('fs');
const path = require('path');

// 源目录
const SRC_DIR = '/app/mcp/dist/src';

// 重写config.js文件
function rewriteConfigFile() {
  const filePath = path.join(SRC_DIR, 'config.js');
  console.log(`重写文件: ${filePath}`);
  
  try {
    // 创建备份
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, `${filePath}.bak`);
    }
    
    // 完全重写文件内容
    const newContent = `
// 应用配置
const defaultConfig = {
  port: 9010,
  defaultApiKey: 'default-api-key-for-docker',
  validApiKeys: ['default-api-key-for-docker'],
  storage: {
    type: process.env.STORAGE_TYPE || 'supabase',
    supabase: {
      url: process.env.SUPABASE_URL || 'http://localhost:54321',
      anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU'
    },
    local: {
      dataDir: process.env.DATA_DIR || './data'
    }
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-for-development-only',
    cookieName: 'prompthub_session'
  },
  cors: {
    allowOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*']
  }
};

// 获取参数值，支持环境变量覆盖
function getParamValue(name) {
  const envName = 'MCP_' + name.toUpperCase();
  return process.env[envName] || defaultConfig[name];
}

// 导出配置
export const config = {
  ...defaultConfig,
  // 允许环境变量覆盖
  port: process.env.PORT || defaultConfig.port,
  defaultApiKey: process.env.API_KEY || defaultConfig.defaultApiKey,
  validApiKeys: process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : defaultConfig.validApiKeys
};
`;
    
    fs.writeFileSync(filePath, newContent);
    console.log(`已重写 ${filePath}`);
    return true;
  } catch (error) {
    console.error(`重写 ${filePath} 失败:`, error);
    return false;
  }
}

// 重写auth-middleware.js文件
function rewriteAuthMiddlewareFile() {
  const filePath = path.join(SRC_DIR, 'api', 'auth-middleware.js');
  console.log(`重写文件: ${filePath}`);
  
  try {
    // 创建备份
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, `${filePath}.bak`);
    }
    
    // 完全重写文件内容
    const newContent = `
import { config } from '../config.js';

// 常量
const API_KEY_HEADER = 'x-api-key';
const AUTH_ERROR = { error: 'Unauthorized', message: 'Invalid or missing API key' };
const AUTH_ERROR_STATUS = 401;

// 验证API密钥
function validateApiKey(apiKey) {
  if (!apiKey) return false;
  
  // 在开发或测试模式下接受默认API密钥
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    const defaultApiKey = process.env.API_KEY || config.defaultApiKey;
    if (apiKey === defaultApiKey) return true;
  }
  
  // 检查有效的API密钥
  return config.validApiKeys.includes(apiKey);
}

// 身份验证中间件 - 需要有效的API密钥
export function authenticateRequest(req, res, next) {
  const apiKey = req.headers[API_KEY_HEADER] || req.query.apiKey;
  
  if (!validateApiKey(apiKey)) {
    return res.status(AUTH_ERROR_STATUS).json(AUTH_ERROR);
  }
  
  // 将API密钥添加到请求对象中以供后续使用
  req.apiKey = apiKey;
  next();
}

// 可选身份验证中间件 - 如果提供，验证API密钥，但允许无API密钥的请求
export function optionalAuthMiddleware(req, res, next) {
  const apiKey = req.headers[API_KEY_HEADER] || req.query.apiKey;
  
  if (apiKey) {
    if (validateApiKey(apiKey)) {
      req.apiKey = apiKey;
      req.authenticated = true;
    } else {
      req.authenticated = false;
    }
  } else {
    req.authenticated = false;
  }
  
  next();
}

// 公共访问中间件 - 允许所有请求
export function publicAccessMiddleware(req, res, next) {
  const apiKey = req.headers[API_KEY_HEADER] || req.query.apiKey;
  
  if (apiKey) {
    if (validateApiKey(apiKey)) {
      req.apiKey = apiKey;
      req.authenticated = true;
    } else {
      req.authenticated = false;
    }
  } else {
    req.authenticated = false;
  }
  
  next();
}
`;
    
    fs.writeFileSync(filePath, newContent);
    console.log(`已重写 ${filePath}`);
    return true;
  } catch (error) {
    console.error(`重写 ${filePath} 失败:`, error);
    return false;
  }
}

// 重写mcp-server.js文件
function rewriteMcpServerFile() {
  const filePath = path.join(SRC_DIR, 'mcp-server.js');
  console.log(`重写文件: ${filePath}`);
  
  try {
    // 创建备份
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, `${filePath}.bak`);
    }
    
    // 完全重写文件内容
    const newContent = `
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { authenticateRequest, optionalAuthMiddleware, publicAccessMiddleware } from './api/auth-middleware.js';

// 错误码常量
const ErrorCode = {
  InvalidParams: 1,
  MethodNotFound: 2,
  InternalError: 3,
  Unauthorized: 4
};

// 自定义错误类
class PromptServerError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = 'PromptServerError';
  }
}

import { config } from './config.js';
import { StorageFactory } from './storage/storage-factory.js';
import mcpRouter from './api/mcp-router.js';
import apiKeysRouter from './api/api-keys-router.js';
import notificationRouter from './api/notification-router.js';
import socialRouter from './api/social-router.js';

// 提取请求中的授权值
function getAuthValue(request, key) {
  // 检查请求头
  if (request.headers && request.headers[key.toLowerCase()]) {
    return request.headers[key.toLowerCase()];
  }
  
  // 检查查询参数
  if (request.query && request.query[key]) {
    return request.query[key];
  }
  
  // 如果都没找到，返回null
  return null;
}

// MCP Server类
class MCPServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.port = process.env.PORT || config.port || 9010;
    this.storage = null;
  }
  
  // 配置服务器
  configureServer() {
    // 配置CORS
    this.app.use(cors());
    
    // 配置JSON解析
    this.app.use(express.json());
    
    // 记录请求
    this.app.use((req, res, next) => {
      console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
      next();
    });
    
    // 健康检查路由
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString()
      });
    });
    
    // 基本API路由
    this.app.get('/api', (req, res) => {
      res.json({ message: "Welcome to Prompt Server API" });
    });
    
    // 分类API路由
    this.app.get('/api/categories', publicAccessMiddleware, async (req, res) => {
      try {
        const categories = await this.storage.getCategories();
        res.json({ categories });
      } catch (error) {
        console.error('获取分类失败:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
      }
    });
    
    // 标签API路由
    this.app.get('/api/tags', publicAccessMiddleware, async (req, res) => {
      try {
        const tags = await this.storage.getTags();
        res.json({ tags });
      } catch (error) {
        console.error('获取标签失败:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
      }
    });
    
    // MCP路由
    this.app.use('/api/mcp', mcpRouter);
    
    // API密钥路由
    this.app.use('/api/keys', authenticateRequest, apiKeysRouter);
    
    // 通知路由
    this.app.use('/api/notifications', authenticateRequest, notificationRouter);
    
    // 社交路由
    this.app.use('/api/social', optionalAuthMiddleware, socialRouter);
    
    // 处理404
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: \`Route \${req.method} \${req.path} not found\`
      });
    });
    
    // 错误处理中间件
    this.app.use((err, req, res, next) => {
      console.error('服务器错误:', err);
      
      // 处理自定义错误
      if (err instanceof PromptServerError) {
        return res.status(400).json({
          error: err.message,
          code: err.code
        });
      }
      
      // 处理其他错误
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
      });
    });
  }
  
  // 启动服务器
  async start() {
    try {
      // 初始化存储
      this.storage = await StorageFactory.createStorage();
      
      // 配置服务器
      this.configureServer();
      
      // 创建HTTP服务器
      this.server = createServer(this.app);
      
      // 启动服务器
      return new Promise((resolve) => {
        this.server.listen(this.port, () => {
          console.log(\`MCP服务器已启动，监听端口 \${this.port}\`);
          resolve();
        });
      });
    } catch (error) {
      console.error('启动服务器失败:', error);
      throw error;
    }
  }
  
  // 停止服务器
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('MCP服务器已停止');
          resolve();
        });
      });
    }
  }
}

// 导出启动MCP服务器的函数
export async function startMCPServer() {
  const server = new MCPServer();
  await server.start();
  return server;
}
`;
    
    fs.writeFileSync(filePath, newContent);
    console.log(`已重写 ${filePath}`);
    return true;
  } catch (error) {
    console.error(`重写 ${filePath} 失败:`, error);
    return false;
  }
}

// 重写index.js文件
function rewriteIndexFile() {
  const filePath = path.join(SRC_DIR, 'index.js');
  console.log(`重写文件: ${filePath}`);
  
  try {
    // 创建备份
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, `${filePath}.bak`);
    }
    
    // 完全重写文件内容
    const newContent = `
import { startMCPServer } from './mcp-server.js';

// 主函数
async function main() {
  try {
    await startMCPServer();
  } catch (error) {
    console.error('Failed to start MCP Prompt Server:', error);
    process.exit(1);
  }
}

// 启动主函数
main();

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 处理SIGINT信号（Ctrl+C）
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// 处理SIGTERM信号
process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});
`;
    
    fs.writeFileSync(filePath, newContent);
    console.log(`已重写 ${filePath}`);
    return true;
  } catch (error) {
    console.error(`重写 ${filePath} 失败:`, error);
    return false;
  }
}

// 重写types.js文件
function rewriteTypesFile() {
  const filePath = path.join(SRC_DIR, 'types.js');
  console.log(`重写文件: ${filePath}`);
  
  try {
    // 创建备份
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, `${filePath}.bak`);
    }
    
    // 完全重写文件内容
    const newContent = `
// 这个文件在原来是TypeScript类型定义文件
// 在JavaScript版本中，我们移除了所有类型定义，
// 并提供了一些基本常量和辅助函数

// 存储适配器类型
export const StorageAdapterType = {
  SUPABASE: 'supabase',
  LOCAL: 'local'
};

// MCP消息类型
export const MessageType = {
  REQUEST: 'request',
  RESPONSE: 'response',
  ERROR: 'error'
};

// 为代码兼容性导出空对象
export const Prompt = {};
export const PromptVersion = {};
export const StorageAdapter = {};
`;
    
    fs.writeFileSync(filePath, newContent);
    console.log(`已重写 ${filePath}`);
    return true;
  } catch (error) {
    console.error(`重写 ${filePath} 失败:`, error);
    return false;
  }
}

// 重写storage-factory.js文件
function rewriteStorageFactoryFile() {
  const filePath = path.join(SRC_DIR, 'storage', 'storage-factory.js');
  console.log(`重写文件: ${filePath}`);
  
  try {
    // 创建备份
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, `${filePath}.bak`);
    }
    
    // 完全重写文件内容
    const newContent = `
import { config } from '../config.js';
import { StorageAdapterType } from '../types.js';

// 存储工厂类
export class StorageFactory {
  static async createStorage() {
    const storageType = process.env.STORAGE_TYPE || config.storage.type || StorageAdapterType.SUPABASE;
    
    console.log(\`正在创建存储适配器 (类型: \${storageType})...\`);
    
    if (storageType === StorageAdapterType.SUPABASE) {
      const { SupabaseAdapter } = await import('./supabase-adapter.js');
      return new SupabaseAdapter();
    } else {
      // 默认使用本地存储
      const { LocalAdapter } = await import('./local-adapter.js');
      return new LocalAdapter();
    }
  }
}
`;
    
    fs.writeFileSync(filePath, newContent);
    console.log(`已重写 ${filePath}`);
    return true;
  } catch (error) {
    console.error(`重写 ${filePath} 失败:`, error);
    return false;
  }
}

// 彻底修复所有JS文件中的TypeScript语法
function fixAllJsFiles() {
  console.log("修复所有JS文件中的TypeScript语法...");
  
  try {
    // 递归获取所有JS文件
    const getAllJsFiles = (dir) => {
      let results = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          results = results.concat(getAllJsFiles(fullPath));
        } else if (item.endsWith('.js')) {
          results.push(fullPath);
        }
      }
      
      return results;
    };
    
    const jsFiles = getAllJsFiles(SRC_DIR);
    console.log(`找到 ${jsFiles.length} 个JS文件需要修复`);
    
    // 记录已重写的文件，避免重复处理
    const rewrittenFiles = [
      path.join(SRC_DIR, 'config.js'),
      path.join(SRC_DIR, 'api', 'auth-middleware.js'),
      path.join(SRC_DIR, 'mcp-server.js'),
      path.join(SRC_DIR, 'index.js'),
      path.join(SRC_DIR, 'types.js'),
      path.join(SRC_DIR, 'storage', 'storage-factory.js')
    ];
    
    // 对每个文件进行修复
    for (const filePath of jsFiles) {
      // 跳过已重写的文件
      if (rewrittenFiles.includes(filePath)) {
        console.log(`跳过已重写的文件: ${filePath}`);
        continue;
      }
      
      console.log(`修复文件: ${filePath}`);
      
      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 创建备份
      fs.writeFileSync(`${filePath}.bak`, content);
      
      // 修复TypeScript语法
      let fixed = content;
      
      // 1. 删除declare语句
      fixed = fixed.replace(/declare\s+[^{]+\{[^}]+\}/g, '');
      fixed = fixed.replace(/declare\s+.*?;/g, '');
      
      // 2. 删除interface定义
      fixed = fixed.replace(/interface\s+[^{]+\{[^}]+\}/g, '');
      
      // 3. 删除type定义
      fixed = fixed.replace(/type\s+[^=]+=\s*[^;]+;/g, '');
      
      // 4. 删除类型导入
      fixed = fixed.replace(/import\s+type[^;]+;/g, '');
      
      // 5. 修复类型注解
      fixed = fixed.replace(/([^'"]):\s*[A-Za-z0-9_<>\[\]|&,\s.'"()\{\}]+(?=[=,);])/g, '$1');
      fixed = fixed.replace(/([a-zA-Z0-9_]+)\s*:\s*[A-Za-z0-9_<>\[\]|&,\s.'"()\{\}]+\s*;/g, '$1;');
      
      // 6. 修复函数声明中的类型
      fixed = fixed.replace(/function\s+([a-zA-Z0-9_]+)\s*\(\s*([^)]*)\s*\)\s*:\s*[A-Za-z0-9_<>\[\]|&,\s.'"()\{\}]+/g, 'function $1($2)');
      
      // 7. 修复类型断言
      fixed = fixed.replace(/as\s+(string|number|boolean|any|[A-Za-z0-9_<>\[\]|&,\s.'"()]+)/g, '');
      
      // 8. 删除类成员声明
      fixed = fixed.replace(/^\s*(private|public|protected)\s+([a-zA-Z0-9_]+)\s*;/gm, '');
      
      // 9. 删除implements关键字
      fixed = fixed.replace(/implements\s+[A-Za-z0-9_<>\[\]|&,\s.]+/g, '');
      
      // 10. 修复箭头函数中的类型
      fixed = fixed.replace(/\(([^)]*)\)\s*:\s*[A-Za-z0-9_<>\[\]|&,\s.'"()\{\}]+\s*=>/g, '($1) =>');
      
      // 11. 修复构造函数参数中的类型
      fixed = fixed.replace(/constructor\s*\(\s*([^)]*)\s*\)/g, (match, params) => {
        // 去除参数中的类型注解
        const fixedParams = params.replace(/([a-zA-Z0-9_]+)\s*:\s*[A-Za-z0-9_<>\[\]|&,\s.'"()\{\}]+/g, '$1');
        return `constructor(${fixedParams})`;
      });
      
      // 12. 修复多余的分号
      fixed = fixed.replace(/function\s+([a-zA-Z0-9_]+)\s*\(\s*([^)]*)\s*\)\s*;/g, 'function $1($2) {}');
      
      // 写入修复后的内容
      fs.writeFileSync(filePath, fixed);
      console.log(`已修复文件: ${filePath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`修复所有JS文件出错:`, error);
    return false;
  }
}

// 创建缺少的local-adapter.js文件
function createLocalAdapterFile() {
  const filePath = path.join(SRC_DIR, 'storage', 'local-adapter.js');
  console.log(`创建文件: ${filePath}`);
  
  try {
    // 创建目录（如果不存在）
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 文件内容
    const content = `
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

// 本地存储适配器
export class LocalAdapter {
  constructor() {
    this.dataDir = config.storage.local.dataDir;
    
    // 确保数据目录存在
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    console.log(\`本地存储适配器已初始化 (数据目录: \${this.dataDir})\`);
  }
  
  // 获取所有分类
  async getCategories() {
    return ['general', 'code', 'creative', 'business'];
  }
  
  // 获取所有标签
  async getTags() {
    return ['popular', 'new', 'featured'];
  }
  
  // 其他存储方法实现...
}
`;
    
    fs.writeFileSync(filePath, content);
    console.log(`已创建 ${filePath}`);
    return true;
  } catch (error) {
    console.error(`创建 ${filePath} 失败:`, error);
    return false;
  }
}

// 执行所有修复
console.log("开始执行综合修复...");

// 重写关键文件
const configFixed = rewriteConfigFile();
const authMiddlewareFixed = rewriteAuthMiddlewareFile();
const mcpServerFixed = rewriteMcpServerFile();
const indexFixed = rewriteIndexFile();
const typesFixed = rewriteTypesFile();
const storageFactoryFixed = rewriteStorageFactoryFile();

// 创建缺少的文件
const localAdapterCreated = createLocalAdapterFile();

// 修复所有文件
const allFilesFixed = fixAllJsFiles();

if (configFixed && authMiddlewareFixed && mcpServerFixed && indexFixed && 
    typesFixed && storageFactoryFixed && localAdapterCreated && allFilesFixed) {
  console.log("所有修复操作已成功完成！");
  process.exit(0);
} else {
  console.error("修复过程中出现错误，请检查日志！");
  process.exit(1);
}
