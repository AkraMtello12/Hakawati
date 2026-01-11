import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Hero from './components/Hero';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import StoryEngine from './components/StoryEngine';
import Loading from './components/Loading';
import StoryBook from './components/StoryBook';
import UserProfile from './components/UserProfile';
import { AppState, StoryParams, GeneratedStory } from './types';
import { generateStoryText } from './services/geminiService';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ADMIN_EMAIL = "akramtello12@gmail.com";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH); // Default to Auth
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth Listener & Routing Logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // User Logged In
        if (currentUser.email === ADMIN_EMAIL) {
           setAppState(AppState.DASHBOARD);
        } else {
           // Normal user goes to Hero if they were in Auth state
           if (appState === AppState.AUTH) {
             setAppState(AppState.HERO);
           }
        }
      } else {
        // User Logged Out
        setAppState(AppState.AUTH);
      }
    });

    return () => unsubscribe();
  }, [appState]);

  const handleStart = () => {
    setAppState(AppState.INPUT);
  };

  const handleOpenProfile = () => {
    setAppState(AppState.PROFILE);
  };

  const handleBackToHero = () => {
    setAppState(AppState.HERO);
  };

  const handleGenerate = async (params: StoryParams) => {
    setAppState(AppState.GENERATING);
    setError(null);
    try {
      const generatedStory = await generateStoryText(params);
      
      // Save story metadata to Firestore (Real Data Recording)
      if (user) {
        try {
            await addDoc(collection(db, "stories"), {
                child: params.childName,
                title: generatedStory.title,
                status: "مكتمل",
                date: new Date().toISOString(), // Use simple string for display, timestamp for sorting
                createdAt: serverTimestamp(),
                userId: user.uid,
                userEmail: user.email,
                badge: generatedStory.moralName, // SAVE THE BADGE FOR PROFILE
                proverb: generatedStory.proverb, // SAVE THE PROVERB FOR PROFILE BUNDLE
                params: {
                    age: params.age,
                    gender: params.gender,
                    moral: params.moral,
                    world: params.world, // For Dashboard Stats
                    sidekick: params.sidekick // For Dashboard Stats
                }
            });
        } catch (dbError: any) {
            console.error("Failed to save story to database:", dbError);
            if (dbError.code === 'permission-denied') {
                console.warn("⚠️ PERMISSION DENIED: Please check your Firebase Firestore Security Rules. Ensure they allow writes for authenticated users.");
            }
            // We don't stop the user experience if saving fails, but we log it.
        }
      }

      setStory(generatedStory);
      setAppState(AppState.READING);
    } catch (err: any) {
      console.error(err);
      // Use the specific error message if available, otherwise generic
      const errorMessage = err.message || "عذراً، حدث خطأ أثناء الاتصال بالحكواتي. يرجى المحاولة مرة أخرى.";
      setError(errorMessage);
      setAppState(AppState.INPUT);
    }
  };

  const handleReset = () => {
    setStory(null);
    setAppState(AppState.HERO);
  };

  if (authLoading) {
    return (
        <div className="min-h-screen bg-h-night flex items-center justify-center">
            <Loading />
        </div>
    );
  }

  return (
    <div className="font-sans text-right" dir="rtl">
      <AnimatePresence mode='wait'>
        
        {/* Auth Page */}
        {appState === AppState.AUTH && (
          <motion.div key="auth" exit={{ opacity: 0 }}>
             <AuthPage onSuccess={() => {}} /> 
          </motion.div>
        )}

        {/* Admin Dashboard */}
        {appState === AppState.DASHBOARD && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <Dashboard onLogout={() => auth.signOut()} />
          </motion.div>
        )}

        {/* Regular User Flow */}
        {appState === AppState.HERO && (
          <motion.div key="hero" exit={{ opacity: 0 }}>
            <Hero onStart={handleStart} onOpenProfile={handleOpenProfile} />
          </motion.div>
        )}

        {/* User Profile */}
        {appState === AppState.PROFILE && user && (
            <motion.div key="profile" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                <UserProfile user={user} onBack={handleBackToHero} />
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
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 text-center w-11/12 max-w-md">
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