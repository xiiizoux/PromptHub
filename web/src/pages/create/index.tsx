import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

import { useAuth, withAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { createPrompt, getCategories, getTags } from '@/lib/api';
import PromptFormContainer, { PromptFormData } from '@/components/prompts/PromptFormContainer';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { UnsavedChangesDialog } from '@/components/ConfirmDialog';

function CreatePromptPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  
  // 数据加载状态
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesByType, setCategoriesByType] = useState<Record<string, string[]>>({
    chat: [],
    image: [],
    video: [],
  });
  const [userReady, setUserReady] = useState(false);
  
  // 未保存状态管理
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 浏览器离开页面警告 - 使用自定义对话框
  const { showConfirmDialog, onConfirmLeave, onCancelLeave, forceNavigate } = useBeforeUnload(
    hasUnsavedChanges, 
    t('createPrompt.unsavedWarning', { fallback: '您的提示词内容尚未保存，确定要离开此页面吗？' }),
    true, // 使用自定义对话框
  );
  
  // 创建页面的权限检查（始终可以创建）
  const permissionCheck = user ? {
    canEdit: true,
    reason: 'owner' as const,
    message: t('createPrompt.permissionMessage', { fallback: '您是此提示词的创建者' }),
  } : null;

  // 用户状态监听和检查
  useEffect(() => {
    if (isLoading) {
      setUserReady(false);
      return;
    }

    if (user) {
      console.log('用户认证状态确认:', {
        id: user.id,
        username: user.username,
        email: user.email,
      });
      setUserReady(true);
    } else {
      setUserReady(false);
      console.log('用户未登录，等待认证处理...');
    }
  }, [user, isLoading]);

  // 获取分类数据 - 按类型分别获取
  useEffect(() => {
    const fetchCategoriesByType = async () => {
      setCategoriesLoading(true);
      try {
        console.log('开始获取类别数据...');

        // 分别获取三种类型的分类
        const [chatCategories, imageCategories, videoCategories] = await Promise.all([
          getCategories('chat'),
          getCategories('image'),
          getCategories('video'),
        ]);

        console.log('获取到的分类数据:', {
          chat: chatCategories,
          image: imageCategories,
          video: videoCategories,
        });

        // 设置按类型分组的分类 - 将对象数组转换为字符串数组
        const categoriesByTypeData = {
          chat: (chatCategories || []).map(cat => cat.name),
          image: (imageCategories || []).map(cat => cat.name),
          video: (videoCategories || []).map(cat => cat.name),
        };
        setCategoriesByType(categoriesByTypeData);

      } catch (err) {
        toast.error(t('createPrompt.errors.categoriesFailed', { fallback: '获取分类列表失败' }));
        console.error('获取分类失败:', err);
        // 错误时设置空数组
        setCategoriesByType({ chat: [], image: [], video: [] });
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategoriesByType();
  }, []);


  // 表单提交处理
  const handleSubmit = async (data: PromptFormData) => {
    // 认证状态检查
    if (!user || !userReady) {
      toast.error(t('createPrompt.errors.authError', { fallback: '用户认证状态异常，请重新登录' }));
      const currentUrl = window.location.pathname + window.location.search;
      router.replace(`/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    try {
      console.log('=== 开始提示词创建流程 ===');
      console.log('提交提示词数据:', data);
      
      // 构建完整的数据对象
      const promptData = {
        ...data,
        version: Number(data.version) || 1.0,
        // 创建提示词时，作者始终是当前登录用户
        author: user.display_name || user.username || user.email?.split('@')[0] || t('createPrompt.defaultAuthor', { fallback: '未知用户' }),
        input_variables: data.input_variables.filter(Boolean), // 过滤空值
        tags: data.tags.filter(Boolean), // 过滤空值
        compatible_models: data.compatible_models.filter(Boolean), // 过滤空值
      };

      console.log('即将创建的提示词:', promptData);
      
      // 使用新的超时机制
      const createPromptWithTimeout = () => {
        return new Promise<any>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(t('createPrompt.errors.timeoutExceeded', { fallback: '创建提示词总体超时(2分钟)，请检查网络连接并重试' })));
          }, 120000); // 2分钟总超时时间
          
          createPrompt(promptData as any)
            .then((result) => {
              clearTimeout(timeoutId);
              resolve(result);
            })
            .catch((error) => {
              clearTimeout(timeoutId);
              reject(error);
            });
        });
      };
      
      const newPrompt = await createPromptWithTimeout();
      console.log('提示词创建成功:', newPrompt);
      
      // 设置成功状态
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      
      // 显示成功提示
      toast.success(t('createPrompt.success.created', { fallback: '提示词创建成功！正在跳转...' }), {
        duration: 3000,
        position: 'top-center',
      });
      
      // 导航到新提示词页面 - 强制跳转，避免未保存状态拦截
      forceNavigate(`/prompts/${newPrompt.id}`);
    } catch (error: unknown) {
      console.error('=== 创建提示词失败 ===');
      console.error('错误详情:', error);
      
      // 提供用户友好的错误提示
      let errorMessage = t('createPrompt.errors.createFailed', { fallback: '创建提示词失败，请稍后重试' });
      let canRetry = true;
      
      if (error instanceof Error && error.message) {
        if (error.message.includes('网络') || error.message.includes('Network')) {
          errorMessage = t('createPrompt.errors.networkError', { fallback: '网络连接问题，请检查网络状态并重试' });
        } else if (error.message.includes('超时') || error.message.includes('timeout')) {
          errorMessage = t('createPrompt.errors.timeout', { fallback: '请求超时，可能是网络较慢，请稍后重试' });
        } else if (error.message.includes('认证') || error.message.includes('登录') || error.message.includes('token')) {
          errorMessage = t('createPrompt.errors.authExpired', { fallback: '登录状态已过期，请重新登录' });
          canRetry = false; // 认证问题不建议重试

          // 认证失效时自动重定向到登录页面
          setTimeout(() => {
            const currentUrl = window.location.pathname + window.location.search;
            router.replace(`/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`);
          }, 2000);
        } else if (error.message.includes('权限')) {
          errorMessage = t('createPrompt.errors.permissionDenied', { fallback: '权限不足，请联系管理员' });
          canRetry = false;
        } else if (error.message.includes('服务器')) {
          errorMessage = t('createPrompt.errors.serverError', { fallback: '服务器暂时不可用，请稍后重试' });
        } else if (error.message.includes('参数错误')) {
          errorMessage = t('createPrompt.errors.invalidParams', { fallback: '请检查输入内容是否正确' });
          canRetry = false;
        } else {
          errorMessage = error.message;
        }
      }
      
      // 显示错误提示
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
      });
      
      // 根据错误类型决定是否显示重试选项
      if (canRetry && typeof window !== 'undefined' && window.confirm) {
        const retry = window.confirm(`${errorMessage}\n\n${t('createPrompt.retry', { fallback: '是否重试？' })}`);
        if (retry) {
          // 给用户一点时间，然后重试
          setTimeout(() => {
            handleSubmit(data);
          }, 2000); // 延长重试间隔
          return;
        }
      } else if (!canRetry) {
        // 对于不可重试的错误，提供相应的指导
        if (errorMessage.includes('登录')) {
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      }
      
      // 在开发环境下输出错误信息
      if (process.env.NODE_ENV === 'development') {
        console.log('创建提示词失败，错误详情:', error);
      }

      throw error; // 重新抛出错误让组件处理isSubmitting状态
    }
  };

  // 如果用户信息还在加载或用户未准备就绪，显示加载状态
  if (isLoading || !userReady) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">{t('createPrompt.loadingUserInfo', { fallback: '正在加载用户信息...' })}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PromptFormContainer
        mode="create"
        onSubmit={handleSubmit}
        categoriesByType={categoriesByType}
        pageTitle={t('createPrompt.title', { fallback: '创建提示词' })}
        pageSubtitle={t('createPrompt.subtitle', { fallback: '释放AI的无限潜能，打造专属的智能提示词' })}
        submitButtonText={t('createPrompt.submitButton', { fallback: '创建提示词' })}
        permissionCheck={permissionCheck}
        hasUnsavedChanges={hasUnsavedChanges}
        saveSuccess={saveSuccess}
        onUnsavedChanges={setHasUnsavedChanges}
      />
      
      {/* 统一的未保存更改确认对话框 */}
      <UnsavedChangesDialog
        open={showConfirmDialog}
        onConfirm={onConfirmLeave}
        onCancel={onCancelLeave}
        context="form"
      />
    </>
  );
}

export default withAuth(CreatePromptPage);