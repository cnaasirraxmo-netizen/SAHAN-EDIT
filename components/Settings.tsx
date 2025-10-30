import React, { useState, useEffect } from 'react';
import { saveApiKey, getApiKey } from '../services/geminiService';
import { CheckCircleIcon, KeyIcon } from '@heroicons/react/24/outline';

export const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    const storedKey = getApiKey();
    setCurrentKey(storedKey);
  }, []);

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    if (trimmedKey) {
        saveApiKey(trimmedKey);
        setCurrentKey(trimmedKey);
        setApiKey(''); // Clear input after save for security
        setSaveStatus('success');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
    }
  };
  
  const handleClear = () => {
    saveApiKey('');
    setCurrentKey(null);
    setApiKey('');
  }

  const maskApiKey = (key: string | null): string => {
    if (!key) return 'Not Set';
    if (key.length <= 8) return '****' + key.slice(-4);
    return key.slice(0, 4) + '...' + key.slice(-4);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Settings</h2>
      
      <div className="p-6 bg-zinc-800/50 rounded-lg border border-zinc-700 max-w-2xl mx-auto">
        <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center">
                <KeyIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
                <h3 className="text-xl font-semibold text-white">Google Gemini API Key</h3>
                <p className="text-zinc-400 mt-1">
                Your API key is stored in your browser's local storage and is required for all AI features.
                </p>
            </div>
        </div>

        <div className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
            <p className="text-sm text-zinc-500">Current API Key</p>
            <p className="font-mono text-white text-lg break-all">{maskApiKey(currentKey)}</p>
        </div>
        
        <p className="text-zinc-400 mb-4 text-sm">
          You can get your free API key from{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            Google AI Studio
          </a>.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-zinc-300 mb-1">
              Enter New or Updated API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-1 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-zinc-600 disabled:cursor-not-allowed"
            >
              Save API Key
            </button>
            <button
              onClick={handleClear}
              disabled={!currentKey}
              className="flex-1 bg-zinc-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-zinc-700 transition-colors duration-300 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
            >
              Clear Saved Key
            </button>
          </div>
        </div>

        {saveStatus === 'success' && (
          <div className="mt-4 flex items-center text-green-400 transition-opacity duration-300">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            <span>API Key updated successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};