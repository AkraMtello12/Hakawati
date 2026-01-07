import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles, Heart, Lightbulb, Droplets, Smile, Volume2, ScrollText, Edit3 } from 'lucide-react';
import { StoryParams, StoryDialect } from '../types';

interface StoryEngineProps {
  onSubmit: (params: StoryParams) => void;
}

const StoryEngine: React.FC<StoryEngineProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(6);
  const [moral, setMoral] = useState('');
  const [customMoral, setCustomMoral] = useState('');
  const [dialect, setDialect] = useState<StoryDialect>(StoryDialect.SYRIAN);

  const morals = [
    { id: 'kindness', label: 'اللطف', icon: Heart, prompt: 'kindness and compassion' },
    { id: 'honesty', label: 'الصدق', icon: Lightbulb, prompt: 'honesty and truth' },
    { id: 'saving', label: 'التوفير', icon: Droplets, prompt: 'saving resources' },
    { id: 'friendship', label: 'الصداقة', icon: User, prompt: 'friendship and loyalty' },
    { id: 'optimism', label: 'التفاؤل', icon: Smile, prompt: 'hope and optimism' },
  ];

  const handleMoralSelect = (prompt: string) => {
    if (moral === prompt) {
      setMoral(''); // Deselect
    } else {
      setMoral(prompt);
      setCustomMoral(''); // Clear custom if selecting preset
    }
  };

  const handleCustomMoralChange = (val: string) => {
    setCustomMoral(val);
    if (val) setMoral(''); // Clear preset if typing custom
  };

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit({
        childName: name,
        age,
        moral: customMoral || moral, // Use custom if available, else selected, else empty (AI decides)
        dialect
      });
    }
  };

  return (
    <div className="min-h-screen bg-h-stone flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Texture */}
        <div className="absolute inset-0 bg-pattern-islamic opacity-5 pointer-events-none" />

        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl bg-white/60 backdrop-blur-xl border border-white/40 rounded-[3rem] shadow-2xl overflow-hidden relative"
        >
            {/* Header */}
            <div className="bg-h-gold/10 p-8 text-center border-b border-h-gold/20">
                <h2 className="text-4xl font-serif text-h-night flex items-center justify-center gap-3">
                    <ScrollText className="text-h-gold" />
                    مصنع الحكايات
                </h2>
                <p className="text-gray-600 mt-2 font-sans">أخبر الحكواتي ببعض التفاصيل ليبدأ السحر</p>
            </div>

            <div className="p-8 md:p-12 space-y-10">
                
                {/* 1. Name Input */}
                <div className="space-y-4">
                    <label className="text-xl font-serif text-h-night block">من هو بطل الحكاية؟</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="اكتب اسم طفلك هنا..."
                            className="w-full bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 text-xl focus:outline-none focus:border-h-gold focus:ring-4 focus:ring-h-gold/10 transition-all text-right"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-h-gold">
                            <User />
                        </div>
                    </div>
                </div>

                {/* 2. Age Slider */}
                <div className="space-y-4">
                     <label className="text-xl font-serif text-h-night flex justify-between">
                        <span>كم عمر البطل؟</span>
                        <span className="text-h-gold font-bold font-sans">{age} سنوات</span>
                    </label>
                    <input 
                        type="range" 
                        min="3" 
                        max="12" 
                        value={age} 
                        onChange={(e) => setAge(parseInt(e.target.value))}
                        className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-h-gold"
                    />
                    <div className="flex justify-between text-sm text-gray-400 font-sans px-1">
                        <span>٣ سنوات</span>
                        <span>١٢ سنة</span>
                    </div>
                </div>

                {/* 3. Moral Selection (Optional) */}
                <div className="space-y-4">
                    <label className="text-xl font-serif text-h-night flex justify-between">
                        <span>ما هي العبرة المطلوبة؟</span>
                        <span className="text-sm text-gray-400 font-sans">(اختياري)</span>
                    </label>
                    
                    {/* Preset Morals */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {morals.map((m) => {
                            const Icon = m.icon;
                            const isSelected = moral === m.prompt;
                            return (
                                <motion.button
                                    key={m.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMoralSelect(m.prompt)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                                        isSelected 
                                        ? 'bg-h-gold text-white border-h-gold shadow-lg shadow-h-gold/30' 
                                        : 'bg-white border-gray-100 text-gray-500 hover:border-h-gold/50'
                                    }`}
                                >
                                    <Icon size={24} />
                                    <span className="font-sans font-medium">{m.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Custom Moral Input */}
                    <div className="relative mt-2">
                        <input 
                            type="text"
                            value={customMoral}
                            onChange={(e) => handleCustomMoralChange(e.target.value)}
                            placeholder="أو اكتب أي موضوع تريده هنا..."
                            className={`w-full bg-white border-2 rounded-xl px-6 py-3 text-lg focus:outline-none transition-all ${customMoral ? 'border-h-gold ring-2 ring-h-gold/10' : 'border-gray-100 focus:border-h-gold'}`}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                           <Edit3 size={18} />
                        </div>
                    </div>
                </div>

                {/* 4. Dialect Switch */}
                <div className="flex items-center justify-between bg-h-stone p-4 rounded-2xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-h-night rounded-full text-white">
                            <Volume2 size={20} />
                        </div>
                        <div>
                            <h3 className="font-serif text-lg text-h-night">لهجة الحكواتي</h3>
                            <p className="text-xs text-gray-500 font-sans">اختر أسلوب السرد المفضل</p>
                        </div>
                    </div>
                    <div className="flex bg-white rounded-full p-1 border border-gray-200">
                        <button 
                            onClick={() => setDialect(StoryDialect.FUSHA)}
                            className={`px-4 py-2 rounded-full text-sm font-sans transition-all ${dialect === StoryDialect.FUSHA ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500'}`}
                        >
                            فصحى
                        </button>
                        <button 
                            onClick={() => setDialect(StoryDialect.SYRIAN)}
                            className={`px-4 py-2 rounded-full text-sm font-sans transition-all ${dialect === StoryDialect.SYRIAN ? 'bg-h-gold text-white shadow-md' : 'text-gray-500'}`}
                        >
                            شامي
                        </button>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                    <motion.button
                        disabled={!name}
                        onClick={handleSubmit}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-5 rounded-2xl font-serif text-2xl flex items-center justify-center gap-3 transition-all ${
                            !name 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-h-gold to-yellow-600 text-white shadow-xl shadow-h-gold/30 hover:shadow-2xl'
                        }`}
                    >
                        <Sparkles className={!name ? "" : "animate-spin-slow"} />
                         اروي يا حكواتي
                    </motion.button>
                </div>
            </div>
        </motion.div>
    </div>
  );
};

export default StoryEngine;