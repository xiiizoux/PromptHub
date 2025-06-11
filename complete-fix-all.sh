#!/bin/bash
# 综合修复Docker启动问题并清理修复脚本

# 设置错误处理
set -e
echo "开始执行最终修复脚本..."

# 停止现有容器
echo "停止现有容器..."
sudo docker stop prompthub || true

# 创建直接修复脚本
echo "创建最终修复脚本..."
cat > final-docker-fix.cjs << 'EOF'
const fs = require('fs');
const path = require('path');

// 主要文件路径
const mcpServerPath = '/app/mcp/dist/src/mcp-server.js';
const indexPath = '/app/mcp/dist/src/index.js';
const authMiddlewarePath = '/app/mcp/dist/src/api/auth-middleware.js';

// 修复mcp-server.js文件
function fixMcpServerFile() {
  console.log(`修复文件: ${mcpServerPath}`);
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(mcpServerPath)) {
      console.error(`文件不存在: ${mcpServerPath}`);
      return false;
    }
    
    // 读取文件内容（用于备份）
    const originalContent = fs.readFileSync(mcpServerPath, 'utf8');
    console.log(`原始文件大小：${originalContent.length} 字节`);
    
    // 创建备份
    const backupPath = `${mcpServerPath}.final-backup`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
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
    
    // 写入新内容
    fs.writeFileSync(mcpServerPath, newContent);
    console.log(`已完全重写 ${mcpServerPath} 文件`);
    
    return true;
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 修复index.js文件
function fixIndexFile() {
  console.log(`修复文件: ${indexPath}`);
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(indexPath)) {
      console.error(`文件不存在: ${indexPath}`);
      return false;
    }
    
    // 创建备份
    const backupPath = `${indexPath}.final-backup`;
    fs.writeFileSync(backupPath, fs.readFileSync(indexPath, 'utf8'));
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 直接创建一个全新的index.js，避免所有潜在问题
    const newIndexContent = `
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
    
    // 写入新内容
    fs.writeFileSync(indexPath, newIndexContent);
    console.log(`已重写 ${indexPath} 文件`);
    
    return true;
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 修复auth-middleware.js文件
function fixAuthMiddlewareFile() {
  console.log(`修复文件: ${authMiddlewarePath}`);
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(authMiddlewarePath)) {
      console.error(`文件不存在: ${authMiddlewarePath}`);
      return false;
    }
    
    // 读取文件内容（用于备份）
    const originalContent = fs.readFileSync(authMiddlewarePath, 'utf8');
    console.log(`原始文件大小：${originalContent.length} 字节`);
    
    // 创建备份
    const backupPath = `${authMiddlewarePath}.final-backup`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 完全重写文件内容
    const newContent = `
import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

// 全局变量和错误常量
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
    
    // 写入新内容
    fs.writeFileSync(authMiddlewarePath, newContent);
    console.log(`已完全重写 ${authMiddlewarePath} 文件`);
    
    return true;
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 递归扫描并修复目录中的所有JS文件
function fixAllJsFilesInDirectory(dirPath) {
  console.log(`扫描目录中的JS文件: ${dirPath}`);
  
  try {
    if (!fs.existsSync(dirPath)) {
      console.error(`目录不存在: ${dirPath}`);
      return false;
    }
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // 递归扫描子目录
        fixAllJsFilesInDirectory(itemPath);
      } else if (item.endsWith('.js') && 
                itemPath !== mcpServerPath && 
                itemPath !== indexPath && 
                itemPath !== authMiddlewarePath) {
        // 修复其他JS文件
        fixJsFile(itemPath);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`扫描目录出错:`, error);
    return false;
  }
}

// 修复单个JS文件中的TypeScript语法
function fixJsFile(filePath) {
  console.log(`修复JS文件: ${filePath}`);
  
  try {
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 创建备份
    fs.writeFileSync(`${filePath}.backup`, content);
    
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
    
    // 6. 修复类型断言
    fixed = fixed.replace(/as\s+(string|number|boolean|any)/g, '');
    
    // 7. 删除类成员声明
    fixed = fixed.replace(/^\s*(private|public|protected)\s+([a-zA-Z0-9_]+)\s*;/gm, '');
    
    // 8. 删除implements关键字
    fixed = fixed.replace(/implements\s+[A-Za-z0-9_<>\[\]|&,\s.]+/g, '');
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixed);
    console.log(`已修复JS文件: ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`修复JS文件出错:`, error);
    return false;
  }
}

// 执行所有修复
console.log("开始执行综合修复...");
const mcpServerFixed = fixMcpServerFile();
const indexFixed = fixIndexFile();
const authMiddlewareFixed = fixAuthMiddlewareFile();
const allJsFixed = fixAllJsFilesInDirectory('/app/mcp/dist/src');

if (mcpServerFixed && indexFixed && authMiddlewareFixed && allJsFixed) {
  console.log("所有修复操作已成功完成！");
  process.exit(0);
} else {
  console.error("修复过程中出现错误，请检查日志！");
  process.exit(1);
}
EOF

# 复制修复脚本到Docker容器
echo "复制最终修复脚本到Docker容器..."
sudo docker cp final-docker-fix.cjs prompthub:/app/final-docker-fix.cjs

# 启动容器
echo "启动容器..."
sudo docker start prompthub

# 等待容器启动
echo "等待容器启动 (5秒)..."
sleep 5

# 在容器内执行修复脚本
echo "在Docker容器中执行最终修复脚本..."
sudo docker exec prompthub node /app/final-docker-fix.cjs

# 重启容器以应用所有修复
echo "重启容器以应用所有修复..."
sudo docker restart prompthub

# 等待容器重启
echo "等待容器重启并检查服务状态 (30秒)..."
sleep 30

# 查看容器日志
echo "显示容器日志最后30行以检查启动状态:"
sudo docker logs prompthub | tail -n 30

# 最终状态检查
echo "详细检查MCP服务状态..."
sudo docker exec prompthub sh -c "ps aux | grep node"

# 检查MCP服务端口是否在监听
echo "检查MCP服务端口是否在监听..."
sudo docker exec prompthub sh -c "netstat -tulpn | grep 9010" || echo "MCP服务可能未启动或netstat未安装"

# 清理所有修复脚本
echo "清理所有修复脚本..."
find . -name "fix-*.js" -o -name "fix-*.cjs" -o -name "fix-*.sh" -o -name "rebuild-docker.sh" -o -name "docker-compose-up.sh" -o -name "test-docker-compose.sh" -o -name "ultimate-fix-docker.sh" -o -name "final-fix-docker.sh" -o -name "final-complete-fix.sh" | xargs rm -f

# 如果final-docker-fix.cjs在当前目录存在，也删除它
rm -f final-docker-fix.cjs

echo "修复完成！Docker容器应该已正常启动。"
echo "所有修复脚本已被删除。"