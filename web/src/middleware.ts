import { NextRequest, NextResponse } from 'next/server';

// API基础URL
const API_BASE_URL = process.env.API_URL || 'http://localhost:9010';
// API密钥
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error('API_KEY环境变量未设置。请在.env文件中设置API_KEY。');
}

export function middleware(request: NextRequest) {
  // 只处理API路由的请求
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // 获取认证头
    const authHeader = request.headers.get('authorization');
    
    // 对于需要认证的API路由，检查认证头
    if (request.nextUrl.pathname.startsWith('/api/auth/me') || 
        request.nextUrl.pathname.startsWith('/api/prompts/create') ||
        request.nextUrl.pathname.startsWith('/api/prompts/update')) {
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, message: '未授权访问，请提供有效的认证令牌' },
          { status: 401 }
        );
      }
    }
    
    // 添加API密钥到请求头
    const requestHeaders = new Headers(request.headers);
    if (API_KEY) {
      requestHeaders.set('x-api-key', API_KEY);
    }
    
    // 继续处理请求，但附带修改后的请求头
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // 对于非API路由，不做任何处理
  return NextResponse.next();
}

// 配置中间件应该应用的路径
export const config = {
  matcher: ['/api/:path*'],
};
