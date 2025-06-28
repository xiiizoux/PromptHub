import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import {
  DocumentTextIcon,
  TagIcon,
  UserIcon,
  CogIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

import PromptTypeSelector, { PromptType } from './PromptTypeSelector';
import CategorySelector from './CategorySelector';
import PreviewAssetManager from './PreviewAssetManager';
import ImageParametersForm, { ImageParameters } from './ImageParametersForm';
import VideoParametersForm, { VideoParameters } from './VideoParametersForm';
import { ModelSelector } from '@/components/ModelSelector';

import { PromptDetails } from '@/types';

// 资源文件接口
interface AssetFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

// 表单数据接口
export interface PromptEditFormData {
  name: string;
  description: string;
  content: string;
  category_type: PromptType;
  category: string;
  tags: string[];
  author: string;
  is_public: boolean;
  allow_collaboration: boolean;
  edit_permission: 'owner_only' | 'collaborators' | 'public';
  compatible_models: string[];
  input_variables: string[];
  template_format: string;
  version: string | number;
  
  // 媒体相关字段
  preview_assets: AssetFile[];
  image_parameters?: ImageParameters;
  video_parameters?: VideoParameters;
}

interface PromptEditFormProps {
  initialData?: Partial<PromptDetails>;
  onSubmit: (data: PromptEditFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  categoriesByType: Record<string, string[]>;
  className?: string;
}

export default function PromptEditForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  categoriesByType,
  className = ''
}: PromptEditFormProps) {
  // 表单状态
  const [currentType, setCurrentType] = useState<PromptType>(
    initialData?.category_type || 'chat'
  );
  const [previewAssets, setPreviewAssets] = useState<AssetFile[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 表单控制
  const { 
    register, 
    handleSubmit, 
    control, 
    formState: { errors }, 
    setValue, 
    watch, 
    reset 
  } = useForm<PromptEditFormData>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      content: initialData?.content || '',
      category_type: initialData?.category_type || 'chat',
      category: initialData?.category || '',
      tags: initialData?.tags || [],
      author: initialData?.author || '',
      is_public: initialData?.is_public ?? true,
      allow_collaboration: initialData?.allow_collaboration ?? false,
      edit_permission: initialData?.edit_permission || 'owner_only',
      compatible_models: initialData?.compatible_models || [],
      input_variables: initialData?.input_variables || [],
      template_format: initialData?.template_format || 'text',
      version: initialData?.version || 1.0,
      preview_assets: [],
      image_parameters: {},
      video_parameters: {}
    }
  });

  // 监听表单变化
  const watchedValues = watch();

  // 处理类型变化
  const handleTypeChange = (newType: PromptType) => {
    if (newType !== currentType) {
      setCurrentType(newType);
      setValue('category_type', newType);
      
      // 重置相关字段
      setValue('category', '');
      setValue('preview_assets', []);
      setPreviewAssets([]);
      
      // 重置参数
      if (newType !== 'image') {
        setValue('image_parameters', {});
      }
      if (newType !== 'video') {
        setValue('video_parameters', {});
      }
      
      setHasUnsavedChanges(true);
    }
  };

  // 处理分类变化
  const handleCategoryChange = (category: string) => {
    setValue('category', category);
    setHasUnsavedChanges(true);
  };

  // 处理资源变化
  const handleAssetsChange = (assets: AssetFile[]) => {
    setPreviewAssets(assets);
    setValue('preview_assets', assets);
    setHasUnsavedChanges(true);
  };

  // 处理图像参数变化
  const handleImageParametersChange = (parameters: ImageParameters) => {
    setValue('image_parameters', parameters);
    setHasUnsavedChanges(true);
  };

  // 处理视频参数变化
  const handleVideoParametersChange = (parameters: VideoParameters) => {
    setValue('video_parameters', parameters);
    setHasUnsavedChanges(true);
  };

  // 表单提交处理
  const onFormSubmit = async (data: PromptEditFormData) => {
    try {
      await onSubmit(data);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  // 检测变化
  useEffect(() => {
    const hasChanges = JSON.stringify(watchedValues) !== JSON.stringify({
      ...initialData,
      preview_assets: [],
      image_parameters: {},
      video_parameters: {}
    });
    setHasUnsavedChanges(hasChanges);
  }, [watchedValues, initialData]);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* 提示词类型选择 - 移到表单外部，居中显示 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center mb-8"
      >
        <div className="bg-dark-bg-secondary/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-6 shadow-lg">
          <PromptTypeSelector
            value={currentType}
            onChange={handleTypeChange}
            disabled={isSubmitting}
          />
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">

        {/* 基本信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h3 className="text-base font-medium text-gray-200 flex items-center gap-2">
            <DocumentTextIcon className="h-4 w-4 text-neon-purple" />
            基本信息
          </h3>

          {/* 标题 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              提示词标题 *
            </label>
            <input
              {...register('name', { required: '请输入提示词标题' })}
              type="text"
              placeholder="为您的提示词起一个清晰的标题"
              className="input-primary w-full"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-neon-red text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              描述 *
            </label>
            <textarea
              {...register('description', { required: '请输入提示词描述' })}
              rows={3}
              placeholder="简要描述这个提示词的用途和特点"
              className="input-primary w-full resize-none"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-neon-red text-sm">{errors.description.message}</p>
            )}
          </div>

          {/* 分类选择 */}
          <div className="space-y-2">
            <Controller
              name="category"
              control={control}
              rules={{ required: '请选择分类' }}
              render={({ field }) => (
                <CategorySelector
                  promptType={currentType}
                  value={field.value}
                  onChange={handleCategoryChange}
                  categoriesByType={categoriesByType}
                  disabled={isSubmitting}
                />
              )}
            />
            {errors.category && (
              <p className="text-neon-red text-sm">{errors.category.message}</p>
            )}
          </div>
        </motion.div>

        {/* 提示词内容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-base font-medium text-gray-200">
            提示词内容 *
          </h3>
          <textarea
            {...register('content', { required: '请输入提示词内容' })}
            rows={12}
            placeholder="在这里编写您的提示词内容。您可以使用 {{变量名}} 来定义动态变量..."
            className="input-primary w-full font-mono text-sm resize-none"
            disabled={isSubmitting}
          />
          {errors.content && (
            <p className="text-neon-red text-sm">{errors.content.message}</p>
          )}
        </motion.div>

        {/* 媒体相关内容 - 移到提示词内容下面 */}
        <AnimatePresence>
          {(currentType === 'image' || currentType === 'video') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* 预览资源管理 */}
              <div className="space-y-3">
                <h3 className="text-base font-medium text-gray-200">
                  示例文件
                </h3>
                <PreviewAssetManager
                  promptType={currentType}
                  assets={previewAssets}
                  onAssetsChange={handleAssetsChange}
                  disabled={isSubmitting}
                />
              </div>

              {/* 图像参数 */}
              {currentType === 'image' && (
                <div className="space-y-3">
                  <h3 className="text-base font-medium text-gray-200">
                    图像参数
                  </h3>
                  <ImageParametersForm
                    control={control}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* 视频参数 */}
              {currentType === 'video' && (
                <div className="space-y-3">
                  <h3 className="text-base font-medium text-gray-200">
                    视频参数
                  </h3>
                  <VideoParametersForm
                    control={control}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 兼容模型 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h3 className="text-base font-medium text-gray-200 flex items-center gap-2">
            <CpuChipIcon className="h-4 w-4 text-neon-cyan" />
            兼容模型
          </h3>
          <Controller
            name="compatible_models"
            control={control}
            render={({ field }) => (
              <ModelSelector
                selectedModels={field.value || []}
                onChange={field.onChange}
                categoryType={currentType}
                placeholder="选择或添加兼容的AI模型..."
                disabled={isSubmitting}
              />
            )}
          />
          <p className="text-xs text-gray-500">
            选择此提示词兼容的AI模型类型，支持文本、图像、音频、视频等多种模型
          </p>
        </motion.div>

        {/* 提交按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between pt-6 border-t border-gray-600"
        >
          <div className="flex items-center gap-2 text-sm text-gray-400">
            {hasUnsavedChanges ? (
              <>
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />
                <span>有未保存的更改</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 text-green-400" />
                <span>所有更改已保存</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                取消
              </button>
            )}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              className="px-8 py-2 bg-gradient-to-r from-neon-cyan to-neon-blue text-white rounded-lg font-medium hover:from-neon-cyan-dark hover:to-neon-blue-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '保存中...' : '保存提示词'}
            </motion.button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
