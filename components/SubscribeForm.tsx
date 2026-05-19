'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    fetch('/api/subscribe/count')
      .then((r) => r.json())
      .then((d) => { if (d.count) setSubscriberCount(d.count); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || '订阅失败，请稍后重试');
        return;
      }

      setStatus('success');
      setSubscriberCount((c) => c + 1);
    } catch {
      setStatus('error');
      setErrorMsg('网络错误，请稍后重试');
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.06]">
      <div className="flex flex-col md:flex-row min-h-[380px]">
        {/* 左侧 - 背景图 + 标语 */}
        <div className="relative md:w-[45%] min-h-[200px] md:min-h-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/subscribe-banner.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0a12]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12]/80 via-transparent to-transparent md:bg-none" />

          <div className="relative h-full flex flex-col justify-end p-6 md:p-8">
            <p className="font-sora text-2xl md:text-3xl font-bold leading-snug">
              <span className="text-white">灵感，</span>
              <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">不用等。</span>
              <br />
              <span className="bg-gradient-to-r from-[#4de1ff] to-[#7c5dff] bg-clip-text text-transparent">创造，</span>
              <span className="text-white">就现在。</span>
            </p>
          </div>
        </div>

        {/* 右侧 - 订阅表单 */}
        <div className="flex-1 bg-[#0a0a12] p-6 md:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-px bg-[#7c5dff]" />
            <span className="font-space-mono text-xs tracking-[0.2em] text-[#7c5dff] uppercase">
              每 周 推 送
            </span>
          </div>

          <h3 className="font-sora text-2xl md:text-3xl font-bold text-white mb-3">
            订阅黑客松资讯
          </h3>
          <p className="font-space-mono text-sm text-gray-400 leading-relaxed mb-8">
            获取最新黑客松活动、参赛技巧和独家资讯，直达你的邮箱。
          </p>

          {status === 'success' ? (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle2 size={20} className="text-green-400 shrink-0" />
              <p className="font-space-mono text-sm text-green-300">
                订阅成功！我们会将最新黑客松资讯发送到你的邮箱。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="邮箱地址"
                required
                className="w-full px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-500 font-space-mono text-sm focus:outline-none focus:border-[#7c5dff]/50 focus:ring-1 focus:ring-[#7c5dff]/30 transition-all"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white text-[#0a0a0a] font-sora text-sm font-semibold transition-all hover:bg-gray-100 active:scale-[0.99] disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <span className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <>
                    锁定我的席位
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              {status === 'error' && (
                <p className="text-xs text-red-400 font-space-mono">{errorMsg}</p>
              )}
            </form>
          )}

          {subscriberCount > 0 && (
            <div className="flex items-center gap-3 mt-6">
              <span className="w-5 h-px bg-gray-600" />
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-space-mono text-xs text-gray-500">
                {subscriberCount} 位创造者已加入
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
