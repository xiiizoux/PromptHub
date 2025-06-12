import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PromptInfo } from '@/types';
import { 
  StarIcon, 
  DocumentTextIcon, 
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  CodeBracketIcon,
  TagIcon,
  ClockIcon,
  UserIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { InteractionButtons } from '@/components/BookmarkButton';
import clsx from 'clsx';

interface PromptCardProps {
  prompt: PromptInfo & { id: string }; // 确保包含id字段
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
  
  // 辅助函数：格式化分类名称和颜色
  const getCategoryStyle = (category?: string) => {
    const categoryMap: Record<string, { name: string; color: string; icon: any }> = {
      coding: { name: '编程', color: 'from-neon-cyan to-neon-cyan-dark', icon: CodeBracketIcon },
      writing: { name: '写作', color: 'from-neon-pink to-neon-yellow', icon: DocumentTextIcon },
      analysis: { name: '分析', color: 'from-neon-yellow to-neon-green', icon: SparklesIcon },
      default: { name: '其他', color: 'from-gray-600 to-gray-700', icon: TagIcon }
    };
    
    const categoryInfo = categoryMap[category || 'default'] || categoryMap.default;
    return categoryInfo;
  };
  
  // 辅助函数：渲染评分
  const renderRating = (rating?: number) => {
    const ratingValue = rating || 0;
    const percentage = (ratingValue / 5) * 100;
    
    return (
      <div className="flex items-center space-x-2">
        <div className="relative w-20 h-2 bg-dark-bg-tertiary rounded-full overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-neon-yellow to-neon-green rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
        <span className="text-xs text-gray-400">{ratingValue.toFixed(1)}</span>
      </div>
    );
  };

  // 辅助函数：渲染标签
  const renderTags = (tags?: string[]) => {
    if (!tags || tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {tags.slice(0, 3).map((tag, index) => (
          <motion.span 
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass border border-neon-cyan/20 text-neon-cyan"
          >
            #{tag}
          </motion.span>
        ))}
        {tags.length > 3 && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass border border-gray-600 text-gray-400">
            +{tags.length - 3}
          </span>
        )}
      </div>
    );
  };

  const categoryInfo = getCategoryStyle(prompt.category);
  const CategoryIcon = categoryInfo.icon;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/prompts/${prompt.name}`}>
        <div className="card glass border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300 group cursor-pointer relative overflow-hidden">
          {/* 背景渐变 */}
          <div className={clsx(
            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300',
            categoryInfo.color
          )} />
          
          {/* 头部 */}
          <div className="relative flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2">
              <div className={clsx(
                'inline-flex p-2 rounded-lg bg-gradient-to-br',
                categoryInfo.color
              )}>
                <CategoryIcon className="h-4 w-4 text-dark-bg-primary" />
              </div>
              <span className="text-sm font-medium text-gray-300">{categoryInfo.name}</span>
              {prompt.usageCount && prompt.usageCount > 100 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="flex items-center space-x-1 px-2 py-1 rounded-full bg-neon-red/20 border border-neon-red/30"
                >
                  <FireIcon className="h-3 w-3 text-neon-red" />
                  <span className="text-xs text-neon-red">热门</span>
                </motion.div>
              )}
            </div>
            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-500 group-hover:text-neon-cyan transition-colors" />
          </div>
          
          {/* 标题 */}
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1 group-hover:text-neon-cyan transition-colors">
            {prompt.name}
          </h3>
          
          {/* 描述 */}
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">
            {prompt.description || '暂无描述'}
          </p>
          
          {/* 标签 */}
          {renderTags(prompt.tags)}
          
          {/* 底部信息 */}
          <div className="mt-4 pt-4 border-t border-neon-cyan/10 space-y-3">
            {/* 评分 */}
            {renderRating(prompt.rating)}
            
            {/* 元信息 */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <UserIcon className="h-3 w-3" />
                  <span>{prompt.author || '匿名'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="h-3 w-3" />
                  <span>v{prompt.version || '1.0'}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-3 w-3" />
                <span>{formatDate(prompt.updated_at || prompt.created_at)}</span>
              </div>
            </div>
            
            {/* 互动按钮 */}
            <div className="flex items-center justify-between">
              <div></div> {/* 占位符 */}
              <div onClick={(e) => e.preventDefault()}> {/* 阻止Link的点击事件 */}
                <InteractionButtons promptId={prompt.id} size="sm" />
              </div>
            </div>
          </div>
          
          {/* 悬停时的边框动画 */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 rounded-2xl animate-border-beam" 
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent)',
                backgroundSize: '200% 100%'
              }}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PromptCard;
