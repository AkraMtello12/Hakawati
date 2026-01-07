import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Hero from './components/Hero';
import StoryEngine from './components/StoryEngine';
import Loading from './components/Loading';
import StoryBook from './components/StoryBook';
import { AppState, StoryParams, GeneratedStory } from './types';
import { generateStoryText } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HERO);
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    setAppState(AppState.INPUT);
  };

  const handleGenerate = async (params: StoryParams) => {
    setAppState(AppState.GENERATING);
    setError(null);
    try {
      const generatedStory = await generateStoryText(params);
      setStory(generatedStory);
      setAppState(AppState.READING);
    } catch (err) {
      console.error(err);
      setError("عذراً، حدث خطأ أثناء الاتصال بالحكواتي. يرجى المحاولة مرة أخرى.");
      setAppState(AppState.INPUT);
    }
  };

  const handleReset = () => {
    setStory(null);
    setAppState(AppState.HERO);
  };

  return (
    <div className="font-sans text-right" dir="rtl">
      <AnimatePresence mode='wait'>
        {appState === AppState.HERO && (
          <motion.div key="hero" exit={{ opacity: 0 }}>
            <Hero onStart={handleStart} />
          </motion.div>
        )}

        {appState === AppState.INPUT && (
          <motion.div 
            key="input" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <StoryEngine onSubmit={handleGenerate} />
            {error && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-50">
                    {error}
                </div>
            )}
          </motion.div>
        )}

        {appState === AppState.GENERATING && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loading />
          </motion.div>
        )}

        {appState === AppState.READING && story && (
          <motion.div key="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <StoryBook story={story} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
