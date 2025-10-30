import React from 'react';

interface ComingSoonProps {
  title: string;
  icon: React.ReactNode;
  message?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title, icon, message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full min-h-[50vh] bg-zinc-800/50 p-8 rounded-xl border border-dashed border-zinc-700">
      {icon}
      <h2 className="mt-6 text-2xl font-bold text-white">{title}</h2>
      <p className="mt-2 text-zinc-400">
        {message || 'This feature will be available in a future update.'}
      </p>
    </div>
  );
};
