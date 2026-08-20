import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 1 to 6
  maxStars?: number; // default 6
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 6,
  onChange,
  readOnly = true,
  size = 'md',
}) => {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <div className="flex items-center gap-0.5" title={`${rating} de ${maxStars} estrelas`}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;
        const isSuperStar = starValue === 6 && isFilled;

        return (
          <button
            key={starValue}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(starValue)}
            className={`transition-transform duration-100 ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-125 focus:outline-none'
            }`}
          >
            <Star
              size={iconSize}
              className={`transition-colors ${
                isFilled
                  ? isSuperStar
                    ? 'fill-amber-400 text-amber-500 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                    : 'fill-amber-400 text-amber-400'
                  : 'fill-stone-200 text-stone-300 dark:fill-stone-800 dark:text-stone-700'
              }`}
            />
          </button>
        );
      })}
      <span className="ml-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
        {rating}★
      </span>
    </div>
  );
};
