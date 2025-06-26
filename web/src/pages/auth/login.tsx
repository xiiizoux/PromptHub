import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getRedirectUrl, buildUrlWithRedirect, handlePostLoginRedirect } from '@/lib/redirect';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });
  
  // 检查用户是否已经登录，如果是则重定向到目标页面
  useEffect(() => {
    let checkTimeout: NodeJS.Timeout;
    
    const checkSession = async () => {
      try {
        console.log('检查现有会话...');
        
        // 添加超时处理，避免无限等待
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('会话检查超时')), 8000),
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise,
        ]) as any;
        
        if (error) {
          console.error('检查会话失败:', error);
          return;
        }
        
        if (session && session.user) {
          console.log('发现已登录会话，重定向...');
          handlePostLoginRedirect(router);
        } else {
          console.log('无现有会话，显示登录表单');
        }
      } catch (err: any) {
        console.error('检查会话异常:', err);
        // 即使检查失败，也要显示登录表单
        if (err.message.includes('超时')) {
          console.warn('会话检查超时，显示登录表单');
        }
      } finally {
        // 确保在任何情况下都会结束初始化状态
        setInitializing(false);
      }
    };
    
    // 设置一个兜底的超时，确保不会无限等待
    checkTimeout = setTimeout(() => {
      console.warn('会话检查超时，强制结束初始化');
      setInitializing(false);
    }, 10000);
    
    checkSession();
    
    return () => {
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
    };
  }, [router]);

  // 如果还在初始化，显示加载界面
  if (initializing) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  const onSubmit = async (data: LoginFormData) => {
    console.log('登录表单提交:', data);
    setIsLoading(true);
    setError(null);

    try {
      console.log('开始调用login函数...');
      await login(data.email, data.password, data.remember);
      handlePostLoginRedirect(router);
    } catch (err: any) {
      console.error('登录失败:', err);
      setError(err.message || '登录失败，请检查您的凭据');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    
    try {
      await loginWithGoogle();
      // Google OAuth会重定向到callback页面，无需手动处理
    } catch (err: any) {
      console.error('Google登录失败:', err);
      setError(err.message || 'Google登录失败，请稍后再试');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const redirectUrl = typeof window !== 'undefined' ? getRedirectUrl(router) : null;

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden flex items-center justify-center">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/4 w-64 h-64 bg-gradient-to-br from-neon-cyan/10 to-neon-pink/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        {/* 返回首页链接 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Link href="/" className="inline-flex items-center text-neon-cyan hover:text-neon-purple transition-colors duration-300 group">
            <motion.div
              whileHover={{ x: -5 }}
              className="flex items-center"
            >
              <SparklesIcon className="h-5 w-5 mr-2 group-hover:shadow-neon-sm transition-all duration-300" />
              <span className="font-medium">返回 Prompt Hub</span>
            </motion.div>
          </Link>
        </motion.div>

        {/* 主登录卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/5 backdrop-blur-lg rounded-2xl border border-dark-border shadow-2xl overflow-hidden"
        >
          {/* 头部区域 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="p-8 text-center border-b border-dark-border"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.6 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple p-0.5"
            >
              <div className="w-full h-full bg-dark-bg-primary rounded-full flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-neon-cyan" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold gradient-text mb-2">欢迎回来</h1>
            <p className="text-gray-400">登录您的 Prompt Hub 账户</p>
          </motion.div>

          {/* 错误提示 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-8 mt-6"
              >
                <div className="p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-red-200">{error}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 表单区域 */}
          <motion.form 
            onSubmit={handleSubmit(onSubmit)} 
            className="p-8 space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {/* 邮箱输入 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-neon-cyan mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                </div>
                <motion.input
                  id="email"
                  type="email"
                  autoComplete="email"
                  whileFocus={{ scale: 1.02 }}
                  className={`w-full pl-12 pr-4 py-3 bg-dark-bg-secondary/50 border rounded-xl text-white placeholder-gray-500 transition-all duration-300 backdrop-blur-sm ${
                    errors.email 
                      ? 'border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400' 
                      : 'border-dark-border focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan focus:shadow-neon-sm'
                  }`}
                  placeholder="输入您的邮箱地址"
                  {...register('email', { 
                    required: '请输入电子邮件',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: '请输入有效的电子邮件地址',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </motion.div>

            {/* 密码输入 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-neon-purple mb-2">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500" />
                </div>
                <motion.input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  whileFocus={{ scale: 1.02 }}
                  className={`w-full pl-12 pr-12 py-3 bg-dark-bg-secondary/50 border rounded-xl text-white placeholder-gray-500 transition-all duration-300 backdrop-blur-sm ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400' 
                      : 'border-dark-border focus:border-neon-purple focus:ring-1 focus:ring-neon-purple focus:shadow-neon-sm'
                  }`}
                  placeholder="输入您的密码"
                  {...register('password', { 
                    required: '请输入密码',
                    minLength: {
                      value: 6,
                      message: '密码必须至少包含6个字符',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-neon-purple transition-colors duration-300"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </motion.div>

            {/* 记住我和忘记密码 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-neon-cyan focus:ring-neon-cyan border-dark-border rounded bg-dark-bg-secondary"
                  {...register('remember')}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-300">
                  记住我
                </label>
              </div>

              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-neon-pink hover:text-white transition-colors duration-300"
              >
                忘记密码?
              </Link>
            </motion.div>

            {/* 登录按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              <motion.button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                whileHover={{ scale: isLoading || isGoogleLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading || isGoogleLoading ? 1 : 0.98 }}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                  isLoading || isGoogleLoading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink text-white shadow-neon hover:shadow-neon-lg'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>正在登录...</span>
                    </>
                  ) : (
                    <>
                      <span>登录</span>
                      <ArrowRightIcon className="w-5 h-5" />
                    </>
                  )}
                </div>
              </motion.button>
            </motion.div>

            {/* 分割线 */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="relative"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-dark-bg-primary text-gray-400">或者</span>
              </div>
            </motion.div>

            {/* Google登录按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
            >
              <motion.button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
                whileHover={{ scale: isLoading || isGoogleLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading || isGoogleLoading ? 1 : 0.98 }}
                className={`w-full py-3 px-4 border rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-3 ${
                  isLoading || isGoogleLoading
                    ? 'bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-white/5 border-dark-border text-white hover:bg-white/10 hover:border-neon-cyan backdrop-blur-sm'
                }`}
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>使用 Google 登录</span>
              </motion.button>
            </motion.div>
          </motion.form>

          {/* 注册链接和问题排查 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="p-8 pt-0 text-center space-y-4"
          >
            <p className="text-gray-400">
              还没有账户?{' '}
              <Link 
                href={buildUrlWithRedirect('/auth/register', redirectUrl)}
                className="text-neon-cyan hover:text-neon-purple transition-colors duration-300 font-medium"
              >
                立即注册
              </Link>
            </p>
            
            {/* 添加故障排查链接 */}
            <div className="border-t border-dark-border pt-4">
              <p className="text-gray-500 text-sm mb-2">登录遇到问题？</p>
              <Link 
                href="/auth/clear-auth"
                className="inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors duration-300 text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                解决登录卡死问题
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// 添加getServerSideProps防止静态生成
export async function getServerSideProps() {
  return {
    props: {},
  };
}