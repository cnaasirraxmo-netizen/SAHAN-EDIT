import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Page } from './types';
import { Sidebar } from './components/Sidebar';
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
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { initDB } from './services/idb';
import { processSyncQueue } from './services/syncService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';


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


const AppContent: React.FC = () => {
  const [page, setPage] = useState<Page>(Page.HOME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isOnline, wasOffline } = useOnlineStatus();
  const { language } = useLanguage();

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
        return <VideoGenerator />;
      case Page.VIDEO_EDIT:
        return <VideoEditor />;
      case Page.VIDEO_PROMPT_GEN:
        return <VideoPromptGenerator setPage={setPage} />;
      case Page.SETTINGS:
        return <Settings />;
      default:
        return <Home setPage={setPage} />;
    }
  };

  const handleSetPage = (newPage: Page) => {
    setPage(newPage);
    setIsSidebarOpen(false); // Close sidebar on navigation for mobile
  }

  const bannerRoot = document.getElementById('status-banner');

  return (
    <div className="font-sans" key={language}>
      {bannerRoot && !isOnline && ReactDOM.createPortal(<OnlineStatusBanner isOnline={isOnline} />, bannerRoot)}
      {bannerRoot && isOnline && wasOffline && ReactDOM.createPortal(<OnlineStatusBanner isOnline={isOnline} />, bannerRoot)}
      
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar page={page} setPage={handleSetPage} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className={`lg:ml-64 lg:rtl:mr-64 lg:rtl:ml-0 min-h-screen transition-padding duration-300 ${!isOnline || (isOnline && wasOffline) ? 'pt-24' : 'pt-16'}`}>
        <div className="p-4 sm:p-6 md:p-10 w-full max-w-7xl mx-auto">
           {renderPage()}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);


export default App;
