import React, { useState, useEffect } from 'react';
import { ApiKeySettings } from './settings/ApiKeySettings';
import { LanguageSettings } from './settings/LanguageSettings';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoonIcon,
  LanguageIcon,
  KeyIcon,
  BellIcon,
  ArrowDownTrayIcon,
  BoltIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowLeftOnRectangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';

type SettingsView = 'main' | 'apiKeys' | 'language';

// Theme Toggle Component
const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('sahan-edit-theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('sahan-edit-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-indigo-500 ${
        theme === 'dark' ? 'bg-indigo-600' : 'bg-zinc-400'
      }`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
          theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

// Settings List Item Component
interface SettingsListItemProps {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  accessory?: 'chevron' | 'toggle' | 'none';
  disabled?: boolean;
}

const SettingsListItem: React.FC<SettingsListItemProps> = ({ icon, title, onClick, accessory = 'chevron', disabled = false }) => {
  const content = (
    <>
      <div className="w-6 h-6 text-zinc-400 mr-4 rtl:ml-4 rtl:mr-0">{icon}</div>
      <span className="flex-grow text-white">{title}</span>
      {accessory === 'chevron' && <ChevronRightIcon className="w-5 h-5 text-zinc-500" />}
      {accessory === 'toggle' && <ThemeToggle />}
    </>
  );

  if (disabled) {
    return (
      <div className="flex items-center p-4 opacity-50 cursor-not-allowed">
        {content}
      </div>
    );
  }

  return (
    <button onClick={onClick} className="w-full flex items-center p-4 text-left rtl:text-right hover:bg-zinc-800/50 transition-colors duration-200">
      {content}
    </button>
  );
};


const MainSettingsScreen: React.FC<{ setView: (view: SettingsView) => void }> = ({ setView }) => {
    const { t } = useLanguage();
    const settingsItems = [
        { icon: <MoonIcon />, title: t('settings_theme_toggle'), accessory: 'toggle' as const },
        { icon: <LanguageIcon />, title: t('settings_language_prefs'), onClick: () => setView('language') },
        { icon: <KeyIcon />, title: t('settings_api_keys'), onClick: () => setView('apiKeys') },
        { icon: <BellIcon />, title: t('settings_notifications'), disabled: true },
        { icon: <ArrowDownTrayIcon />, title: t('settings_downloads'), disabled: true },
        { icon: <BoltIcon />, title: t('settings_data_usage'), disabled: true },
        { icon: <ShieldCheckIcon />, title: t('settings_privacy'), disabled: true },
        { icon: <ClockIcon />, title: t('settings_clear_history'), disabled: true },
        { icon: <ArrowLeftOnRectangleIcon />, title: t('settings_logout'), disabled: true },
        { icon: <TrashIcon />, title: t('settings_delete_account'), disabled: true },
    ];

    return (
        <div className="divide-y divide-zinc-800">
            {settingsItems.map((item, index) => (
                <SettingsListItem
                    key={index}
                    icon={item.icon}
                    title={item.title}
                    accessory={item.accessory || 'chevron'}
                    onClick={item.onClick}
                    disabled={item.disabled}
                />
            ))}
        </div>
    );
};

export const Settings: React.FC = () => {
  const [view, setView] = useState<SettingsView>('main');
  const { t } = useLanguage();

  const pageTitle: Record<SettingsView, string> = {
    main: t('settings_title'),
    apiKeys: t('settings_api_keys_title'),
    language: t('settings_language_prefs_title'),
  };

  // Set the theme on initial load
  useEffect(() => {
    const theme = localStorage.getItem('sahan-edit-theme') || 'dark';
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <div className="bg-black -m-4 sm:-m-6 md:-m-10 font-sans">
      <div className="sticky top-16 lg:top-0 bg-zinc-900/80 backdrop-blur-md z-10">
        <div className="flex items-center p-4 h-16 border-b border-zinc-800 max-w-4xl mx-auto">
          {view !== 'main' && (
            <button
              onClick={() => setView('main')}
              className="p-2 -ml-2 rtl:-mr-2 rtl:ml-0 rounded-full hover:bg-zinc-800 transition-colors"
              aria-label={t('settings_go_back')}
            >
              <ChevronLeftIcon className="w-6 h-6 text-white transform rtl:rotate-180" />
            </button>
          )}
          <h1 className={`text-xl font-semibold text-white ${view === 'main' ? 'px-2' : 'flex-grow text-center'}`}>
            {pageTitle[view]}
          </h1>
          {view !== 'main' && <div className="w-10"></div> /* Spacer */}
        </div>
      </div>
      <div className="p-2 sm:p-4 max-w-4xl mx-auto">
        {view === 'main' && <MainSettingsScreen setView={setView} />}
        {view === 'apiKeys' && <ApiKeySettings />}
        {view === 'language' && <LanguageSettings />}
      </div>
    </div>
  );
};
