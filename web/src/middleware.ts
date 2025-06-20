import { NextRequest, NextResponse } from 'next/server';

// API基础URL
const API_BASE_URL = process.env.API_URL || 'http://localhost:9010';
// API密钥
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error('API_KEY环境变量未设置。请在.env文件中设置API_KEY。');
}

// 需要认证的API路由模式
const PROTECTED_ROUTES = [
  '/api/auth/me',
  '/api/auth/profile',
  '/api/auth/api-keys',
  '/api/prompts/create',
  '/api/prompts/update',
  '/api/prompts/delete',
  '/api/prompts/bookmark',
  '/api/prompts/like',
  '/api/prompts/rating',
  '/api/profile/',
  '/api/user/',
  '/api/collaborative/',
  '/api/performance/track',
  '/api/social/'
];

// 公开访问的API路由（不需要认证）
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/signin',
  '/api/auth/register',
  '/api/prompts/search',
  '/api/prompts/index',
  '/api/categories',
  '/api/tags',
  '/api/public-prompts',
  '/api/templates'
];

// 检查路径是否需要认证
function requiresAuth(pathname: string): boolean {
  // 首先检查是否是公开路由
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return false;
  }

  // 然后检查是否是受保护的路由
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

// 添加安全头
function addSecurityHeaders(response: NextResponse): NextResponse {
  // 防止XSS攻击
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 内容安全策略（根据需要调整）
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );

  return response;
}

export function middleware(request: NextRequest) {
  // 只处理API路由的请求
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const pathname = request.nextUrl.pathname;

    // 检查是否需要认证
    if (requiresAuth(pathname)) {
      const authHeader = request.headers.get('authorization');
      const apiKey = request.headers.get('x-api-key');

      // 检查认证令牌或API密钥
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (!apiKey) {
          const response = NextResponse.json(
            { success: false, message: '未授权访问，请提供有效的认证令牌或API密钥' },
            { status: 401 }
          );
          return addSecurityHeaders(response);
        }
      }
    }

    // 添加API密钥到请求头
    const requestHeaders = new Headers(request.headers);
    if (API_KEY) {
      requestHeaders.set('x-api-key', API_KEY);
    }

    // 添加请求ID用于追踪
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    requestHeaders.set('x-request-id', requestId);

    // 继续处理请求，但附带修改后的请求头
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return addSecurityHeaders(response);
  }

  // 对于非API路由，添加安全头
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

// 配置中间件应该应用的路径
export const config = {
  matcher: ['/api/:path*'],
};
