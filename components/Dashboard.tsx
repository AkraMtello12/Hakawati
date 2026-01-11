import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Archive, Settings, LogOut, Users, BookOpen, Server, Search, Loader2, AlertTriangle, Filter, Save, Shield, Globe, FileSpreadsheet, Trash2, Download, AlertCircle, PieChart, BarChart } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit, writeBatch, doc } from 'firebase/firestore';

interface DashboardProps {
  onLogout: () => void;
}

interface StoryDoc {
    id: string;
    child: string;
    title: string;
    date: string;
    status: string;
    userEmail?: string;
    rawDate?: any; // For sorting if needed
    params?: any;
}

type TabView = 'overview' | 'archive' | 'users' | 'settings';

// Helper Components defined outside to prevent re-renders
const SidebarItem: React.FC<{ id: TabView, icon: any, label: string, activeTab: TabView, setActiveTab: (id: TabView) => void }> = ({ id, icon: Icon, label, activeTab, setActiveTab }) => (
    <button 
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-sans font-medium ${
            activeTab === id 
            ? 'bg-white/10 text-h-gold shadow-lg border border-white/5' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
    >
        <Icon size={20} />
        {label}
    </button>
);

const StatCard = ({ icon: Icon, label, value, colorClass, subText, loading }: any) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
    >
        <div className={`p-4 rounded-xl ${colorClass}`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-sans">{label}</p>
            <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : value}</h3>
            {subText && <p className="text-xs text-gray-400 mt-1">{subText}</p>}
        </div>
    </motion.div>
);

const StatProgressBar: React.FC<{ label: string, percent: number, colorClass: string }> = ({ label, percent, colorClass }) => (
    <div className="mb-4">
        <div className="flex justify-between text-sm font-sans mb-1 text-gray-700">
            <span>{label}</span>
            <span className="font-bold">{percent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-2.5 rounded-full ${colorClass}`} 
            />
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [stories, setStories] = useState<StoryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Action States
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    // We increase limit to 100 to make the Archive/Users tabs more useful for this demo
    const q = query(
        collection(db, "stories"), 
        orderBy("createdAt", "desc"), 
        limit(100)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetchedStories = snapshot.docs.map(doc => {
            const data = doc.data();
            let displayDate = data.date;
            try {
                if (data.createdAt && data.createdAt.toDate) {
                    displayDate = data.createdAt.toDate().toLocaleDateString('ar-EG');
                } else if (data.date) {
                    displayDate = new Date(data.date).toLocaleDateString('ar-EG');
                }
            } catch(e) {}

            return {
                id: doc.id,
                child: data.child || "مجهول",
                title: data.title || "بدون عنوان",
                date: displayDate,
                status: data.status || "مكتمل",
                userEmail: data.userEmail,
                rawDate: data.createdAt,
                params: data.params
            } as StoryDoc;
        });
        setStories(fetchedStories);
        setLoading(false);
        setError(null);
      },
      (err: any) => {
        console.error("Firestore Error:", err);
        setLoading(false);
        if (err.code === 'permission-denied') {
            setError("عذراً، لا تملك صلاحيات لعرض البيانات. يرجى التحقق من قواعد الأمان (Rules) في Firebase Console.");
        } else {
            setError("حدث خطأ أثناء الاتصال بقاعدة البيانات.");
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // --- Derived Data for Views ---

  // Archive: Filtered Stories
  const filteredStories = useMemo(() => {
    if (!searchTerm) return stories;
    const lower = searchTerm.toLowerCase();
    return stories.filter(s => 
        s.child.includes(lower) || 
        s.title.includes(lower) || 
        (s.userEmail && s.userEmail.includes(lower))
    );
  }, [stories, searchTerm]);

  // Users: Aggregated from stories (Simulated User List)
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, { email: string, count: number, lastActive: string }>();
    
    stories.forEach(story => {
        const email = story.userEmail || 'زائر مجهول';
        if (!userMap.has(email)) {
            userMap.set(email, { email, count: 0, lastActive: story.date });
        }
        const user = userMap.get(email)!;
        user.count += 1;
    });

    return Array.from(userMap.values());
  }, [stories]);

  // Statistics: Worlds & Sidekicks
  const stats = useMemo(() => {
    const worldCounts: Record<string, number> = {};
    const sidekickCounts: Record<string, number> = {};
    let totalStories = stories.length;

    stories.forEach(s => {
        // Count Worlds
        const w = s.params?.world;
        if (w) {
             let label = 'غير محدد';
             if (w.includes('adventure')) label = 'عالم المغامرة';
             else if (w.includes('fantasy') || w.includes('magic')) label = 'عالم الخيال';
             else if (w.includes('comedy') || w.includes('funny')) label = 'عالم الضحك';
             else if (w.includes('space') || w.includes('aliens')) label = 'عالم الفضاء';
             else label = 'أخرى';
             
             worldCounts[label] = (worldCounts[label] || 0) + 1;
        }

        // Count Sidekicks
        const k = s.params?.sidekick;
        if (k) {
             let label = k; 
             if (k === 'cat') label = 'قطة';
             else if (k === 'bird') label = 'عصفور';
             else if (k === 'turtle') label = 'سلحفاة';
             
             sidekickCounts[label] = (sidekickCounts[label] || 0) + 1;
        }
    });

    const calculatePercent = (counts: Record<string, number>) => {
        return Object.entries(counts)
            .map(([label, count]) => ({ label, count, percent: Math.round((count / (totalStories || 1)) * 100) }))
            .sort((a, b) => b.count - a.count);
    };

    return {
        worlds: calculatePercent(worldCounts),
        sidekicks: calculatePercent(sidekickCounts)
    };
  }, [stories]);


  // --- Actions ---

  const exportToCSV = () => {
    const headers = ['المعرف', 'اسم الطفل', 'عنوان القصة', 'تاريخ الإنشاء', 'البريد الإلكتروني', 'العمر', 'الجنس', 'العبرة'];
    const rows = stories.map(story => [
        story.id,
        story.child,
        story.title,
        story.date,
        story.userEmail || 'N/A',
        story.params?.age || 'N/A',
        story.params?.gender || 'N/A',
        story.params?.moral || 'N/A'
    ]);

    const csvContent = '\uFEFF' + 
        [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hakawati_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteAll = async () => {
    if (!showDeleteConfirm) {
        setShowDeleteConfirm(true);
        return;
    }

    setIsDeleting(true);
    try {
        const batch = writeBatch(db);
        
        stories.forEach(story => {
            const docRef = doc(db, "stories", story.id);
            batch.delete(docRef);
        });

        await batch.commit();
        setShowDeleteConfirm(false);
    } catch (err: any) {
        console.error("Delete Error", err);
        alert("فشل الحذف: " + err.message);
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      
      {/* Sidebar */}
      <div className="w-64 bg-h-night text-white flex flex-col shadow-2xl z-10 sticky top-0 h-screen">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-h-gold rounded-full flex items-center justify-center text-h-night font-bold font-serif text-xl">
            ح
          </div>
          <div>
            <h1 className="font-serif text-xl text-h-gold">ديوان الحكواتي</h1>
            <p className="text-xs text-gray-400 font-sans">لوحة الإدارة v2.0</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem id="overview" icon={LayoutDashboard} label="نظرة عامة" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarItem id="archive" icon={Archive} label="أرشيف الحكايات" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarItem id="users" icon={Users} label="المستخدمين" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarItem id="settings" icon={Settings} label="الإعدادات" activeTab={activeTab} setActiveTab={setActiveTab} />
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-sans"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center sticky top-0 z-20">
          <h2 className="text-2xl font-serif text-gray-800">
             {activeTab === 'overview' && 'نظرة عامة'}
             {activeTab === 'archive' && 'أرشيف الحكايات'}
             {activeTab === 'users' && 'سجل المستخدمين'}
             {activeTab === 'settings' && 'إعدادات النظام'}
          </h2>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-h-night text-white flex items-center justify-center font-bold font-serif">
                م
             </div>
          </div>
        </header>

        <main className="p-8 space-y-8">
            
            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3"
                >
                    <AlertTriangle size={24} />
                    <p className="font-sans font-medium">{error}</p>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                
                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <motion.div 
                        key="overview"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        {/* Top Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard 
                                icon={BookOpen} 
                                label="إجمالي الحكايات" 
                                value={stories.length} 
                                colorClass="bg-blue-50 text-blue-600"
                                loading={loading}
                            />
                            <StatCard 
                                icon={Users} 
                                label="المستخدمين النشطين" 
                                value={uniqueUsers.length} 
                                colorClass="bg-purple-50 text-purple-600"
                                loading={loading}
                            />
                             <StatCard 
                                icon={Server} 
                                label="حالة النظام" 
                                value="ممتازة" 
                                subText="متصل بـ Gemini 1.5 Pro"
                                colorClass="bg-green-50 text-green-600"
                                loading={loading}
                            />
                        </div>

                        {/* Analytics Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Worlds Stats */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-serif text-gray-800 mb-4 flex items-center gap-2">
                                    <PieChart size={20} className="text-h-gold" />
                                    أكثر العوالم اختياراً
                                </h3>
                                <div className="space-y-4">
                                    {stats.worlds.length > 0 ? stats.worlds.slice(0, 4).map((w) => (
                                        <StatProgressBar 
                                            key={w.label} 
                                            label={w.label} 
                                            percent={w.percent} 
                                            colorClass="bg-gradient-to-r from-purple-400 to-purple-600" 
                                        />
                                    )) : <p className="text-sm text-gray-400">لا توجد بيانات كافية</p>}
                                </div>
                            </div>

                            {/* Sidekicks Stats */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-serif text-gray-800 mb-4 flex items-center gap-2">
                                    <BarChart size={20} className="text-blue-500" />
                                    أكثر الأصدقاء شعبية
                                </h3>
                                <div className="space-y-4">
                                    {stats.sidekicks.length > 0 ? stats.sidekicks.slice(0, 4).map((s) => (
                                        <StatProgressBar 
                                            key={s.label} 
                                            label={s.label} 
                                            percent={s.percent} 
                                            colorClass="bg-gradient-to-r from-blue-400 to-blue-600" 
                                        />
                                    )) : <p className="text-sm text-gray-400">لا توجد بيانات كافية</p>}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Table (Short) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-serif text-gray-800">أحدث الحكايات</h3>
                            </div>
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 text-gray-500 font-sans text-sm">
                                    <tr>
                                        <th className="px-6 py-4">اسم الطفل</th>
                                        <th className="px-6 py-4">العنوان</th>
                                        <th className="px-6 py-4">التاريخ</th>
                                        <th className="px-6 py-4">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stories.slice(0, 5).map((story) => (
                                        <tr key={story.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{story.child}</td>
                                            <td className="px-6 py-4 text-gray-600">{story.title}</td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{story.date}</td>
                                            <td className="px-6 py-4"><span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded-full">{story.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* --- ARCHIVE TAB --- */}
                {activeTab === 'archive' && (
                    <motion.div 
                        key="archive"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                         {/* Toolbar */}
                         <div className="bg-white p-4 rounded-2xl border border-gray-200 flex gap-4">
                            <div className="flex-1 bg-gray-50 rounded-xl flex items-center px-4 border border-gray-200 focus-within:border-h-gold transition-colors">
                                <Search className="text-gray-400" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="ابحث عن اسم طفل، عنوان قصة، أو بريد إلكتروني..." 
                                    className="w-full bg-transparent p-3 outline-none font-sans"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-sans font-medium flex items-center gap-2 hover:bg-gray-200">
                                <Filter size={18} />
                                <span>تصفية</span>
                            </button>
                         </div>

                         {/* Full Table */}
                         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-h-stone text-gray-600 font-serif">
                                        <tr>
                                            <th className="px-6 py-4">اسم الطفل</th>
                                            <th className="px-6 py-4">عنوان الحكاية</th>
                                            <th className="px-6 py-4">المستخدم (الأهل)</th>
                                            <th className="px-6 py-4">التاريخ</th>
                                            <th className="px-6 py-4">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredStories.map((story) => (
                                            <tr key={story.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-800">{story.child}</td>
                                                <td className="px-6 py-4 text-gray-600">{story.title}</td>
                                                <td className="px-6 py-4 text-gray-500 font-sans text-sm">{story.userEmail || '-'}</td>
                                                <td className="px-6 py-4 text-gray-500 text-sm">{story.date}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 rounded-full text-xs font-sans font-bold bg-green-100 text-green-700 border border-green-200">
                                                        {story.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredStories.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-12 text-gray-400 font-sans">
                                                    لا توجد نتائج تطابق بحثك
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* --- USERS TAB --- */}
                {activeTab === 'users' && (
                    <motion.div 
                        key="users"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-xl font-serif text-gray-800 flex items-center gap-2">
                                    <Users className="text-h-gold" />
                                    <span>المستخدمين النشطين</span>
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 font-sans">تم تجميع هذه البيانات بناءً على نشاط توليد القصص</p>
                            </div>
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 text-gray-500 font-sans text-sm">
                                    <tr>
                                        <th className="px-6 py-4">البريد الإلكتروني</th>
                                        <th className="px-6 py-4">عدد القصص المولدة</th>
                                        <th className="px-6 py-4">آخر نشاط</th>
                                        <th className="px-6 py-4">نوع الحساب</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {uniqueUsers.map((user, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {user.email.charAt(0).toUpperCase()}
                                                </div>
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 text-center w-32">
                                                <span className="bg-gray-100 px-3 py-1 rounded-lg font-bold">{user.count}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{user.lastActive}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs border border-gray-200 px-2 py-1 rounded text-gray-500">مجاني</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* --- SETTINGS TAB --- */}
                {activeTab === 'settings' && (
                    <motion.div 
                        key="settings"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="max-w-4xl mx-auto space-y-6"
                    >
                        {/* Section 1: General */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-serif text-h-night mb-6 flex items-center gap-2">
                                <Globe className="text-h-gold" />
                                إعدادات عامة
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">اسم التطبيق</label>
                                    <input type="text" defaultValue="حكواتي" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">اللغة الافتراضية</label>
                                    <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50">
                                        <option>العربية (Arabic)</option>
                                        <option>الإنجليزية (English)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                         {/* Section 2: AI Config */}
                         <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-serif text-h-night mb-6 flex items-center gap-2">
                                <Shield className="text-h-gold" />
                                ضبط الذكاء الاصطناعي
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <h4 className="font-bold text-gray-800">فلتر المحتوى الآمن (Safety Filter)</h4>
                                        <p className="text-xs text-gray-500">منع إنشاء أي قصص قد تكون غير مناسبة للأطفال</p>
                                    </div>
                                    <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                    </div>
                                </div>
                                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <h4 className="font-bold text-gray-800">الوضع الإبداعي العالي</h4>
                                        <p className="text-xs text-gray-500">يسمح للحكواتي بارتجال تفاصيل أكثر خيالاً</p>
                                    </div>
                                    <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Data Management */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                             <h3 className="text-xl font-serif text-h-night mb-6 flex items-center gap-2">
                                <FileSpreadsheet className="text-h-gold" />
                                إدارة البيانات
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Export */}
                                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-start gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                            <Download size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">تصدير البيانات</h4>
                                            <p className="text-xs text-gray-500">تحميل جميع القصص كملف CSV (Excel)</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={exportToCSV}
                                        disabled={stories.length === 0}
                                        className="w-full py-2 bg-white border border-blue-200 text-blue-700 rounded-xl font-medium hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        تحميل الملف
                                    </button>
                                </div>

                                {/* Danger Zone */}
                                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-start gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-red-800">منطقة الخطر</h4>
                                            <p className="text-xs text-red-500/80">حذف جميع بيانات القصص المسجلة</p>
                                        </div>
                                    </div>
                                    {showDeleteConfirm ? (
                                        <div className="w-full space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <p className="text-xs text-red-600 font-bold text-center">هل أنت متأكد؟ لا يمكن التراجع.</p>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    className="flex-1 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-sm"
                                                >
                                                    إلغاء
                                                </button>
                                                <button 
                                                    onClick={handleDeleteAll}
                                                    disabled={isDeleting}
                                                    className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 flex items-center justify-center gap-2"
                                                >
                                                    {isDeleting && <Loader2 size={12} className="animate-spin" />}
                                                    تأكيد الحذف
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="w-full py-2 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={18} />
                                            حذف كل البيانات
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button className="bg-h-night text-white px-8 py-3 rounded-xl font-serif flex items-center gap-2 hover:bg-gray-800 transition-all">
                                <Save size={18} />
                                حفظ التغييرات
                            </button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;