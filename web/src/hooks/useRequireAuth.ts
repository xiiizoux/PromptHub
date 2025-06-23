import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface UseRequireAuthOptions {
  redirectTo?: string;
  showToast?: boolean;
  returnUrl?: boolean;
}

/**
 * 自定义hook，用于要求用户登录
 * 如果用户未登录，则自动重定向到登录页面
 */
export const useRequireAuth = (options: UseRequireAuthOptions = {}) => {
  const { 
    redirectTo = '/auth/login', 
    showToast = true, 
    returnUrl = true, 
  } = options;
  
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 如果还在加载认证状态，不做任何操作
    if (isLoading) return;

    // 如果未登录，重定向到登录页面
    if (!isAuthenticated) {
      if (showToast) {
        toast.error('请先登录以访问此页面', {
          duration: 3000,
          position: 'top-center',
        });
      }

      let redirectUrl = redirectTo;
      
      // 如果需要返回当前页面，添加returnUrl参数
      if (returnUrl) {
        const currentUrl = window.location.pathname + window.location.search;
        redirectUrl += `?returnUrl=${encodeURIComponent(currentUrl)}`;
      }

      router.replace(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, showToast, returnUrl]);

  return {
    isAuthenticated,
    isLoading,
    isReady: !isLoading && isAuthenticated,
  };
};

/**
 * 检查是否已登录的工具函数
 * 可以在组件中用于条件渲染
 */
export const useAuthCheck = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    isReady: !isLoading,
    requireLogin: (action: () => void, options: { showToast?: boolean } = {}) => {
      if (isLoading) {
        if (options.showToast !== false) {
          toast.loading('正在验证身份...', { duration: 1000 });
        }
        return;
      }

      if (!isAuthenticated) {
        if (options.showToast !== false) {
          toast.error('请先登录以使用此功能', {
            duration: 3000,
            position: 'top-center',
          });
        }
        
        // 可以在这里添加跳转到登录页面的逻辑
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`;
        return;
      }

      // 已登录，执行操作
      action();
    },
  };
}; 