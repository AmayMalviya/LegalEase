'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import LegalCard from '@/components/cards/LegalCard';
import Link from 'next/link';

const SOURCES = [
  'All Acts',
  'Indian Penal Code',
  'Code of Criminal Procedure',
  'Code of Civil Procedure',
  'Indian Evidence Act',
  'Constitution of India',
  'Hindu Marriage Act',
  'Motor Vehicles Act',
  'Drugs and Cosmetics Act',
  'Negotiable Instruments Act',
  'IPC (FIR Reference)',
];

export default function LibraryPage() {
  const [query, setQuery] = useState('');
  const [activeSource, setActiveSource] = useState('All Acts');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, activeSource]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          page: String(page),
          pageSize: '18',
        });
        if (activeSource !== 'All Acts') params.set('source', activeSource);

        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();
        setResults(data.data || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [debouncedQuery, activeSource, page]);

  const totalPages = Math.ceil(total / 18);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative border-b border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Legal Library</h1>
            </div>
            <p className="text-gray-500">
              Browse {total > 0 ? total.toLocaleString() : '3,000+'} sections from 10 Indian legal acts
            </p>
          </motion.div>

          {/* Search */}
          <div className="mt-6 flex gap-3 max-w-2xl">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by keyword, section number, or topic..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/40 transition-colors"
                />
              </div>
          </div>

          {/* Source filters */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {SOURCES.map((src) => (
              <button
                key={src}
                onClick={() => setActiveSource(src)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeSource === src
                    ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                    : 'bg-white/5 border border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-600 text-sm">No results found for "{debouncedQuery || 'your search'}"</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 text-sm mb-5">
              Showing {(page - 1) * 18 + 1}–{Math.min(page * 18, total)} of {total.toLocaleString()} results
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/ask?q=${encodeURIComponent(`${doc.source} Section ${doc.section}: ${doc.title}`)}`}
                  className="block"
                >
                  <LegalCard doc={doc} />
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
