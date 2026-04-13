'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  Plus, Clock, CheckCircle, XCircle, FileEdit, Send, Eye,
} from 'lucide-react';

interface Work {
  id: string;
  name: string;
  tagline: string | null;
  hackathonName: string | null;
  verificationStatus: string;
  aiConfidenceScore: number | null;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  draft: { label: '草稿', icon: FileEdit, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
  pending: { label: '审核中', icon: Clock, color: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20' },
  ai_reviewed: { label: '待人工审核', icon: Clock, color: 'text-orange-300 bg-orange-500/10 border-orange-500/20' },
  approved: { label: '已通过', icon: CheckCircle, color: 'text-green-300 bg-green-500/10 border-green-500/20' },
  rejected: { label: '未通过', icon: XCircle, color: 'text-red-300 bg-red-500/10 border-red-500/20' },
};

export default function MyWorksPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/works?mine=true')
      .then((r) => r.json())
      .then(({ data }) => setWorks(data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative min-h-screen bg-[#05060a]">
      <div className="fixed inset-0 -z-10 opacity-[0.15]">
        <div className="absolute inset-0 grid-bg" />
      </div>
      <Navbar />

      <main className="relative pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">我的作品</h1>
              <p className="text-gray-400">管理你提交的黑客松作品</p>
            </div>
            <Link
              href="/works/submit"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              <Plus size={18} /> 提交作品
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : works.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <FileEdit size={28} className="text-purple-400" />
              </div>
              <p className="text-gray-400 mb-4">还没有提交过作品</p>
              <Link
                href="/works/submit"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                <Plus size={16} /> 提交第一个作品
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {works.map((w) => {
                const sc = statusConfig[w.verificationStatus] || statusConfig.draft;
                const Icon = sc.icon;
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{w.name}</h3>
                      <p className="text-gray-500 text-sm truncate">{w.tagline || w.hackathonName || '无描述'}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${sc.color}`}>
                      <Icon size={12} />
                      {sc.label}
                    </span>
                    <div className="flex gap-2">
                      {(w.verificationStatus === 'draft' || w.verificationStatus === 'rejected') && (
                        <Link
                          href={`/works/submit?edit=${w.id}`}
                          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                          title="编辑"
                        >
                          <FileEdit size={16} />
                        </Link>
                      )}
                      {w.verificationStatus === 'approved' && (
                        <Link
                          href={`/works/${w.id}`}
                          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                          title="查看"
                        >
                          <Eye size={16} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
