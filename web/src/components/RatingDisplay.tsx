import React from 'react';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '@/contexts/LanguageContext';

interface RatingDisplayProps {
  rating: number;
  count: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  count,
  size = 'sm',
  className = '',
}) => {
  const { t } = useLanguage();
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const renderStars = () => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const Icon = star <= Math.round(rating) ? StarSolidIcon : StarIcon;
          return (
            <Icon
              key={star}
              className={`${sizeClasses[size]} ${
                star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-600'
              }`}
            />
          );
        })}
      </div>
    );
  };

  if (count === 0) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${textSizeClasses[size]} ${className}`}>
        {renderStars()}
        <span>{t('rating.no_rating')}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${textSizeClasses[size]} ${className}`}>
      {renderStars()}
      <span className="text-white font-medium">
        {rating.toFixed(1)}
      </span>
      <span className="text-gray-400">
        ({count})
      </span>
    </div>
  );
}; 