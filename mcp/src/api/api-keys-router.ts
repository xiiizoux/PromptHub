import express, { Request, Response, NextFunction } from 'express';
import { StorageFactory } from '../storage/storage-factory.js';
import { authenticateRequest } from './auth-middleware.js';
import logger, { logApiKeyActivity } from '../utils/logger.js';

const router = express.Router();

/**
 * 获取当前用户的API密钥列表
 * GET /api/api-keys
 */
// 获取请求的IP和UserAgent用于审计日志
const getRequestMetadata = (req: Request) => {
  return {
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    requestId: req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
  };
};

// 通用错误处理中间件
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const metadata = getRequestMetadata(req);
  const userId = req.user?.id || 'unauthenticated';
  
  logger.error('API错误', {
    error: err.message,
    stack: err.stack,
    userId,
    path: req.path,
    method: req.method,
    ...metadata
  });
  
  return res.status(500).json({
    success: false,
    error: '服务器内部错误',
    requestId: metadata.requestId
  });
};

router.get('/', authenticateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metadata = getRequestMetadata(req);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
        requestId: metadata.requestId
      });
    }

    const storage = StorageFactory.getStorage();
    const apiKeys = await storage.listApiKeys(req.user.id);
    
    const requestMetadata = getRequestMetadata(req);
    // 记录成功获取API密钥列表的操作
    logApiKeyActivity(req.user.id, 'LIST_API_KEYS', undefined, {
      count: apiKeys.length,
      ...requestMetadata
    });

    return res.json({
      success: true,
      data: apiKeys,
      requestId: requestMetadata.requestId
    });
  } catch (error) {
    const requestMetadata = getRequestMetadata(req);
    logger.error('获取API密钥列表失败:', { error, userId: req.user?.id, ...requestMetadata });
    return res.status(500).json({
      success: false,
      error: '获取API密钥列表失败',
      requestId: requestMetadata.requestId
    });
  }
});

/**
 * 创建新的API密钥
 * POST /api/api-keys
 */
router.post('/', authenticateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metadata = getRequestMetadata(req);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
        requestId: metadata.requestId
      });
    }

    const { name, expiresInDays } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      logger.warn('尝试创建无效名称的API密钥', { userId: req.user.id, name, ...metadata });
      return res.status(400).json({
        success: false,
        error: '密钥名称不能为空',
        requestId: metadata.requestId
      });
    }

    // 验证过期天数
    let daysToExpire = expiresInDays ? parseInt(expiresInDays) : 30;
    if (isNaN(daysToExpire) || daysToExpire < 0) {
      daysToExpire = 30; // 默认30天
    }

    const storage = StorageFactory.getStorage();
    const apiKey = await storage.generateApiKey(req.user.id, name.trim(), daysToExpire);
    
    // 记录创建API密钥的操作（不记录实际密钥，只记录相关信息）
    logApiKeyActivity(req.user.id, 'CREATE_API_KEY', undefined, {
      keyName: name.trim(),
      expiresInDays: daysToExpire,
      ...metadata
    });

    return res.json({
      success: true,
      data: {
        apiKey,
        name: name.trim(),
        expiresInDays: daysToExpire
      },
      requestId: metadata.requestId
    });
  } catch (error) {
    const requestMetadata = getRequestMetadata(req);
    logger.error('创建API密钥失败:', { error, userId: req.user?.id, ...requestMetadata });
    
    const errorMessage = error instanceof Error ? error.message : '创建API密钥失败';
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
      requestId: requestMetadata.requestId
    });
  }
});

/**
 * 删除API密钥
 * DELETE /api/api-keys/:id
 */
router.delete('/:id', authenticateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metadata = getRequestMetadata(req);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
        requestId: metadata.requestId
      });
    }

    const keyId = req.params.id;
    
    if (!keyId) {
      logger.warn('尝试删除无效ID的API密钥', { userId: req.user.id, ...metadata });
      return res.status(400).json({
        success: false,
        error: '密钥ID不能为空',
        requestId: metadata.requestId
      });
    }

    const storage = StorageFactory.getStorage();
    const success = await storage.deleteApiKey(req.user.id, keyId);

    if (!success) {
      logger.warn('尝试删除不存在或无权访问的API密钥', { 
        userId: req.user.id, 
        keyId, 
        ...metadata 
      });
      return res.status(404).json({
        success: false,
        error: '密钥不存在或无权删除',
        requestId: metadata.requestId
      });
    }

    // 记录删除API密钥的操作
    logApiKeyActivity(req.user.id, 'DELETE_API_KEY', keyId, metadata);
    
    return res.json({
      success: true,
      message: '密钥已成功删除',
      requestId: metadata.requestId
    });
  } catch (error) {
    const requestMetadata = getRequestMetadata(req);
    logger.error('删除API密钥失败:', { 
      error, 
      userId: req.user?.id, 
      keyId: req.params.id, 
      ...requestMetadata 
    });
    return res.status(500).json({
      success: false,
      error: '删除API密钥失败',
      requestId: requestMetadata.requestId
    });
  }
});

// 错误处理中间件应该在所有路由之后使用
router.use(errorHandler);

export default router;
