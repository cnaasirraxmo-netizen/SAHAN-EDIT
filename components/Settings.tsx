import React from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export const Settings: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full min-h-[50vh] bg-zinc-800/50 p-8 rounded-xl border border-dashed border-zinc-700">
      <Cog6ToothIcon className="w-16 h-16 text-zinc-500 animate-spin [animation-duration:5s]" />
      <h2 className="mt-6 text-2xl font-bold text-white">Settings</h2>
      <p className="mt-2 text-zinc-400">
        Configuration options will be available here in a future update.
      </p>
    </div>
  );
};