'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, MessageSquare, Bookmark, Trash2, Clock, Scale, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('history');
  const [history, setHistory] = useState([]);
  const [savedLaws, setSavedLaws] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) { setLoading(false); return; }

      const [histRes, savedRes] = await Promise.all([
        supabase.from('query_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('saved_laws').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      setHistory(histRes.data || []);
      setSavedLaws(savedRes.data || []);
      setLoading(false);
    };
    loadData();
  }, []);

  const deleteHistory = async (id) => {
    await supabase.from('query_history').delete().eq('id', id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const deleteSaved = async (id) => {
    await supabase.from('saved_laws').delete().eq('id', id);
    setSavedLaws((prev) => prev.filter((s) => s.id !== id));
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
            <LogIn className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Sign in to view your dashboard</h2>
          <p className="text-gray-500 text-sm mb-6">Your query history and saved laws will appear here.</p>
          <Link href="/login" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm hover:scale-105 transition-all">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-600 text-xs">{user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 mb-8">
          {[
            { label: 'Questions Asked', value: history.length, icon: MessageSquare, color: 'text-indigo-300' },
            { label: 'Saved Laws', value: savedLaws.length, icon: Bookmark, color: 'text-sky-300' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-6 w-fit">
          {[{ id: 'history', label: 'Query History', icon: Clock }, { id: 'saved', label: 'Saved Laws', icon: Bookmark }].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'history' ? (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-16 text-gray-600">No questions asked yet. <Link href="/ask" className="text-indigo-300">Ask one now →</Link></div>
            ) : history.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm mb-1 truncate">{item.question}</p>
                    <p className="text-gray-500 text-xs line-clamp-2">{item.answer?.slice(0, 120)}...</p>
                    <p className="text-gray-700 text-xs mt-2">{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <button
                    onClick={() => deleteHistory(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {savedLaws.length === 0 ? (
              <div className="text-center py-16 text-gray-600">No saved laws yet. <Link href="/library" className="text-indigo-300">Browse library →</Link></div>
            ) : savedLaws.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale className="w-3.5 h-3.5 text-indigo-300" />
                      <span className="text-xs text-gray-500">{item.source} — §{item.section}</span>
                    </div>
                    <p className="font-medium text-white text-sm mb-1">{item.title}</p>
                    <p className="text-gray-500 text-xs line-clamp-2">{item.content?.slice(0, 120)}...</p>
                  </div>
                  <button
                    onClick={() => deleteSaved(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
