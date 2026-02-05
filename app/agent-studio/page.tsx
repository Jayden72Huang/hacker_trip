'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import ScrollFloat from '@/components/ScrollFloat';
import { X, CheckCircle2, Users } from 'lucide-react';

export default function AgentStudioPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; waitlistCount?: number }>({ show: false, type: 'success' });

  // 自动关闭 toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok || result?.error) {
        throw new Error(result?.error || '提交失败，请稍后再试');
      }

      setIsSubmitted(true);
      setEmail('');
      // 显示成功浮窗，包含白名单人数
      setToast({ show: true, type: 'success', waitlistCount: result?.count || 128 });
    } catch {
      // 显示错误浮窗
      setToast({ show: true, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* 背景 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* 增加上方行间距空间 */}
          <div className="h-10 md:h-14" />
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-10 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <span className="text-sm font-medium text-amber-200/90">即将上线...</span>
          </div>

          {/* 主标题 */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
            <span className="text-white/90 block">Hacker Agent</span>
            <span className="block">
              <ScrollFloat
                animationDuration={1}
                ease="back.inOut(2)"
                scrollStart="top 95%"
                scrollEnd="top 70%"
                stagger={0.03}
                gradientColors={{
                  from: '#818cf8',
                  via: '#c084fc',
                  to: '#f472b6'
                }}
              >
                你的黑客松全能助手
              </ScrollFloat>
            </span>
          </h1>

          {/* 副标题 */}
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed flex justify-center whitespace-nowrap">
            在 Hacker Agent 创作空间，你将拥有赛题上下文和100+插件， 全程一站式助力，让你轻松参赛。
          </p>

          {/* Slogan + Waiting List */}
          <div className="mb-6">
            <p className="text-xl md:text-2xl font-light text-gray-300 italic">
              "加入内测白名单，<br className="md:hidden" />
              <span className="text-white font-normal">抢先体验专属你的 AI 黑客松助手</span>"
            </p>
          </div>
          <div className="max-w-xl mx-auto mb-8">
            {isSubmitted ? (
              <div className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-green-500/10 border border-green-500/20">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-300">已加入等待列表，欢迎邮件已发送</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="你的邮箱"
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.07] transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-4 rounded-2xl font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isLoading ? '提交中...' : '申请内测'}
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  我们会在产品上线时第一时间通知你
                </p>
              </form>
            )}
          </div>

          {/* Hacker Agent 目标标题（与上方加大间距） */}
          <div className="mt-40" />
          <h2 className="text-3xl md:text-6xl font-bold text-white/90 mb-6">
            Hacker Agent 初心
          </h2>

          <p className="text-gray-500 max-w-xl mx-auto mb-16">
            让你不再为 Demo 演示焦虑，不再为材料准备熬夜。<br/>
            让 AI 处理繁琐，你只需专注于改变世界的创意。
          </p>

          {/* 愿景展示 */}
          <div className="relative mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 卡片 1 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/5 hover:border-blue-500/20 transition-all duration-500">
                  <div className="text-5xl mb-6">🎬</div>
                  <h3 className="text-lg font-semibold text-white mb-3">Demo 不再是难题</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    脚本、PPT、演示流程<br/>
                    3 分钟 Demo 背后的<br/>
                    3 小时准备工作
                  </p>
                  <div className="mt-6 text-xs text-blue-400/60 font-mono">
                    → 交给 Agent
                  </div>
                </div>
              </div>

              {/* 卡片 2 */}
              <div className="group relative md:-mt-4">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/5 hover:border-purple-500/20 transition-all duration-500">
                  <div className="text-5xl mb-6">💡</div>
                  <h3 className="text-lg font-semibold text-white mb-3">想法碰撞火花</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    凌晨 3 点的灵感<br/>
                    需要一个不会困的<br/>
                    脑暴伙伴
                  </p>
                  <div className="mt-6 text-xs text-purple-400/60 font-mono">
                    → 随时在线
                  </div>
                </div>
              </div>

              {/* 卡片 3 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/5 hover:border-amber-500/20 transition-all duration-500">
                  <div className="text-5xl mb-6">🛠️</div>
                  <h3 className="text-lg font-semibold text-white mb-3">工具随手可得</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    MCP、Skills、APIs<br/>
                    你需要的能力<br/>
                    一键接入
                  </p>
                  <div className="mt-6 text-xs text-amber-400/60 font-mono">
                    → 即插即用
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 返回 */}
          <div className="mt-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-400 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回首页
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Toast 浮窗 */}
      {toast.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`relative w-full max-w-md p-6 rounded-3xl border shadow-2xl animate-in fade-in zoom-in duration-300 ${
              toast.type === 'success'
                ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-green-500/30'
                : 'bg-gradient-to-br from-gray-900 to-gray-800 border-rose-500/30'
            }`}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>

            {toast.type === 'success' ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  成功加入白名单！
                </h3>
                <p className="text-gray-400">
                  上线前将邀请你参与内测体验
                </p>
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/10">
                  <Users size={18} className="text-indigo-400" />
                  <span className="text-gray-300">
                    当前白名单人数：<span className="text-white font-bold">{toast.waitlistCount}</span> 人
                  </span>
                </div>
                <button
                  onClick={() => setToast(prev => ({ ...prev, show: false }))}
                  className="w-full py-3 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all"
                >
                  知道了
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center">
                  <X size={32} className="text-rose-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  提交失败
                </h3>
                <p className="text-gray-400">
                  请检查网络连接后重试
                </p>
                <button
                  onClick={() => setToast(prev => ({ ...prev, show: false }))}
                  className="w-full py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 transition-all"
                >
                  关闭
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
