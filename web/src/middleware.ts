import { NextRequest, NextResponse } from 'next/server';
import { addSecurityHeaders, handleCORS } from './middleware/security';

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
  '/api/social/',
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

  // 处理页面路由的认证
  if (!pathname.startsWith('/api/')) {
    if (pageRequiresAuth(pathname)) {
      const hasAuth = await hasValidSession(request);
      
      if (!hasAuth) {
        // 重定向到登录页面，带上返回URL
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('returnUrl', pathname);
        
        const response = NextResponse.redirect(loginUrl);
        return addSecurityHeaders(response);
      }
    }
    
    // 对于非API路由，添加安全头
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

// 需要认证的页面路径
const PROTECTED_PAGES = [
  '/prompts/create',
  '/prompts/[id]/edit',
  '/profile',
  '/dashboard',
  '/settings',
];

// 检查页面是否需要认证
function pageRequiresAuth(pathname: string): boolean {
  return PROTECTED_PAGES.some(route => {
    // 支持动态路由匹配
    if (route.includes('[id]')) {
      const pattern = route.replace('[id]', '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
}

// 检查是否有有效的认证session
async function hasValidSession(request: NextRequest): Promise<boolean> {
  try {
    // 检查是否有Supabase认证相关的cookie
    const authCookies = request.cookies.getAll();
    const supabaseAccessToken = authCookies.find(cookie => 
      cookie.name.includes('supabase-auth-token') || 
      cookie.name.includes('sb-') && cookie.name.includes('auth-token')
    );
    
    // 如果没有访问令牌cookie，检查是否有其他认证标识
    if (!supabaseAccessToken) {
      const hasAnyAuthCookie = authCookies.some(cookie => 
        cookie.name.includes('supabase') || 
        cookie.name.includes('auth') ||
        cookie.name === 'prompthub-user'
      );
      
      // 如果有认证cookie但没有访问令牌，可能session已过期
      if (hasAnyAuthCookie) {
        console.log('发现认证cookie但缺少访问令牌，可能session已过期');
      }
      
      return hasAnyAuthCookie;
    }
    
    // 简单验证token格式（JWT应该有3个部分）
    const tokenValue = supabaseAccessToken.value;
    if (tokenValue && tokenValue.split('.').length === 3) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('检查session失败:', error);
    return false;
  }
}

// 配置中间件应该应用的路径
export const config = {
  matcher: ['/api/:path*', '/prompts/create', '/prompts/:path*/edit', '/profile', '/dashboard', '/settings'],
};
