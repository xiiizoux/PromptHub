import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { 
  submitRating, 
  getPromptRatings, 
  getUserRating, 
  updateRating, 
  deleteRating,
  Rating, 
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface RatingSystemProps {
  promptId: string;
  className?: string;
}

export const RatingSystem: React.FC<RatingSystemProps> = ({ 
  promptId, 
  className = '', 
}) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 根据语言选择 date-fns locale
  const dateLocale = language === 'zh' ? zhCN : enUS;

  const fetchRatings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getPromptRatings(promptId, {
        page: currentPage,
        pageSize: 5,
      });
      
      setRatings(response.data);
      setTotalRatings(response.total);
      setTotalPages(response.totalPages);
      setAverageRating(response.averageRating);
      setRatingDistribution(response.ratingDistribution);
    } catch (error: unknown) {
      console.error(t('rating.get_ratings_failed'), error);
    } finally {
      setIsLoading(false);
    }
  }, [promptId, currentPage, t]);

  const fetchUserRating = useCallback(async () => {
    try {
      const rating = await getUserRating(promptId);
      setUserRating(rating);
      if (rating) {
        setNewRating(rating.rating);
        setNewComment(rating.comment || '');
      }
    } catch (error) {
      console.error(t('rating.get_user_rating_failed'), error);
    }
  }, [promptId, t]);

  useEffect(() => {
    if (promptId) {
      fetchRatings();
      if (user) {
        fetchUserRating();
      }
    }
  }, [promptId, user, currentPage, fetchRatings, fetchUserRating]);

  const handleSubmitRating = async () => {
    if (!user) {
      toast.error(t('auth.login_required'));
      return;
    }

    if (newRating < 1 || newRating > 5) {
      toast.error(t('rating.select_rating'));
      return;
    }

    try {
      setIsLoading(true);
      
      // Submit rating
      
      if (userRating) {
        // Update existing rating
        await updateRating(promptId, {
          rating: newRating,
          comment: newComment,
        });
        toast.success(t('rating.rating_updated'));
      } else {
        // Submit new rating
        await submitRating(promptId, {
          rating: newRating,
          comment: newComment,
        });
        toast.success(t('rating.rating_submitted'));
      }

      setShowRatingForm(false);
      await fetchRatings();
      await fetchUserRating();
    } catch (error: unknown) {
      console.error('评分操作失败详情:', error);
      
      // 类型守卫：检查是否是带有response属性的错误对象
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { response?: { status: number; data?: { error?: string } } };
        if (responseError.response) {
          console.error('错误响应:', responseError.response.status, responseError.response.data);
          if (responseError.response.status === 401) {
            toast.error(t('errors.auth_failed'));
          } else if (responseError.response.status === 400) {
            toast.error(responseError.response.data?.error || t('errors.request_failed'));
          } else {
            const errorMessage = responseError.response.data?.error || 
                               (error instanceof Error ? error.message : undefined) || 
                               t('rating.rating_failed');
            toast.error(errorMessage);
          }
        } else {
          const errorMessage = error instanceof Error ? error.message : t('rating.rating_failed');
          toast.error(errorMessage);
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : t('rating.rating_failed');
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!userRating) {return;}

    try {
      setIsLoading(true);
      await deleteRating(promptId);
      toast.success(t('rating.rating_deleted'));
      setUserRating(null);
      setNewRating(0);
      setNewComment('');
      setShowRatingForm(false);
      await fetchRatings();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('rating.delete_rating_failed');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const Icon = star <= rating ? StarSolidIcon : StarIcon;
          return (
            <motion.button
              key={star}
              onClick={() => interactive && onRate?.(star)}
              disabled={!interactive}
              whileHover={interactive ? { scale: 1.1 } : {}}
              whileTap={interactive ? { scale: 0.9 } : {}}
              className={`h-5 w-5 transition-colors ${
                interactive 
                  ? 'cursor-pointer hover:text-yellow-400' 
                  : 'cursor-default'
              } ${
                star <= rating ? 'text-yellow-400' : 'text-gray-600'
              }`}
            >
              <Icon />
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    // const maxCount = Math.max(...Object.values(ratingDistribution));
    
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution[star.toString()] || 0;
          const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
          
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm text-gray-400 w-8">{star}{t('rating.star')}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-yellow-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: 0.1 * (6 - star) }}
                />
              </div>
              <span className="text-sm text-gray-400 w-8">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 评分概览 */}
      <div className="glass rounded-xl border border-neon-cyan/20 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">{t('rating.user_ratings')}</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {renderStars(Math.round(averageRating))}
                <span className="text-lg font-semibold text-white">
                  {averageRating > 0 ? averageRating.toFixed(1) : t('rating.no_rating')}
                </span>
              </div>
              <span className="text-gray-400">
                ({totalRatings} {t('rating.ratings_count')})
              </span>
            </div>
          </div>

          {user && (
            <button
              onClick={() => setShowRatingForm(!showRatingForm)}
              className="btn-secondary"
            >
              {userRating ? t('rating.modify_rating') : t('rating.add_rating')}
            </button>
          )}
        </div>

        {/* 评分分布 */}
        {totalRatings > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">{t('rating.rating_distribution')}</h4>
              {renderRatingDistribution()}
            </div>
          </div>
        )}
      </div>

      {/* 评分表单 */}
      <AnimatePresence>
        {showRatingForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl border border-neon-purple/20 p-6"
          >
            <h4 className="text-lg font-semibold text-white mb-4">
              {userRating ? t('rating.modify_rating') : t('rating.add_rating')}
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('rating.rating')}
                </label>
                {renderStars(newRating, true, setNewRating)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('rating.comment_optional')}
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('rating.share_your_thoughts')}
                  rows={3}
                  className="input-primary w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubmitRating}
                  disabled={isLoading || newRating === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('buttons.submitting') : (userRating ? t('rating.update_rating') : t('rating.submit_rating'))}
                </button>
                
                <button
                  onClick={() => setShowRatingForm(false)}
                  className="btn-secondary"
                >
                  {t('buttons.cancel')}
                </button>

                {userRating && (
                  <button
                    onClick={handleDeleteRating}
                    disabled={isLoading}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    {t('rating.delete_rating')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 评分列表 */}
      {ratings.length > 0 && (
        <div className="glass rounded-xl border border-neon-cyan/20 p-6">
          <h4 className="text-lg font-semibold text-white mb-4">{t('rating.user_reviews')}</h4>
          
          <div className="space-y-4">
            {ratings.map((rating) => (
              <motion.div
                key={rating.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b border-gray-800 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {rating.user?.display_name?.[0] || rating.user?.email?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {renderStars(rating.rating)}
                        <span className="text-sm text-gray-400">
                          {rating.user?.display_name || rating.user?.email || t('rating.anonymous_user')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(rating.created_at), { 
                          addSuffix: true, 
                          locale: dateLocale, 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {rating.comment && (
                  <p className="text-gray-300 text-sm mt-2 ml-11">
                    {rating.comment}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('rating.previous_page')}
                </button>
                
                <span className="px-3 py-1 text-gray-400">
                  {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('rating.next_page')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 