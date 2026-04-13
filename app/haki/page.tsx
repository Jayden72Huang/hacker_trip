'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Bot, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { Haki } from './components/HackerBot';

export default function HakiPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [hasInvite, setHasInvite] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if URL has invite param
    const params = new URLSearchParams(window.location.search);
    setHasInvite(!!params.get('invite'));
  }, []);

  if (!mounted || status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-[#05060a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
            <Bot size={24} className="text-white" />
          </div>
          <p className="font-space-mono text-sm text-gray-500">Loading Haki...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#05060a]">
        <div className="text-center space-y-4">
          {hasInvite ? (
            <>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#7c5dff] via-[#c759ff] to-[#4de1ff] flex items-center justify-center mb-2">
                <Users size={28} className="text-white" />
              </div>
              <p className="font-sora text-lg font-semibold text-white">
                你收到了一个团队邀请
              </p>
              <p className="font-space-mono text-sm text-gray-400">
                登录后自动加入队伍
              </p>
              <button
                onClick={() => signIn('github', { callbackUrl: window.location.href })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7c5dff] to-[#c759ff] hover:shadow-lg hover:shadow-[#7c5dff]/20 transition-all font-space-mono text-sm text-white font-medium"
              >
                登录并加入
              </button>
            </>
          ) : (
            <>
              <p className="font-space-mono text-gray-400">请先登录后使用 Haki</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-space-mono text-sm text-gray-300"
              >
                <ArrowLeft size={16} />
                返回首页
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return <Haki user={session.user!} />;
}
