'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Scale, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) { setError(error.message); } else { setSent(true); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="orb w-[420px] h-[420px] bg-indigo-500/10 top-[-120px] left-[-140px]" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/30">
            <Scale className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-gray-500 text-sm mt-1">We&apos;ll send you a reset link</p>
        </div>
        {sent ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <h2 className="text-white font-semibold mb-2">Check your inbox</h2>
            <p className="text-gray-500 text-sm">A reset link was sent to <strong className="text-white">{email}</strong>.</p>
            <Link href="/login" className="mt-4 inline-block text-sm text-indigo-300 hover:text-indigo-200">Back to Sign In</Link>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-700 outline-none focus:border-indigo-500/40 transition-colors" />
                </div>
              </div>
              {error && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-sky-500 text-white hover:scale-[1.02] disabled:opacity-60 transition-all">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-600 mt-5">
              Remember it? <Link href="/login" className="text-indigo-300 font-medium hover:text-indigo-200">Sign in</Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}