import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { browserCompatibility } from '../lib/browser-compatibility';

/**
 * 安全头部配置
 */
export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableCORS: boolean;
  allowedOrigins: string[];
  isDevelopment: boolean;
}

/**
 * 获取安全配置
 */
function getSecurityConfig(): SecurityConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    enableCSP: process.env.ENABLE_CSP !== 'false',
    enableHSTS: process.env.ENABLE_HSTS !== 'false' && !isDevelopment,
    enableCORS: process.env.ENABLE_CORS !== 'false',
    allowedOrigins: getAllowedOrigins(),
    isDevelopment,
  };
}

/**
 * 获取允许的源域名列表
 */
function getAllowedOrigins(): string[] {
  const corsOrigin = process.env.CORS_ORIGIN;
  const nodeEnv = process.env.NODE_ENV;
  
  if (corsOrigin) {
    if (corsOrigin === '*') {
      return ['*'];
    }
    return corsOrigin.split(',').map(origin => origin.trim());
  }
  
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    return [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      'http://localhost:3001',
      'http://localhost:5173',  // Vite
      'http://localhost:4173',   // Vite preview
    ];
  } else if (nodeEnv === 'production') {
    const allowedOrigins = [
      'https://prompt-hub.cc',
      'https://www.prompt-hub.cc',
    ];
    
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (process.env.API_URL) {
      allowedOrigins.push(process.env.API_URL);
    }
    
    return allowedOrigins;
  }
  
  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
}

/**
 * 设置安全头部（兼容性优化）
 */
function setSecurityHeaders(res: NextApiResponse | NextResponse, config: SecurityConfig): void {
  // 获取浏览器兼容的安全头部配置
  const compatibleHeaders = browserCompatibility.getCompatibleSecurityHeaders();

  // 类型守卫函数
  const isNextResponse = (response: any): response is NextResponse => {
    return response.headers && typeof response.headers.set === 'function';
  };

  // 应用兼容的安全头部
  Object.entries(compatibleHeaders).forEach(([key, value]) => {
    if (isNextResponse(res)) {
      res.headers.set(key, value);
    } else {
      (res as NextApiResponse).setHeader(key, value);
    }
  });

  // 权限策略（现代浏览器支持）
  if (isNextResponse(res)) {
    res.headers.set('Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
    // 防止MIME类型嗅探
    res.headers.set('X-Download-Options', 'noopen');
    // 移除暴露服务器信息的头
    res.headers.delete('X-Powered-By');
    res.headers.delete('Server');
    res.headers.delete('X-AspNet-Version');
    res.headers.delete('X-AspNetMvc-Version');
  } else {
    const apiRes = res as NextApiResponse;
    apiRes.setHeader('Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
    // 防止MIME类型嗅探
    apiRes.setHeader('X-Download-Options', 'noopen');
    // API路由无法删除这些头部，只能设置为空
    apiRes.removeHeader('X-Powered-By');
  }
}

/**
 * 检查源是否被允许
 */
function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes('*')) {
    return true;
  }
  
  return allowedOrigins.includes(origin);
}

/**
 * 设置CORS头部（兼容性优化）
 */
function setCORSHeaders(res: NextApiResponse | NextResponse, origin: string | undefined, config: SecurityConfig): void {
  if (!config.enableCORS) return;

  // 获取浏览器兼容的CORS配置
  const corsConfig = browserCompatibility.getCompatibleCORSConfig();

  // 类型守卫函数
  const isNextResponse = (response: any): response is NextResponse => {
    return response.headers && typeof response.headers.set === 'function';
  };

  // 检查源是否被允许
  if (origin && isOriginAllowed(origin, config.allowedOrigins)) {
    if (isNextResponse(res)) {
      res.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      (res as NextApiResponse).setHeader('Access-Control-Allow-Origin', origin);
    }
  } else if (config.allowedOrigins.includes('*')) {
    if (isNextResponse(res)) {
      res.headers.set('Access-Control-Allow-Origin', '*');
    } else {
      (res as NextApiResponse).setHeader('Access-Control-Allow-Origin', '*');
    }
  }

  if (isNextResponse(res)) {
    res.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
    res.headers.set('Access-Control-Allow-Headers', corsConfig.headers.join(', '));
    res.headers.set('Access-Control-Allow-Credentials', corsConfig.credentials === 'include' ? 'true' : 'false');
    res.headers.set('Access-Control-Max-Age', '86400'); // 24小时
    res.headers.set('Access-Control-Expose-Headers',
      'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  } else {
    const apiRes = res as NextApiResponse;
    apiRes.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
    apiRes.setHeader('Access-Control-Allow-Headers', corsConfig.headers.join(', '));
    apiRes.setHeader('Access-Control-Allow-Credentials', corsConfig.credentials === 'include' ? 'true' : 'false');
    apiRes.setHeader('Access-Control-Max-Age', '86400'); // 24小时
    apiRes.setHeader('Access-Control-Expose-Headers',
      'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  }
}

/**
 * API路由安全中间件
 */
export function withSecurity(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const config = getSecurityConfig();
    const origin = req.headers.origin;
    
    // 设置安全头部
    setSecurityHeaders(res, config);
    
    // 设置CORS头部
    setCORSHeaders(res, origin, config);
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // 调用实际的处理程序
    return handler(req, res);
  };
}

/**
 * Next.js 中间件安全头部设置
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  const config = getSecurityConfig();
  
  // 设置安全头部
  setSecurityHeaders(response, config);
  
  return response;
}

/**
 * 处理CORS预检请求
 */
export function handleCORS(request: NextRequest): NextResponse | null {
  const config = getSecurityConfig();
  
  if (!config.enableCORS) return null;
  
  const origin = request.headers.get('origin');
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    setCORSHeaders(response, origin || undefined, config);
    setSecurityHeaders(response, config);
    
    return response;
  }
  
  return null;
}

/**
 * 获取安全报告
 */
export function getSecurityReport(): {
  config: SecurityConfig;
  headers: string[];
  recommendations: string[];
} {
  const config = getSecurityConfig();
  
  const headers = [
    'X-Content-Type-Options',
    'X-Frame-Options', 
    'X-XSS-Protection',
    'Referrer-Policy',
    'Permissions-Policy',
  ];
  
  if (config.enableCSP) headers.push('Content-Security-Policy');
  if (config.enableHSTS) headers.push('Strict-Transport-Security');
  if (config.enableCORS) headers.push('Access-Control-*');
  
  const recommendations = [];
  
  if (config.isDevelopment) {
    recommendations.push('生产环境建议启用HSTS');
    recommendations.push('生产环境建议使用更严格的CSP');
  }
  
  if (config.allowedOrigins.includes('*')) {
    recommendations.push('建议限制CORS允许的源域名');
  }
  
  return {
    config,
    headers,
    recommendations,
  };
}
