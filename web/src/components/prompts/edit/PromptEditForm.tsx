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
  InformationCircleIcon,
  XMarkIcon,
  PlusCircleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

import { PromptType } from './PromptTypeSelector';
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
  currentType?: PromptType; // 添加当前类型属性
  hasUnsavedChanges?: boolean;
  permissionCheck?: { canEdit: boolean; message: string };
  saveSuccess?: boolean;
  onUnsavedChanges?: (hasChanges: boolean) => void; // 通知外部组件状态变化
}

export default function PromptEditForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  categoriesByType,
  className = '',
  currentType: propCurrentType, // 接收外部传入的当前类型
  hasUnsavedChanges = false,
  permissionCheck,
  saveSuccess = false,
  onUnsavedChanges
}: PromptEditFormProps) {
  // 表单状态 - 优先使用外部传入的类型
  const [currentType, setCurrentType] = useState<PromptType>(
    propCurrentType || initialData?.category_type || 'chat'
  );
  const [previewAssets, setPreviewAssets] = useState<AssetFile[]>([]);
  
  // 变量和标签的本地状态
  const [variableInput, setVariableInput] = useState('');
  const [tagInput, setTagInput] = useState('');

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

  // 初始化时加载现有媒体文件
  useEffect(() => {
    if (initialData?.parameters?.media_files && Array.isArray(initialData.parameters.media_files)) {
      const existingAssets: AssetFile[] = initialData.parameters.media_files.map((file: any) => ({
        id: file.id || `existing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: file.url,
        name: file.name || 'Unknown file',
        size: file.size || 0,
        type: file.type || 'unknown'
      }));
      setPreviewAssets(existingAssets);
      setValue('preview_assets', existingAssets);
    }
  }, [initialData, setValue]);

  // 监听外部类型变化
  useEffect(() => {
    if (propCurrentType && propCurrentType !== currentType) {
      setCurrentType(propCurrentType);
      setValue('category_type', propCurrentType);
      
      // 重置相关字段
      setValue('category', '');
      setValue('preview_assets', []);
      setPreviewAssets([]);
      
      // 重置参数
      if (propCurrentType !== 'image') {
        setValue('image_parameters', {});
      }
      if (propCurrentType !== 'video') {
        setValue('video_parameters', {});
      }
      
      onUnsavedChanges?.(true);
    }
  }, [propCurrentType, currentType, setValue]);

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
      
      onUnsavedChanges?.(true);
    }
  };

  // 处理分类变化
  const handleCategoryChange = (category: string) => {
    setValue('category', category);
    onUnsavedChanges?.(true);
  };

  // 处理资源变化
  const handleAssetsChange = (assets: AssetFile[]) => {
    setPreviewAssets(assets);
    setValue('preview_assets', assets);
    onUnsavedChanges?.(true);
  };

  // 处理图像参数变化
  const handleImageParametersChange = (parameters: ImageParameters) => {
    setValue('image_parameters', parameters);
    onUnsavedChanges?.(true);
  };

  // 处理视频参数变化
  const handleVideoParametersChange = (parameters: VideoParameters) => {
    setValue('video_parameters', parameters);
    onUnsavedChanges?.(true);
  };

  // 表单提交处理
  const onFormSubmit = async (data: PromptEditFormData) => {
    try {
      await onSubmit(data);
      onUnsavedChanges?.(false);
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
    onUnsavedChanges?.(hasChanges);
  }, [watchedValues, initialData]);

  return (
    <div className={`space-y-8 ${className}`}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">

        {/* 提示词内容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="content" className="flex items-center text-lg font-semibold text-gray-200">
              <DocumentTextIcon className="h-6 w-6 text-neon-cyan mr-3" />
              提示词内容 *
              <span className="ml-2 text-sm font-normal text-gray-400">核心内容区域</span>
            </label>

            {/* 提示用户使用右侧栏的智能功能 */}
            <div className="text-sm text-gray-400">
              💡 使用右侧智能助手进行分析和优化
            </div>
          </div>
          
          <div className="relative">
            <textarea
              {...register('content', { required: '请输入提示词内容' })}
              rows={12}
              placeholder="在这里编写您的提示词内容。您可以使用 {{变量名}} 来定义动态变量..."
              className="input-primary w-full font-mono text-sm resize-none"
              disabled={isSubmitting}
            />
            
            <div className="absolute top-3 right-3 text-xs text-gray-500">
              使用 {'{{变量名}}'} 定义变量
            </div>
          </div>
          
          {errors.content && (
            <p className="text-neon-red text-sm mt-1">{errors.content.message}</p>
          )}
        </motion.div>

        {/* 媒体相关内容 - 移到提示词内容后面 */}
        <AnimatePresence>
          {(currentType === 'image' || currentType === 'video') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              {/* 预览资源管理 */}
              <PreviewAssetManager
                promptType={currentType}
                assets={previewAssets}
                onAssetsChange={handleAssetsChange}
                disabled={isSubmitting}
              />

              {/* 图像参数 */}
              {currentType === 'image' && (
                <div className="space-y-3">
                  <h3 className="text-base font-medium text-gray-200">
                    图像参数
                  </h3>
                  <Controller
                    name="image_parameters"
                    control={control}
                    render={({ field }) => (
                      <ImageParametersForm
                        value={field.value || {}}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </div>
              )}

              {/* 视频参数 */}
              {currentType === 'video' && (
                <div className="space-y-3">
                  <h3 className="text-base font-medium text-gray-200">
                    视频参数
                  </h3>
                  <Controller
                    name="video_parameters"
                    control={control}
                    render={({ field }) => (
                      <VideoParametersForm
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 基本信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* 标题 */}
          <div className="space-y-2">
            <label htmlFor="prompt-name" className="flex items-center text-sm font-medium text-gray-300 mb-3">
              <TagIcon className="h-5 w-5 text-neon-cyan mr-2" />
              提示词名称 *
            </label>
            <input
              id="prompt-name"
              {...register('name', { required: '请输入提示词名称' })}
              type="text"
              placeholder="为您的提示词起个响亮的名字"
              className="input-primary w-full"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-neon-red text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* 作者 */}
          <div className="space-y-2">
            <label htmlFor="author" className="flex items-center text-sm font-medium text-gray-300 mb-3">
              <UserIcon className="h-5 w-5 text-neon-purple mr-2" />
              作者
            </label>
            <input
              id="author"
              {...register('author')}
              type="text"
              className="input-primary w-full bg-gray-800 text-gray-400 cursor-not-allowed"
              disabled={true}
              readOnly
              title="创作者不可更改"
            />
            <p className="text-xs text-gray-500">创作者不可更改</p>
          </div>
        </motion.div>

        {/* 分类和版本 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
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
              <p className="text-neon-red text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* 版本 */}
          <div className="space-y-2">
            <label htmlFor="version" className="flex items-center text-sm font-medium text-gray-300 mb-3">
              <CogIcon className="h-5 w-5 text-neon-purple mr-2" />
              版本
            </label>
            <input
              id="version"
              {...register('version')}
              type="text"
              className="input-primary w-full"
              disabled={isSubmitting}
            />
          </div>
        </motion.div>

        {/* 描述 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-300 mb-3">
            <DocumentTextIcon className="h-5 w-5 text-neon-cyan mr-2" />
            描述 *
          </label>
          <textarea
            id="description"
            {...register('description', { required: '请输入描述' })}
            rows={3}
            placeholder="简要描述您的提示词的用途和特点..."
            className="input-primary w-full resize-none"
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="text-neon-red text-sm mt-1">{errors.description.message}</p>
          )}
        </motion.div>

        {/* 变量管理 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <label className="flex items-center text-sm font-medium text-gray-300">
            <TagIcon className="h-5 w-5 text-neon-purple mr-2" />
            输入变量
          </label>
          
          <Controller
            name="input_variables"
            control={control}
            render={({ field }) => {
              // 添加变量
              const addVariable = () => {
                if (variableInput && !field.value?.includes(variableInput)) {
                  const newVariables = [...(field.value || []), variableInput];
                  field.onChange(newVariables);
                  setVariableInput('');
                  onUnsavedChanges?.(true);
                }
              };

              // 删除变量
              const removeVariable = (variable: string) => {
                const newVariables = (field.value || []).filter((v: string) => v !== variable);
                field.onChange(newVariables);
                onUnsavedChanges?.(true);
              };

              // 处理回车键
              const handleKeyPress = (e: React.KeyboardEvent) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addVariable();
                }
              };

              return (
                <div className="space-y-3">
                  {/* 输入框 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={variableInput}
                      onChange={(e) => setVariableInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="添加新变量..."
                      className="input-primary flex-1"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={addVariable}
                      disabled={!variableInput || isSubmitting}
                      className="btn-primary px-3 py-2 disabled:opacity-50"
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* 显示现有变量 */}
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((variable: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30"
                        >
                          {variable}
                          <button
                            type="button"
                            onClick={() => removeVariable(variable)}
                            disabled={isSubmitting}
                            className="ml-2 hover:text-neon-red transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    在提示词内容中使用 {'{{变量名}}'} 格式来定义变量，系统会自动检测
                  </p>
                </div>
              );
            }}
          />
        </motion.div>

        {/* 标签管理 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <label className="flex items-center text-sm font-medium text-gray-300">
            <TagIcon className="h-5 w-5 text-neon-pink mr-2" />
            标签
          </label>
          
          <Controller
            name="tags"
            control={control}
            render={({ field }) => {
              // 添加标签
              const addTag = () => {
                if (tagInput && !field.value?.includes(tagInput)) {
                  const newTags = [...(field.value || []), tagInput];
                  field.onChange(newTags);
                  setTagInput('');
                  onUnsavedChanges?.(true);
                }
              };

              // 删除标签
              const removeTag = (tag: string) => {
                const newTags = (field.value || []).filter((t: string) => t !== tag);
                field.onChange(newTags);
                onUnsavedChanges?.(true);
              };

              // 处理回车键
              const handleKeyPress = (e: React.KeyboardEvent) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              };

              return (
                <div className="space-y-3">
                  {/* 输入框 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="添加新标签..."
                      className="input-primary flex-1"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      disabled={!tagInput || isSubmitting}
                      className="btn-primary px-3 py-2 disabled:opacity-50"
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* 显示现有标签 */}
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            disabled={isSubmitting}
                            className="ml-2 hover:text-neon-red transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    使用标签来帮助用户更好地发现和分类您的提示词
                  </p>
                </div>
              );
            }}
          />
        </motion.div>

        {/* 兼容模型 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <label className="flex items-center text-sm font-medium text-gray-300">
            <CpuChipIcon className="h-5 w-5 text-neon-cyan mr-2" />
            兼容模型
          </label>
          <Controller
            name="compatible_models"
            control={control}
            render={({ field }) => (
              <ModelSelector
                selectedModels={field.value || []}
                onChange={field.onChange}
                categoryType={currentType as 'chat' | 'image' | 'video' | 'multimodal'}
                placeholder="选择或添加兼容的AI模型..."
              />
            )}
          />
          <p className="text-xs text-gray-500">
            选择此提示词兼容的AI模型类型，支持文本、图像、音频、视频等多种模型
          </p>
        </motion.div>

        {/* 公开/私有选项和协作设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          {/* 公开/私有选项 */}
          <div className="flex items-center justify-between p-4 border border-neon-cyan/20 rounded-xl bg-dark-bg-secondary">
            <div className="flex items-center">
              <div className="mr-3 text-neon-cyan">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-300">公开分享</h3>
                <p className="text-gray-400 text-sm">所有人可以查看和使用您的提示词</p>
              </div>
            </div>
            <div className="flex items-center">
              <Controller
                name="is_public"
                control={control}
                render={({ field }) => (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neon-cyan rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
                  </label>
                )}
              />
            </div>
          </div>

          {/* 协作设置 */}
          <div className="space-y-4">
            <label className="flex items-center text-sm font-medium text-gray-300">
              <InformationCircleIcon className="h-5 w-5 text-neon-purple mr-2" />
              协作设置
            </label>
            
            <div className="relative flex items-start p-4 border border-neon-cyan/20 rounded-xl bg-dark-bg-secondary">
              <Controller
                name="allow_collaboration"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      className="h-4 w-4 text-neon-cyan border-gray-600 rounded focus:ring-neon-cyan"
                    />
                  </div>
                )}
              />
              <div className="ml-3">
                <label className="text-sm font-medium text-gray-300">
                  允许协作编辑
                </label>
                <div className="text-sm text-gray-400">
                  允许其他贡献者修改这个提示词的内容（编辑权限，仅在公开分享时有效）
                </div>
              </div>
            </div>

            {/* 编辑权限级别 */}
            <div className="p-4 border border-neon-cyan/20 rounded-xl bg-dark-bg-secondary">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                编辑权限级别
              </label>
              <Controller
                name="edit_permission"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    className="input-primary w-full"
                  >
                    <option value="owner_only">仅创建者可编辑</option>
                    <option value="collaborators">协作者可编辑</option>
                    <option value="public">所有人可编辑</option>
                  </select>
                )}
              />
            </div>
          </div>
        </motion.div>

        {/* 提交按钮和状态信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex justify-between items-end pt-8"
        >
          {/* 左侧状态信息 */}
          <div className="flex flex-col space-y-1">
            {/* 未保存更改提示 */}
            {hasUnsavedChanges && (
              <p className="text-xs text-yellow-400">
                <span className="text-yellow-400">⚠</span> 有未保存的更改
              </p>
            )}

            {/* 权限信息 */}
            {permissionCheck && permissionCheck.canEdit && (
              <p className="text-xs text-gray-500">
                <span className="text-neon-cyan">✓</span> {permissionCheck.message}
              </p>
            )}

            {/* 保存成功提示 */}
            {saveSuccess && (
              <p className="text-xs text-green-400">
                <span className="text-green-400">✓</span> 提示词已成功更新！
              </p>
            )}
          </div>

          {/* 右侧提交按钮 */}
          <div className="flex space-x-4">
            {onCancel && (
              <motion.button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary"
              >
                取消
              </motion.button>
            )}
            
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
                  <span>更新中...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>更新提示词</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
