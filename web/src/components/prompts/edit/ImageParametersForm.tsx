import React from 'react';
import { motion } from 'framer-motion';
import { AdjustmentsHorizontalIcon, SparklesIcon } from '@heroicons/react/24/outline';

export interface ImageParameters {
  style?: string;
  aspect_ratio?: string;
  resolution?: string;
  quality?: string;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
  negative_prompt?: string;
}

interface ImageParametersFormProps {
  value: ImageParameters;
  onChange: (parameters: ImageParameters) => void;
  disabled?: boolean;
  className?: string;
}

const styleOptions = [
  { value: 'photorealistic', label: '写实摄影', description: '真实照片效果' },
  { value: 'artistic', label: '艺术风格', description: '绘画艺术效果' },
  { value: 'anime', label: '动漫风格', description: '日系动漫效果' },
  { value: 'cartoon', label: '卡通风格', description: '西式卡通效果' },
  { value: 'oil_painting', label: '油画风格', description: '传统油画效果' },
  { value: 'watercolor', label: '水彩风格', description: '水彩画效果' },
  { value: 'sketch', label: '素描风格', description: '铅笔素描效果' },
  { value: 'digital_art', label: '数字艺术', description: '现代数字创作' }
];

const aspectRatioOptions = [
  { value: '1:1', label: '方形 (1:1)', description: '1024×1024' },
  { value: '16:9', label: '横屏 (16:9)', description: '1920×1080' },
  { value: '9:16', label: '竖屏 (9:16)', description: '1080×1920' },
  { value: '4:3', label: '标准 (4:3)', description: '1024×768' },
  { value: '3:4', label: '肖像 (3:4)', description: '768×1024' },
  { value: '21:9', label: '超宽 (21:9)', description: '2560×1080' }
];

const qualityOptions = [
  { value: 'draft', label: '草图', description: '快速生成，质量较低' },
  { value: 'standard', label: '标准', description: '平衡质量与速度' },
  { value: 'high', label: '高质量', description: '高质量，生成较慢' },
  { value: 'ultra', label: '超高质量', description: '最高质量，生成最慢' }
];

export default function ImageParametersForm({
  value,
  onChange,
  disabled = false,
  className = ''
}: ImageParametersFormProps) {
  const updateParameter = (key: keyof ImageParameters, paramValue: any) => {
    onChange({
      ...value,
      [key]: paramValue
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <AdjustmentsHorizontalIcon className="h-6 w-6 text-neon-purple" />
        <h3 className="text-lg font-semibold text-gray-200">图像生成参数</h3>
        <SparklesIcon className="h-5 w-5 text-neon-cyan" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 风格选择 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            风格样式
          </label>
          <select
            value={value.style || 'photorealistic'}
            onChange={(e) => updateParameter('style', e.target.value)}
            disabled={disabled}
            className="input-primary w-full"
          >
            {styleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* 宽高比 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            宽高比
          </label>
          <select
            value={value.aspect_ratio || '1:1'}
            onChange={(e) => updateParameter('aspect_ratio', e.target.value)}
            disabled={disabled}
            className="input-primary w-full"
          >
            {aspectRatioOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* 质量设置 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            生成质量
          </label>
          <select
            value={value.quality || 'standard'}
            onChange={(e) => updateParameter('quality', e.target.value)}
            disabled={disabled}
            className="input-primary w-full"
          >
            {qualityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* 引导强度 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            引导强度
            <span className="ml-2 text-xs text-gray-500">
              ({value.guidance_scale || 7})
            </span>
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={value.guidance_scale || 7}
              onChange={(e) => updateParameter('guidance_scale', parseFloat(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>创意性强</span>
              <span>严格遵循</span>
            </div>
          </div>
        </div>

        {/* 推理步数 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            推理步数
            <span className="ml-2 text-xs text-gray-500">
              ({value.num_inference_steps || 50})
            </span>
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={value.num_inference_steps || 50}
              onChange={(e) => updateParameter('num_inference_steps', parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>速度快</span>
              <span>质量高</span>
            </div>
          </div>
        </div>

        {/* 随机种子 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            随机种子 (可选)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={value.seed || ''}
              onChange={(e) => updateParameter('seed', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="留空为随机生成"
              disabled={disabled}
              className="input-primary flex-1"
              min="0"
              max="4294967295"
            />
            <motion.button
              type="button"
              onClick={() => updateParameter('seed', Math.floor(Math.random() * 4294967295))}
              disabled={disabled}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-neon-purple/20 border border-neon-purple/30 rounded-lg text-neon-purple hover:bg-neon-purple/30 transition-colors text-sm"
            >
              随机
            </motion.button>
          </div>
          <p className="text-xs text-gray-500">
            相同种子会产生相似的结果，用于复现效果
          </p>
        </div>
      </div>

      {/* 负面提示词 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          负面提示词 (可选)
        </label>
        <textarea
          value={value.negative_prompt || ''}
          onChange={(e) => updateParameter('negative_prompt', e.target.value)}
          placeholder="描述不希望在图像中出现的内容，如：模糊、扭曲、低质量..."
          disabled={disabled}
          rows={3}
          className="input-primary w-full resize-none"
        />
        <p className="text-xs text-gray-500">
          描述不希望在生成图像中出现的元素，有助于提高生成质量
        </p>
      </div>

      {/* 参数预览 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-dark-bg-secondary/50 rounded-lg p-4 border border-gray-600"
      >
        <h4 className="text-sm font-medium text-gray-300 mb-3">参数预览</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-gray-500">风格:</span>
            <span className="ml-1 text-gray-300">
              {styleOptions.find(s => s.value === value.style)?.label || '写实摄影'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">宽高比:</span>
            <span className="ml-1 text-gray-300">{value.aspect_ratio || '1:1'}</span>
          </div>
          <div>
            <span className="text-gray-500">质量:</span>
            <span className="ml-1 text-gray-300">
              {qualityOptions.find(q => q.value === value.quality)?.label || '标准'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">引导强度:</span>
            <span className="ml-1 text-gray-300">{value.guidance_scale || 7}</span>
          </div>
          <div>
            <span className="text-gray-500">推理步数:</span>
            <span className="ml-1 text-gray-300">{value.num_inference_steps || 50}</span>
          </div>
          <div>
            <span className="text-gray-500">种子:</span>
            <span className="ml-1 text-gray-300">{value.seed || '随机'}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}