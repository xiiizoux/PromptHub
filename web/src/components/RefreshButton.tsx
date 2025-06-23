import React from 'react';
import { motion } from 'framer-motion';

// 定义刷新图标组件
const RefreshIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
    />
  </svg>
);

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  loading = false,
  className = '',
  size = 'md',
  text = '刷新',
}) => {
  // 根据尺寸确定样式
  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-3',
    lg: 'text-base py-3 px-4',
  };

  // 图标尺寸
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <motion.button
      whileHover={{ scale: loading ? 1 : 1.05 }}
      whileTap={{ scale: loading ? 1 : 0.95 }}
      onClick={loading ? undefined : onClick}
      disabled={loading}
      className={`flex items-center space-x-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors ${sizeClasses[size]} ${className}`}
    >
      <RefreshIcon className={`${iconSize[size]} ${loading ? 'animate-spin' : ''}`} />
      {text && <span>{loading ? '加载中...' : text}</span>}
    </motion.button>
  );
};

export { RefreshIcon };
export default RefreshButton;