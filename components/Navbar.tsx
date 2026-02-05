'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Rocket, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { UserMenu } from './UserMenu';
import { SignInModal } from './SignInModal';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 py-6">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-10">
          <nav className="glass rounded-full px-6 py-3 lg:px-10 lg:py-4 flex items-center justify-between glow">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="font-sora text-sm font-extrabold text-white">H</span>
              </div>
              <span className="font-sora text-xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                HackerTrip
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-7 lg:gap-9">
              <Link
                href="/"
                className="font-space-mono text-sm text-white hover:text-indigo-200 transition-colors relative group"
              >
                黑客松
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 scale-x-100 group-hover:scale-x-110 transition-transform origin-left" />
              </Link>
              <Link
                href="/explore"
                className="font-space-mono text-sm text-gray-400 hover:text-white transition-colors"
              >
                探索
              </Link>
              <Link
                href="/products"
                className="font-space-mono text-sm text-gray-400 hover:text-white transition-colors"
              >
                作品榜
              </Link>
              <Link
                href="#"
                className="font-space-mono text-sm text-gray-400 hover:text-white transition-colors"
              >
                社区
              </Link>
            </div>

            {/* Right Side Buttons */}
            <div className="flex items-center gap-3">
              {/* Organize Button */}
              <Link
                href="/organize"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
              >
                <Rocket size={16} className="text-indigo-400" />
                <span className="font-space-mono text-sm font-medium text-gray-300">
                  发起活动
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
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 glass rounded-2xl p-4 border border-white/5">
              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  className="px-4 py-3 rounded-xl hover:bg-white/5 font-space-mono text-sm text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  黑客松
                </Link>
              <Link
                href="/explore"
                className="px-4 py-3 rounded-xl hover:bg-white/5 font-space-mono text-sm text-gray-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                探索
              </Link>
              <Link
                href="/products"
                className="px-4 py-3 rounded-xl hover:bg-white/5 font-space-mono text-sm text-gray-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                作品榜
              </Link>
              <Link
                href="#"
                className="px-4 py-3 rounded-xl hover:bg-white/5 font-space-mono text-sm text-gray-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                  社区
                </Link>
                <div className="w-full h-px bg-white/10 my-2" />
                <Link
                  href="/organize"
                  className="px-4 py-3 rounded-xl hover:bg-white/5 font-space-mono text-sm text-indigo-400 transition-colors flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Rocket size={16} />
                  发起活动
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
