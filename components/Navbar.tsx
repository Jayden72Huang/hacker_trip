'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Menu, X, LogOut, Users } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { UserMenu } from './UserMenu';
import { SignInModal } from './SignInModal';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
              <button
                onClick={() => setQrModalOpen(true)}
                className="font-space-mono text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Users size={14} />
                社群
              </button>
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
                <button
                  onClick={() => { setMobileMenuOpen(false); setQrModalOpen(true); }}
                  className="px-4 py-3 rounded-xl hover:bg-white/5 font-space-mono text-sm text-gray-400 transition-colors text-left flex items-center gap-2"
                >
                  <Users size={14} />
                  社群
                </button>
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

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setQrModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative glass rounded-2xl p-6 border border-white/10 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
            <h3 className="font-sora text-lg font-bold text-white mb-1">加入社群</h3>
            <p className="font-space-mono text-xs text-gray-400 mb-4">
              扫码加入 HackerTrip 微信社群
            </p>
            <Image
              src="/images/wechat-community-qr.jpg"
              alt="HackerTrip 微信社群二维码"
              width={280}
              height={380}
              className="rounded-xl mx-auto"
            />
            <p className="font-space-mono text-xs text-gray-500 mt-4">
              微信扫一扫，加入种子用户群
            </p>
          </div>
        </div>
      )}
    </>
  );
}
