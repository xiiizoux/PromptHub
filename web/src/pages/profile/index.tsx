import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth, withAuth } from '@/contexts/AuthContext';
import { User } from '@/types';

interface ProfileFormData {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // 当用户信息加载完成后重置表单
  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user, reset]);

  const newPassword = watch('newPassword');

  // 提交个人信息更新
  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // 根据是否更改密码决定发送的数据
      const updateData: any = {
        username: data.username,
      };

      // 如果用户选择更改密码
      if (isPasswordChangeOpen && data.currentPassword && data.newPassword) {
        updateData.currentPassword = data.currentPassword;
        updateData.newPassword = data.newPassword;
      }

      // 调用API更新用户信息
      const token = localStorage.getItem('auth_token');
      const response = await axios.put('/api/auth/profile', updateData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSuccessMessage('个人信息更新成功');
        // 如果更改了密码，重置密码字段
        if (isPasswordChangeOpen) {
          reset({
            ...data,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setIsPasswordChangeOpen(false);
        }
      } else {
        setErrorMessage(response.data.message || '更新失败，请稍后再试');
      }
    } catch (err: any) {
      console.error('更新个人信息失败:', err);
      setErrorMessage(err.response?.data?.message || '更新失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取用户创建的提示词数量
  const [promptCount, setPromptCount] = useState(0);
  useEffect(() => {
    const fetchPromptCount = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`/api/prompts/count?author=${user.username}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.count !== undefined) {
          setPromptCount(response.data.count);
        }
      } catch (err) {
        console.error('获取提示词数量失败:', err);
      }
    };
    
    fetchPromptCount();
  }, [isAuthenticated, user]);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-tight">
        {/* 个人资料导航栏 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">账户管理</h2>
          </div>
          <div className="p-0">
            <nav className="flex divide-x divide-gray-200">
              <a href="/profile" className="flex-1 px-4 py-3 text-center text-primary-600 font-medium border-b-2 border-primary-600">
                个人资料
              </a>
              <a href="/profile/api-keys" className="flex-1 px-4 py-3 text-center text-gray-500 hover:text-gray-900 font-medium hover:bg-gray-50">
                API密钥管理
              </a>
            </nav>
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">个人资料</h1>
            <p className="mt-2 text-gray-600">
              查看和更新您的个人信息
            </p>
          </div>

          <div className="p-6">
            {/* 成功消息 */}
            {successMessage && (
              <div className="mb-6 bg-green-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      {successMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 错误消息 */}
            {errorMessage && (
              <div className="mb-6 bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 左侧：用户信息卡片 */}
              <div className="md:col-span-1">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white text-4xl font-bold">
                      {user?.username.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">{user?.username}</h3>
                    <p className="text-gray-500">{user?.email}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      加入于 {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '未知日期'}
                    </p>
                  </div>
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">角色</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {user?.role === 'admin' ? '管理员' : user?.role === 'contributor' ? '贡献者' : '用户'}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-500">创建的提示词</span>
                      <span className="text-sm font-medium text-gray-900">{promptCount}</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => router.push('/prompts?author=' + user?.username)}
                      className="w-full btn-outline"
                    >
                      查看我的提示词
                    </button>
                  </div>
                </div>
              </div>

              {/* 右侧：个人信息表单 */}
              <div className="md:col-span-2">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        用户名
                      </label>
                      <input
                        type="text"
                        id="username"
                        className={`mt-1 input ${errors.username ? 'border-red-500' : ''}`}
                        {...register('username', { 
                          required: '请输入用户名',
                          minLength: {
                            value: 3,
                            message: '用户名必须至少包含3个字符'
                          },
                          maxLength: {
                            value: 20,
                            message: '用户名不能超过20个字符'
                          },
                          pattern: {
                            value: /^[A-Za-z0-9_-]+$/,
                            message: '用户名只能包含字母、数字、下划线和连字符'
                          }
                        })}
                      />
                      {errors.username && (
                        <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        电子邮件
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="mt-1 input bg-gray-100"
                        value={user?.email || ''}
                        disabled
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        电子邮件地址不可更改
                      </p>
                    </div>

                    {/* 密码更改区域 */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">更改密码</h3>
                        <button
                          type="button"
                          onClick={() => setIsPasswordChangeOpen(!isPasswordChangeOpen)}
                          className="text-sm text-primary-600 hover:text-primary-500"
                        >
                          {isPasswordChangeOpen ? '取消' : '更改密码'}
                        </button>
                      </div>

                      {isPasswordChangeOpen && (
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                              当前密码
                            </label>
                            <input
                              type="password"
                              id="currentPassword"
                              className={`mt-1 input ${errors.currentPassword ? 'border-red-500' : ''}`}
                              {...register('currentPassword', { 
                                required: '请输入当前密码'
                              })}
                            />
                            {errors.currentPassword && (
                              <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                              新密码
                            </label>
                            <input
                              type="password"
                              id="newPassword"
                              className={`mt-1 input ${errors.newPassword ? 'border-red-500' : ''}`}
                              {...register('newPassword', { 
                                required: '请输入新密码',
                                minLength: {
                                  value: 8,
                                  message: '密码必须至少包含8个字符'
                                },
                                pattern: {
                                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
                                  message: '密码必须包含至少一个大写字母、一个小写字母和一个数字'
                                }
                              })}
                            />
                            {errors.newPassword && (
                              <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                              确认新密码
                            </label>
                            <input
                              type="password"
                              id="confirmPassword"
                              className={`mt-1 input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                              {...register('confirmPassword', { 
                                required: '请确认新密码',
                                validate: value => value === newPassword || '两次输入的密码不匹配'
                              })}
                            />
                            {errors.confirmPassword && (
                              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="btn-outline mr-3"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`btn-primary ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            保存中...
                          </>
                        ) : '保存更改'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 使用身份验证高阶组件包装组件
export default withAuth(ProfilePage);
