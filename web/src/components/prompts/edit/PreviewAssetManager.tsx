import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhotoIcon, 
  VideoCameraIcon, 
  TrashIcon, 
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PromptType } from './PromptTypeSelector';

interface AssetFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

interface PreviewAssetManagerProps {
  promptType: PromptType;
  assets: AssetFile[];
  onAssetsChange: (assets: AssetFile[]) => void;
  maxAssets?: number;
  maxFileSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
}

export default function PreviewAssetManager({
  promptType,
  assets,
  onAssetsChange,
  maxAssets = 4,
  maxFileSize = promptType === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024, // 10MB for images, 100MB for videos
  disabled = false,
  className = '',
}: PreviewAssetManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageType = promptType === 'image';
  const isVideoType = promptType === 'video';
  const acceptedTypes = isImageType ? 'image/*' : 'video/*';
  const fileTypeLabel = isImageType ? '图片' : '视频';
  const maxSizeLabel = isImageType ? '10MB' : '100MB';

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 验证文件
  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `文件大小超过${maxSizeLabel}限制`;
    }
    
    if (isImageType && !file.type.startsWith('image/')) {
      return '请选择图片文件';
    }
    
    if (isVideoType && !file.type.startsWith('video/')) {
      return '请选择视频文件';
    }
    
    return null;
  };

  // 真实文件上传
  const uploadFile = async (file: File): Promise<AssetFile> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 获取认证token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('用户未登录，请先登录后再上传文件');
      }

      const formData = new FormData();
      formData.append('file', file);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`文件 ${file.name} 上传失败`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || `文件 ${file.name} 上传失败`);
      }

      const assetFile: AssetFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: result.data.url,
        name: file.name,
        size: file.size,
        type: file.type,
      };

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

      return assetFile;
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      console.error('文件上传错误:', error);
      throw error;
    }
  };

  // 处理文件选择
  const handleFileSelect = async (files: FileList) => {
    if (disabled) {return;}

    const fileArray = Array.from(files);
    
    // 检查文件数量限制
    if (assets.length + fileArray.length > maxAssets) {
      alert(`最多只能上传${maxAssets}个${fileTypeLabel}文件`);
      return;
    }

    // 验证文件
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }
    }

    // 上传文件
    try {
      const uploadPromises = fileArray.map(file => uploadFile(file));
      const newAssets = await Promise.all(uploadPromises);
      onAssetsChange([...assets, ...newAssets]);
    } catch (error) {
      console.error('File upload failed:', error);
      alert(error instanceof Error ? error.message : '文件上传失败，请重试');
    }
  };

  // 处理拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {setDragOver(true);}
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) {return;}
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  // 删除文件
  const removeAsset = (id: string) => {
    const updatedAssets = assets.filter(asset => asset.id !== id);
    onAssetsChange(updatedAssets);
  };

  // 渲染文件预览
  const renderAssetPreview = (asset: AssetFile) => (
    <motion.div
      key={asset.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative group bg-dark-bg-secondary rounded-lg overflow-hidden border border-gray-600"
    >
      {/* 预览内容 */}
      <div className="relative w-full h-32 sm:h-40 md:h-48 lg:h-56">
        {isImageType ? (
          <Image
            src={asset.url}
            alt={asset.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <video
            src={asset.url}
            className="w-full h-full object-cover"
            controls
            preload="metadata"
          />
        )}
      </div>

      {/* 文件信息 */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-200 truncate" title={asset.name}>
          {asset.name}
        </p>
        <p className="text-xs text-gray-400">
          {formatFileSize(asset.size)}
        </p>
      </div>

      {/* 删除按钮 */}
      <button
        type="button"
        onClick={() => removeAsset(asset.id)}
        className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        title="删除文件"
      >
        <TrashIcon className="h-4 w-4 text-white" />
      </button>
    </motion.div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="flex items-center text-base font-medium text-gray-200">
        {isImageType ? (
          <PhotoIcon className="h-4 w-4 text-neon-purple mr-2" />
        ) : (
          <VideoCameraIcon className="h-4 w-4 text-neon-purple mr-2" />
        )}
        示例{fileTypeLabel} ({assets.length}/{maxAssets})*
      </label>

      {/* 媒体版本管理警告说明 */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-yellow-400 font-medium mb-1">媒体文件不支持版本管理</p>
            <p className="text-yellow-300/80">
              媒体文件不会保存到版本历史中，版本回滚时保持当前状态，请谨慎删改
            </p>
          </div>
        </div>
      </div>

      {/* 上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${dragOver ? 'border-neon-cyan bg-neon-cyan/5' : 'border-gray-600 hover:border-gray-500'}
          ${isUploading ? 'border-neon-cyan bg-neon-cyan/5' : ''}
        `}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {isUploading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto"></div>
            <p className="text-gray-300">正在上传{fileTypeLabel}...</p>
            <div className="w-full max-w-xs mx-auto bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-neon-cyan h-2 rounded-full"
                style={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-gray-400">{uploadProgress}%</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="text-5xl text-gray-400">
              {isImageType ? '🖼️' : '🎬'}
            </div>
            <div>
              <p className="text-gray-300 mb-2">
                拖拽文件到此处或点击上传{fileTypeLabel}
              </p>
              <p className="text-sm text-gray-500">
                支持 {isImageType ? 'JPG, PNG, WebP, GIF' : 'MP4, WebM, MOV, AVI'} 格式
              </p>
              <p className="text-sm text-gray-500">
                单个文件最大 {maxSizeLabel}，最多上传 {maxAssets} 个文件
              </p>
            </div>
            
            {assets.length < maxAssets && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-blue text-white rounded-lg font-medium hover:from-neon-cyan-dark hover:to-neon-blue-dark transition-all inline-flex items-center gap-2"
              >
                <ArrowUpTrayIcon className="h-5 w-5" />
                选择{fileTypeLabel}文件
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* 已上传文件列表 */}
      <AnimatePresence>
        {assets.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {assets.map(renderAssetPreview)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 提示信息 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`text-sm rounded-lg p-3 ${
          assets.length === 0 
            ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' 
            : 'bg-green-500/10 border border-green-500/20 text-green-400'
        }`}
      >
        <div className="flex items-start gap-2">
          {assets.length === 0 ? (
            <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium mb-1">
              {assets.length === 0 ? '需要上传文件' : '文件上传完成'}
            </p>
            <ul className="text-xs space-y-1 opacity-90">
              <li>• 至少上传1个{fileTypeLabel}文件作为示例展示</li>
              <li>• 最多可上传{maxAssets}个文件</li>
              <li>• 文件大小限制：{maxSizeLabel}</li>
              <li>• 文件将用于提示词的预览和展示</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}