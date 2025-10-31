import React from 'react';
import { Page } from '../../types';
import { ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';

interface ApiKeyErrorProps {
  message: string;
  setPage: (page: Page) => void;
}

export const ApiKeyError: React.FC<ApiKeyErrorProps> = ({ message, setPage }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0" />
        <span>{message}</span>
      </div>
      <button
        onClick={() => setPage(Page.SETTINGS)}
        className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200"
      >
        {t('api_key_error_go_to_settings')}
        <ArrowRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
