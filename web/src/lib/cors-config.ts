/**
 * 智能CORS配置
 * 根据环境自动调整CORS策略，在安全性和兼容性之间取得平衡
 */

export interface CorsConfig {
  origin: string | string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  optionsSuccessStatus: number;
}

/**
 * 获取智能CORS配置
 */
export function getCorsConfig(): CorsConfig {
  const nodeEnv = process.env.NODE_ENV;
  const corsOrigin = process.env.CORS_ORIGIN;
  
  // 基础配置
  const baseConfig: CorsConfig = {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Api-Key',
      'X-Request-ID',
      'X-Session-ID',
      'Accept',
      'Origin',
      'User-Agent'
    ],
    credentials: true,
    optionsSuccessStatus: 200 // 兼容旧版浏览器
  };

  return baseConfig;
}

/**
 * 获取允许的源域名列表
 */
function getAllowedOrigins(): string | string[] | boolean {
  const corsOrigin = process.env.CORS_ORIGIN;
  const nodeEnv = process.env.NODE_ENV;
  
  // 如果明确设置了CORS_ORIGIN，使用设置的值
  if (corsOrigin) {
    if (corsOrigin === '*') {
      return '*';
    }
    // 支持逗号分隔的多个域名
    return corsOrigin.split(',').map(origin => origin.trim());
  }
  
  // 根据环境智能配置
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    // 开发环境：允许常见的开发端口和本地访问
    return [
      'http://localhost:3000',
      'http://localhost:9010',  // MCP服务
      'http://localhost:9011',  // Web服务
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:9010',
      'http://127.0.0.1:9011',
      'http://127.0.0.1:8080',
      // 支持常见的开发工具
      'http://localhost:3001',
      'http://localhost:5173',  // Vite
      'http://localhost:4173'   // Vite preview
    ];
  } else if (nodeEnv === 'production') {
    // 生产环境：更严格但仍保持必要的灵活性
    const allowedOrigins = [
      'http://localhost:9010',  // 本地MCP服务
      'http://localhost:9011',  // 本地Web服务
      'http://127.0.0.1:9010',
      'http://127.0.0.1:9011'
    ];
    
    // 如果设置了前端URL，添加到允许列表
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // 如果设置了API URL，添加到允许列表
    if (process.env.API_URL) {
      allowedOrigins.push(process.env.API_URL);
    }
    
    return allowedOrigins;
  }
  
  // 默认情况：允许本地服务间通信
  return [
    'http://localhost:9010',
    'http://localhost:9011',
    'http://127.0.0.1:9010',
    'http://127.0.0.1:9011'
  ];
}

/**
 * 检查源是否被允许
 * 用于动态CORS验证
 */
export function isOriginAllowed(origin: string): boolean {
  const allowedOrigins = getAllowedOrigins();
  
  if (allowedOrigins === '*') {
    return true;
  }
  
  if (typeof allowedOrigins === 'boolean') {
    return allowedOrigins;
  }
  
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(origin);
  }
  
  return allowedOrigins === origin;
}

/**
 * 记录CORS请求（用于调试和监控）
 */
export function logCorsRequest(origin: string, allowed: boolean): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CORS] Origin: ${origin}, Allowed: ${allowed}`);
  }
}
