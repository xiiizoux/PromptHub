import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next/types';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { ChevronLeftIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

import { useAuth, withAuth } from '@/contexts/AuthContext';
import { updatePrompt, getCategories } from '@/lib/api';
import { databaseService } from '@/lib/database-service';
import { PromptDetails, PermissionCheck } from '@/types';
import PromptFormContainer, { PromptFormData } from '@/components/prompts/PromptFormContainer';
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

  // 分类数据标准化处理
  const normalizeCategoryName = (category: string | undefined): string => {
    if (!category) return '通用';
    
    // 清理分类名称：去除多余空格、统一格式
    const cleaned = category.trim();
    
    // 只做基本的英文到中文映射，不要随意更改中文分类名称
    const categoryMappings: { [key: string]: string } = {
      'general': '通用',
      'academic': '学术',
      'professional': '职业', 
      'creative': '文案',
      'design': '设计',
      'education': '教育',
      'entertainment': '娱乐',
      'game': '游戏',
      'life': '生活',
      'business': '商业',
      'office': '办公',
      'code': '编程',
      'programming': '编程',
      'translation': '翻译',
      'video': '视频',
      'podcast': '播客',
      'music': '音乐',
      'health': '健康',
      'technology': '科技',
    };
    
    // 检查是否为英文分类，如果是则映射为中文
    const mapped = categoryMappings[cleaned.toLowerCase()];
    if (mapped) return mapped;
    
    // 中文分类名称直接返回，不做映射
    return cleaned;
  };

  // 确保所有数据都有默认值并正确格式化
  const safePromptData = {
    name: prompt.name || '',
    description: prompt.description || '',
    content: prompt.content || prompt.messages?.[0]?.content || '',
    category: normalizeCategoryName(prompt.category),
    tags: Array.isArray(prompt.tags) ? prompt.tags : [],
    input_variables: Array.isArray(prompt.input_variables) ? prompt.input_variables : [],
    compatible_models: Array.isArray(prompt.compatible_models) ? prompt.compatible_models : [],
    version: currentVersionFormatted,
    author: prompt.author || user?.display_name || user?.username || '未知用户',
    template_format: prompt.template_format || 'text',
    is_public: prompt.is_public !== undefined ? Boolean(prompt.is_public) : false,
    allow_collaboration: prompt.allow_collaboration !== undefined ? Boolean(prompt.allow_collaboration) : false,
    edit_permission: mapEditPermission(prompt.edit_permission),
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
    mediaFilesCount: safePromptData.parameters?.media_files?.length || 0,
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

        // 设置按类型分组的分类
        const categoriesByTypeData = {
          chat: chatCategories || [],
          image: imageCategories || [],
          video: videoCategories || [],
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
      toast.error('您没有编辑此提示词的权限');
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
      toast.success('提示词更新成功！正在跳转...', {
        duration: 3000,
        position: 'top-center',
      });
      
      // 保存成功后直接跳转回详情页面，提供更好的用户体验
      router.push(`/prompts/${prompt.id}`);
    } catch (error: unknown) {
      console.error('更新提示词失败:', error);
      toast.error(`❌ 更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
      throw error; // 重新抛出错误让组件处理isSubmitting状态
    }
  };

  // 权限检查失败时显示错误页面
  if (permissionCheck && !permissionCheck.canEdit) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Link href={`/prompts/${prompt.id}`} className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              返回提示词详情
            </Link>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <ShieldExclamationIcon className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h1>
            <p className="text-gray-600 mb-6">{permissionCheck.message}</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-2">编辑权限说明：</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>您可以编辑自己创建的提示词</li>
                  <li>管理员可以编辑所有提示词</li>
                  <li>贡献者可以编辑公开的提示词</li>
                  <li>其他用户无法编辑他人的提示词</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Link
                href={`/prompts/${prompt.id}`}
                className="btn-primary"
              >
                查看提示词详情
              </Link>
              <Link
                href="/prompts"
                className="btn-secondary"
              >
                浏览其他提示词
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              3秒后将自动跳转到提示词详情页面...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PromptFormContainer
      mode="edit"
      initialData={safePromptData}
      onSubmit={handleSubmit}
      onCancel={() => router.push(`/prompts/${prompt.id}`)}
      categoriesByType={categoriesByType}
      pageTitle="编辑提示词"
      pageSubtitle="完善您的智能提示词，让AI更好地理解您的需求"
      submitButtonText="更新提示词"
      backLink={{
        href: `/prompts/${prompt.id}`,
        label: '返回提示词详情',
      }}
      permissionCheck={permissionCheck}
      hasUnsavedChanges={hasUnsavedChanges}
      saveSuccess={saveSuccess}
    />
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