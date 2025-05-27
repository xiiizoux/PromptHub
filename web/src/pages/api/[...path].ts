import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

/**
 * API代理中间件
 * 
 * 这个文件用于将前端对/api/*的请求转发到后端服务器
 * 解决前端直接请求后端服务时可能遇到的CORS问题
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 获取API密钥（优先使用环境变量）
    const apiKey = process.env.API_KEY;
    
    // 确定目标URL（后端API服务器地址）
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:9010';
    
    // 获取请求路径
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path;
    
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
