import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next/types';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { ChevronLeftIcon, ShieldExclamationIcon, SparklesIcon } from '@heroicons/react/24/outline';

import { useAuth, withAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { updatePrompt, getCategories } from '@/lib/api';
import { databaseService } from '@/lib/database-service';
import { PromptDetails, PermissionCheck } from '@/types';
import PromptFormContainer from '@/components/prompts/PromptFormContainer';
import { PromptFormData } from '@/types/form';
import ContextualPromptEditor from '@/components/prompts/ContextualPromptEditor';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { UnsavedChangesDialog } from '@/components/ConfirmDialog';
import {
  checkEditPermission,
  getPermissionDescription,
} from '@/lib/permissions';
import {
  validateVersionFormat,
  canIncrementVersion,
  suggestNextVersion,
  formatVersionFromInt,
  parseVersionToInt,
  getVersionValidationMessage,
  formatVersionDisplay,
} from '@/lib/version-utils';

interface EditPromptPageProps {
  prompt: PromptDetails;
}

function EditPromptPage({ prompt }: EditPromptPageProps) {
  const router = useRouter();
  const { user, getToken } = useAuth();
  const { t } = useLanguage();

  // 格式化当前版本号 - 一位小数方案，确保格式一致
  const currentVersionFormatted = typeof prompt.version === 'number' 
    ? Math.round(prompt.version * 10) / 10  // 确保一位小数格式
    : parseVersionToInt(prompt.version || 1.0);

  // 修复edit_permission数据映射 - 支持更多变体
  const mapEditPermission = (serverValue: any): 'owner_only' | 'collaborators' | 'public' => {
    // 处理可能的各种格式
    const normalizedValue = String(serverValue).toLowerCase().trim();
    
    switch (normalizedValue) {
      case 'owner':
      case 'owner_only':
      case 'owneronly':
        return 'owner_only';
      case 'collaborators':
      case 'collaborator':
        return 'collaborators';
      case 'public':
      case 'everyone':
        return 'public';
      default:
        console.warn('未识别的编辑权限值:', serverValue, '使用默认值 owner_only');
        return 'owner_only';
    }
  };

  // 分类数据标准化处理 - 移除硬编码映射
  const normalizeCategoryName = (category: string | undefined): string => {
    if (!category) {return '';}

    // 只做基本的清理：去除多余空格
    return category.trim();
  };

  // 确保所有数据都有默认值并正确格式化
  const safePromptData = {
    name: prompt.name || '',
    description: prompt.description || '',
    content: prompt.content || '',
    category: normalizeCategoryName(prompt.category),
    tags: Array.isArray(prompt.tags) ? prompt.tags : [],
    input_variables: Array.isArray(prompt.input_variables) ? prompt.input_variables : [],
    compatible_models: Array.isArray(prompt.compatible_models) ? prompt.compatible_models : [],
    version: currentVersionFormatted,
    author: prompt.author || user?.display_name || user?.username || t('editPrompt.defaultAuthor', { fallback: '未知用户' }),
    template_format: prompt.template_format || 'text',
    is_public: prompt.is_public !== undefined ? Boolean(prompt.is_public) : false,
    allow_collaboration: prompt.allow_collaboration !== undefined ? Boolean(prompt.allow_collaboration) : false,
    edit_permission: mapEditPermission(prompt.edit_permission),
    collaborators: Array.isArray(prompt.collaborators) ? prompt.collaborators : [],
    category_type: prompt.category_type || 'chat', // 直接使用prompt.category_type，不需要类型断言

    // 媒体相关字段
    preview_asset_url: prompt.preview_asset_url,
    parameters: prompt.parameters || {},
  };

  console.log('EditPromptPage - safePromptData:', {
    name: safePromptData.name,
    category_type: safePromptData.category_type,
    hasPreviewAssetUrl: !!safePromptData.preview_asset_url,
    hasParameters: !!safePromptData.parameters,
    parametersKeys: safePromptData.parameters ? Object.keys(safePromptData.parameters) : [],
    mediaFilesCount: (safePromptData.parameters && typeof safePromptData.parameters === 'object' && 'media_files' in safePromptData.parameters && Array.isArray(safePromptData.parameters.media_files)) ? safePromptData.parameters.media_files.length : 0,
  });

  // 状态管理
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesByType, setCategoriesByType] = useState<Record<string, string[]>>({
    chat: [],
    image: [],
    video: [],
  });
  const [permissionCheck, setPermissionCheck] = useState<PermissionCheck | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editMode, setEditMode] = useState<'traditional' | 'context_engineering'>('traditional');

  // 浏览器离开页面警告 - 使用自定义对话框
  const { showConfirmDialog, onConfirmLeave, onCancelLeave, forceNavigate } = useBeforeUnload(
    hasUnsavedChanges, 
    t('editPrompt.unsavedWarning', { fallback: '您对提示词的修改尚未保存，确定要离开此页面吗？' }),
    true, // 使用自定义对话框
  );

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

        // 设置按类型分组的分类 - 转换为字符串数组
        const categoriesByTypeData = {
          chat: (chatCategories || []).map(cat => cat.name),
          image: (imageCategories || []).map(cat => cat.name),
          video: (videoCategories || []).map(cat => cat.name),
        };
        setCategoriesByType(categoriesByTypeData);

      } catch (err) {
        console.error('获取分类失败:', err);
        // 错误时设置空数组
        setCategoriesByType({ chat: [], image: [], video: [] });
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategoriesByType();
  }, []);

  // 权限检查和作者信息更新
  useEffect(() => {
    if (user) {
      const permission = checkEditPermission(prompt, user);
      setPermissionCheck(permission);
      
      // 如果没有权限，3秒后重定向到详情页
      if (!permission.canEdit) {
        setTimeout(() => {
          router.push(`/prompts/${prompt.id}`);
        }, 3000);
      }
    }
  }, [user, prompt, router]);


  // 表单提交处理
  const handleSubmit = async (data: PromptFormData) => {
    // 再次检查权限
    if (!permissionCheck?.canEdit) {
      toast.error(t('editPrompt.errors.noPermission', { fallback: '您没有编辑此提示词的权限' }));
      return;
    }

    try {
      // 确保版本号是整数格式（后端需要）
      const versionInt = typeof data.version === 'number' 
        ? data.version 
        : parseVersionToInt(String(data.version));
      
      const submitData = {
        ...data,
        version: versionInt,
      };
      
      console.log('提交的表单数据:', {
        原始版本: data.version,
        处理后版本: versionInt,
        其他数据: { ...submitData, content: submitData.content?.substring(0, 100) + '...' },
      });
      
      // 获取token
      let token = undefined;
      if (typeof window !== 'undefined' && user && typeof user === 'object') {
        if (typeof getToken === 'function') {
          token = await getToken();
        }
      }
      
      const result = await updatePrompt(prompt.id, submitData);
      
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      
      // 显示成功提示
      toast.success(t('editPrompt.success.updated', { fallback: '提示词更新成功！' }), {
        duration: 2000,
        position: 'top-center',
      });
      
      // 保存成功后强制跳转（忽略未保存状态检测）
      forceNavigate(`/prompts/${prompt.id}`);
    } catch (error: unknown) {
      console.error('更新提示词失败:', error);
      const errorMessage = error instanceof Error ? error.message : t('editPrompt.errors.unknownError', { fallback: '未知错误' });
      toast.error(t('editPrompt.errors.updateFailedMessage', { message: errorMessage, fallback: `❌ 更新失败: ${errorMessage}` }));
      throw error; // 重新抛出错误让组件处理isSubmitting状态
    }
  };

  // 权限检查失败时显示错误页面
  if (permissionCheck && !permissionCheck.canEdit) {
    return (
      <div className="bg-dark-bg-primary min-h-screen py-8">
        <div className="container-custom">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Link href={`/prompts/${prompt.id}`} className="inline-flex items-center text-sm font-medium text-neon-cyan hover:text-white transition-colors">
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              {t('editPrompt.backToDetails', { fallback: '返回提示词详情' })}
            </Link>
          </div>

          <div className="glass rounded-xl p-8 text-center border border-red-400/30 bg-red-500/10">
            <ShieldExclamationIcon className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">{t('editPrompt.permissionDenied.title', { fallback: '访问被拒绝' })}</h1>
            <p className="text-gray-300 mb-6">{permissionCheck.message}</p>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="text-sm text-yellow-300">
                <p className="font-medium mb-2">{t('editPrompt.permissionDenied.instructions.title', { fallback: '编辑权限说明：' })}</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>{t('editPrompt.permissionDenied.instructions.owner', { fallback: '您可以编辑自己创建的提示词' })}</li>
                  <li>{t('editPrompt.permissionDenied.instructions.admin', { fallback: '管理员可以编辑所有提示词' })}</li>
                  <li>{t('editPrompt.permissionDenied.instructions.contributor', { fallback: '贡献者可以编辑公开的提示词' })}</li>
                  <li>{t('editPrompt.permissionDenied.instructions.others', { fallback: '其他用户无法编辑他人的提示词' })}</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Link
                href={`/prompts/${prompt.id}`}
                className="px-6 py-3 bg-neon-cyan text-black rounded-lg hover:bg-cyan-400 transition-colors font-medium"
              >
                {t('editPrompt.permissionDenied.actions.viewDetails', { fallback: '查看提示词详情' })}
              </Link>
              <Link
                href="/prompts"
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                {t('editPrompt.permissionDenied.actions.browseOthers', { fallback: '浏览其他提示词' })}
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              {t('editPrompt.permissionDenied.autoRedirect', { fallback: '3秒后将自动跳转到提示词详情页面...' })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Context Engineering模式的保存处理
  const handleContextEngineeringSave = async (updatedPrompt: Partial<PromptDetails>) => {
    if (!permissionCheck?.canEdit) {
      toast.error(t('editPrompt.errors.noPermission', { fallback: '您没有编辑此提示词的权限' }));
      return;
    }

    try {
      const result = await updatePrompt(prompt.id, updatedPrompt);
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      
      toast.success(t('editPrompt.success.updated', { fallback: '提示词更新成功！' }), {
        duration: 2000,
        position: 'top-center',
      });
      
      forceNavigate(`/prompts/${prompt.id}`);
    } catch (error) {
      console.error('更新提示词失败:', error);
      const errorMessage = error instanceof Error ? error.message : t('editPrompt.errors.unknownError', { fallback: '未知错误' });
      toast.error(t('editPrompt.errors.updateFailedMessage', { message: errorMessage, fallback: `❌ 更新失败: ${errorMessage}` }));
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      {/* 编辑模式选择器 */}
      <div className="container-custom py-6">
        <div className="flex justify-between items-center mb-6">
          {/* 返回按钮 */}
          <Link href={`/prompts/${prompt.id}`} className="inline-flex items-center text-sm font-medium text-neon-cyan hover:text-white transition-colors">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            {t('editPrompt.backToDetails', { fallback: '返回提示词详情' })}
          </Link>

          {/* 编辑模式切换 */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">{t('editPrompt.editMode', { fallback: '编辑模式:' })}</span>
            <div className="flex bg-dark-bg-secondary rounded-lg p-1 border border-neon-cyan/30">
              <button
                onClick={() => setEditMode('traditional')}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                  editMode === 'traditional' 
                    ? 'bg-neon-cyan text-black font-medium' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('editPrompt.traditionalEdit', { fallback: '传统编辑' })}
              </button>
              <button
                onClick={() => setEditMode('context_engineering')}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 flex items-center ${
                  editMode === 'context_engineering' 
                    ? 'bg-neon-purple text-white font-medium' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <SparklesIcon className="h-4 w-4 mr-1" />
                {t('editPrompt.contextEngineering', { fallback: 'Context Engineering' })}
              </button>
            </div>
          </div>
        </div>

        {/* 条件渲染不同的编辑器 */}
        {editMode === 'traditional' ? (
          <PromptFormContainer
            mode="edit"
            initialData={safePromptData}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/prompts/${prompt.id}`)}
            categoriesByType={categoriesByType}
            pageTitle={t('editPrompt.traditionalMode.title', { fallback: '编辑提示词 - 传统模式' })}
            pageSubtitle={t('editPrompt.traditionalMode.subtitle', { fallback: '使用简单的表单编辑您的提示词' })}
            submitButtonText={t('editPrompt.submitButton', { fallback: '更新提示词' })}
            permissionCheck={permissionCheck}
            hasUnsavedChanges={hasUnsavedChanges}
            saveSuccess={saveSuccess}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        ) : (
          <ContextualPromptEditor
            prompt={safePromptData as PromptDetails}
            onSave={handleContextEngineeringSave}
            onCancel={() => router.push(`/prompts/${prompt.id}`)}
            isLoading={false}
          />
        )}
      </div>
      
      {/* 统一的未保存更改确认对话框 */}
      <UnsavedChangesDialog
        open={showConfirmDialog}
        onConfirm={onConfirmLeave}
        onCancel={onCancelLeave}
        context="form"
      />
    </div>
  );
}

export default withAuth(EditPromptPage);

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;

  try {
    console.log(`[Edit getServerSideProps] 获取提示词详情，ID: ${id}`);

    // 在服务端直接使用数据库服务，避免HTTP调用
    // 注意：getPromptByName 方法实际上支持通过ID或name查找
    const prompt = await databaseService.getPromptByName(id as string);

    if (!prompt) {
      console.log(`[Edit getServerSideProps] 未找到提示词，ID: ${id}`);
      return {
        notFound: true,
      };
    }

    console.log(`[Edit getServerSideProps] 成功获取提示词: ${prompt.name} (ID: ${prompt.id})`);

    return {
      props: {
        prompt: prompt,
      },
    };
  } catch (error: unknown) {
    console.error(`[Edit getServerSideProps] 获取提示词详情失败，ID: ${id}`, error);

    return {
      notFound: true,
    };
  }
};