import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

/**
 * API代理中间件
 * 
 * 这个文件用于将前端对/api/*的请求转发到后端服务器
 * 解决前端直接请求后端服务时可能遇到的CORS问题
 */

// 前端处理的API路径，不需要代理到后端
const FRONTEND_API_PATHS = [
  'ai/optimize',
  'auth',
  'prompts',
  'user',
  'profile',
  'social',
  'quality',
  'performance',
  'templates',
  'collaborative',
  'recommendations',
  'search',
  'categories',
  'tags',
  'public-prompts',
  'make-prompts-public',
  'direct-create',
  'ai-analyze'
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 获取请求路径
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : (path || '');
    
    // 如果没有路径，返回404
    if (!apiPath) {
      return res.status(404).json({
        success: false,
        error: '未找到请求的资源',
        message: 'API路径不能为空'
      });
    }
    
    // 检查是否是前端处理的API路径
    const isHandledByFrontend = FRONTEND_API_PATHS.some(frontendPath => {
      return apiPath === frontendPath || apiPath.startsWith(frontendPath + '/');
    });
    
    if (isHandledByFrontend) {
      return res.status(404).json({
        success: false,
        error: '未找到请求的资源',
        message: `API路径 /${apiPath} 应该由前端处理，但找不到对应的处理程序`
      });
    }
    
    // 获取API密钥（优先使用环境变量）
    const apiKey = process.env.API_KEY;
    
    // 确定目标URL（后端API服务器地址）
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:9010';
    
    // 构建完整URL
    const url = `${backendUrl}/api/${apiPath}`;
    
    // 设置请求头
    const headers: Record<string, string> = {
      ...req.headers as Record<string, string>,
    };
    
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }
    
    // 删除host头（避免出现Invalid Host header错误）
    delete headers.host;
    
    // 发送请求到后端服务器
    const response = await axios({
      method: req.method as string,
      url,
      data: req.body,
      headers,
      params: req.query,
      responseType: 'json',
    });
    
    // 返回响应结果
    res.status(response.status).json(response.data);
  } catch (error: any) {
    // 处理错误
    console.error('API代理错误:', error.message);
    
    // 返回错误响应
    res.status(error.response?.status || 500).json({
      error: error.message,
      data: error.response?.data || null,
    });
  }
}
