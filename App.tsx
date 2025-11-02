import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Page } from './types';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { GenerateLogo } from './components/ImageGenerator';
import { CinematicImageGenerator } from './components/CinematicImageGenerator';
import { ImageEditor } from './components/ImageEditor';
import { LogoEditor } from './components/LogoEditor';
import { VideoGenerator } from './components/VideoGenerator';
import { VideoEditor } from './components/VideoEditor';
import { Settings } from './components/Settings';
import { VideoPromptGenerator } from './components/VideoPromptGenerator';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { initDB } from './services/idb';
import { processSyncQueue } from './services/syncService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import type { Video } from '@google/genai';
import { HomeIcon, ClipboardDocumentListIcon, SparklesIcon, FilmIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, ClipboardDocumentListIcon as ClipboardDocumentListIconSolid, SparklesIcon as SparklesIconSolid, FilmIcon as FilmIconSolid, ViewfinderCircleIcon as ViewfinderCircleIconSolid } from '@heroicons/react/24/solid';


const OnlineStatusBanner: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  const { t } = useLanguage();
  if (isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 p-2 bg-green-600 text-white text-center text-sm z-[100]">
        {t('online_banner_back')}
      </div>
    );
  }
  return (
    <div className="fixed top-0 left-0 right-0 p-2 bg-zinc-700 text-white text-center text-sm z-[100]">
      {t('online_banner_offline')}
    </div>
  );
};

// --- Bottom Navigation Bar Component ---

interface BottomNavBarProps {
    page: Page;
    setPage: (page: Page) => void;
}

const NavItem: React.FC<{
    page: Page;
    targetPage: Page;
    setPage: (page: Page) => void;
    label: string;
    Icon: React.ElementType;
    IconSolid: React.ElementType;
}> = ({ page, targetPage, setPage, label, Icon, IconSolid }) => {
    const isActive = page === targetPage;
    const CurrentIcon = isActive ? IconSolid : Icon;
    return (
        <button
            onClick={() => setPage(targetPage)}
            className="flex flex-col items-center justify-center flex-1 py-2 px-1 text-xs transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
        >
            <CurrentIcon className={`w-6 h-6 mb-1 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
            <span className={`font-semibold ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`}>{label}</span>
        </button>
    );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ page, setPage }) => {
    const { t } = useLanguage();

    const navItems = [
        {
            targetPage: Page.HOME,
            label: t('sidebar_home'),
            Icon: HomeIcon,
            IconSolid: HomeIconSolid,
        },
        {
            targetPage: Page.VIDEO_PROMPT_GEN,
            label: t('sidebar_video_script'),
            Icon: ClipboardDocumentListIcon,
            IconSolid: ClipboardDocumentListIconSolid,
        },
        {
            targetPage: Page.LOGO_GEN,
            label: t('sidebar_generate_logo'),
            Icon: SparklesIcon,
            IconSolid: SparklesIconSolid,
        },
        {
            targetPage: Page.VIDEO_GEN,
            label: t('sidebar_generate_video'),
            Icon: FilmIcon,
            IconSolid: FilmIconSolid,
        },
        {
            targetPage: Page.VIDEO_ANALYZER,
            label: t('sidebar_video_analyzer'),
            Icon: ViewfinderCircleIcon,
            IconSolid: ViewfinderCircleIconSolid,
        }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-800/90 backdrop-blur-md border-t border-zinc-700 z-50 flex items-stretch">
            {navItems.map(item => (
                <NavItem
                    key={item.targetPage}
                    page={page}
                    targetPage={item.targetPage}
                    setPage={setPage}
                    label={item.label}
                    Icon={item.Icon}
                    IconSolid={item.IconSolid}
                />
            ))}
        </nav>
    );
};


const AppContent: React.FC = () => {
  const [page, setPage] = useState<Page>(Page.HOME);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isOnline, wasOffline } = useOnlineStatus();
  const { language } = useLanguage();
  const [videoContext, setVideoContext] = useState<{ video: Video; url: string } | null>(null);

  useEffect(() => {
    // Initialize the database on app load
    initDB();

    if (isOnline) {
      console.log("App is online, processing sync queue...");
      processSyncQueue();
    }
  }, [isOnline]);
  
  // Add a key to the root div to force re-render on language change,
  // which helps with some complex components if needed.
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const renderPage = () => {
    switch (page) {
      case Page.HOME:
        return <Home setPage={setPage} />;
      case Page.LOGO_GEN:
        return <GenerateLogo setPage={setPage} />;
      case Page.IMAGE_GEN:
        return <CinematicImageGenerator setPage={setPage} />;
      case Page.IMAGE_EDIT:
        return <ImageEditor setPage={setPage} />;
      case Page.LOGO_EDIT:
        return <LogoEditor setPage={setPage} />;
      case Page.VIDEO_GEN:
        return <VideoGenerator setPage={setPage} setVideoContext={setVideoContext} />;
      case Page.VIDEO_EDIT:
        return <VideoEditor setPage={setPage} />;
      case Page.VIDEO_PROMPT_GEN:
        return <VideoPromptGenerator setPage={setPage} />;
       case Page.VIDEO_ANALYZER:
        return <VideoAnalyzer setPage={setPage} />;
      case Page.SETTINGS:
        return <Settings />;
      default:
        return <Home setPage={setPage} />;
    }
  };

  const handleSetPage = (newPage: Page) => {
    // Clear video editing context when navigating away from the video editing flow
    // to ensure a fresh start next time.
    if (newPage !== Page.VIDEO_EDIT) {
      setVideoContext(null);
    }
    setPage(newPage);
  }

  const bannerRoot = document.getElementById('status-banner');

  return (
    <div className="font-sans" key={language}>
      {bannerRoot && !isOnline && ReactDOM.createPortal(<OnlineStatusBanner isOnline={isOnline} />, bannerRoot)}
      {bannerRoot && isOnline && wasOffline && ReactDOM.createPortal(<OnlineStatusBanner isOnline={isOnline} />, bannerRoot)}
      
      <Header onProfileClick={() => setIsAuthModalOpen(true)} />
      
      <main className={`min-h-screen transition-padding duration-300 pb-20 ${!isOnline || (isOnline && wasOffline) ? 'pt-24' : 'pt-16'}`}>
        <div className="p-4 sm:p-6 md:p-10 w-full max-w-7xl mx-auto">
           {renderPage()}
        </div>
      </main>

      <BottomNavBar page={page} setPage={handleSetPage} />

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  </AuthProvider>
);


export default App;