import React, { useState } from 'react';
import { ImageGenerator } from './components/ImageGenerator';
import { ImageEditor } from './components/ImageEditor';
import { VideoGenerator } from './components/VideoGenerator';
import { VideoEditor } from './components/VideoEditor';
import { CreationMode } from './types';
import { PhotoIcon, PaintBrushIcon, VideoCameraIcon, SparklesIcon, FilmIcon } from '@heroicons/react/24/outline';


const App: React.FC = () => {
  const [mode, setMode] = useState<CreationMode>(CreationMode.IMAGE_GEN);

  const renderComponent = () => {
    switch (mode) {
      case CreationMode.IMAGE_GEN:
        return <ImageGenerator />;
      case CreationMode.IMAGE_EDIT:
        return <ImageEditor />;
      case CreationMode.VIDEO_GEN:
        return <VideoGenerator />;
      case CreationMode.VIDEO_EDIT:
        return <VideoEditor />;
      default:
        return <ImageGenerator />;
    }
  };

  const NavButton: React.FC<{
    currentMode: CreationMode;
    targetMode: CreationMode;
    onClick: (mode: CreationMode) => void;
    icon: React.ReactNode;
    text: string;
  }> = ({ currentMode, targetMode, onClick, icon, text }) => (
    <button
      onClick={() => onClick(targetMode)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${
        currentMode === targetMode
          ? 'bg-indigo-600 text-white shadow-lg'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{text}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600 flex items-center justify-center gap-3">
            <SparklesIcon className="w-10 h-10 text-indigo-500" />
            Creative Suite AI
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Your AI-powered partner for stunning visuals and videos.
          </p>
        </header>

        <nav className="max-w-2xl mx-auto mb-8 p-2 bg-gray-800 rounded-xl shadow-md flex items-center justify-around gap-2">
          <NavButton
            currentMode={mode}
            targetMode={CreationMode.IMAGE_GEN}
            onClick={setMode}
            icon={<PhotoIcon className="w-5 h-5" />}
            text="Generate Image"
          />
          <NavButton
            currentMode={mode}
            targetMode={CreationMode.IMAGE_EDIT}
            onClick={setMode}
            icon={<PaintBrushIcon className="w-5 h-5" />}
            text="Edit Image"
          />
          <NavButton
            currentMode={mode}
            targetMode={CreationMode.VIDEO_GEN}
            onClick={setMode}
            icon={<VideoCameraIcon className="w-5 h-5" />}
            text="Generate Video"
          />
          <NavButton
            currentMode={mode}
            targetMode={CreationMode.VIDEO_EDIT}
            onClick={setMode}
            icon={<FilmIcon className="w-5 h-5" />}
            text="Edit Video"
          />
        </nav>

        <main>
          <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
            {renderComponent()}
          </div>
        </main>
        
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;