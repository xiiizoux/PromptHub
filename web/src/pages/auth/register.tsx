import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getRedirectUrl, buildUrlWithRedirect } from '@/lib/redirect';

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
  const router = useRouter();
  const { register: authRegister } = useAuth(); // 使用AuthContext中的注册函数
  
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
    // 只在客户端执行
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
      // 使用AuthContext中的register方法注册新用户
      await authRegister(data.username, data.email, data.password);
      
      // 注册成功
      setSuccessMessage('注册成功！请检查您的邮箱完成验证。');
      
      // 等待3秒后重定向到登录页，保持原始重定向参数
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            创建新账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            或{' '}
            <Link 
              href={buildUrlWithRedirect('/auth/login', typeof window !== 'undefined' ? getRedirectUrl(router) : null)}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              登录到已有账户
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  注册失败
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  注册成功
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{successMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">用户名</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                placeholder="用户名"
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
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="sr-only">电子邮件</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                placeholder="电子邮件"
                {...register('email', { 
                  required: '请输入电子邮件',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '请输入有效的电子邮件地址'
                  }
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">密码</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                placeholder="密码"
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">确认密码</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                placeholder="确认密码"
                {...register('confirmPassword', { 
                  required: '请确认密码',
                  validate: value => value === password || '两次输入的密码不匹配'
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="agreeTerms"
              type="checkbox"
              className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${
                errors.agreeTerms ? 'border-red-300' : ''
              }`}
              {...register('agreeTerms', { 
                required: '您必须同意服务条款和隐私政策'
              })}
            />
            <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-900">
              我同意{' '}
              <Link href="/terms" className="font-medium text-primary-600 hover:text-primary-500">
                服务条款
              </Link>
              {' '}和{' '}
              <Link href="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
                隐私政策
              </Link>
            </label>
          </div>
          {errors.agreeTerms && (
            <p className="mt-1 text-sm text-red-600">{errors.agreeTerms.message}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  正在注册...
                </>
              ) : '注册'}
            </button>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="text-sm">
              <Link href="/" className="font-medium text-gray-600 hover:text-gray-500">
                返回首页
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// 添加getServerSideProps防止静态生成
export async function getServerSideProps() {
  return {
    props: {}, // 返回空props
  };
}

