'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Scale, BookOpen, FileText, LayoutDashboard, Menu, X, MessageSquare, LogOut, LogIn } from 'lucide-react';

const navLinks = [
  { href: '/ask', label: 'AI Assistant', icon: MessageSquare },
  { href: '/library', label: 'Legal Library', icon: BookOpen },
  { href: '/case-studies', label: 'Case Studies', icon: FileText },
  { href: '/blog', label: 'Blog', icon: BookOpen },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = (() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
    const allowed = raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!allowed.length) return false;
    return allowed.includes(String(user?.email || '').trim().toLowerCase());
  })();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all duration-300">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              Legal<span className="text-indigo-300">Ease</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[...navLinks, ...(isAdmin ? [{ href: '/admin/documents', label: 'Admin', icon: LayoutDashboard }] : [])].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === href
                    ? 'bg-indigo-500/15 text-indigo-300'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Auth Button */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <>
                <Link href="/login" className="px-4 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-200">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 pb-4">
          <div className="py-3 space-y-1">
            {[...navLinks, ...(isAdmin ? [{ href: '/admin/documents', label: 'Admin', icon: LayoutDashboard }] : [])].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === href ? 'bg-indigo-500/15 text-indigo-300' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/10">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-400"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-indigo-300"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
