import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookmarkIcon, MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import { getUserBookmarks } from '@/lib/api';
import { PromptDetails } from '@/types';
import { useAuth, withAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { BookmarkButton } from '@/components/BookmarkButton';
import UserMediaPromptCard from '@/components/prompts/UserMediaPromptCard';
import toast from 'react-hot-toast';
import { formatVersionDisplay } from '@/lib/version-utils';
import clsx from 'clsx';

const BookmarksPage: React.FC = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<PromptDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // 新增视图模式
  const [activeType, setActiveType] = useState<'all' | 'chat' | 'image' | 'video'>('all'); // 新增类型筛选

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const data = await getUserBookmarks();
      setBookmarks(data);
    } catch (error: any) {
      console.error('获取收藏失败:', error);
      toast.error('获取收藏失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤收藏的提示词
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = 
      bookmark.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || bookmark.category === selectedCategory;
    
    // 新增类型筛选
    const matchesType = activeType === 'all' || (bookmark as any).category_type === activeType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  // 获取所有分类
  const categories = Array.from(new Set(bookmarks.map(b => b.category))).filter(Boolean);

  const handleBookmarkRemoved = (promptId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== promptId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg-primary">
        <div className="container-custom py-16">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">加载收藏中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-16">
        <div className="container-custom">
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center mb-6">
              <BookmarkIcon className="h-8 w-8 text-neon-cyan mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                我的收藏
              </h1>
            </div>
            <p className="text-gray-400 text-lg">
              您收藏的所有提示词，共 {bookmarks.length} 个
            </p>
          </motion.div>

          {/* 搜索和筛选 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索收藏的提示词..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-primary w-full pl-10"
                />
              </div>

              {/* 类型筛选 */}
              <select
                value={activeType}
                onChange={(e) => setActiveType(e.target.value as 'all' | 'chat' | 'image' | 'video')}
                className="input-primary lg:w-32"
              >
                <option value="all">所有类型</option>
                <option value="chat">对话</option>
                <option value="image">图像</option>
                <option value="video">视频</option>
              </select>

              {/* 分类筛选 */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-primary lg:w-48"
              >
                <option value="all">所有分类</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* 视图模式切换 */}
              <div className="flex border border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium transition-colors',
                    viewMode === 'grid'
                      ? 'bg-neon-cyan text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  )}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium transition-colors',
                    viewMode === 'list'
                      ? 'bg-neon-cyan text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  )}
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* 收藏列表 */}
          {filteredBookmarks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center py-16"
            >
              <BookmarkIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {searchTerm || selectedCategory !== 'all' || activeType !== 'all' ? '没有找到匹配的收藏' : '还没有收藏'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCategory !== 'all' || activeType !== 'all'
                  ? '尝试调整搜索条件或筛选条件'
                  : '快去发现一些有趣的提示词吧！'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && activeType === 'all' && (
                <Link
                  href="/prompts"
                  className="btn-primary"
                >
                  浏览提示词
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={clsx(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              )}
            >
              {filteredBookmarks.map((bookmark, index) => (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }} // 减少延迟时间
                >
                  {viewMode === 'grid' ? (
                    // 网格模式：使用优化的UserMediaPromptCard
                    <UserMediaPromptCard
                      prompt={{
                        ...bookmark,
                        category_type: (bookmark as any).category_type || 'chat',
                        preview_asset_url: (bookmark as any).preview_asset_url,
                        thumbnail_url: (bookmark as any).thumbnail_url,
                        parameters: (bookmark as any).parameters,
                      }}
                      showPublicStatus={false}
                    />
                  ) : (
                    // 列表模式：简化布局但仍支持媒体预览
                    <div className="glass rounded-xl border border-neon-cyan/20 p-4 hover:border-neon-cyan/40 transition-all duration-300 group">
                      <div className="flex items-start gap-4">
                        {/* 媒体缩略图 */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                          {(bookmark as any).preview_asset_url ? (
                            <img 
                              src={(bookmark as any).thumbnail_url || (bookmark as any).preview_asset_url}
                              alt={bookmark.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xs text-gray-500">
                                {(bookmark as any).category_type === 'image' ? '🖼️' : 
                                 (bookmark as any).category_type === 'video' ? '🎥' : '💬'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <Link
                              href={`/prompts/${bookmark.id}`}
                              className="text-lg font-semibold text-white hover:text-neon-cyan transition-colors line-clamp-1"
                            >
                              {bookmark.name}
                            </Link>
                            <BookmarkButton
                              promptId={bookmark.id}
                              variant="bookmark"
                              size="sm"
                              showCount={false}
                              className="ml-2 flex-shrink-0"
                            />
                          </div>
                          
                          <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                            {bookmark.description}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple rounded-full">
                              {bookmark.category}
                            </span>
                            <span>收藏于 {formatDistanceToNow(new Date((bookmark as any).bookmarked_at), { addSuffix: true, locale: zhCN })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(BookmarksPage); 