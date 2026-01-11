import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Key, Chrome, ArrowLeft, Send } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';

interface AuthPageProps {
  onSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // For signup
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // Here you could save the "name" to user profile or Firestore in a later step
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') setError('البريد أو كلمة المرور غير صحيحة');
      else if (err.code === 'auth/email-already-in-use') setError('هذا البريد مسجل مسبقاً');
      else if (err.code === 'auth/weak-password') setError('كلمة المرور ضعيفة جداً');
      else if (err.code === 'auth/unauthorized-domain') setError('نطاق الموقع غير مصرح به (Unauthorized Domain). يرجى إضافته في إعدادات Firebase Authentication.');
      else setError('حدث خطأ ما، حاول مرة أخرى: ' + err.code);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
         setError('نطاق الموقع الحالي غير مصرح له بالدخول. يرجى الذهاب إلى Firebase Console > Authentication > Settings > Authorized domains وإضافة هذا النطاق.');
      } else if (err.code === 'auth/popup-closed-by-user') {
         setError('تم إغلاق النافذة قبل اكتمال الدخول.');
      } else if (err.code === 'auth/popup-blocked') {
         setError('المتصفح منع النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.');
      } else {
         setError('فشل الدخول عبر Google. تأكد من الإعدادات.');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('الرجاء إدخال البريد الإلكتروني أولاً');
      return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
        setShowForgot(false);
    } catch (err) {
        setError('تعذر إرسال الرابط، تأكد من صحة البريد');
    }
  };

  return (
    <div className="min-h-screen bg-h-night flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-pattern-islamic opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-h-gold/20 blur-[100px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl overflow-hidden relative z-10"
      >
        <AnimatePresence mode="wait">
            {!showForgot ? (
                <motion.div 
                    key="auth-form"
                    initial={{ x: 0 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="p-8"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                    <h2 className="text-3xl font-serif text-h-gold mb-2">بوابة الحارة</h2>
                    <p className="text-gray-300 font-sans text-sm">أهلاً بك في عالم الحكايات</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-black/20 p-1 rounded-xl mb-6">
                    <button 
                        onClick={() => { setIsLogin(true); setError(''); }}
                        className={`flex-1 py-2 rounded-lg font-serif text-sm transition-all ${isLogin ? 'bg-h-gold text-h-night shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        دخول للحارة
                    </button>
                    <button 
                        onClick={() => { setIsLogin(false); setError(''); }}
                        className={`flex-1 py-2 rounded-lg font-serif text-sm transition-all ${!isLogin ? 'bg-h-gold text-h-night shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        سجل نفوس جديد
                    </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="relative">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-h-gold w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="اسم الطفل"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-h-gold transition-colors text-right"
                            required={!isLogin}
                        />
                        </div>
                    )}

                    <div className="relative">
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-h-gold w-5 h-5" />
                        <input 
                        type="email" 
                        placeholder="البريد الإلكتروني"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-h-gold transition-colors text-right"
                        required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-h-gold w-5 h-5" />
                        <input 
                        type="password" 
                        placeholder="كلمة المرور"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-h-gold transition-colors text-right"
                        required
                        />
                    </div>

                    {error && <p className="text-red-400 text-xs text-center font-sans bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}

                    {isLogin && (
                        <div className="text-left">
                        <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-gray-400 hover:text-h-gold transition-colors">
                            نسيت المفتاح؟
                        </button>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-h-gold to-yellow-600 text-white font-serif py-3 rounded-xl shadow-lg hover:shadow-h-gold/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'جاري التحقق...' : (
                            <>
                            <Key size={18} />
                            افتح يا سمسم
                            </>
                        )}
                    </button>
                    </form>

                    <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-transparent text-gray-500 bg-[#1a2336]">أو</span></div>
                    </div>

                    <button 
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-gray-800 font-sans py-3 rounded-xl shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                    >
                    <Chrome size={20} className="text-blue-500" />
                    الدخول بحساب Google
                    </button>
                </motion.div>
            ) : (
                <motion.div 
                    key="forgot-password"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="p-8"
                >
                    <button onClick={() => { setShowForgot(false); setError(''); }} className="mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm">
                        <ArrowLeft size={16} />
                        عودة
                    </button>
                    
                    <h2 className="text-2xl font-serif text-h-gold mb-2 text-center">استعادة المفتاح</h2>
                    <p className="text-gray-400 text-center text-sm mb-6">أدخل بريدك الإلكتروني لنرسل لك رابطاً لإنشاء كلمة مرور جديدة</p>

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-h-gold w-5 h-5" />
                            <input 
                            type="email" 
                            placeholder="البريد الإلكتروني"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-h-gold transition-colors text-right"
                            required
                            />
                        </div>
                        {error && <p className="text-red-400 text-xs text-center font-sans">{error}</p>}
                         <button 
                            type="submit" 
                            className="w-full bg-h-gold text-white font-serif py-3 rounded-xl shadow-lg hover:bg-yellow-600 transition-all flex items-center justify-center gap-2"
                        >
                            <Send size={18} />
                            أرسل الرابط
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AuthPage;