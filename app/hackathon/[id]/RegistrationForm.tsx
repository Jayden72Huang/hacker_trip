'use client';

import { useState } from 'react';

type Props = {
  hackathonName: string;
};

export function RegistrationForm({ hackathonName }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    teamSize: '',
    idea: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '提交失败');
      }

      setStatus('success');
      setMessage('已收到报名，我们会邮件确认并安排后续流程。');
      setFormData({ name: '', email: '', teamSize: '', idea: '' });
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '提交失败，请稍后再试');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">姓名 / 团队名</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none"
            placeholder="如：王小明 / Alpha Team"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">邮箱</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">团队规模</label>
          <input
            name="teamSize"
            value={formData.teamSize}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none"
            placeholder="例如：3-5 人"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">项目方向</label>
          <input
            name="idea"
            value={formData.idea}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none"
            placeholder="硬件+AIoT / 金融风控 / 开放式"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        提交后我们会立即给你发送确认邮件，并在报名通道正式开启后优先联系你。
      </p>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700 transition-colors disabled:opacity-60"
      >
        {status === 'loading' ? '提交中...' : `报名 ${hackathonName}`}
      </button>

      {message && (
        <div
          className={`mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            status === 'success'
              ? 'bg-green-500/10 text-green-200 border border-green-500/20'
              : 'bg-amber-500/10 text-amber-200 border border-amber-500/30'
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
}
