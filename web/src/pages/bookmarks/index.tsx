import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookmarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getUserBookmarks } from '@/lib/api';
import { PromptDetails } from '@/types';
import { useAuth, withAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { BookmarkButton } from '@/components/BookmarkButton';
import toast from 'react-hot-toast';

const BookmarksPage: React.FC = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<PromptDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
    
    return matchesSearch && matchesCategory;
  });

  // 获取所有分类
  const categories = Array.from(new Set(bookmarks.map(b => b.category)));

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
                {searchTerm || selectedCategory !== 'all' ? '没有找到匹配的收藏' : '还没有收藏'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCategory !== 'all' 
                  ? '尝试调整搜索条件或分类筛选'
                  : '快去发现一些有趣的提示词吧！'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && (
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredBookmarks.map((bookmark, index) => (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="glass rounded-xl border border-neon-cyan/20 p-6 hover:border-neon-cyan/40 transition-all duration-300 group"
                >
                  {/* 卡片头部 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link
                        href={`/prompts/${bookmark.name}`}
                        className="text-lg font-semibold text-white hover:text-neon-cyan transition-colors line-clamp-2"
                      >
                        {bookmark.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded-full">
                          {bookmark.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          收藏于 {formatDistanceToNow(new Date((bookmark as any).bookmarked_at), { 
                            addSuffix: true, 
                            locale: zhCN 
                          })}
                        </span>
                      </div>
                    </div>
                    
                    {/* 收藏按钮 */}
                    <BookmarkButton
                      promptId={bookmark.id}
                      variant="bookmark"
                      size="sm"
                      showCount={false}
                      className="ml-2"
                    />
                  </div>

                  {/* 描述 */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {bookmark.description}
                  </p>

                  {/* 标签 */}
                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {bookmark.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-gray-800/50 text-gray-300 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                      {bookmark.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-800/50 text-gray-400 text-xs rounded-md">
                          +{bookmark.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 底部信息 */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>by {bookmark.author || '匿名'}</span>
                    <span>v{bookmark.version}</span>
                  </div>
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