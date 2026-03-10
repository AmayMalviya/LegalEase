'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, BookOpen, FileText, ArrowRight, Shield, Zap, Globe, Scale } from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'AI Legal Assistant',
    description: 'Ask any question about Indian law and get instant, accurate answers backed by real legal text.',
    href: '/ask',
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20',
  },
  {
    icon: BookOpen,
    title: 'Legal Library',
    description: 'Browse and search thousands of sections from IPC, CrPC, CPC, Constitution, and more.',
    href: '/library',
    color: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/20',
  },
  {
    icon: FileText,
    title: 'Case Studies',
    description: 'Explore real-world FIR records and understand how laws apply in practice.',
    href: '/case-studies',
    color: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/20',
  },
];

const acts = [
  'Indian Penal Code', 'CrPC', 'Code of Civil Procedure',
  'Indian Evidence Act', 'Constitution of India', 'Motor Vehicles Act',
  'Hindu Marriage Act', 'Negotiable Instruments Act',
];

const stats = [
  { value: '3,000+', label: 'Legal Sections' },
  { value: '10', label: 'Legal Acts' },
  { value: 'AI', label: 'Powered Answers' },
  { value: 'Free', label: 'Forever' },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-[600px] h-[600px] bg-amber-500/8 top-[-200px] left-[-100px]" />
      <div className="orb w-[400px] h-[400px] bg-orange-500/6 top-[200px] right-[-100px]" />
      <div className="orb w-[300px] h-[300px] bg-blue-500/6 bottom-[100px] left-[200px]" />

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Powered by Llama 3 + RAG — Grounded in Real Indian Law
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            <span className="text-white">Know Your</span>
            <br />
            <span className="gradient-text">Legal Rights</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            LegalEase is your free AI-powered guide to Indian law. Ask any legal question and get answers
            grounded in the actual text of the IPC, Constitution, CrPC, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ask"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 transition-all duration-200"
            >
              Ask a Legal Question
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-200"
            >
              Browse Legal Library
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-5">
              <p className="text-3xl font-bold text-amber-400">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything You Need</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            From AI-powered Q&A to a comprehensive legal library — all in one platform.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={f.href} className="group block h-full">
                <div className={`h-full bg-white/5 border border-white/10 rounded-3xl p-7 hover:bg-white/8 hover:border-white/20 hover:shadow-2xl ${f.glow} transition-all duration-300 hover:-translate-y-1`}>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">{f.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-400 group-hover:gap-2.5 transition-all">
                    Explore <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Legal Acts Marquee */}
      <section className="border-y border-white/5 py-8 overflow-hidden mb-20">
        <div className="flex gap-6 animate-[scroll_20s_linear_infinite] whitespace-nowrap">
          {[...acts, ...acts].map((act, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm font-medium flex-shrink-0"
            >
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              {act}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 text-center">
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-3xl p-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 text-sm font-semibold">Free. Always.</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Start Exploring Indian Law Today
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            No lawyers. No fees. Just AI-powered clarity on your legal rights, backed by real law.
          </p>
          <Link
            href="/ask"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 transition-all duration-200"
          >
            Ask Your First Question <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}