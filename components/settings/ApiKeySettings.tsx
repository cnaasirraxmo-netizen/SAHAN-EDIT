import React, { useState, useEffect, useCallback } from 'react';
import { saveApiKey, getApiKey } from '../../services/geminiService';
import { ApiKeyManager } from '../common/ApiKeyManager';
import { useLanguage } from '../../contexts/LanguageContext';

type ServiceKeyStatus = {
  [key: string]: string | null;
};

export const ApiKeySettings: React.FC = () => {
  const { t } = useLanguage();
  const [currentKeys, setCurrentKeys] = useState<ServiceKeyStatus>({});

  const services = [
    {
      id: 'gemini',
      title: 'Google Gemini',
      description: t('api_key_desc_gemini'),
      getApiKeyUrl: 'https://aistudio.google.com/app/apikey',
      enabled: true,
    },
    {
      id: 'openai',
      title: 'OpenAI',
      description: t('api_key_desc_openai'),
      getApiKeyUrl: 'https://platform.openai.com/api-keys',
      enabled: true,
    },
    {
      id: 'anthropic',
      title: 'Anthropic',
      description: t('api_key_desc_anthropic'),
      getApiKeyUrl: 'https://console.anthropic.com/settings/keys',
      enabled: true,
    },
    {
      id: 'groq',
      title: 'Groq',
      description: t('api_key_desc_groq'),
      getApiKeyUrl: 'https://console.groq.com/keys',
      enabled: true,
    },
     {
      id: 'cohere',
      title: 'Cohere',
      description: t('api_key_desc_cohere'),
      getApiKeyUrl: 'https://dashboard.cohere.com/api-keys',
      enabled: true,
    },
    {
      id: 'mistral',
      title: 'Mistral AI',
      description: t('api_key_desc_mistral'),
      getApiKeyUrl: 'https://console.mistral.ai/api-keys/',
      enabled: true,
    },
    {
      id: 'replicate',
      title: 'Replicate',
      description: t('api_key_desc_replicate'),
      getApiKeyUrl: 'https://replicate.com/account/api-tokens',
      enabled: true,
    },
  ];

  const loadKeys = useCallback(() => {
    const loadedKeys: ServiceKeyStatus = {};
    services.forEach(service => {
      loadedKeys[service.id] = getApiKey(service.id);
    });
    setCurrentKeys(loadedKeys);
  }, []); // services array is stable

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleSave = (serviceId: string, apiKey: string) => {
    saveApiKey(serviceId, apiKey);
    loadKeys(); // a simple way to reload the state
  };
  
  const handleClear = (serviceId: string) => {
    saveApiKey(serviceId, '');
    loadKeys();
  }

  return (
    <div className="space-y-8 py-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-zinc-400 px-2 text-center">
          {t('api_key_storage_notice')}
        </p>
        
        {services.map(service => (
           <ApiKeyManager
              key={service.id}
              serviceId={service.id}
              title={service.title}
              description={service.description}
              getApiKeyUrl={service.getApiKeyUrl}
              currentKey={currentKeys[service.id] || null}
              onSave={handleSave}
              onClear={handleClear}
              isEnabled={service.enabled}
            />
        ))}
      </div>
    </div>
  );
};
