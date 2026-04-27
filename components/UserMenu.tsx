'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, Shield, Crown, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: '管理员', color: 'text-red-400 bg-red-500/10', icon: Crown },
  organizer: { label: '组织者', color: 'text-indigo-400 bg-indigo-500/10', icon: Shield },
  user: { label: '选手', color: 'text-gray-400 bg-white/5', icon: Gamepad2 },
};

export function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');
  const menuRef = useRef<HTMLDivElement>(null);

  // 从 API 获取用户真实 role
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/role')
        .then(res => res.json())
        .then(data => {
          if (data.role) setUserRole(data.role);
        })
        .catch(() => {});
    }
  }, [session?.user?.id]);

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
        className="p-1 rounded-full hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
      >
        {user?.image && !imageError ? (
          <Image
            src={user.image}
            alt={displayName}
            width={40}
            height={40}
            className="rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-sora text-base font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-gray-900 border border-white/10 shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-1">
              <p className="font-sora text-sm font-medium text-white truncate">
                {displayName}
              </p>
              {(() => {
                const cfg = ROLE_CONFIG[userRole] || ROLE_CONFIG.user;
                const Icon = cfg.icon;
                return (
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-space-mono font-medium ${cfg.color}`}>
                    <Icon size={10} />
                    {cfg.label}
                  </span>
                );
              })()}
            </div>
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
            {userRole === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-space-mono text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all"
              >
                <Crown size={16} />
                管理后台
              </Link>
            )}
            {userRole === 'organizer' && (
              <Link
                href="/organizer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-space-mono text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all"
              >
                <Shield size={16} />
                组织者后台
              </Link>
            )}
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
