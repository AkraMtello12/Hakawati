import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, LogOut } from 'lucide-react';
import { auth } from '../firebase';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-h-night flex items-center justify-center">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-pattern-islamic opacity-10 pointer-events-none"></div>
      
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-h-gold opacity-20 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 opacity-10 blur-[120px] rounded-full mix-blend-screen"></div>

      {/* Logout Button */}
      <div className="absolute top-6 left-6 z-20">
        <button 
            onClick={() => auth.signOut()}
            className="group flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
        >
            <LogOut size={18} />
            <span className="font-sans text-sm font-medium">تسجيل خروج</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="z-10 text-center px-6 max-w-4xl w-full flex flex-col items-center">
        
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
        >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-h-gold/30 bg-h-gold/10 text-h-gold text-sm font-sans mb-6 backdrop-blur-sm">
                <Sparkles size={16} />
                <span>الجيل القادم من الحكايات</span>
            </div>
        </motion.div>

        <motion.h1 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-6xl md:text-8xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-h-gold-light to-h-gold drop-shadow-2xl mb-6 leading-relaxed pb-4"
        >
          حكواتي
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-xl md:text-2xl text-gray-300 font-sans font-light mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          حيث يصبح طفلك بطل الحكاية. ندمج عبق دمشق القديمة بسحر الذكاء الاصطناعي لنروي قصصاً لا تُنسى.
        </motion.p>

        <motion.button
          onClick={onStart}
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(212, 175, 55, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          className="group relative px-10 py-5 bg-white/10 border border-white/20 rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-h-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center gap-3 text-2xl font-serif text-white group-hover:text-h-gold-light transition-colors">
            <BookOpen size={28} />
             ابدأ الحكاية الآن
          </span>
        </motion.button>
      </div>

      {/* Footer Pattern */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Hero;