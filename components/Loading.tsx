import React from 'react';
import { motion } from 'framer-motion';

const Loading: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-h-night z-50 flex flex-col items-center justify-center">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-h-night to-[#1a1a2e]" />
        
        <div className="relative z-10 flex flex-col items-center">
            {/* Feather/Quill Animation Container */}
            <div className="relative w-32 h-32 mb-8">
                <motion.svg
                    viewBox="0 0 100 100"
                    className="w-full h-full text-h-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    {/* Abstract Feather Path */}
                    <motion.path
                        d="M20,80 Q50,20 80,10 C80,10 60,40 50,50 Q40,60 20,80 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                     {/* Writing Line */}
                     <motion.path
                        d="M20,85 Q40,85 60,80 T90,85"
                        fill="none"
                        stroke="white"
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                    />
                </motion.svg>
            </div>

            <motion.h3 
                className="text-3xl font-serif text-white mb-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                جاري نسج الحكاية...
            </motion.h3>
            <p className="text-h-gold-light font-sans opacity-80">الحكواتي يرتب أفكاره</p>
        </div>
    </div>
  );
};

export default Loading;
