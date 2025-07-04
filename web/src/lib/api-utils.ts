import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

// 注意：此文件仅用于内部认证中间件，不再依赖外部API服务

// 身份验证中间件
export const withAuth = (handler: NextApiHandler): NextApiHandler => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // 从请求头中获取令牌
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: '未授权访问，请提供有效的认证令牌', 
        });
      }
      
      const token = authHeader.substring(7); // 移除"Bearer "前缀
      
      // 在真实环境中，这里应该验证令牌的有效性
      // 出于演示目的，我们这里简单地检查令牌是否存在
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: '认证令牌无效', 
        });
      }
      
      // 如果令牌有效，将用户信息添加到请求对象中
      // 在实际情况下，这应该从令牌中解析或通过数据库查询获取
      (req as any).user = {
        id: '1',
        username: 'demo_user',
        email: 'demo@example.com',
        role: 'user',
      };
      
      // 继续处理请求
      return await handler(req, res);
    } catch (error) {
      console.error('身份验证错误:', error);
      return res.status(500).json({ 
        success: false, 
        message: '身份验证过程中发生错误', 
      });
    }
  };
};

// proxyApiRequest函数已移除 - Web服务器不再代理到外部API服务
