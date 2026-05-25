'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { UserMenu } from './UserMenu';
import { SignInModal } from './SignInModal';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [mobileCommunityOpen, setMobileCommunityOpen] = useState(false);
  const communityRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  // 滚动监听
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 点击外部关闭社群面板
  useEffect(() => {
    if (!communityOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (communityRef.current && !communityRef.current.contains(e.target as Node)) {
        setCommunityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [communityOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 py-6">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-10">
          <motion.nav
            className="glass rounded-full px-6 py-3 lg:px-10 lg:py-4 flex items-center justify-between glow"
            animate={{
              backdropFilter: scrolled ? 'blur(20px)' : 'blur(14px)',
              backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.06)',
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="HackerTrip"
                width={40}
                height={40}
                className="h-9 w-auto"
                priority
              />
              <span className="font-sora text-xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                HackerTrip
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-7 lg:gap-9">
              <Link
                href="/explore"
                className="font-space-mono text-sm text-gray-400 hover:text-white transition-colors"
              >
                黑客松
              </Link>

              {/* 黑客松社群 Toggle */}
              <div ref={communityRef} className="relative">
                <button
                  type="button"
                  onClick={() => setCommunityOpen((v) => !v)}
                  aria-expanded={communityOpen}
                  className="flex items-center gap-1 font-space-mono text-sm text-gray-400 hover:text-white transition-colors"
                >
                  黑客松社群
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${communityOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {communityOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-4 z-50"
                    >
                      <div className="glass glow rounded-2xl border border-white/10 p-5 w-[280px] flex flex-col items-center gap-3">
                        <p className="font-sora text-sm font-medium text-white text-center">
                          扫码加入 HackerTrip 社群
                        </p>
                        <div className="rounded-xl overflow-hidden bg-black/40 border border-white/5">
                          <Image
                            src="/images/community-qr.jpg"
                            alt="黑客松社群微信群二维码"
                            width={240}
                            height={366}
                            className="block w-full h-auto"
                          />
                        </div>
                        <p className="font-space-mono text-[11px] text-gray-500 text-center leading-relaxed">
                          微信扫码加入 · 二维码定期更新
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Side Buttons */}
            <div className="flex items-center gap-3">
              {/* Organize Button */}
              <Link
                href="/organize"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
              >
                <span className="font-space-mono text-sm font-medium text-gray-300">
                  发起黑客松
                </span>
              </Link>

              {/* Auth Section */}
              {isLoading ? (
                <div className="w-[100px] h-[42px] rounded-full bg-white/5 animate-pulse" />
              ) : session ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setSignInModalOpen(true)}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-[1.03] active:scale-100 shadow-lg shadow-indigo-500/30"
                >
                  <span className="font-space-mono text-sm font-medium text-white">
                    登录
                  </span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X size={20} className="text-white" />
                ) : (
                  <Menu size={20} className="text-white" />
                )}
              </button>
            </div>
          </motion.nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 glass rounded-2xl p-4 border border-white/5">
              <div className="flex flex-col gap-2">
                <Link
                  href="/explore"
                  className="px-4 py-3 rounded-xl hover:bg-white/5 font-space-mono text-sm text-gray-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  黑客松
                </Link>

                {/* 移动端黑客松社群 Toggle */}
                <button
                  type="button"
                  onClick={() => setMobileCommunityOpen((v) => !v)}
                  aria-expanded={mobileCommunityOpen}
                  className="px-4 py-3 rounded-xl hover:bg-white/5 font-space-mono text-sm text-gray-400 transition-colors flex items-center justify-between"
                >
                  黑客松社群
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${mobileCommunityOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {mobileCommunityOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-4 mb-2 rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col items-center gap-2">
                        <p className="font-sora text-sm font-medium text-white text-center">
                          扫码加入 HackerTrip 社群
                        </p>
                        <div className="rounded-lg overflow-hidden bg-black/40 border border-white/5">
                          <Image
                            src="/images/community-qr.jpg"
                            alt="黑客松社群微信群二维码"
                            width={220}
                            height={336}
                            className="block w-full h-auto"
                          />
                        </div>
                        <p className="font-space-mono text-[11px] text-gray-500 text-center">
                          微信扫码加入 · 二维码定期更新
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="w-full h-px bg-white/10 my-2" />
                <Link
                  href="/organize"
                  className="px-4 py-3 rounded-xl hover:bg-white/5 font-space-mono text-sm text-indigo-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  发起黑客松
                </Link>

                {/* Mobile Auth Section */}
                <div className="w-full h-px bg-white/10 my-2" />
                {session ? (
                  <>
                    <div className="px-4 py-3 flex items-center gap-3">
                      {session.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || ''}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
                      )}
                      <div>
                        <p className="font-sora text-sm font-medium text-white">
                          {session.user?.name}
                        </p>
                        <p className="font-space-mono text-xs text-gray-500">
                          {session.user?.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        await signOut({ callbackUrl: '/' });
                      }}
                      className="px-4 py-3 rounded-xl hover:bg-red-500/10 font-space-mono text-sm text-red-400 transition-colors text-left flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      退出登录
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSignInModalOpen(true);
                    }}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-space-mono text-sm text-white transition-colors text-center"
                  >
                    登录
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Sign In Modal */}
      <SignInModal isOpen={signInModalOpen} onClose={() => setSignInModalOpen(false)} />
    </>
  );
}
