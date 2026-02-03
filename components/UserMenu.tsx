'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  const user = session?.user;
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
      >
        {user?.image && !imageError ? (
          <Image
            src={user.image}
            alt={displayName}
            width={32}
            height={32}
            className="rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-sora text-sm font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="hidden sm:block font-space-mono text-sm text-gray-300 max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-gray-900 border border-white/10 shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="font-sora text-sm font-medium text-white truncate">
              {displayName}
            </p>
            <p className="font-space-mono text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>

          <div className="py-2">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-space-mono text-gray-400 hover:bg-white/5 hover:text-white transition-all"
            >
              <User size={16} />
              个人中心
            </Link>
          </div>

          <div className="py-2 border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-space-mono text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={16} />
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
