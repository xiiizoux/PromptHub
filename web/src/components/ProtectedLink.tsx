import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';

interface ProtectedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  showLoginToast?: boolean;
  requireLogin?: boolean;
  onClick?: () => void;
}

/**
 * 受保护的链接组件
 * 未登录用户点击时会跳转到登录页面
 */
export const ProtectedLink: React.FC<ProtectedLinkProps> = ({
  href,
  children,
  className = '',
  showLoginToast = true,
  requireLogin = true,
  onClick,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 如果不需要登录保护，直接允许跳转
    if (!requireLogin) {
      onClick?.();
      return;
    }

    // 如果正在加载认证状态，阻止跳转
    if (isLoading) {
      e.preventDefault();
      if (showLoginToast) {
        toast.loading(t('messages.verifying_identity'), { duration: 1000 });
      }
      return;
    }

    // 如果未登录，阻止跳转并引导到登录页面
    if (!isAuthenticated) {
      e.preventDefault();
      
      if (showLoginToast) {
        toast.error(t('auth.login_required_access'), {
          duration: 3000,
          position: 'top-center',
        });
      }

      // 跳转到登录页面，带上当前要访问的页面作为returnUrl
      const currentUrl = href;
      router.push(`/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // 已登录，执行自定义点击处理
    onClick?.();
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
};

/**
 * 受保护的按钮组件
 * 未登录用户点击时会提示登录
 */
interface ProtectedButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  showLoginToast?: boolean;
  requireLogin?: boolean;
  disabled?: boolean;
}

export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  onClick,
  children,
  className = '',
  showLoginToast = true,
  requireLogin = true,
  disabled = false,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const handleClick = () => {
    // 如果按钮被禁用，不处理点击
    if (disabled) {return;}

    // 如果不需要登录保护，直接执行点击
    if (!requireLogin) {
      onClick();
      return;
    }

    // 如果正在加载认证状态，显示加载提示
    if (isLoading) {
      if (showLoginToast) {
        toast.loading(t('messages.verifying_identity'), { duration: 1000 });
      }
      return;
    }

    // 如果未登录，提示登录
    if (!isAuthenticated) {
      if (showLoginToast) {
        toast.error(t('auth.login_required_action'), {
          duration: 3000,
          position: 'top-center',
        });
      }

      // 跳转到登录页面
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // 已登录，执行点击处理
    onClick();
  };

  return (
    <button 
      onClick={handleClick}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}; 