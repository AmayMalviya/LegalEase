'use client';
import { Scale, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const SOURCE_COLORS = {
  'Indian Penal Code': 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
  'Code of Criminal Procedure': 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
  'Code of Civil Procedure': 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
  'Indian Evidence Act': 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
  'Hindu Marriage Act': 'from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-400',
  'Motor Vehicles Act': 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
  'Drugs and Cosmetics Act': 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
  'Negotiable Instruments Act': 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
  'Constitution of India': 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-300',
  default: 'from-gray-500/20 to-gray-600/10 border-gray-500/30 text-gray-400',
};

export default function LegalCard({ doc, showSave = true }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const colorClass = SOURCE_COLORS[doc.source] || SOURCE_COLORS.default;

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const { error } = await supabase.from('saved_laws').upsert({
      user_id: user.id,
      legal_doc_id: doc.id,
      source: doc.source,
      section: doc.section,
      title: doc.title,
      content: doc.content,
    }, { onConflict: 'user_id,legal_doc_id' });

    if (!error) setSaved(true);
    setSaving(false);
  };

  return (
    <div className={`group relative bg-gradient-to-br ${colorClass} border rounded-2xl p-5 hover:scale-[1.01] transition-all duration-300 hover:shadow-lg`}>
      {/* Source badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/30 border border-white/10 text-gray-300 mb-2">
            <Scale className="w-3 h-3" />
            {doc.source}
          </span>
          <p className="text-xs text-gray-500 font-mono">Section {doc.section}</p>
        </div>
        {showSave && (
          <button
            onClick={handleSave}
            disabled={saved || saving}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-indigo-300 disabled:text-indigo-300"
            title={saved ? 'Saved!' : 'Save this section'}
          >
            {saved ? <BookmarkCheck className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
          </button>
        )}
      </div>

      <h3 className="font-semibold text-white text-sm mb-2 leading-snug">{doc.title}</h3>
      <p className="text-gray-400 text-xs leading-relaxed line-clamp-4">{doc.content}</p>
    </div>
  );
}
