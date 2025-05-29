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
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      remember: false
    }
  });
  
  // 检查用户是否已经登录，如果是则重定向到目标页面
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        handlePostLoginRedirect(router);
      }
    };
    
    checkSession();
  }, [router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await login(data.email, data.password, data.remember);
      handlePostLoginRedirect(router);
    } catch (err: any) {
      console.error('登录失败:', err);
      setError(err.message || '登录失败，请检查您的凭据');
    } finally {
      setIsLoading(false);
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
          <div className="p-8 text-center border-b border-dark-border bg-gradient-to-r from-dark-card/30 to-dark-card/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple p-0.5"
            >
              <div className="w-full h-full bg-dark-bg-primary rounded-full flex items-center justify-center">
                <LockClosedIcon className="w-8 h-8 text-neon-cyan" />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-2"
            >
              欢迎回来
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-gray-400"
            >
              登录到 Prompt Hub，继续你的AI创作之旅
            </motion.p>
          </div>

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
                      message: '请输入有效的电子邮件地址'
                    }
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
                  type={showPassword ? "text" : "password"}
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
                      message: '密码必须至少包含6个字符'
                    }
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
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                  isLoading
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
          </motion.form>

          {/* 注册链接 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="p-8 pt-0 text-center"
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