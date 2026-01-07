import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Home, Volume2, StopCircle, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { GeneratedStory } from '../types';
import { generateSceneImage, generateSpeech, getFallbackImage } from '../services/geminiService';

interface StoryBookProps {
  story: GeneratedStory;
  onReset: () => void;
}

const StoryBook: React.FC<StoryBookProps> = ({ story, onReset }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [images, setImages] = useState<string[]>(new Array(story.pages.length).fill(''));
  const [loadingImage, setLoadingImage] = useState(false);
  const [usingFallback, setUsingFallback] = useState<boolean[]>(new Array(story.pages.length).fill(false));
  
  // Audio states
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Helper to decode base64
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // ignore
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    setLoadingAudio(true);
    try {
      const base64Audio = await generateSpeech(story.pages[currentPage].text);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const arrayBuffer = decodeBase64(base64Audio);
      const dataInt16 = new Int16Array(arrayBuffer);
      const float32Data = new Float32Array(dataInt16.length);
      for (let i = 0; i < dataInt16.length; i++) {
         float32Data[i] = dataInt16[i] / 32768.0;
      }
      
      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      
      sourceNodeRef.current = source;
      setIsPlaying(true);

    } catch (e) {
      console.error("Audio playback failed", e);
      alert("عذراً، لم نتمكن من قراءة النص حالياً.");
    } finally {
      setLoadingAudio(false);
    }
  };

  useEffect(() => {
    stopAudio();
  }, [currentPage]);

  useEffect(() => {
    return () => {
        stopAudio();
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  // Load image
  useEffect(() => {
    const loadImage = async () => {
      // If we already have an image (generated or fallback), don't reload
      if (images[currentPage]) return;

      if (story.pages[currentPage]) {
        setLoadingImage(true);
        try {
          // Attempt to generate AI image
          const imgUrl = await generateSceneImage(story.pages[currentPage].imagePrompt);
          setImages(prev => {
            const newImages = [...prev];
            newImages[currentPage] = imgUrl;
            return newImages;
          });
        } catch (e) {
          console.log("Using fallback image due to API limit/error");
          // If generation fails (429, 404, etc.), silently switch to fallback
          setImages(prev => {
            const newImages = [...prev];
            newImages[currentPage] = getFallbackImage(currentPage);
            return newImages;
          });
          setUsingFallback(prev => {
            const newStatus = [...prev];
            newStatus[currentPage] = true;
            return newStatus;
          });
        } finally {
          setLoadingImage(false);
        }
      }
    };
    loadImage();
  }, [currentPage, story.pages]);

  const nextPage = () => {
    if (currentPage < story.pages.length - 1) setCurrentPage(c => c + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(c => c - 1);
  };

  return (
    <div className="min-h-screen bg-h-night flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Navbar Actions */}
      <div className="absolute top-6 left-6 z-20 flex gap-3">
        <button onClick={onReset} className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-md" title="العودة للرئيسية">
            <Home size={20} />
        </button>
      </div>

      {/* Book Container */}
      <div className="relative w-full max-w-6xl aspect-[16/9] md:aspect-[2/1] bg-[#fdfbf7] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row border-8 border-[#3e2c22]">
        
        {/* Spine */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-8 bg-gradient-to-r from-[#2c1e16] to-[#4a362a] z-10 transform -translate-x-1/2 shadow-inner"></div>

        {/* Right Page (Text) */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative md:border-l border-[#e5e5e5]">
           <div className="absolute top-0 right-0 p-6 opacity-10">
                <img src="https://www.transparenttextures.com/patterns/arabesque.png" className="w-32 h-32" alt="decor" />
           </div>
           
           <motion.div
             key={`text-${currentPage}`}
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5 }}
           >
             <h2 className="text-3xl md:text-4xl font-serif text-h-gold mb-8 text-center md:text-right leading-relaxed">
               {currentPage === 0 ? story.title : `الفصل ${currentPage + 1}`}
             </h2>
             <p className="text-xl md:text-2xl font-sans leading-[2] text-gray-800 text-justify">
               {story.pages[currentPage].text}
             </p>
           </motion.div>

           <div className="mt-8 flex items-center gap-4">
              <button 
                onClick={playAudio}
                disabled={loadingAudio}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-serif text-lg transition-all ${
                    isPlaying 
                    ? 'bg-red-50 text-red-500 border border-red-200' 
                    : 'bg-h-gold/10 text-h-gold border border-h-gold/30 hover:bg-h-gold/20'
                }`}
              >
                  {loadingAudio ? (
                      <Loader2 size={20} className="animate-spin" />
                  ) : isPlaying ? (
                      <StopCircle size={20} />
                  ) : (
                      <Volume2 size={20} />
                  )}
                  <span>{isPlaying ? 'إيقاف القراءة' : 'اقرأ لي'}</span>
              </button>
           </div>

           <div className="mt-auto text-center text-gray-400 font-serif">
             {currentPage + 1} / {story.pages.length}
           </div>
        </div>

        {/* Left Page (Image) */}
        <div className="flex-1 p-4 md:p-8 bg-[#f5f5f0] flex items-center justify-center relative overflow-hidden">
            <div className="w-full h-full border-4 border-dashed border-[#d4af37]/30 rounded-2xl flex items-center justify-center bg-white shadow-inner overflow-hidden relative group">
                <AnimatePresence mode='wait'>
                    {loadingImage ? (
                         <motion.div 
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                         >
                             <div className="w-12 h-12 border-4 border-h-gold border-t-transparent rounded-full animate-spin"></div>
                             <span className="text-gray-400 font-serif">جاري رسم المشهد...</span>
                         </motion.div>
                    ) : (
                        <div className="relative w-full h-full">
                            <motion.img
                                key={`img-${currentPage}`}
                                src={images[currentPage]}
                                alt="Story Scene"
                                initial={{ scale: 1.1, opacity: 0, filter: 'blur(10px)' }}
                                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                transition={{ duration: 0.8 }}
                                className="w-full h-full object-cover rounded-xl"
                            />
                            
                            {/* Fallback Indicator */}
                            {usingFallback[currentPage] && (
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs text-gray-500 font-sans shadow-sm flex items-center gap-1">
                                    <ImageIcon size={12} />
                                    <span>صورة توضيحية (الخادم مشغول)</span>
                                </div>
                            )}

                             {/* AI Generated Indicator */}
                             {!usingFallback[currentPage] && images[currentPage] && (
                                <div className="absolute top-4 right-4 bg-h-gold/90 backdrop-blur px-3 py-1 rounded-full text-xs text-white font-sans shadow-sm flex items-center gap-1">
                                    <Sparkles size={12} />
                                    <span>رسم بالذكاء الاصطناعي</span>
                                </div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
                
                {/* Image Overlay Texture for "Painting" effect */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/canvas-orange.png')] opacity-30 mix-blend-multiply pointer-events-none"></div>
            </div>
        </div>

      </div>

      {/* Controls */}
      <div className="flex gap-8 mt-8 z-10">
        <button 
            onClick={prevPage} 
            disabled={currentPage === 0}
            className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-md"
        >
            <ChevronRight size={32} />
        </button>
        <button 
            onClick={nextPage} 
            disabled={currentPage === story.pages.length - 1}
            className="p-4 rounded-full bg-h-gold hover:bg-yellow-600 text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-h-gold/30 transition-all"
        >
            <ChevronLeft size={32} />
        </button>
      </div>

    </div>
  );
};

export default StoryBook;