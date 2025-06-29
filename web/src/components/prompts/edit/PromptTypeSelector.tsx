import React from 'react';
import { motion } from 'framer-motion';

export type PromptType = 'chat' | 'image' | 'video' | 'multimodal';

interface PromptTypeSelectorProps {
  value: PromptType;
  onChange: (type: PromptType) => void;
  disabled?: boolean;
  className?: string;
}

const typeOptions = [
  {
    value: 'chat' as const,
    label: '对话提示词',
    icon: '💬',
    description: '适用于文本对话、问答、写作助手等场景。支持变量替换和上下文管理。',
    color: 'neon-cyan'
  },
  {
    value: 'image' as const,
    label: '图像提示词',
    icon: '🖼️',
    description: '适用于AI图像生成场景。可以设置风格、尺寸、质量等参数，并上传示例图片。',
    color: 'neon-purple'
  },
  {
    value: 'video' as const,
    label: '视频提示词',
    icon: '🎬',
    description: '适用于AI视频生成场景。可以设置时长、帧率、运动强度等参数，并上传示例视频。',
    color: 'neon-pink'
  },
  {
    value: 'multimodal' as const,
    label: '多模态提示词',
    icon: '🔗',
    description: '适用于需要同时处理文本、图像、视频等多种模态的AI场景。',
    color: 'neon-blue'
  }
];

// 获取激活状态的样式
const getActiveStyles = (color: string) => {
  switch (color) {
    case 'neon-cyan':
      return 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan shadow-md';
    case 'neon-purple':
      return 'border-neon-purple bg-neon-purple/20 text-neon-purple shadow-md';
    case 'neon-pink':
      return 'border-neon-pink bg-neon-pink/20 text-neon-pink shadow-md';
    case 'neon-blue':
      return 'border-neon-blue bg-neon-blue/20 text-neon-blue shadow-md';
    default:
      return 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan shadow-md';
  }
};

// 获取激活状态的圆点样式
const getActiveDotStyles = (color: string) => {
  switch (color) {
    case 'neon-cyan':
      return 'bg-neon-cyan';
    case 'neon-purple':
      return 'bg-neon-purple';
    case 'neon-pink':
      return 'bg-neon-pink';
    case 'neon-blue':
      return 'bg-neon-blue';
    default:
      return 'bg-neon-cyan';
  }
};

export default function PromptTypeSelector({
  value,
  onChange,
  disabled = false,
  className = ''
}: PromptTypeSelectorProps) {
  return (
    <div className={`${className}`}>
      {/* 扁平化的标签式切换按钮 - 居中显示 */}
      <div className="flex flex-wrap justify-center gap-3">
        {typeOptions.map((option) => (
          <motion.button
            key={option.value}
            whileHover={!disabled ? {
              scale: 1.02,
              boxShadow: value === option.value
                ? `0 0 20px ${option.color === 'neon-cyan' ? '#06b6d4' : option.color === 'neon-purple' ? '#8b5cf6' : '#ec4899'}40`
                : '0 4px 12px rgba(0, 0, 0, 0.3)'
            } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 text-sm font-medium
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${value === option.value
                ? getActiveStyles(option.color)
                : 'border-gray-600 hover:border-gray-500 bg-dark-bg-secondary/50 text-gray-300 hover:text-gray-200 hover:bg-dark-bg-secondary/70'
              }
            `}
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
          >
            <span className="text-lg">{option.icon}</span>
            <span className="font-medium">{option.label}</span>
            {value === option.value && (
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ duration: 0.3 }}
                className={`w-2 h-2 ${getActiveDotStyles(option.color)} rounded-full shadow-lg`}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* 简化的类型描述 - 去除背景框 */}
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="text-center mt-3"
      >
        <p className="text-xs text-gray-400">
          {typeOptions.find(option => option.value === value)?.description}
        </p>
      </motion.div>
    </div>
  );
}