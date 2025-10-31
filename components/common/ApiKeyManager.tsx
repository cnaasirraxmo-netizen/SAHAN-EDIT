import React, { useState } from 'react';
import { KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';

interface ApiKeyManagerProps {
  serviceId: string;
  title: string;
  description: string;
  getApiKeyUrl: string;
  currentKey: string | null;
  onSave: (serviceId: string, apiKey: string) => void;
  onClear: (serviceId: string) => void;
  isEnabled: boolean;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  serviceId,
  title,
  description,
  getApiKeyUrl,
  currentKey,
  onSave,
  onClear,
  isEnabled,
}) => {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const handleSave = () => {
    onSave(serviceId, apiKey);
    setApiKey(''); // Clear input for security
    setSaveStatus('success');
    setTimeout(() => {
      setSaveStatus('idle');
    }, 3000);
  };

  const handleClear = () => {
    onClear(serviceId);
    setApiKey('');
  };

  const maskApiKey = (key: string | null): string => {
    if (!key) return t('api_key_manager_not_set');
    if (key.length <= 8) return '****' + key.slice(-4);
    return key.slice(0, 4) + '...' + key.slice(-4);
  };

  return (
    <div className={`p-6 bg-zinc-800/50 rounded-lg border border-zinc-700 relative ${!isEnabled ? 'opacity-50' : ''}`}>
      {!isEnabled && (
        <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center rounded-lg" title="This feature is not yet available.">
          <span className="text-lg font-bold text-zinc-400">{t('coming_soon_title')}</span>
        </div>
      )}
      <div className={`transition-opacity ${!isEnabled ? 'blur-sm' : ''}`}>
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center">
            <KeyIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-zinc-400 mt-1 text-sm">{description}</p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
          <p className="text-sm text-zinc-500">{t('api_key_manager_current_key')}</p>
          <p className="font-mono text-white text-lg break-all">{maskApiKey(currentKey)}</p>
        </div>
        
        <p className="text-zinc-400 mb-4 text-sm">
          {t('api_key_manager_get_key_prompt')}{' '}
          <a
            href={getApiKeyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
            tabIndex={!isEnabled ? -1 : 0}
          >
            {t('api_key_manager_official_website')}
          </a>.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor={`api-key-${serviceId}`} className="block text-sm font-medium text-zinc-300 mb-1">
              {t('api_key_manager_enter_key_label')}
            </label>
            <input
              id={`api-key-${serviceId}`}
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('api_key_manager_enter_key_placeholder')}
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              disabled={!isEnabled}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSave}
              disabled={!apiKey.trim() || !isEnabled}
              className="flex-1 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-zinc-600 disabled:cursor-not-allowed"
            >
              {t('button_save_api_key')}
            </button>
            <button
              onClick={handleClear}
              disabled={!currentKey || !isEnabled}
              className="flex-1 bg-zinc-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-zinc-700 transition-colors duration-300 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
            >
              {t('button_clear_saved_key')}
            </button>
          </div>
        </div>

        {saveStatus === 'success' && (
          <div className="mt-4 flex items-center text-green-400 transition-opacity duration-300">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            <span>{t('api_key_manager_success_message')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
