import React from 'react';
import Link from 'next/link';
import { PromptInfo } from '@/types';
import { StarIcon, DocumentTextIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface PromptCardProps {
  prompt: PromptInfo;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt }) => {
  // 辅助函数：格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知日期';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // 辅助函数：格式化分类名称
  const formatCategory = (category?: string) => {
    if (!category) return '未分类';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  // 辅助函数：渲染评分星星
  const renderStars = (rating?: number) => {
    const stars = [];
    const ratingValue = rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= ratingValue) {
        stars.push(<StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />);
      } else {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    
    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-1 text-xs text-gray-600">({ratingValue.toFixed(1)})</span>
      </div>
    );
  };

  // 辅助函数：渲染标签
  const renderTags = (tags?: string[]) => {
    if (!tags || tags.length === 0) return null;
    
    return (
      <div className="mt-3 flex flex-wrap gap-1">
        {tags.slice(0, 3).map((tag, index) => (
          <span 
            key={index}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
          >
            {tag}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500">
            +{tags.length - 3}
          </span>
        )}
      </div>
    );
  };

  return (
    <Link href={`/prompts/${prompt.name}`} className="block">
      <div className="prompt-card hover:border-primary-300 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <span className="inline-flex items-center rounded-full bg-secondary-50 px-2 py-1 text-xs font-medium text-secondary-700">
              {formatCategory(prompt.category)}
            </span>
            {prompt.usageCount && prompt.usageCount > 100 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                热门
              </span>
            )}
          </div>
          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400" />
        </div>
        
        <h3 className="mt-3 text-lg font-medium text-gray-900 line-clamp-1">{prompt.name}</h3>
        
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
          {prompt.description || '没有描述'}
        </p>
        
        {/* 标签显示 */}
        {renderTags(prompt.tags)}
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
            <span className="ml-1 text-xs text-gray-500">
              v{prompt.version || '1.0'}
            </span>
          </div>
          
          {renderStars(prompt.rating)}
        </div>
        
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div>
            {prompt.author ? `由 ${prompt.author} 创建` : '未知作者'}
          </div>
          <div>
            {formatDate(prompt.updated_at || prompt.created_at)}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PromptCard;
