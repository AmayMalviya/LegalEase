'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Pencil, ShieldAlert } from 'lucide-react';

function AdminGate({ forbidden }) {
  if (!forbidden) return null;
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7 text-gray-500" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Access denied</h1>
        <p className="text-gray-500 text-sm">
          This page is only available to administrators.
        </p>
      </div>
    </div>
  );
}

function EditorModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState(
    initial || { source: '', section: '', title: '', content: '' }
  );
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    if (open) setForm(initial || { source: '', section: '', title: '', content: '' });
  }, [open, initial]);

  if (!open) return null;

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl bg-slate-950 border border-white/10 rounded-3xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">{isEdit ? 'Edit document' : 'New document'}</h2>
            <p className="text-xs text-gray-500 mt-1">Embeddings will be generated automatically.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">Close</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Source</label>
              <input
                value={form.source}
                onChange={set('source')}
                placeholder="e.g. Motor Vehicles Act"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-700 outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Section</label>
              <input
                value={form.section}
                onChange={set('section')}
                placeholder="e.g. 177"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-700 outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Title</label>
            <input
              value={form.title}
              onChange={set('title')}
              placeholder="Short section title"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-700 outline-none focus:border-indigo-500/40 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Content</label>
            <textarea
              value={form.content}
              onChange={set('content')}
              placeholder="Full legal text for this section..."
              rows={10}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-700 outline-none focus:border-indigo-500/40 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !form.source.trim() || !form.section.trim() || !form.title.trim() || !form.content.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-sky-500 text-white disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminDocumentsPage() {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('All Acts');
  const [sources, setSources] = useState(['All Acts']);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useEffect(() => {
    const loadSources = async () => {
      try {
        const res = await fetch('/api/search?action=sources');
        const json = await res.json();
        setSources(['All Acts', ...(json.sources || [])]);
      } catch {
        setSources(['All Acts']);
      }
    };
    loadSources();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, source]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setForbidden(false);
      try {
        const params = new URLSearchParams({
          q: query,
          page: String(page),
          pageSize: String(pageSize),
        });
        if (source !== 'All Acts') params.set('source', source);

        const res = await fetch(`/api/admin/documents?${params}`);
        if (res.status === 403) {
          setForbidden(true);
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setData(json.data || []);
        setTotal(json.total || 0);
      } catch (e) {
        setError(e.message || 'Failed to load documents.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [query, source, page, pageSize]);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (doc) => {
    setEditing(doc);
    setEditorOpen(true);
  };

  const saveDoc = async (form) => {
    if (editing?.id) {
      const res = await fetch(`/api/admin/documents/${encodeURIComponent(editing.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to update');
    } else {
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to create');
    }

    // reload current page
    setPage(1);
    setQuery((q) => q); // trigger effect without changing value
  };

  const deleteDoc = async (doc) => {
    if (!confirm(`Delete ${doc.source} §${doc.section}?`)) return;
    const res = await fetch(`/api/admin/documents/${encodeURIComponent(doc.id)}`, {
      method: 'DELETE',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Failed to delete');
    setData((prev) => prev.filter((d) => d.id !== doc.id));
    setTotal((t) => Math.max(0, t - 1));
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <AdminGate forbidden={forbidden} />
      {!forbidden && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin · Documents</h1>
              <p className="text-sm text-gray-500 mt-1">Create, edit, and remove legal library sections.</p>
            </div>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all"
            >
              <Plus className="w-4 h-4" />
              New document
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-5">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by meaning (semantic) or leave empty to browse…"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-700 outline-none focus:border-indigo-500/40 transition-colors"
                />
              </div>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="md:w-80 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-indigo-500/40"
              >
                {sources.map((s) => (
                  <option key={s} value={s} className="bg-slate-950">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-500">
                    <th className="py-2 pr-4">Source</th>
                    <th className="py-2 pr-4">Section</th>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-t border-white/10">
                        <td className="py-4 pr-4" colSpan={4}>
                          <div className="h-5 bg-white/5 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : data.length === 0 ? (
                    <tr className="border-t border-white/10">
                      <td className="py-6 text-sm text-gray-500" colSpan={4}>
                        No documents found.
                      </td>
                    </tr>
                  ) : (
                    data.map((doc) => (
                      <tr key={doc.id} className="border-t border-white/10">
                        <td className="py-3 pr-4 text-sm text-white whitespace-nowrap">{doc.source}</td>
                        <td className="py-3 pr-4 text-sm text-gray-300 whitespace-nowrap">{doc.section}</td>
                        <td className="py-3 pr-4 text-sm text-gray-300 min-w-[420px]">
                          <span className="text-white">{doc.title}</span>
                          <div className="text-xs text-gray-600 line-clamp-1 mt-1">{doc.content}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(doc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteDoc(doc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                <span>
                  Page {page} of {totalPages} · {total.toLocaleString()} total
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 disabled:opacity-40 hover:bg-white/10 transition-all"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 disabled:opacity-40 hover:bg-white/10 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <EditorModal
            open={editorOpen}
            initial={editing}
            onClose={() => setEditorOpen(false)}
            onSave={saveDoc}
          />
        </>
      )}
    </div>
  );
}

