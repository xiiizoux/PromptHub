import { config } from '../config.js';

/**
 * 身份验证中间件，用于保护需要认证的API路由
 * @param {Request} req 请求对象
 * @param {Response} res 响应对象
 * @param {Function} next 下一个中间件函数
 */
export const authenticateRequest = (req, res, next) => {
  // 获取API密钥
  const apiKey = getAuthValue(req, 'x-api-key') || getAuthValue(req, 'api_key');
  
  // 验证API密钥
  if (apiKey && apiKey === config.apiKey) {
    // 添加模拟用户信息，用于记录操作
    req.user = {
      id: 'system-user',
      email: 'system@example.com',
      role: 'admin'
    };
    return next();
  }
  
  // 获取授权头
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // 这里可以添加JWT验证逻辑，用于用户登录身份验证
    // 简化起见，我们只检查令牌是否存在
    if (token) {
      // 在实际应用中，这里应该从token中解析用户信息
      req.user = {
        id: 'authenticated-user',
        email: 'user@example.com',
        role: 'user'
      };
      return next();
    }
  }
  
  // 身份验证失败
  res.status(401).json({
    success: false,
    error: '未授权访问，请提供有效的API密钥或认证令牌'
  });
};

/**
 * 从请求中获取认证值
 * @param {Request} request 请求对象
 * @param {string} key 键名
 * @returns {string} 认证值
 */
function getAuthValue(request, key) {
  // 从查询参数获取值
  if (request.query && request.query[key.toLowerCase()]) {
    return request.query[key.toLowerCase()];
  }
  
  // 从headers获取值
  if (request.headers && request.headers[key.toLowerCase()]) {
    return request.headers[key.toLowerCase()];
  }
  
  // 从Bearer令牌获取API密钥
  if (key.toLowerCase() === 'api_key' && request.headers && request.headers.authorization) {
    const authHeader = request.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }
  
  return '';
}
