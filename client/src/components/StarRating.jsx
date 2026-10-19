import { useState } from 'react';

export default function StarRating({
  rating = 0,
  max = 5,
  interactive = false,
  onChange = () => {},
  size = 18,
  showValue = false,
  count = null
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'inline-flex', gap: 2 }}>
        {Array.from({ length: max }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;
          const isHalf = !isFilled && starValue - 0.5 <= displayRating;

          return (
            <span
              key={index}
              style={{
                fontSize: size,
                color: isFilled || isHalf ? '#f59e0b' : '#d1d5db',
                cursor: interactive ? 'pointer' : 'default',
                transition: 'transform 0.1s, color 0.1s',
                display: 'inline-block',
                lineHeight: 1
              }}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onClick={() => interactive && onChange(starValue)}
              title={interactive ? `${starValue} / ${max}` : undefined}
            >
              ★
            </span>
          );
        })}
      </div>

      {showValue && (
        <span style={{ fontSize: size * 0.85, fontWeight: 700, color: '#b45309', marginLeft: 4 }}>
          {Number(rating).toFixed(1)}
        </span>
      )}

      {count !== null && (
        <span style={{ fontSize: size * 0.8, color: '#6b7280', marginLeft: 4 }}>
          ({count} avis)
        </span>
      )}
    </div>
  );
}
