'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { X, Mail, Loader2 } from 'lucide-react';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await signIn('resend', { email, redirect: false });
      setEmailSent(true);
    } catch (error) {
      console.error('Email sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = (provider: 'google' | 'github') => {
    signIn(provider);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"
        >
          <X size={20} className="text-gray-400" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="font-sora text-xl font-extrabold text-white">H</span>
          </div>
          <h2 className="font-sora text-2xl font-bold text-white mb-2">
            欢迎来到 HackerTrip
          </h2>
          <p className="font-space-mono text-sm text-gray-400">
            登录后探索全球黑客松活动
          </p>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          {emailSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Mail size={32} className="text-green-400" />
              </div>
              <h3 className="font-sora text-lg font-semibold text-white mb-2">
                查看你的邮箱
              </h3>
              <p className="font-space-mono text-sm text-gray-400 mb-4">
                我们已发送登录链接至 <span className="text-white">{email}</span>
              </p>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="font-space-mono text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                使用其他邮箱
              </button>
            </div>
          ) : (
            <>
              {/* Email Form */}
              <form onSubmit={handleEmailSignIn} className="mb-6">
                <label className="block font-space-mono text-sm text-gray-400 mb-2">
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 font-space-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full mt-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="text-white animate-spin" />
                  ) : (
                    <Mail size={18} className="text-white" />
                  )}
                  <span className="font-space-mono text-sm font-medium text-white">
                    {isLoading ? '发送中...' : '使用邮箱继续'}
                  </span>
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="font-space-mono text-xs text-gray-500 uppercase">或</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Social Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleSocialSignIn('google')}
                  className="w-full px-4 py-3 rounded-xl bg-white hover:bg-gray-100 transition-all flex items-center justify-center gap-3"
                >
                  <GoogleIcon className="w-5 h-5" />
                  <span className="font-space-mono text-sm font-medium text-gray-800">
                    使用 Google 登录
                  </span>
                </button>
                <button
                  onClick={() => handleSocialSignIn('github')}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/10 transition-all flex items-center justify-center gap-3"
                >
                  <GitHubIcon className="w-5 h-5 text-white" />
                  <span className="font-space-mono text-sm font-medium text-white">
                    使用 GitHub 登录
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-white/5 border-t border-white/10">
          <p className="font-space-mono text-xs text-gray-500 text-center">
            继续即表示你同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  );
}
