import { NextRequest, NextResponse } from 'next/server';
import { addSecurityHeaders, handleCORS } from './middleware/security';



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
  '/api/social/',
];

// 公开访问的API路由（不需要认证）
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/auth/signin',
  '/api/auth/register',
  '/api/prompts/search',
  '/api/prompts/index',
  '/api/categories',
  '/api/tags',
  '/api/public-prompts',
  '/api/templates',
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

// addSecurityHeaders 函数现在从 security.ts 导入

export async function middleware(request: NextRequest) {
  // 处理CORS预检请求
  const corsResponse = handleCORS(request);
  if (corsResponse) {
    return corsResponse;
  }

  const pathname = request.nextUrl.pathname;

  // 对于非API路由，只添加安全头，认证由客户端AuthContext处理
  if (!pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // 处理API路由的请求
  if (requiresAuth(pathname)) {
    const authHeader = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');

    // 检查认证令牌或API密钥
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (!apiKey) {
        const response = NextResponse.json(
          { success: false, message: '未授权访问，请提供有效的认证令牌或API密钥' },
          { status: 401 },
        );
        return addSecurityHeaders(response);
      }
    }
  }

  // 添加请求头
  const requestHeaders = new Headers(request.headers);

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

// 注意：页面级别的认证检查已移除，现在由客户端AuthContext和withAuth HOC处理
// 这样可以避免服务端和客户端认证状态不一致导致的重定向循环问题

// 配置中间件应该应用的路径 - 现在只处理API路由和安全头
export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
