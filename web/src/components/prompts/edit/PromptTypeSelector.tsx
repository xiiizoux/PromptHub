import React from 'react';
import { motion } from 'framer-motion';

export type PromptType = 'chat' | 'image' | 'video';

interface PromptTypeSelectorProps {
  value: PromptType;
  onChange: (type: PromptType) => void;
  disabled?: boolean;
  className?: string;
}

const typeOptions = [
  { 
    value: 'chat' as const, 
    label: '对话', 
    icon: '💬', 
    description: '文本交互、问答、分析',
    color: 'neon-cyan'
  },
  { 
    value: 'image' as const, 
    label: '图像', 
    icon: '🖼️', 
    description: 'AI图像生成',
    color: 'neon-purple'
  },
  { 
    value: 'video' as const, 
    label: '视频', 
    icon: '🎬', 
    description: 'AI视频生成',
    color: 'neon-pink'
  }
];

export default function PromptTypeSelector({ 
  value, 
  onChange, 
  disabled = false,
  className = '' 
}: PromptTypeSelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {typeOptions.map((option) => (
          <motion.div
            key={option.value}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={`
              relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${value === option.value
                ? `border-${option.color} bg-${option.color}/10 shadow-lg`
                : 'border-gray-600 hover:border-gray-500 bg-dark-bg-secondary/50'
              }
            `}
            onClick={() => !disabled && onChange(option.value)}
          >
            <div className="text-center">
              <div className="text-3xl mb-3">{option.icon}</div>
              <div className="font-semibold text-gray-200 mb-1">{option.label}</div>
              <div className="text-xs text-gray-400">{option.description}</div>
            </div>
            
            {value === option.value && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute -top-2 -right-2 w-6 h-6 bg-${option.color} rounded-full flex items-center justify-center shadow-lg`}
              >
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* 类型描述 */}
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-3 rounded-lg bg-dark-bg-secondary/30 border border-gray-600"
      >
        <p className="text-sm text-gray-400">
          {value === 'chat' && '适用于文本对话、问答、写作助手等场景。支持变量替换和上下文管理。'}
          {value === 'image' && '适用于AI图像生成场景。可以设置风格、尺寸、质量等参数，并上传示例图片。'}
          {value === 'video' && '适用于AI视频生成场景。可以设置时长、帧率、运动强度等参数，并上传示例视频。'}
        </p>
      </motion.div>
    </div>
  );
}