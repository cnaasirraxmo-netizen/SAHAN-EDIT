import React, { useState } from 'react';
import { Page } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { GenerateLogo } from './components/ImageGenerator';
import { ImageEditor } from './components/ImageEditor';
import { LogoEditor } from './components/LogoEditor';
import { VideoGenerator } from './components/VideoGenerator';
import { VideoEditor } from './components/VideoEditor';
import { Settings } from './components/Settings';
import { VideoPromptGenerator } from './components/VideoPromptGenerator';


const App: React.FC = () => {
  const [page, setPage] = useState<Page>(Page.HOME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case Page.HOME:
        return <Home setPage={setPage} />;
      case Page.LOGO_GEN:
        return <GenerateLogo />;
      case Page.IMAGE_EDIT:
        return <ImageEditor />;
      case Page.LOGO_EDIT:
        return <LogoEditor />;
      case Page.VIDEO_GEN:
        return <VideoGenerator />;
      case Page.VIDEO_EDIT:
        return <VideoEditor />;
      case Page.VIDEO_PROMPT_GEN:
        return <VideoPromptGenerator />;
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

  return (
    <div className="bg-zinc-900 text-white font-sans">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar page={page} setPage={handleSetPage} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6 md:p-10 w-full max-w-7xl mx-auto">
           {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;