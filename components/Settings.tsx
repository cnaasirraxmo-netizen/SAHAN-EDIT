import React, { useState, useEffect, useCallback } from 'react';
import { saveApiKey, getApiKey } from '../services/geminiService';
import { ApiKeyManager } from './common/ApiKeyManager';

type ServiceKeyStatus = {
  [key: string]: string | null;
};

export const Settings: React.FC = () => {
  const [currentKeys, setCurrentKeys] = useState<ServiceKeyStatus>({});

  const services = [
    {
      id: 'gemini',
      title: 'Google Gemini',
      description: 'Required for all current image, video, and text generation features.',
      getApiKeyUrl: 'https://aistudio.google.com/app/apikey',
      enabled: true,
    },
    {
      id: 'openai',
      title: 'OpenAI',
      description: 'Future integration for models like GPT-4, DALL-E 3, and Sora.',
      getApiKeyUrl: 'https://platform.openai.com/api-keys',
      enabled: false,
    },
    {
      id: 'anthropic',
      title: 'Anthropic',
      description: 'Future integration for Claude series models for advanced reasoning and text generation.',
      getApiKeyUrl: 'https://console.anthropic.com/settings/keys',
      enabled: false,
    },
    {
      id: 'groq',
      title: 'Groq',
      description: 'Future integration for high-speed inference with open-source models.',
      getApiKeyUrl: 'https://console.groq.com/keys',
      enabled: false,
    },
    {
      id: 'replicate',
      title: 'Replicate',
      description: 'Future integration to access a wide variety of community-published models.',
      getApiKeyUrl: 'https://replicate.com/account/api-tokens',
      enabled: false,
    },
  ];

  const loadKeys = useCallback(() => {
    const loadedKeys: ServiceKeyStatus = {};
    services.forEach(service => {
      loadedKeys[service.id] = getApiKey(service.id);
    });
    setCurrentKeys(loadedKeys);
  }, [services]);

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
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Settings</h2>
      
      <div className="max-w-3xl mx-auto space-y-6">
        <h3 className="text-2xl font-semibold text-white">API Key Management</h3>
        <p className="text-zinc-400">
          Your API keys are stored securely in your browser's local storage and are never sent to our servers.
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
