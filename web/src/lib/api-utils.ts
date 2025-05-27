import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

// API基础URL
const API_BASE_URL = process.env.API_URL || 'http://localhost:9010';
// API密钥
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error('API_KEY环境变量未设置。请在.env文件中设置API_KEY。');
}

// 创建axios实例
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  }
});

// 身份验证中间件
export const withAuth = (handler: NextApiHandler): NextApiHandler => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // 从请求头中获取令牌
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: '未授权访问，请提供有效的认证令牌' 
        });
      }
      
      const token = authHeader.substring(7); // 移除"Bearer "前缀
      
      // 在真实环境中，这里应该验证令牌的有效性
      // 出于演示目的，我们这里简单地检查令牌是否存在
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: '认证令牌无效' 
        });
      }
      
      // 如果令牌有效，将用户信息添加到请求对象中
      // 在实际情况下，这应该从令牌中解析或通过数据库查询获取
      (req as any).user = {
        id: '1',
        username: 'demo_user',
        email: 'demo@example.com',
        role: 'user'
      };
      
      // 继续处理请求
      return await handler(req, res);
    } catch (error) {
      console.error('身份验证错误:', error);
      return res.status(500).json({ 
        success: false, 
        message: '身份验证过程中发生错误' 
      });
    }
  };
};

// 创建一个辅助函数用于代理API请求
export const proxyApiRequest = async (
  req: NextApiRequest,
  res: NextApiResponse,
  endpoint: string,
  options: {
    requireAuth?: boolean;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    transformRequest?: (data: any) => any;
    transformResponse?: (data: any) => any;
  } = {}
) => {
  const {
    requireAuth = false,
    method = req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    transformRequest = (data) => data,
    transformResponse = (data) => data
  } = options;

  try {
    // 设置请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    };

    // 如果需要身份验证，添加认证令牌到请求头
    if (requireAuth && req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // 准备请求数据
    const requestData = req.body ? transformRequest(req.body) : undefined;
    
    // 构建查询字符串
    const queryString = req.query 
      ? Object.entries(req.query)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&')
      : '';
    
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    // 发送请求到后端API
    const response = await apiClient.request({
      method,
      url,
      data: requestData,
      headers
    });

    // 转换响应数据
    const responseData = transformResponse(response.data);
    
    // 返回响应
    return res.status(response.status).json(responseData);
  } catch (error: any) {
    console.error(`API请求错误 (${endpoint}):`, error.response?.data || error.message);
    
    // 如果后端API返回错误，传递错误状态码和消息
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || '请求处理失败',
        error: error.response.data
      });
    }
    
    // 如果是网络错误或其他未处理的错误
    return res.status(500).json({
      success: false,
      message: '与API服务器通信时发生错误',
      error: error.message
    });
  }
};
