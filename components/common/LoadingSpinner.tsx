import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center space-y-4 p-4">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
    {message && <p className="text-lg text-gray-300 animate-pulse">{message}</p>}
  </div>
);
