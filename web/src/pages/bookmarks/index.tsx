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
import UserMediaPromptCard from '@/components/prompts/UserMediaPromptCard';
import toast from 'react-hot-toast';
import { formatVersionDisplay } from '@/lib/version-utils';

const BookmarksPage: React.FC = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<PromptDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeType, setActiveType] = useState<'all' | 'chat' | 'image' | 'video'>('all'); // 类型筛选

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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredBookmarks.map((bookmark, index) => (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
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