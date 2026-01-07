import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Home, Volume2, StopCircle, Loader2, Image as ImageIcon, Heart, Medal, BookOpen, Star, HelpCircle, Gift } from 'lucide-react';
import { GeneratedStory } from '../types';
import { generateSceneImage, generateSpeech } from '../services/geminiService';

interface StoryBookProps {
  story: GeneratedStory;
  onReset: () => void;
}

const StoryBook: React.FC<StoryBookProps> = ({ story, onReset }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [images, setImages] = useState<string[]>(new Array(story.pages.length).fill(''));
  const [showInteraction, setShowInteraction] = useState(false);
  const [interactionCompleted, setInteractionCompleted] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  
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
      } catch (e) { }
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

  // Image Loading (Theme Based)
  useEffect(() => {
    const loadImage = async () => {
      if (images[currentPage]) return;

      if (story.pages[currentPage]) {
        const imgUrl = await generateSceneImage(
            story.pages[currentPage].imagePrompt, 
            story.moralId
        );
        setImages(prev => {
            const newImages = [...prev];
            newImages[currentPage] = imgUrl;
            return newImages;
        });
      }
    };
    loadImage();
  }, [currentPage, story.pages, story.moralId]);

  const nextPage = () => {
    // Interaction Check at mid-point (e.g. after page index 1, which is page 2)
    if (currentPage === 1 && !interactionCompleted) {
        setShowInteraction(true);
        return;
    }
    if (currentPage < story.pages.length - 1) {
        setCurrentPage(c => c + 1);
    } else {
        // End of story
        setShowBadge(true);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(c => c - 1);
  };

  // --- Magic Dictionary Renderer ---
  const renderTextWithDictionary = (text: string) => {
    const dictWords = story.dictionary.map(d => d.word);
    
    if (dictWords.length === 0) return text;

    let parts: (string | React.JSX.Element)[] = [text];

    story.dictionary.forEach((entry) => {
       const newParts: (string | React.JSX.Element)[] = [];
       parts.forEach(part => {
          if (typeof part !== 'string') {
             newParts.push(part);
             return;
          }
          const split = part.split(new RegExp(`(${entry.word})`, 'gi'));
          split.forEach((s, idx) => {
             if (s.toLowerCase() === entry.word.toLowerCase()) {
                newParts.push(
                    <span key={`${entry.word}-${idx}`} className="group relative inline-block cursor-help mx-1">
                        <span className="border-b-2 border-dotted border-h-gold text-h-gold font-bold">{s}</span>
                        {/* Tooltip */}
                        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-h-night text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-xl">
                            {entry.definition}
                            <svg className="absolute text-h-night h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                        </span>
                    </span>
                );
             } else {
                newParts.push(s);
             }
          });
       });
       parts = newParts;
    });

    return <>{parts}</>;
  };

  // --- Badge View (End Screen) ---
  if (showBadge) {
      return (
        <div className="min-h-screen bg-h-night flex flex-col items-center justify-center p-4 relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute inset-0 bg-pattern-islamic opacity-10 animate-pulse"></div>
             <div className="absolute top-0 w-full h-full bg-gradient-to-b from-transparent to-black/80"></div>
             
             <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="z-10 bg-[#fdfbf7] p-8 md:p-12 rounded-[3rem] max-w-lg w-full text-center shadow-[0_0_60px_rgba(212,175,55,0.4)] border-8 border-double border-h-gold relative"
             >
                {/* Ribbon */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-h-accent text-white px-8 py-2 rounded-full font-serif text-xl shadow-lg">
                    النهاية
                </div>

                <div className="mt-8 mb-8 relative inline-block">
                    <Medal size={120} className="text-h-gold drop-shadow-xl mx-auto" strokeWidth={1} />
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                         <Star className="text-h-gold fill-h-gold/20 animate-spin-slow" size={160} />
                    </motion.div>
                </div>
                
                <h2 className="text-3xl font-serif text-h-night mb-4">أحسنت يا بطل!</h2>
                <p className="text-gray-600 font-sans mb-8">لقد أتممت القصة وحصلت على وسام</p>
                
                <div className="bg-h-gold/10 border border-h-gold/30 p-6 rounded-2xl mb-8">
                    <h3 className="text-4xl font-serif text-h-gold mb-2">{story.moralName}</h3>
                </div>

                <button 
                    onClick={onReset}
                    className="w-full py-4 bg-h-night text-white rounded-xl font-serif text-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                    <BookOpen size={20} />
                    حكاية جديدة
                </button>
             </motion.div>
        </div>
      );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-h-night flex flex-col items-center justify-center p-4 md:p-8 relative">
      
      {/* Navbar Actions */}
      <div className="absolute top-6 left-6 z-20 flex gap-3">
        <button onClick={onReset} className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-md" title="العودة للرئيسية">
            <Home size={20} />
        </button>
      </div>

      {/* --- Book Container --- */}
      <div className={`relative w-full max-w-6xl aspect-[16/9] md:aspect-[2/1] bg-[#fdfbf7] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row border-8 border-[#3e2c22] transition-all duration-500 ${showInteraction ? 'blur-sm scale-95 opacity-80' : ''}`}>
        
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
             <div className="text-xl md:text-2xl font-sans leading-[2.2] text-gray-800 text-justify">
               {/* Use the Dictionary Renderer here */}
               {renderTextWithDictionary(story.pages[currentPage].text)}
             </div>
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
                    <div className="relative w-full h-full">
                        <motion.img
                            key={`img-${currentPage}`}
                            src={images[currentPage]}
                            alt="Story Scene"
                            initial={{ scale: 1.05, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1 }}
                            className="w-full h-full object-cover rounded-xl"
                        />
                        
                        {/* Theme Badge */}
                        <div className="absolute top-4 right-4 bg-h-gold/90 backdrop-blur px-3 py-1 rounded-full text-xs text-white font-sans shadow-sm flex items-center gap-1">
                            {story.moralId ? <Heart size={12} fill="white" /> : <ImageIcon size={12} />}
                            <span>{story.moralId ? "لوحة فنية خاصة بالعبرة" : "مشهد فني"}</span>
                        </div>
                    </div>
                </AnimatePresence>
                
                {/* Image Overlay Texture */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/canvas-orange.png')] opacity-30 mix-blend-multiply pointer-events-none"></div>
            </div>
        </div>

      </div>

      {/* --- Controls --- */}
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
            className={`group rounded-full transition-all flex items-center gap-2 shadow-lg ${
                currentPage === story.pages.length - 1
                ? 'bg-gradient-to-r from-h-gold to-yellow-600 px-8 py-4 hover:scale-105 shadow-h-gold/50'
                : 'p-4 bg-h-gold hover:bg-yellow-600 shadow-h-gold/30'
            } text-white`}
        >
            {(currentPage === story.pages.length - 1) ? (
                <>
                    <span className="font-serif text-xl">استلم هديتك</span>
                    <Gift size={24} className="animate-bounce" />
                </>
            ) : (
                <ChevronLeft size={32} />
            )}
        </button>
      </div>

      {/* --- Interaction Modal (Pop-up) --- */}
      <AnimatePresence>
        {showInteraction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-h-night/60 backdrop-blur-md"
                />

                {/* Card */}
                <motion.div 
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="relative bg-[#fdfbf7] w-full max-w-lg rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border-4 border-h-gold"
                >
                    {/* Header */}
                    <div className="bg-h-gold/10 p-6 flex flex-col items-center border-b border-h-gold/20">
                        <div className="bg-white p-3 rounded-full shadow-md border border-h-gold/30 mb-3">
                            <HelpCircle size={32} className="text-h-gold" />
                        </div>
                        <h3 className="text-2xl font-serif text-h-night text-center">ماذا ستفعل لو كنت البطل؟</h3>
                    </div>

                    {/* Question Content */}
                    <div className="p-8">
                        <p className="text-xl text-center font-sans text-gray-700 mb-8 leading-relaxed">
                            {story.question.text}
                        </p>

                        <div className="space-y-4">
                            {story.question.options.map((opt, idx) => (
                                <motion.button
                                    key={idx}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 + 0.2 }}
                                    onClick={() => {
                                        if (opt.isCorrect) {
                                            // Provide visual feedback instead of alert? For now alert is fine but logic is improved.
                                            // In a polished app, you might show a success state inside the modal first.
                                            alert(`✅ ${opt.feedback}`); 
                                            setInteractionCompleted(true);
                                            setShowInteraction(false);
                                            setCurrentPage(prev => prev + 1);
                                        } else {
                                            alert(`⚠️ ${opt.feedback}`);
                                        }
                                    }}
                                    className="w-full group p-4 rounded-xl border-2 border-gray-200 hover:border-h-gold hover:bg-h-gold/5 transition-all flex items-center gap-4 text-right"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 group-hover:border-h-gold flex items-center justify-center text-gray-500 group-hover:text-h-gold font-bold font-serif shadow-sm">
                                        {idx + 1}
                                    </div>
                                    <span className="flex-1 text-lg font-sans font-medium text-gray-700 group-hover:text-h-night">
                                        {opt.text}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StoryBook;