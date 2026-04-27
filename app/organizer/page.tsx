'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Home,
  Inbox,
  LayoutDashboard,
  Loader2,
  Shield,
  Sparkles,
} from 'lucide-react';
import { DraftList } from '@/app/admin/components/DraftList';
import { HackathonManager } from '@/app/admin/components/HackathonManager';
import { SmartImporter } from '@/app/admin/components/SmartImporter';

type MenuItem = {
  id: 'my-hackathons' | 'create' | 'drafts';
  label: string;
  icon: React.ElementType;
};

type OrganizerProfile = {
  status?: 'pending' | 'approved' | 'rejected' | null;
  rejectionReason?: string | null;
} | null;

const menuItems: MenuItem[] = [
  { id: 'my-hackathons', label: '我的活动', icon: LayoutDashboard },
  { id: 'create', label: '创建活动', icon: Sparkles },
  { id: 'drafts', label: '草稿箱', icon: Inbox },
];

const STATUS_MESSAGE: Record<string, { title: string; description: string }> = {
  pending: {
    title: '组织者申请审核中',
    description: '审核通过后，你可以在这里创建和管理自己的黑客松活动。',
  },
  rejected: {
    title: '组织者申请未通过',
    description: '请根据审核反馈补充信息后重新提交申请。',
  },
  none: {
    title: '需要先申请组织者权限',
    description: '通过组织者审核后，你可以自助发布和维护自己的活动。',
  },
};

export default function OrganizerPage() {
  const [activeTab, setActiveTab] = useState<MenuItem['id']>('my-hackathons');
  const [refreshKey, setRefreshKey] = useState(0);
  const [profile, setProfile] = useState<OrganizerProfile>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadOrganizerStatus() {
      try {
        const res = await fetch('/api/organizer');
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || '无法获取组织者状态');
        }

        if (mounted) setProfile(data.profile || null);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : '无法获取组织者状态');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadOrganizerStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const handleDataAdded = () => {
    setRefreshKey((prev) => prev + 1);
    setActiveTab('drafts');
  };

  const getActiveLabel = () => {
    return menuItems.find((item) => item.id === activeTab)?.label || '组织者后台';
  };

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-gray-500" size={20} />
          <span className="ml-2 font-space-mono text-sm text-gray-400">加载中...</span>
        </div>
      );
    }

    if (error || profile?.status !== 'approved') {
      const message = STATUS_MESSAGE[profile?.status || 'none'] || STATUS_MESSAGE.none;

      return (
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
            <Shield size={24} />
          </div>
          <h2 className="font-sora text-xl font-bold text-white">
            {error || message.title}
          </h2>
          <p className="mt-2 font-space-mono text-sm leading-6 text-gray-400">
            {error ? '请稍后重试，或确认当前账号已提交组织者申请。' : message.description}
          </p>
          {profile?.rejectionReason && (
            <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 font-space-mono text-sm text-red-300">
              {profile.rejectionReason}
            </p>
          )}
          <Link
            href="/organize"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 font-space-mono text-sm text-white transition-colors hover:bg-indigo-600"
          >
            前往组织者申请
            <ChevronRight size={14} />
          </Link>
        </div>
      );
    }

    return (
      <>
        {activeTab === 'my-hackathons' && (
          <HackathonManager
            apiBase="/api/organizer"
            showFeaturedToggle={false}
            refreshKey={refreshKey}
            onRefresh={() => setRefreshKey((prev) => prev + 1)}
          />
        )}
        {activeTab === 'create' && (
          <SmartImporter apiBase="/api/organizer" onSuccess={handleDataAdded} />
        )}
        {activeTab === 'drafts' && <DraftList key={refreshKey} apiBase="/api/organizer" />}
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <aside className="flex w-64 flex-col border-r border-white/10 bg-black/20">
        <div className="border-b border-white/10 p-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-sora text-lg font-bold text-white">HackerTrip</h1>
              <p className="-mt-0.5 text-[10px] text-gray-500">组织者后台</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="mb-2 px-4">
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
              活动管理
            </span>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Home size={16} />
            返回首页
          </Link>
        </div>
      </aside>

      <main className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center border-b border-white/10 bg-black/20 px-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">组织者后台</span>
            <ChevronRight size={14} className="text-gray-600" />
            <span className="font-medium text-white">{getActiveLabel()}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl">
            {renderMainContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
