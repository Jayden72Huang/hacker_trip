'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Hero } from '@/components/Hero';
import { Navbar } from '@/components/Navbar';
import { Timeline } from '@/components/Timeline';
import { EventDetail } from '@/components/EventDetail';
import { Features } from '@/components/Features';
import { Testimonials } from '@/components/Testimonials';
import { Footer } from '@/components/Footer';
import { SignInModal } from '@/components/SignInModal';
import { hackathons } from '@/data/hackathons';

const STORAGE_KEY = 'hackertrip_subscriptions';

export default function Home() {
  const { data: session } = useSession();
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  const defaultId = useMemo(() => {
    const upcoming = hackathons.find((h) => !h.isPast);
    return upcoming ? upcoming.id : hackathons[0].id;
  }, []);

  const [selectedId, setSelectedId] = useState<string>(defaultId);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const selected = hackathons.find((h) => h.id === selectedId) ?? hackathons[0];

  // 从localStorage加载订阅状态
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      const saved: string[] = raw ? JSON.parse(raw) : [];
      setSubscriptions(saved);
    } catch {
      setSubscriptions([]);
    }
  }, []);

  // 切换订阅状态 - 必须登录才能订阅
  const toggleSubscription = useCallback(async (hackathonId: string): Promise<'subscribed' | 'unsubscribed' | 'login-required'> => {
    // 检查是否已登录
    if (!session) {
      setSignInModalOpen(true);
      return 'login-required';
    }

    let result: 'subscribed' | 'unsubscribed' = 'subscribed';
    setSubscriptions(prev => {
      let next: string[];
      if (prev.includes(hackathonId)) {
        next = prev.filter(id => id !== hackathonId);
        result = 'unsubscribed';
      } else {
        next = [...prev, hackathonId];
        result = 'subscribed';
      }
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      } catch {
        // ignore storage errors
      }
      return next;
    });

    return result;
  }, [session]);

  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed inset-0 -z-10 grid-bg opacity-50" aria-hidden />
      {/* 全局渐变背景 */}
      <div className="fixed inset-0 z-[-5] overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-20 left-1/5 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[150px]" />
        <div className="absolute top-40 right-1/5 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[150px]" />
        <div className="absolute top-[600px] left-1/3 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[120px]" />
      </div>
      <Navbar />
      <main className="pt-10">
        <Hero />
        <Timeline
          selectedId={selectedId}
          onSelect={setSelectedId}
          subscriptions={subscriptions}
        />
        <EventDetail
          hackathon={selected}
          isSubscribed={subscriptions.includes(selected.id)}
          onToggleSubscribe={() => toggleSubscription(selected.id)}
        />
        <Features />
        <Testimonials />
      </main>
      <Footer />

      {/* 登录弹窗 - 订阅时未登录会触发 */}
      <SignInModal isOpen={signInModalOpen} onClose={() => setSignInModalOpen(false)} />
    </div>
  );
}
