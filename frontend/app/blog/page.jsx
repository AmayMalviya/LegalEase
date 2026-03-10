'use client';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const POSTS = [
  {
    slug: 'know-your-rights-arrest',
    title: 'Know Your Rights When Arrested in India',
    excerpt: 'If you or someone you know is arrested in India, the law provides strong protections under Article 22 of the Constitution and the CrPC. Learn exactly what rights you have from the moment of arrest.',
    category: 'Criminal Law',
    readTime: '5 min',
    gradient: 'from-red-500 to-orange-500',
  },
  {
    slug: 'what-is-fir',
    title: 'What is an FIR and How Do You File One?',
    excerpt: 'A First Information Report (FIR) is the starting point of the criminal justice process in India. This guide walks you through what it is, when to file one, and how.',
    category: 'Procedure',
    readTime: '4 min',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    slug: 'section-498a-explained',
    title: 'Section 498A IPC Explained: Domestic Cruelty Laws',
    excerpt: 'Section 498A of the Indian Penal Code deals with cruelty by husband or relatives. Understanding this section is crucial for anyone dealing with domestic abuse situations.',
    category: 'Family Law',
    readTime: '6 min',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    slug: 'bail-in-india',
    title: 'Understanding Bail in Indian Law: Types and Process',
    excerpt: 'Bail is not just a right — it is a complex legal concept with many forms. From regular bail to anticipatory bail, this guide demystifies the bail process in India.',
    category: 'Criminal Law',
    readTime: '7 min',
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    slug: 'property-rights-women',
    title: "Women's Property Rights Under Hindu Law",
    excerpt: 'The Hindu Succession Act, 2005 amendment gave women equal inheritance rights. Learn how this affects property disputes, coparcenary rights, and joint family property.',
    category: 'Property Law',
    readTime: '5 min',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    slug: 'traffic-violations-mva',
    title: 'Traffic Violations and Their Penalties Under the MVA',
    excerpt: 'The Motor Vehicles (Amendment) Act 2019 drastically increased fines for traffic violations. Know the penalties for common offenses like drunk driving, over-speeding, and no-helmet.',
    category: 'Traffic Law',
    readTime: '4 min',
    gradient: 'from-green-500 to-emerald-500',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Legal Blog</h1>
            </div>
            <p className="text-gray-500">Plain-English guides to understanding Indian law</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POSTS.map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="group h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:-translate-y-1 transition-all duration-300">
                {/* Color strip */}
                <div className={`h-1.5 bg-gradient-to-r ${post.gradient}`} />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${post.gradient} bg-clip-text text-transparent border border-white/10`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.readTime} read
                    </span>
                  </div>
                  <h2 className="font-semibold text-white text-base mb-3 leading-snug">{post.title}</h2>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
                  <Link
                    href={`/ask?q=${encodeURIComponent(post.title)}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-400 hover:gap-2.5 transition-all group-hover:text-amber-300"
                  >
                    Ask AI about this <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
