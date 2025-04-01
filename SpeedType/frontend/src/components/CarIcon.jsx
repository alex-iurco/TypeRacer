import React from 'react';

const CarIcon = ({ color }) => (
  <svg
    width="40"
    height="20"
    viewBox="0 0 40 20"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M36 8h-2l-2-4h-16l-2 4h-2c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h1c0 1.66 1.34 3 3 3s3-1.34 3-3h10c0 1.66 1.34 3 3 3s3-1.34 3-3h1c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2zm-24 7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm16 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2-7h-18v-4h16l2 4z"
    />
  </svg>
);

export default CarIcon; 