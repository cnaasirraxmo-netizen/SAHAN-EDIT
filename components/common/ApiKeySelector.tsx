import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';

interface ApiKeySelectorProps {
    onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {

    const handleSelectKey = async () => {
        // @ts-ignore
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            try {
                // @ts-ignore
                await window.aistudio.openSelectKey();
                // Assume success and notify parent component to proceed
                onKeySelected();
            } catch (error) {
                console.error("Error opening API key selection dialog:", error);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-700/50 rounded-lg border border-gray-600">
            <InformationCircleIcon className="w-12 h-12 text-indigo-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">API Key Required</h3>
            <p className="text-gray-300 mb-4 max-w-md">
                Video generation with Veo requires you to select your own API key. Your key will be used for this session.
            </p>
            <p className="text-gray-400 mb-6 text-sm">
                Please note that charges may apply. For more details, see the{' '}
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    billing documentation
                </a>.
            </p>
            <button
                onClick={handleSelectKey}
                className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
                Select API Key
            </button>
        </div>
    );
};
