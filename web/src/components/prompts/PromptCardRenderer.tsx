import React from 'react';
import { PromptInfo } from '@/types';
import PromptCard from './PromptCard';
import ImagePromptCard from './ImagePromptCard';
import VideoPromptCard from './VideoPromptCard';

interface PromptCardRendererProps {
  prompt: PromptInfo & {
    category_type?: 'chat' | 'image' | 'video';
    preview_asset_url?: string;
    parameters?: Record<string, any>;
  };
}

/**
 * 智能提示词卡片渲染器
 * 根据提示词类型自动选择合适的卡片组件进行渲染
 */
const PromptCardRenderer: React.FC<PromptCardRendererProps> = ({ prompt }) => {
  // 如果没有必要的数据，不渲染
  if (!prompt || !prompt.id) {
    return null;
  }

  // 根据分类类型选择合适的卡片组件
  switch (prompt.category_type) {
    case 'image':
      return <ImagePromptCard prompt={prompt} />;
    
    case 'video':
      return <VideoPromptCard prompt={prompt} />;
    
    case 'chat':
    default:
      // 对话类型或未指定类型使用默认卡片
      return <PromptCard prompt={prompt} />;
  }
};

export default PromptCardRenderer;