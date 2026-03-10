'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Shield, Gavel, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const FIR_SAMPLE_DATA = [
  { section: '302', offense: 'Murder', punishment: 'Death, or Life Imprisonment + Fine', cognizable: 'Cognizable', bailable: 'Non-Bailable', court: 'Court of Session' },
  { section: '376', offense: 'Rape', punishment: 'Rigorous imprisonment for not less than 7 years, extendable to life + Fine', cognizable: 'Cognizable', bailable: 'Non-Bailable', court: 'Court of Session' },
  { section: '379', offense: 'Theft', punishment: 'Imprisonment up to 3 years, or Fine, or Both', cognizable: 'Cognizable', bailable: 'Bailable', court: 'Any Magistrate' },
  { section: '420', offense: 'Cheating and dishonestly inducing delivery of property', punishment: 'Imprisonment up to 7 years + Fine', cognizable: 'Cognizable', bailable: 'Non-Bailable', court: 'Magistrate of 1st Class' },
  { section: '498A', offense: 'Husband or relative of husband of a woman subjecting her to cruelty', punishment: 'Imprisonment up to 3 years + Fine', cognizable: 'Cognizable', bailable: 'Non-Bailable', court: 'Magistrate of 1st Class' },
  { section: '376D', offense: 'Gang Rape', punishment: 'Rigorous imprisonment for not less than 20 years up to Life + Fine', cognizable: 'Cognizable', bailable: 'Non-Bailable', court: 'Court of Session' },
  { section: '307', offense: 'Attempt to Murder', punishment: 'Imprisonment up to 10 years + Fine; if hurt caused — Life Imprisonment', cognizable: 'Cognizable', bailable: 'Non-Bailable', court: 'Court of Session' },
  { section: '323', offense: 'Voluntarily causing hurt', punishment: 'Imprisonment up to 1 year, or Fine up to ₹1000, or Both', cognizable: 'Non-Cognizable', bailable: 'Bailable', court: 'Any Magistrate' },
  { section: '354', offense: 'Assault or criminal force to woman with intent to outrage her modesty', punishment: 'Imprisonment 1-5 years + Fine', cognizable: 'Cognizable', bailable: 'Non-Bailable', court: 'Any Magistrate' },
  { section: '406', offense: 'Punishment for criminal breach of trust', punishment: 'Imprisonment up to 3 years, or Fine, or Both', cognizable: 'Cognizable', bailable: 'Non-Bailable', court: 'Magistrate of 1st Class' },
  { section: '411', offense: 'Dishonestly receiving stolen property', punishment: 'Imprisonment up to 3 years, or Fine, or Both', cognizable: 'Cognizable', bailable: 'Non-Bailable', court: 'Any Magistrate' },
  { section: '304B', offense: 'Dowry death', punishment: 'Imprisonment not less than 7 years; may extend to life', cognizable: 'Cognizable', bailable: 'Non-Bailable', court: 'Court of Session' },
];

export default function CaseStudiesPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = FIR_SAMPLE_DATA.filter((item) => {
    const q = (query || '').trim().toLowerCase();
    const digits = q.match(/\d+/g)?.join('') || '';
    const matchesQuery =
      !q ||
      item.offense.toLowerCase().includes(q) ||
      item.section.includes(digits) ||
      `ipc ${item.section}`.includes(q) ||
      `section ${item.section}`.includes(q);
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Cognizable' && item.cognizable === 'Cognizable') ||
      (filter === 'Non-Cognizable' && item.cognizable === 'Non-Cognizable') ||
      (filter === 'Bailable' && item.bailable === 'Bailable') ||
      (filter === 'Non-Bailable' && item.bailable === 'Non-Bailable');
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Case Studies</h1>
            </div>
            <p className="text-gray-500">Real IPC sections with offense details, punishments, and court jurisdiction</p>
          </motion.div>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search offense or section..."
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors w-64"
              />
            </div>
            {['All', 'Cognizable', 'Non-Cognizable', 'Bailable', 'Non-Bailable'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-purple-500/20 border border-purple-500/40 text-purple-400'
                    : 'bg-white/5 border border-white/10 text-gray-500 hover:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-4">
          {filtered.map((item, i) => (
            <motion.div
              key={item.section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={`/ask?q=${encodeURIComponent(`IPC Section ${item.section}: ${item.offense}`)}`}
                className="block bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 hover:border-white/15 transition-all"
              >
                <div className="flex flex-wrap gap-4 items-start">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold font-mono">
                      IPC §{item.section}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-2">{item.offense}</h3>
                    <p className="text-gray-400 text-sm mb-3">
                      <span className="text-gray-600">Punishment: </span>{item.punishment}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.cognizable === 'Cognizable'
                          ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
                          : 'bg-gray-500/10 border border-gray-500/20 text-gray-400'
                      }`}>
                        <AlertCircle className="w-3 h-3" /> {item.cognizable}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.bailable === 'Bailable'
                          ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                          : 'bg-red-500/10 border border-red-500/20 text-red-400'
                      }`}>
                        <Shield className="w-3 h-3" /> {item.bailable}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <Gavel className="w-3 h-3" /> {item.court}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
