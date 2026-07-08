'use client';

import { useState } from 'react';
import {
  Copy,
  Check,
  X,
  Link2,
  Mail,
  Bot,
  Sparkles,
  Send,
} from 'lucide-react';

interface InviteModalProps {
  teamId: string;
  teamName?: string;
  onClose: () => void;
}

export function InviteModal({ teamId, teamName, onClose }: InviteModalProps) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email invite state
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const generateLink = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/agent/team/${teamId}/invite`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '生成失败');
      }
      const data = await res.json();
      setInviteUrl(data.inviteUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成邀请链接失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailInvite = async () => {
    if (!email.trim() || !email.includes('@')) return;
    setIsSendingEmail(true);
    setError(null);
    try {
      // Generate link first if not generated
      let link = inviteUrl;
      if (!link) {
        const res = await fetch(`/api/agent/team/${teamId}/invite`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error('生成邀请链接失败');
        const data = await res.json();
        link = data.inviteUrl;
        setInviteUrl(link);
      }
      // For now, copy the link to clipboard with the email as context
      // In the future, this could send an actual email
      if (link) {
        await navigator.clipboard.writeText(link);
      }
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '邀请失败');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-[#0d0e14] border border-white/[0.08] rounded-2xl shadow-2xl shadow-[#7c5dff]/10 overflow-hidden">
        {/* Top gradient accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#7c5dff] to-transparent" />

        <div className="p-6 space-y-5">
          {/* Header with logo */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c5dff] via-[#c759ff] to-[#4de1ff] flex items-center justify-center shadow-lg shadow-[#7c5dff]/20">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-sora text-lg font-semibold text-white">
                  邀请队友
                </h2>
                {teamName && (
                  <p className="text-xs text-gray-500 font-space-mono mt-0.5">
                    {teamName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Invite link section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 size={14} className="text-[#7c5dff]" />
              <span className="text-sm font-medium text-gray-300">邀请链接</span>
              <span className="text-[10px] text-gray-600 font-space-mono">有效期 24h</span>
            </div>

            {!inviteUrl ? (
              <button
                onClick={generateLink}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-[#7c5dff]/30 hover:bg-white/[0.06] text-gray-300 text-sm transition-all duration-300 disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-[#7c5dff] rounded-full animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-[#7c5dff]" />
                    生成邀请链接
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#7c5dff]/[0.06] border border-[#7c5dff]/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-space-mono text-[#7c5dff] truncate">
                      {inviteUrl}
                    </p>
                  </div>
                  <button
                    onClick={copyLink}
                    className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                      copied
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'hover:bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                {copied && (
                  <p className="text-emerald-400 text-[11px] font-space-mono text-center animate-fade-up">
                    已复制到剪贴板
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] text-gray-600 font-space-mono uppercase">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Email invite section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-[#4de1ff]" />
              <span className="text-sm font-medium text-gray-300">邮箱邀请</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="队友的邮箱地址"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#4de1ff]/40 focus:ring-1 focus:ring-[#4de1ff]/20 transition-all duration-300"
                onKeyDown={(e) => e.key === 'Enter' && handleEmailInvite()}
              />
              <button
                onClick={handleEmailInvite}
                disabled={!email.trim() || !email.includes('@') || isSendingEmail}
                className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-[#7c5dff] to-[#c759ff] text-white transition-all duration-300 hover:shadow-md hover:shadow-[#7c5dff]/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSendingEmail ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : emailSent ? (
                  <Check size={16} />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            {emailSent && (
              <p className="text-[#4de1ff] text-[11px] font-space-mono text-center animate-fade-up">
                邀请链接已生成并复制，请发送给队友
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-xs font-space-mono text-center">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
