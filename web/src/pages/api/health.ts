/**
 * 健康检查API端点
 * 用于网络连接测试和系统状态监控
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '@/lib/api-handler';
import { logger } from '@/lib/error-handler';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // 执行基本的健康检查
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: '系统运行正常',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      }
    };

    // 可以在这里添加更多的健康检查，比如数据库连接等
    // 但要注意不要暴露敏感信息

    logger.info('健康检查请求', undefined, {
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

    return successResponse(res, healthStatus);
  } catch (error: any) {
    logger.error('健康检查失败', error);
    return errorResponse(res, '健康检查失败', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['GET'],
  requireAuth: false
});