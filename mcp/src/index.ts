#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config, validateConfig } from './config.js';
import mcpRouter from './api/mcp-router.js';
import apiKeysRouter from './api/api-keys-router.js';
import logger from './utils/logger.js';

export async function startMCPServer() {
  try {
    // 验证配置
    validateConfig();
    
    logger.info('正在启动MCP服务器...');
    
    // 创建Express应用
    const app = express();
    
    // 安全中间件
    app.use((req, res, next) => {
      // 隐藏技术栈信息
      res.removeHeader('X-Powered-By');

      // 添加安全头部
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      // 生产环境启用HSTS
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      }

      next();
    });

    // 配置CORS
    if (config.security.enableCors) {
      app.use(cors({
        origin: (origin, callback) => {
          // 允许没有origin的请求（如移动应用、Postman等）
          if (!origin) return callback(null, true);

          const allowedOrigins = config.security.corsOrigin;

          // 如果配置为*，允许所有
          if (allowedOrigins === '*') {
            return callback(null, true);
          }

          // 检查是否在允许列表中
          const isAllowed = Array.isArray(allowedOrigins)
            ? allowedOrigins.includes(origin)
            : allowedOrigins === origin;

          if (isAllowed) {
            callback(null, true);
          } else {
            // 在开发环境中记录被拒绝的请求，生产环境中静默拒绝
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[CORS] Blocked origin: ${origin}`);
            }
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        credentials: true,
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Api-Key',
          'Server-Key',
          'X-Request-ID',
          'X-Session-ID',
          'Accept',
          'Origin',
          'User-Agent'
        ],
        optionsSuccessStatus: 200 // 兼容旧版浏览器
      }));
    }

    app.use(express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        // 验证JSON格式，防止恶意请求
        try {
          JSON.parse(buf.toString());
        } catch (e) {
          res.status(400).json({ success: false, error: 'Invalid JSON format' });
          return;
        }
      }
    }));
    
    // 根路径
    app.get('/', (req, res) => {
      res.json({ 
        message: 'Welcome to MCP Prompt Server',
        version: config.mcp.version,
        timestamp: new Date().toISOString()
      });
    });
    
    // 健康检查端点
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        version: config.mcp.version,
        timestamp: new Date().toISOString(),
        storage: config.storage.type,
        transportType: process.env.TRANSPORT_TYPE || 'stdio'
      });
    });
    
    // 配置路由
    app.use('/', mcpRouter);
    app.use('/api/keys', apiKeysRouter);
    
    // 错误处理中间件
    app.use((error: any, req: any, res: any, next: any) => {
      logger.error('服务器错误:', error);
      res.status(500).json({
        success: false,
        error: '内部服务器错误'
      });
    });
    
    // 404处理
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: '未找到请求的资源'
      });
    });
    
    // 启动服务器
    const port = config.port || 9010;
    const server = createServer(app);
    
    server.listen(port, () => {
      logger.info(`MCP服务器启动成功，端口: ${port}`);
      logger.info(`健康检查: http://localhost:${port}/api/health`);
      logger.info(`MCP工具端点: http://localhost:${port}/tools`);
    });
    
    // 优雅关闭处理
    const gracefulShutdown = () => {
      logger.info('正在优雅关闭服务器...');
      server.close(() => {
        logger.info('服务器已关闭');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    return server;
  } catch (error) {
    logger.error('启动MCP服务器失败:', error);
    throw error;
  }
}

async function main() {
  try {
    await startMCPServer();
  } catch (error) {
    console.error('Failed to start MCP Prompt Server:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
