import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Award, BookOpen, Star, User, Loader2, Package, Quote, Edit2, Check, X } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

interface UserProfileProps {
  user: { email: string | null; uid: string; displayName?: string | null };
  onBack: () => void;
}

interface SavedProverb {
    text: string;
    explanation: string;
}

interface UserStory {
    id: string;
    title: string;
    badge?: string; 
    proverb?: SavedProverb;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onBack }) => {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editing Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || user.email?.split('@')[0] || "المغامر");
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    const fetchUserStories = async () => {
        try {
            const q = query(
                collection(db, "stories"),
                where("userId", "==", user.uid)
            );
            
            const snapshot = await getDocs(q);
            
            const data = snapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    title: d.title || "قصة بلا عنوان",
                    badge: d.badge || d.params?.moral,
                    proverb: d.proverb // Fetch the proverb object
                };
            });
            setStories(data);
        } catch (error) {
            console.error("Error fetching user profile data", error);
        } finally {
            setLoading(false);
        }
    };

    fetchUserStories();
  }, [user.uid]);

  const handleSaveName = async () => {
    if (!auth.currentUser || !displayName.trim()) return;
    
    setIsSavingName(true);
    try {
        await updateProfile(auth.currentUser, {
            displayName: displayName
        });
        setIsEditingName(false);
    } catch (error) {
        console.error("Error updating profile", error);
        alert("حدث خطأ أثناء حفظ الاسم");
    } finally {
        setIsSavingName(false);
    }
  };

  // Unique Badges
  const badges = Array.from(new Set(stories.map(s => s.badge).filter(Boolean)));
  
  // Unique Proverbs (filtered by text to avoid duplicates)
  const proverbs = stories
    .map(s => s.proverb)
    .filter((p): p is SavedProverb => !!p)
    .filter((v, i, a) => a.findIndex(t => (t.text === v.text)) === i);

  return (
    <div className="min-h-screen bg-h-stone flex flex-col items-center p-4 relative overflow-hidden">
         {/* Background Texture */}
         <div className="absolute inset-0 bg-pattern-islamic opacity-5 pointer-events-none" />
         
         {/* Header */}
         <div className="w-full max-w-4xl flex justify-between items-center py-6 mb-8 relative z-10">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-h-night font-serif hover:text-h-gold transition-colors"
            >
                <ArrowLeft size={20} />
                <span>عودة للحارة</span>
            </button>
            <h1 className="text-2xl font-serif text-h-gold font-bold">ملف المغامر</h1>
         </div>

         <div className="w-full max-w-4xl space-y-8 relative z-10">
            
            {/* 1. Identity Card */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-h-gold/20 flex flex-col md:flex-row items-center gap-8"
            >
                <div className="w-24 h-24 rounded-full bg-h-night text-h-gold flex items-center justify-center border-4 border-h-gold shadow-lg shrink-0">
                    <User size={48} />
                </div>
                <div className="flex-1 text-center md:text-right w-full">
                    
                    {/* Editable Name Section */}
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        {isEditingName ? (
                            <div className="flex items-center gap-2 w-full max-w-xs animate-in fade-in">
                                <input 
                                    type="text" 
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full border-b-2 border-h-gold bg-transparent text-2xl font-serif text-h-night focus:outline-none py-1"
                                    autoFocus
                                />
                                <button 
                                    onClick={handleSaveName} 
                                    disabled={isSavingName}
                                    className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                                >
                                    {isSavingName ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsEditingName(false);
                                        setDisplayName(user.displayName || user.email?.split('@')[0] || "المغامر");
                                    }}
                                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-3xl font-serif text-h-night">{displayName}</h2>
                                <button 
                                    onClick={() => setIsEditingName(true)}
                                    className="text-gray-400 hover:text-h-gold transition-colors p-1"
                                    title="تعديل الاسم"
                                >
                                    <Edit2 size={18} />
                                </button>
                            </>
                        )}
                    </div>

                    <p className="text-gray-500 font-sans">{user.email}</p>
                    
                    <div className="flex gap-4 mt-6 justify-center md:justify-start">
                        <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold font-sans flex items-center gap-2">
                            <BookOpen size={16} />
                            <span>{stories.length} حكاية</span>
                        </div>
                        <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-xl font-bold font-sans flex items-center gap-2">
                            <Award size={16} />
                            <span>{badges.length} وسام</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 2. Wall of Badges */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
            >
                <h3 className="text-xl font-serif text-h-night mb-6 flex items-center gap-2">
                    <Award className="text-h-gold" />
                    حائط الأوسمة
                </h3>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-h-gold" /></div>
                ) : badges.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                        {badges.map((badge, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 min-w-[120px] transition-transform hover:scale-105">
                                <div className="w-14 h-14 bg-gradient-to-br from-h-gold to-yellow-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-h-gold/20">
                                    <Star size={28} fill="white" />
                                </div>
                                <span className="font-serif font-bold text-h-night text-sm mt-1">{badge}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 font-sans text-center py-8">لم تحصل على أوسمة بعد. ابدأ بصناعة الحكايات!</p>
                )}
            </motion.div>

            {/* 3. Hakawati's Bundle (The Treasury of Proverbs) - REPLACES STORY HISTORY */}
            <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="bg-[#fdfbf7] rounded-3xl shadow-sm border border-h-gold/30 overflow-hidden relative"
            >
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-h-gold to-transparent opacity-50"></div>
                
                <div className="p-8 border-b border-h-gold/10 flex items-center gap-3">
                    <div className="p-3 bg-h-gold/10 text-h-gold rounded-full">
                        <Package size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif text-h-night font-bold">صرة الحكواتي</h3>
                        <p className="text-xs text-gray-500 font-sans">كنوز الحكم التي جمعتها من حكاياتك</p>
                    </div>
                </div>
                
                {loading ? (
                    <div className="p-12 flex justify-center text-h-gold"><Loader2 className="animate-spin" /></div>
                ) : proverbs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                        {proverbs.map((proverb, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
                                {/* Moved quote to bottom-left to avoid Arabic text start (top-right) */}
                                <div className="absolute bottom-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                    <Quote size={48} className="text-h-gold rotate-180" />
                                </div>
                                
                                <div>
                                    <p className="text-lg font-serif font-bold text-h-night mb-3 relative z-10 leading-relaxed border-r-4 border-h-gold pr-3">
                                        "{proverb.text}"
                                    </p>
                                </div>
                                
                                <div className="text-sm text-gray-500 font-sans relative z-10 bg-gray-50 p-3 rounded-lg mt-2">
                                    <span className="font-bold text-h-gold/80 block mb-1 text-xs">المعنى:</span>
                                    {proverb.explanation}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center flex flex-col items-center gap-4">
                        <Package size={48} className="text-gray-200" />
                        <p className="text-gray-400 font-sans">الصرة فارغة حالياً. اقرأ المزيد من الحكايات لتمتلك الحكمة!</p>
                    </div>
                )}
            </motion.div>

         </div>
    </div>
  );
};

export default UserProfile;