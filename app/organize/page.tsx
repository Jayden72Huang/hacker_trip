'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SignInModal } from '@/components/SignInModal';
import Link from 'next/link';
import {
  Building2,
  Globe,
  CheckCircle2,
  ArrowRight,
  Clock,
  XCircle,
  Plus,
  FileText,
  Settings,
} from 'lucide-react';

type OrganizerProfile = {
  id: string;
  userId: string;
  organizationName: string;
  website: string | null;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
};

type PageState = 'loading' | 'intro' | 'register' | 'pending' | 'approved' | 'rejected';

export default function OrganizePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [formData, setFormData] = useState({
    organization: '',
    website: '',
    role: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 获取组织者档案
  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (!session) {
      setPageState('intro');
      return;
    }

    // 已登录，获取组织者档案
    fetchOrganizerProfile();
  }, [session, sessionStatus]);

  const fetchOrganizerProfile = async () => {
    try {
      const res = await fetch('/api/organizer');
      const data = await res.json();

      if (data.profile) {
        setProfile(data.profile);
        switch (data.profile.status) {
          case 'pending':
            setPageState('pending');
            break;
          case 'approved':
            router.push('/organizer');
            return;
          case 'rejected':
            setPageState('rejected');
            break;
        }
      } else {
        setPageState('register');
      }
    } catch {
      setPageState('register');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/organizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: formData.organization,
          website: formData.website,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '提交失败');
        return;
      }

      setProfile(data.profile);
      setPageState('pending');
    } catch {
      setError('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = () => {
    setShowSignInModal(true);
  };

  // 加载中
  if (pageState === 'loading' || sessionStatus === 'loading') {
    return (
      <div className="relative min-h-screen pb-12">
        <div className="fixed inset-0 -z-10 grid-bg opacity-50" aria-hidden />
        <Navbar />
        <main className="pt-32 pb-24">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed inset-0 -z-10 grid-bg opacity-50" aria-hidden />
      <Navbar />

      <main className="pt-32 pb-24 min-h-[calc(100vh-200px)] flex flex-col justify-center">
        <div className="w-full max-w-[800px] mx-auto px-6">
          {/* 未登录：展示介绍页 */}
          {pageState === 'intro' && (
            <div className="text-center">
              <h1 className="font-sora text-4xl md:text-5xl font-bold text-white mb-4">
                成为黑客松组织者
              </h1>
              <p className="font-space-mono text-lg text-gray-400 mb-12 max-w-lg mx-auto">
                在 HackerTrip 发布你的黑客松活动，触达全球开发者社区
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="glass rounded-2xl p-6 border border-white/5 text-left">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                    <Globe size={20} className="text-blue-400" />
                  </div>
                  <h3 className="font-sora text-lg font-semibold text-white mb-2">
                    触达全球开发者
                  </h3>
                  <p className="font-space-mono text-sm text-gray-400">
                    让来自世界各地的优秀开发者发现你的活动
                  </p>
                </div>

                <div className="glass rounded-2xl p-6 border border-white/5 text-left">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
                    <FileText size={20} className="text-purple-400" />
                  </div>
                  <h3 className="font-sora text-lg font-semibold text-white mb-2">
                    智能信息录入
                  </h3>
                  <p className="font-space-mono text-sm text-gray-400">
                    支持文本导入自动解析，快速完成活动信息填写
                  </p>
                </div>

                <div className="glass rounded-2xl p-6 border border-white/5 text-left">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
                    <Settings size={20} className="text-green-400" />
                  </div>
                  <h3 className="font-sora text-lg font-semibold text-white mb-2">
                    灵活的自定义
                  </h3>
                  <p className="font-space-mono text-sm text-gray-400">
                    Notion 风格编辑器，自由添加活动详情模块
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all text-lg font-space-mono font-medium text-white shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-100"
              >
                <ArrowRight size={20} />
                注册成为组织者
              </button>
            </div>
          )}

          {/* 已登录但未注册：展示注册表单 */}
          {pageState === 'register' && (
            <div>
              <div className="glass rounded-3xl p-8 md:p-12 border border-white/5">
                <div className="text-center mb-10">
                  <h2 className="font-sora text-3xl font-bold text-white mb-3">
                    注册成为组织者
                  </h2>
                  <p className="font-space-mono text-sm text-gray-400">
                    填写以下信息完成注册，我们将在 24 小时内审核
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-space-mono">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 组织 */}
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      组织/公司 *
                    </label>
                    <div className="relative">
                      <Building2
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      />
                      <input
                        type="text"
                        required
                        value={formData.organization}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            organization: e.target.value,
                          })
                        }
                        placeholder="你所在的组织或公司"
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* 网站 */}
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      网站（可选）
                    </label>
                    <div className="relative">
                      <Globe
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      />
                      <input
                        type="text"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                        placeholder="yourwebsite.com"
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* 角色 */}
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      你的角色 *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-gray-900">
                        选择你的角色
                      </option>
                      <option value="organizer" className="bg-gray-900">
                        活动组织者
                      </option>
                      <option value="sponsor" className="bg-gray-900">
                        赞助商
                      </option>
                      <option value="partner" className="bg-gray-900">
                        合作伙伴
                      </option>
                      <option value="community" className="bg-gray-900">
                        社区负责人
                      </option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all text-base font-space-mono font-medium text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        提交中...
                      </>
                    ) : (
                      '提交申请'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 待审核状态 */}
          {pageState === 'pending' && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                <Clock size={40} className="text-yellow-500" />
              </div>

              <h2 className="font-sora text-3xl font-bold text-white mb-4">
                申请审核中
              </h2>
              <p className="font-space-mono text-gray-400 mb-8 max-w-md mx-auto">
                你的组织者申请正在审核中，我们将在 24 小时内通过邮件通知你结果。
              </p>

              <div className="glass rounded-2xl p-6 border border-white/5 mb-8 max-w-md mx-auto">
                <h3 className="font-sora text-lg font-semibold text-white mb-4">
                  申请信息
                </h3>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="font-space-mono text-sm text-gray-500">组织</span>
                    <span className="font-space-mono text-sm text-white">
                      {profile?.organizationName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-space-mono text-sm text-gray-500">角色</span>
                    <span className="font-space-mono text-sm text-white">
                      {profile?.role === 'organizer' && '活动组织者'}
                      {profile?.role === 'sponsor' && '赞助商'}
                      {profile?.role === 'partner' && '合作伙伴'}
                      {profile?.role === 'community' && '社区负责人'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-space-mono text-sm text-gray-500">状态</span>
                    <span className="font-space-mono text-sm text-yellow-400">
                      待审核
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-space-mono text-sm text-gray-300"
              >
                返回首页
              </Link>
            </div>
          )}

          {/* 已通过：展示组织者后台 */}
          {pageState === 'approved' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-sora text-3xl font-bold text-white mb-2">
                    组织者中心
                  </h1>
                  <p className="font-space-mono text-sm text-gray-400">
                    {profile?.organizationName}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="font-space-mono text-xs text-green-400">已认证</span>
                </div>
              </div>

              {/* 快捷操作 */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Link
                  href="/organize/create"
                  className="glass rounded-2xl p-6 border border-white/5 hover:border-indigo-500/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus size={24} className="text-white" />
                  </div>
                  <h3 className="font-sora text-lg font-semibold text-white mb-2">
                    创建新活动
                  </h3>
                  <p className="font-space-mono text-sm text-gray-400">
                    发布新的黑客松活动
                  </p>
                </Link>

                <Link
                  href="/organize/events"
                  className="glass rounded-2xl p-6 border border-white/5 hover:border-indigo-500/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText size={24} className="text-blue-400" />
                  </div>
                  <h3 className="font-sora text-lg font-semibold text-white mb-2">
                    我的活动
                  </h3>
                  <p className="font-space-mono text-sm text-gray-400">
                    管理已发布的活动
                  </p>
                </Link>
              </div>

              {/* 组织信息 */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-sora text-lg font-semibold text-white">
                    组织信息
                  </h3>
                  <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <Settings size={16} />
                    <span className="font-space-mono text-sm">编辑</span>
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-space-mono text-sm text-gray-500">组织名称</span>
                    <span className="font-space-mono text-sm text-white">
                      {profile?.organizationName}
                    </span>
                  </div>
                  {profile?.website && (
                    <div className="flex justify-between">
                      <span className="font-space-mono text-sm text-gray-500">网站</span>
                      <span className="font-space-mono text-sm text-indigo-400">
                        {profile.website}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-space-mono text-sm text-gray-500">角色</span>
                    <span className="font-space-mono text-sm text-white">
                      {profile?.role === 'organizer' && '活动组织者'}
                      {profile?.role === 'sponsor' && '赞助商'}
                      {profile?.role === 'partner' && '合作伙伴'}
                      {profile?.role === 'community' && '社区负责人'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 被拒绝状态 */}
          {pageState === 'rejected' && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <XCircle size={40} className="text-red-500" />
              </div>

              <h2 className="font-sora text-3xl font-bold text-white mb-4">
                申请未通过
              </h2>
              <p className="font-space-mono text-gray-400 mb-8 max-w-md mx-auto">
                很抱歉，你的组织者申请未能通过审核。
              </p>

              {profile?.rejectionReason && (
                <div className="glass rounded-2xl p-6 border border-red-500/20 mb-8 max-w-md mx-auto">
                  <h3 className="font-sora text-lg font-semibold text-white mb-2">
                    原因
                  </h3>
                  <p className="font-space-mono text-sm text-gray-400">
                    {profile.rejectionReason}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-space-mono text-sm text-gray-300"
                >
                  返回首页
                </Link>
                <a
                  href="mailto:support@hackertrip.space"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all font-space-mono text-sm text-white shadow-lg shadow-indigo-500/30"
                >
                  联系我们
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <SignInModal isOpen={showSignInModal} onClose={() => setShowSignInModal(false)} />
    </div>
  );
}
