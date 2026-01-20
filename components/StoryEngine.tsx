import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles, Heart, Lightbulb, Droplets, Smile, Volume2, ScrollText, Edit3, Users, Map, Castle, PartyPopper, Rocket, Zap, BookOpen, Hourglass, LogOut, ArrowRight } from 'lucide-react';
import { StoryParams, StoryDialect, Gender, StoryLength } from '../types';
import { auth } from '../firebase';

interface StoryEngineProps {
  onSubmit: (params: StoryParams) => void;
  onBack: () => void;
}

const StoryEngine: React.FC<StoryEngineProps> = ({ onSubmit, onBack }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('boy');
  const [age, setAge] = useState(6);
  const [selectedMoralId, setSelectedMoralId] = useState<string>(''); 
  const [moralPrompt, setMoralPrompt] = useState(''); 
  const [customMoral, setCustomMoral] = useState('');
  const [dialect, setDialect] = useState<StoryDialect>(StoryDialect.SYRIAN);
  const [sidekick, setSidekick] = useState<string>('');
  const [world, setWorld] = useState<string>('');
  const [length, setLength] = useState<StoryLength>('medium');

  const morals = [
    { id: 'kindness', label: 'اللطف', icon: Heart, prompt: 'اللطف والرحمة' },
    { id: 'honesty', label: 'الصدق', icon: Lightbulb, prompt: 'الصدق وقول الحقيقة' },
    { id: 'saving', label: 'التوفير', icon: Droplets, prompt: 'أهمية التوفير وعدم الإسراف' },
    { id: 'friendship', label: 'الصداقة', icon: Users, prompt: 'قيمة الصداقة والوفاء' },
    { id: 'optimism', label: 'التفاؤل', icon: Smile, prompt: 'الأمل والتفاؤل' },
  ];

  const sidekicks = [
    { id: 'cat', label: 'قطة', icon: '🐱' },
    { id: 'bird', label: 'عصفور', icon: '🐦' },
    { id: 'turtle', label: 'سلحفاة', icon: '🐢' },
  ];

  const worlds = [
    { id: 'adventure', label: 'عالم المغامرة', icon: Map, prompt: 'an adventurous world full of maps, mountains, and hidden treasures' },
    { id: 'fantasy', label: 'عالم الخيال', icon: Castle, prompt: 'a magical fantasy world with castles, magic wands, and enchanted creatures' },
    { id: 'comedy', label: 'عالم الضحك', icon: PartyPopper, prompt: 'a silly, funny world like a circus or a town where everything is upside down' },
    { id: 'space', label: 'عالم الفضاء', icon: Rocket, prompt: 'a sci-fi space setting with planets, stars, rockets, and friendly aliens' },
  ];

  const lengthOptions: Record<StoryLength, { label: string; icon: React.ElementType; sub: string }> = {
    short: { label: 'قصة سريعة', icon: Zap, sub: 'خفيفة قبل النوم' },
    medium: { label: 'قصة كاملة', icon: BookOpen, sub: 'المتعة المعتادة' },
    long: { label: 'قصة ملحمية', icon: Hourglass, sub: 'بتفاصيل غنية' }
  };

  const lengthOptionsKeys = Object.keys(lengthOptions) as StoryLength[];

  const handleMoralSelect = (id: string, prompt: string) => {
    if (selectedMoralId === id) {
      setSelectedMoralId('');
      setMoralPrompt('');
    } else {
      setSelectedMoralId(id);
      setMoralPrompt(prompt);
      setCustomMoral(''); 
    }
  };

  const handleCustomMoralChange = (val: string) => {
    setCustomMoral(val);
    if (val) {
        setSelectedMoralId(''); 
        setMoralPrompt('');
    }
  };

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit({
        childName: name,
        gender,
        age,
        moral: customMoral || moralPrompt, 
        moralId: selectedMoralId || undefined, 
        dialect,
        sidekick: sidekick || undefined,
        world: world || undefined,
        length
      });
    }
  };

  return (
    <div className="min-h-screen bg-h-stone flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Texture */}
        <div className="absolute inset-0 bg-pattern-islamic opacity-5 pointer-events-none" />

        {/* Back Button (Top Right) */}
        <div className="absolute top-6 right-6 z-20">
            <button 
                onClick={onBack}
                className="group flex items-center gap-2 px-4 py-2 bg-white/50 border border-gray-200 rounded-full text-gray-500 hover:text-h-gold hover:bg-white transition-all shadow-sm backdrop-blur-md"
            >
                <ArrowRight size={18} />
                <span className="font-sans text-sm font-medium">رجوع</span>
            </button>
        </div>

        {/* Logout Button (Top Left) */}
        <div className="absolute top-6 left-6 z-20">
            <button 
                onClick={() => auth.signOut()}
                className="group flex items-center gap-2 px-4 py-2 bg-white/50 border border-gray-200 rounded-full text-gray-500 hover:text-red-500 hover:bg-white transition-all shadow-sm backdrop-blur-md"
            >
                <LogOut size={18} />
                <span className="font-sans text-sm font-medium">تسجيل خروج</span>
            </button>
        </div>

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
                
                {/* 1. Name & Gender Input */}
                <div className="space-y-4">
                    <label className="text-xl font-serif text-h-night block">من هو بطل الحكاية؟</label>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
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
                        
                        {/* Gender Toggle */}
                        <div className="flex bg-white rounded-2xl p-1 border-2 border-gray-200 w-full md:w-auto shrink-0">
                             <button
                                onClick={() => setGender('boy')}
                                className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-serif text-lg transition-all flex items-center justify-center gap-2 ${gender === 'boy' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                             >
                                👦 ولد
                             </button>
                             <button
                                onClick={() => setGender('girl')}
                                className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-serif text-lg transition-all flex items-center justify-center gap-2 ${gender === 'girl' ? 'bg-pink-100 text-pink-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                             >
                                👧 بنت
                             </button>
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

                {/* 3. Story World Selection (New Feature) */}
                <div className="space-y-4">
                    <label className="text-xl font-serif text-h-night flex justify-between items-center">
                        <span>في أي عالم تدور القصة؟</span>
                        <span className="text-sm text-gray-400 font-sans">(اختياري)</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {worlds.map((w) => {
                            const Icon = w.icon;
                            const isSelected = world === w.prompt;
                            return (
                                <motion.button
                                    key={w.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setWorld(isSelected ? '' : w.prompt)}
                                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                        isSelected 
                                        ? 'bg-h-gold/10 border-h-gold text-h-gold shadow-lg' 
                                        : 'bg-white border-gray-200 text-gray-500 hover:border-h-gold/50 hover:bg-h-gold/5'
                                    }`}
                                >
                                    <div className={`p-3 rounded-full ${isSelected ? 'bg-h-gold text-white' : 'bg-gray-100'}`}>
                                        <Icon size={24} />
                                    </div>
                                    <span className="font-sans font-bold">{w.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Sidekick Selection */}
                <div className="space-y-4">
                     <label className="text-xl font-serif text-h-night flex justify-between items-center">
                        <span>هل يرافق البطل صديق أليف؟</span>
                        <span className="text-sm text-gray-400 font-sans">(اختياري)</span>
                    </label>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {sidekicks.map((s) => {
                            const isSelected = sidekick === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setSidekick(isSelected ? '' : s.id)}
                                    className={`flex-1 min-w-[100px] p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                        isSelected
                                        ? 'border-h-gold bg-h-gold/10 shadow-lg'
                                        : 'border-gray-200 bg-white hover:border-h-gold/50'
                                    }`}
                                >
                                    <span className="text-4xl">{s.icon}</span>
                                    <span className="font-sans font-medium text-gray-700">{s.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 5. Moral Selection (Optional) */}
                <div className="space-y-4">
                    <label className="text-xl font-serif text-h-night flex justify-between">
                        <span>ما هي العبرة المطلوبة؟</span>
                        <span className="text-sm text-gray-400 font-sans">(اختياري)</span>
                    </label>
                    
                    {/* Preset Morals */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {morals.map((m) => {
                            const Icon = m.icon;
                            const isSelected = selectedMoralId === m.id;
                            return (
                                <motion.button
                                    key={m.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMoralSelect(m.id, m.prompt)}
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

                {/* 6. Story Length (New Feature) */}
                <div className="space-y-4 border-t border-gray-200 pt-6">
                    <label className="text-xl font-serif text-h-night flex justify-between">
                        <span>وقت الحكاية</span>
                        <span className="text-h-gold font-bold font-sans text-lg">{lengthOptions[length].label}</span>
                    </label>
                    <div className="flex bg-gray-100 p-1 rounded-2xl relative isolate">
                        {lengthOptionsKeys.map((l) => {
                            const Icon = lengthOptions[l].icon;
                            const isSelected = length === l;
                            return (
                                <button
                                    key={l}
                                    onClick={() => setLength(l)}
                                    className={`flex-1 relative z-10 py-3 flex flex-col items-center justify-center gap-1 transition-colors ${isSelected ? 'text-h-night' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="length-selector-bg"
                                            className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200 -z-10"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Icon size={18} className={isSelected ? 'text-h-gold' : ''} />
                                        <span className={`font-serif font-bold ${isSelected ? 'text-base' : 'text-sm'}`}>{lengthOptions[l].label}</span>
                                    </div>
                                    <span className="text-xs font-sans opacity-70 hidden md:block">{lengthOptions[l].sub}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 7. Dialect Switch */}
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
                <div className="pt-2">
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