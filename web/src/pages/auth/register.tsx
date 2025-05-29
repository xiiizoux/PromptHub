import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getRedirectUrl, buildUrlWithRedirect } from '@/lib/redirect';
import { EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, LockClosedIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { register: authRegister } = useAuth();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false
    }
  });

  const password = watch('password');
  
  // 检查用户是否已经登录
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    
    checkSession();
  }, [router]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await authRegister(data.username, data.email, data.password);
      setSuccessMessage('注册成功！请检查您的邮箱完成验证。');
      
      setTimeout(() => {
        const redirectUrl = typeof window !== 'undefined' ? getRedirectUrl(router) : null;
        const loginUrl = buildUrlWithRedirect('/auth/login?registered=true', redirectUrl);
        router.push(loginUrl);
      }, 3000);
    } catch (err: any) {
      console.error('注册失败:', err);
      setError(err.message || '注册失败，请稍后再试');
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

        {/* 主注册卡片 */}
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
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink p-0.5"
            >
              <div className="w-full h-full bg-dark-bg-primary rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-neon-purple" />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-3xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan bg-clip-text text-transparent mb-2"
            >
              创建新账户
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-gray-400"
            >
              加入 Prompt Hub，开始你的AI创作之旅
            </motion.p>
          </div>

          {/* 错误和成功提示 */}
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
                      <h3 className="text-sm font-medium text-red-300">注册失败</h3>
                      <div className="mt-1 text-sm text-red-200">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-8 mt-6"
              >
                <div className="p-4 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-300">注册成功</h3>
                      <div className="mt-1 text-sm text-green-200">
                        <p>{successMessage}</p>
                      </div>
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
            {/* 用户名输入 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <label htmlFor="username" className="block text-sm font-medium text-neon-purple mb-2">
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                </div>
                <motion.input
                  id="username"
                  type="text"
                  autoComplete="username"
                  whileFocus={{ scale: 1.02 }}
                  className={`w-full pl-12 pr-4 py-3 bg-dark-bg-secondary/50 border rounded-xl text-white placeholder-gray-500 transition-all duration-300 backdrop-blur-sm ${
                    errors.username 
                      ? 'border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400' 
                      : 'border-dark-border focus:border-neon-purple focus:ring-1 focus:ring-neon-purple focus:shadow-neon-sm'
                  }`}
                  placeholder="输入您的用户名"
                  {...register('username', { 
                    required: '请输入用户名',
                    minLength: {
                      value: 4,
                      message: '用户名必须至少包含4个字符'
                    },
                    maxLength: {
                      value: 20,
                      message: '用户名不能超过20个字符'
                    },
                    pattern: {
                      value: /^[A-Za-z0-9_-]+$/,
                      message: '用户名只能包含字母、数字、下划线和连字符'
                    },
                    validate: {
                      notReserved: value => {
                        // 转换为小写进行检查，确保不区分大小写
                        const lowerValue = value.toLowerCase();
                        const reservedNames = [
                          'admin', 'administrator', 'root', 'superuser', 'super', 
                          'system', 'sysadmin', 'user', 'test', 'guest', 
                          'manager', 'support', 'service', 'security',
                          'webmaster', 'postmaster', 'master', 'owner', 'staff'
                        ];
                        return !reservedNames.includes(lowerValue) || 
                          '此用户名为系统保留名，请使用其他用户名';
                      }
                    }
                  })}
                />
              </div>
              {errors.username && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.username.message}
                </motion.p>
              )}
            </motion.div>

            {/* 邮箱输入 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
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
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-neon-pink mb-2">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500" />
                </div>
                <motion.input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  whileFocus={{ scale: 1.02 }}
                  className={`w-full pl-12 pr-12 py-3 bg-dark-bg-secondary/50 border rounded-xl text-white placeholder-gray-500 transition-all duration-300 backdrop-blur-sm ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400' 
                      : 'border-dark-border focus:border-neon-pink focus:ring-1 focus:ring-neon-pink focus:shadow-neon-sm'
                  }`}
                  placeholder="输入您的密码"
                  {...register('password', { 
                    required: '请输入密码',
                    minLength: {
                      value: 8,
                      message: '密码必须至少包含8个字符'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&#\-_+=,.;:]{8,}$/,
                      message: '密码必须包含至少一个大写字母、一个小写字母和一个数字'
                    }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-neon-pink transition-colors duration-300"
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

            {/* 确认密码输入 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neon-pink mb-2">
                确认密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500" />
                </div>
                <motion.input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  whileFocus={{ scale: 1.02 }}
                  className={`w-full pl-12 pr-12 py-3 bg-dark-bg-secondary/50 border rounded-xl text-white placeholder-gray-500 transition-all duration-300 backdrop-blur-sm ${
                    errors.confirmPassword 
                      ? 'border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400' 
                      : 'border-dark-border focus:border-neon-pink focus:ring-1 focus:ring-neon-pink focus:shadow-neon-sm'
                  }`}
                  placeholder="再次输入您的密码"
                  {...register('confirmPassword', { 
                    required: '请确认密码',
                    validate: value => value === password || '两次输入的密码不匹配'
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-neon-pink transition-colors duration-300"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.confirmPassword.message}
                </motion.p>
              )}
            </motion.div>

            {/* 同意条款 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="flex items-start"
            >
              <input
                id="agreeTerms"
                type="checkbox"
                className={`h-4 w-4 text-neon-cyan focus:ring-neon-cyan border-dark-border rounded bg-dark-bg-secondary mt-1 ${
                  errors.agreeTerms ? 'border-red-500' : ''
                }`}
                {...register('agreeTerms', { 
                  required: '您必须同意服务条款和隐私政策'
                })}
              />
              <label htmlFor="agreeTerms" className="ml-3 block text-sm text-gray-300">
                我同意{' '}
                <Link href="/terms" className="text-neon-cyan hover:text-neon-purple transition-colors duration-300">
                  服务条款
                </Link>
                {' '}和{' '}
                <Link href="/privacy" className="text-neon-cyan hover:text-neon-purple transition-colors duration-300">
                  隐私政策
                </Link>
              </label>
            </motion.div>
            {errors.agreeTerms && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm"
              >
                {errors.agreeTerms.message}
              </motion.p>
            )}

            {/* 注册按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
            >
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-white shadow-neon hover:shadow-neon-lg'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>正在注册...</span>
                    </>
                  ) : (
                    <>
                      <span>注册</span>
                      <ArrowRightIcon className="w-5 w-5" />
                    </>
                  )}
                </div>
              </motion.button>
            </motion.div>
          </motion.form>

          {/* 登录链接 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
            className="p-8 pt-0 text-center"
          >
            <p className="text-gray-400">
              已有账户?{' '}
              <Link 
                href={buildUrlWithRedirect('/auth/login', redirectUrl)}
                className="text-neon-cyan hover:text-neon-purple transition-colors duration-300 font-medium"
              >
                立即登录
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