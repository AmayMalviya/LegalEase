'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Scale, User, Bot, AlertCircle, ExternalLink, BookmarkPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const EXAMPLE_QUESTIONS = [
  'What is the punishment for theft under IPC?',
  'What are my rights if I am arrested?',
  'What is the process for filing for divorce?',
  'What does Section 498A of IPC cover?',
];

function ChatMessage({ message, onExport, onRelatedClick }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
          isUser ? 'bg-indigo-500' : 'bg-gradient-to-br from-indigo-500 to-sky-500'
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-amber-500 text-white rounded-tr-sm'
              : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose-legal" dangerouslySetInnerHTML={{ __html: formatAnswer(message.content) }} />
          )}
        </div>

        {/* Sources + actions */}
        {!isUser && (message.sources?.length > 0 || onExport || message.relatedQuestions?.length) && (
          <div className="flex flex-col gap-2 mt-1">
            {message.sources && message.sources.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center">Sources:</span>
                {message.sources.map((src) => (
                  <span
                    key={src.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium"
                  >
                    <Scale className="w-3 h-3" />
                    {src.source} §{src.section}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {onExport && (
                <button
                  type="button"
                  onClick={() => onExport(message)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Export as PDF
                </button>
              )}

              {message.relatedQuestions && message.relatedQuestions.length > 0 && (
                <>
                  <span className="text-[11px] text-gray-600">Related:</span>
                  {message.relatedQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onRelatedClick?.(q)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-300 hover:bg-amber-500/15 hover:border-amber-500/40 hover:text-white transition-all"
                    >
                      <Bot className="w-3 h-3" />
                      {q}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatAnswer(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

export default function AskPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load recent history into the chat on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!supabase) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error: histError } = await supabase
          .from('query_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (histError) {
          console.error('Failed to load history for /ask:', histError);
          return;
        }

        if (data && data.length) {
          const historyMessages = [];
          // show oldest first
          for (const item of [...data].reverse()) {
            historyMessages.push({ role: 'user', content: item.question });
            historyMessages.push({
              role: 'assistant',
              content: item.answer,
              sources: item.sources || [],
            });
          }
          setMessages(historyMessages);
        }
      } catch (err) {
        console.error('Error loading history for /ask:', err);
      }
    };

    loadHistory();
  }, [supabase]);

  const sendMessage = async (question) => {
    const q = question || input.trim();
    if (!q || loading) return;

    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, stream: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get response');
      }

      if (!res.body) {
        throw new Error('No response body from server');
      }

      // Create an empty assistant message that we'll stream into
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', sources: [], relatedQuestions: [] },
      ]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          let event;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          if (event.type === 'meta') {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === 'assistant') {
                last.sources = event.sources || [];
              }
              return next;
            });
          } else if (event.type === 'token') {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === 'assistant') {
                last.content = (last.content || '') + event.token;
              }
              return next;
            });
          } else if (event.type === 'related') {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === 'assistant') {
                last.relatedQuestions = event.relatedQuestions || [];
              }
              return next;
            });
          } else if (event.type === 'error') {
            setError(event.error || 'Failed to get response');
          } else if (event.type === 'done') {
            // nothing extra; loop will naturally finish
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleExportToPdf = (message) => {
    if (typeof window === 'undefined') return;

    const title = 'LegalEase Answer Export';
    const sourcesSection =
      message.sources && message.sources.length
        ? `<h3>Sources</h3><ul>${message.sources
            .map(
              (s) =>
                `<li>${s.source} — Section ${s.section}${
                  s.title ? `: ${s.title}` : ''
                }</li>`
            )
            .join('')}</ul>`
        : '';

    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color: #020617; }
            h1 { font-size: 20px; margin-bottom: 16px; }
            h3 { font-size: 14px; margin-top: 20px; margin-bottom: 8px; }
            p, li { font-size: 13px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>AI Legal Answer</h1>
          ${formatAnswer(message.content)}
          ${sourcesSection}
        </body>
      </html>
    `;

    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Empty state */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-indigo-500/30">
                <Scale className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">AI Legal Assistant</h1>
              <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
                Ask any question about Indian law. Answers are grounded in real legal text.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm hover:bg-white/10 hover:text-white hover:border-indigo-500/40 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                onExport={msg.role === 'assistant' ? handleExportToPdf : undefined}
                onRelatedClick={(q) => sendMessage(q)}
              />
            ))}

            {/* Loading */}
            {loading && (
              <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-sky-500">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-white/10 bg-gradient-to-t from-slate-950/80 to-transparent backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-indigo-500/40 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a legal question... (e.g. What is Section 302 IPC?)"
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm resize-none outline-none px-2 py-1.5 min-h-[36px] max-h-32"
              style={{ overflowY: 'auto' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center hover:scale-110 disabled:opacity-40 disabled:scale-100 transition-all shadow-lg shadow-indigo-500/25"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-700 mt-2">
            Answers are generated by AI from real Indian legal documents. For legal advice, consult a qualified lawyer.
          </p>
        </div>
      </div>
    </div>
  );
}
