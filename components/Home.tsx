import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Page } from '../types';
import {
    SparklesIcon,
    LightBulbIcon,
    PencilIcon,
    CodeBracketIcon,
    PhotoIcon,
    DocumentMagnifyingGlassIcon,
    PaperAirplaneIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import { getGenAIClient } from '../services/geminiService';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { marked } from 'marked';
import { ApiKeyError } from './common/ApiKeyError';
import { AnimatedLogo } from './common/AnimatedLogo';

interface HomeProps {
    setPage: (page: Page) => void;
}

type Message = {
    role: 'user' | 'model';
    content: string;
};

interface SuggestionChipProps {
    icon: React.ReactNode;
    text: string;
    color: string;
    onClick: () => void;
}

const SuggestionChip: React.FC<SuggestionChipProps> = ({ icon, text, color, onClick }) => (
    <button
        onClick={onClick}
        className="p-3 bg-zinc-800 rounded-lg border border-zinc-700 text-left hover:bg-zinc-700/80 transition-colors duration-200 flex items-center gap-3"
    >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
            {icon}
        </div>
        <span className="text-zinc-200 font-medium text-sm">{text}</span>
    </button>
);

export const Home: React.FC<HomeProps> = ({ setPage }) => {
    const { t } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        try {
            const ai = getGenAIClient();
            chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash' });
        } catch (err) {
            setError(err instanceof Error ? err.message : t('error_unknown'));
        }
    }, [t]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSend = async (prompt?: string) => {
        const textToSend = prompt || input;
        if (!textToSend.trim() || isLoading) return;

        const newUserMessage: Message = { role: 'user', content: textToSend };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);
        
        try {
            if (!chatRef.current) {
                throw new Error("Chat session not initialized.");
            }
            
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            const stream = await chatRef.current.sendMessageStream({ message: textToSend });
            
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content += chunkText;
                    return newMessages;
                });
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('error_unknown');
            setError(errorMessage);
            // Remove the empty model message on error
            setMessages(prev => prev.filter((msg, index) => index !== prev.length - 1 || msg.content !== ''));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        handleSend();
    };

    const handleNewChat = () => {
        setMessages([]);
        setError(null);
        try {
            const ai = getGenAIClient();
            chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash' });
        } catch (err) {
            setError(err instanceof Error ? err.message : t('error_unknown'));
        }
    };
    
    const welcomeSuggestions = [
        { icon: <PhotoIcon className="w-5 h-5" />, text: "Create an image", color: "bg-green-500/20 text-green-300", action: () => setPage(Page.IMAGE_GEN) },
        { icon: <DocumentMagnifyingGlassIcon className="w-5 h-5" />, text: "Analyze data", color: "bg-blue-500/20 text-blue-300", action: () => setPage(Page.VIDEO_ANALYZER) },
        { icon: <PencilIcon className="w-5 h-5" />, text: "Help me write", color: "bg-purple-500/20 text-purple-300", action: () => handleSend("Help me write a short story about a space explorer.") },
        { icon: <LightBulbIcon className="w-5 h-5" />, text: "Brainstorm ideas", color: "bg-yellow-500/20 text-yellow-300", action: () => handleSend("Brainstorm some names for a new coffee shop.") },
    ];
    
    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] lg:h-[calc(100vh-6rem)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-full">
                        <AnimatedLogo />
                        <h1 className="text-3xl font-bold text-zinc-200 mt-6 mb-4">What can I help with?</h1>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                            {welcomeSuggestions.map((item, index) => (
                                <SuggestionChip key={index} {...item} onClick={item.action} />
                            ))}
                        </div>
                    </div>
                ) : (
                   <>
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-zinc-800 text-zinc-200 rounded-bl-none'}`}>
                                    <div 
                                        className="prose prose-invert prose-sm max-w-none" 
                                        dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
                                    />
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl bg-zinc-800 text-zinc-200 rounded-bl-none">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150"></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-300"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                   </>
                )}
            </div>

            <div className="px-4 pb-4 w-full max-w-3xl mx-auto">
                 {messages.length > 0 && 
                    <div className="flex justify-center mb-2">
                        <button onClick={handleNewChat} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors">
                            <PlusIcon className="w-4 h-4" /> New Chat
                        </button>
                    </div>
                }
                 {error && (
                    <div className="mb-2">
                        {error.includes("API Key not found") ?
                        <ApiKeyError message={error} setPage={setPage} /> :
                        <p className="text-red-400 text-center text-sm">{error}</p>
                        }
                    </div>
                )}
                <form onSubmit={handleFormSubmit} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message SAHAN..."
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-4 pr-14 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow duration-200"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full text-zinc-400 hover:text-white disabled:hover:text-zinc-400 disabled:opacity-50 transition-colors"
                        aria-label="Send message"
                    >
                        <PaperAirplaneIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};