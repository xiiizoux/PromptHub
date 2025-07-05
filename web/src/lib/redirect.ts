import { NextRouter } from 'next/router';

/**
 * 重定向工具函数
 */

// 获取重定向URL
export const getRedirectUrl = (router: NextRouter): string | null => {
  // 支持多种重定向参数名称
  return (router.query.returnUrl || router.query.redirect) as string || null;
};

// 构建带重定向参数的URL
export const buildUrlWithRedirect = (baseUrl: string, redirectUrl?: string | null): string => {
  if (!redirectUrl) {return baseUrl;}
  
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}redirect=${encodeURIComponent(redirectUrl)}`;
};

// 重定向到登录页面
export const redirectToLogin = (router: NextRouter, currentPath?: string): void => {
  const redirectUrl = currentPath || router.asPath;
  const loginUrl = buildUrlWithRedirect('/auth/login', redirectUrl);
  router.push(loginUrl);
};

// 重定向到注册页面
export const redirectToRegister = (router: NextRouter, currentPath?: string): void => {
  const redirectUrl = currentPath || router.asPath;
  const registerUrl = buildUrlWithRedirect('/auth/register', redirectUrl);
  router.push(registerUrl);
};

// 执行登录后重定向
export const handlePostLoginRedirect = (router: NextRouter, defaultPath: string = '/'): void => {
  const redirectUrl = getRedirectUrl(router);
  router.push(redirectUrl || defaultPath);
};

// 检查是否为安全的重定向URL（防止开放重定向攻击）
export const isSafeRedirectUrl = (url: string): boolean => {
  try {
    // 如果是相对路径，认为是安全的
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true;
    }
    
    // 如果是绝对URL，检查是否为同域
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin === window.location.origin;
  } catch {
    return false;
  }
};

// 安全的重定向函数
export const safeRedirect = (router: NextRouter, url: string, fallback: string = '/'): void => {
  if (isSafeRedirectUrl(url)) {
    router.push(url);
  } else {
    router.push(fallback);
  }
}; 