'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { CalendarDays, Plus, ShieldAlert } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

type OrganizerProfile = {
  organizationName?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | null;
};

export default function OrganizerEventsPage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!session?.user?.id) {
        setLoadingProfile(false);
        return;
      }

      try {
        const res = await fetch('/api/organizer');
        const data = await res.json();
        if (!cancelled) {
          setProfile(data?.profile || null);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const isLoading = status === 'loading' || loadingProfile;

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-10 right-1/3 w-[700px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-[0.2em]">Organizer</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mt-2">
                我的活动
              </h1>
              {profile?.organizationName && (
                <p className="text-sm text-gray-400 mt-2">{profile.organizationName}</p>
              )}
            </div>

            <Link
              href="/organize/create"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all font-space-mono text-sm text-white shadow-lg shadow-indigo-500/25"
            >
              <Plus size={16} />
              创建新活动
            </Link>
          </div>

          {isLoading ? (
            <div className="glass rounded-2xl p-8 border border-white/5">
              <div className="h-6 w-40 bg-white/5 rounded animate-pulse mb-4" />
              <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
            </div>
          ) : !session ? (
            <div className="glass rounded-2xl p-8 border border-white/5 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <ShieldAlert className="text-amber-300" size={20} />
              </div>
              <p className="text-white font-semibold mb-2">需要登录</p>
              <p className="text-gray-400 text-sm mb-6">请先登录后查看你发起的活动。</p>
              <Link
                href="/organize"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-space-mono text-sm text-gray-300"
              >
                返回组织者中心
              </Link>
            </div>
          ) : profile?.status && profile.status !== 'approved' ? (
            <div className="glass rounded-2xl p-8 border border-white/5 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <ShieldAlert className="text-amber-300" size={20} />
              </div>
              <p className="text-white font-semibold mb-2">组织者状态未通过</p>
              <p className="text-gray-400 text-sm mb-6">
                你的组织者资质目前为「{profile.status}」。通过认证后才能管理活动列表。
              </p>
              <Link
                href="/organize"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-space-mono text-sm text-gray-300"
              >
                返回组织者中心
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Empty state for now - the create flow is not persisted yet */}
              <div className="glass rounded-2xl p-8 border border-white/5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <CalendarDays className="text-indigo-300" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold mb-1">暂无已发布活动</p>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      你可以先创建活动并提交审核。后续我们会在这里展示你的活动列表、报名数据与更新记录。
                    </p>
                    <div className="mt-5 flex gap-3 flex-wrap">
                      <Link
                        href="/organize/create"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all font-space-mono text-sm text-white shadow-lg shadow-indigo-500/25"
                      >
                        <Plus size={16} />
                        立即创建
                      </Link>
                      <Link
                        href="/organize"
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-space-mono text-sm text-gray-300"
                      >
                        返回组织者中心
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

