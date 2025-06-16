// 安全的CORS配置
import cors from 'cors';

// 允许的源域配置
const getAllowedOrigins = (): string[] => {
  const origins = process.env.ALLOWED_ORIGINS;
  
  if (origins) {
    return origins.split(',').map(origin => origin.trim());
  }
  
  // 默认安全配置
  if (process.env.NODE_ENV === 'production') {
    return [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      'https://api.yourdomain.com'
    ];
  }
  
  // 开发环境配置
  return [
    'http://localhost:3000',
    'http://localhost:9011',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:9011'
  ];
};

// 动态CORS配置
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // 允许无origin的请求（如移动应用、Postman等）
    if (!origin && process.env.ALLOW_NO_ORIGIN === 'true') {
      return callback(null, true);
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked request from origin: ${origin}`);
      callback(new Error('CORS policy violation: Origin not allowed'));
    }
  },
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Api-Key',
    'X-Requested-With',
    'X-Request-ID',
    'Cache-Control'
  ],
  
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID'
  ],
  
  credentials: true,
  
  // 预检请求缓存时间（1小时）
  maxAge: 3600,
  
  // 仅在生产环境记录详细日志
  optionsSuccessStatus: process.env.NODE_ENV === 'production' ? 204 : 200
};

// 预检请求处理中间件
export const handlePreflightRequest = (req: any, res: any, next: any) => {
  if (req.method === 'OPTIONS') {
    // 记录预检请求
    console.log(`✅ CORS preflight from: ${req.headers.origin}`);
    
    // 设置安全头
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders?.join(','));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '3600');
    
    return res.status(204).end();
  }
  
  next();
};

export default corsOptions; 