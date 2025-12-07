'use client';

import React from 'react';
import styles from './LoadingSpinner.module.scss';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 18,
  className = ''
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size + 1}
      viewBox="0 0 18 19"
      fill="none"
      className={`${styles.spinner} ${className}`}
    >
      <g clipPath="url(#clip0_1186_7196)">
        <path
          d="M9 2.48145V5.48145M12.15 6.83145L14.325 4.65645M13.5 9.98145H16.5M12.15 13.1314L14.325 15.3064M9 14.4814V17.4814M3.675 15.3064L5.85 13.1314M1.5 9.98145H4.5M3.675 4.65645L5.85 6.83145"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_1186_7196">
          <rect width="18" height="18" fill="white" transform="translate(0 0.981445)"/>
        </clipPath>
      </defs>
    </svg>
  );
};

export default LoadingSpinner;