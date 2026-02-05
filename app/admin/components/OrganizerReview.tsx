'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Globe,
  Mail,
  User,
  ChevronDown,
  Search,
  RefreshCw,
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
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
};

const roleLabels: Record<string, string> = {
  organizer: '活动组织者',
  sponsor: '赞助商',
  partner: '合作伙伴',
  community: '社区负责人',
};

const statusConfig = {
  pending: {
    label: '待审核',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: Clock,
  },
  approved: {
    label: '已通过',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: CheckCircle2,
  },
  rejected: {
    label: '已拒绝',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: XCircle,
  },
};

export function OrganizerReview() {
  const [profiles, setProfiles] = useState<OrganizerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/organizers?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [filter]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/organizers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectReason : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // 更新列表
        setProfiles((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...data.profile } : p))
        );
        setExpandedId(null);
        setRejectReason('');
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const counts = {
    all: profiles.length,
    pending: profiles.filter((p) => p.status === 'pending').length,
    approved: profiles.filter((p) => p.status === 'approved').length,
    rejected: profiles.filter((p) => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">组织者审核</h2>
          <p className="text-sm text-gray-400 mt-1">管理组织者申请</p>
        </div>
        <button
          onClick={fetchProfiles}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-300"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {status === 'all' ? '全部' : statusConfig[status].label}
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-black/20">
                {counts[status]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="搜索组织名称、邮箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10 text-sm font-medium text-gray-400">
          <div className="col-span-3">组织</div>
          <div className="col-span-2">申请人</div>
          <div className="col-span-2">邮箱</div>
          <div className="col-span-2">角色</div>
          <div className="col-span-1">状态</div>
          <div className="col-span-2 text-right">操作</div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            暂无{filter === 'all' ? '' : statusConfig[filter]?.label}申请
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredProfiles.map((profile) => {
              const config = statusConfig[profile.status];
              const StatusIcon = config.icon;
              const isExpanded = expandedId === profile.id;

              return (
                <div key={profile.id}>
                  {/* Main Row */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Building2 size={18} className="text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{profile.organizationName}</p>
                        {profile.website && (
                          <a
                            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-gray-500 hover:text-indigo-400 flex items-center gap-1"
                          >
                            <Globe size={10} />
                            {profile.website}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      {profile.userImage ? (
                        <img
                          src={profile.userImage}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                          <User size={14} className="text-gray-400" />
                        </div>
                      )}
                      <span className="text-sm text-gray-300">{profile.userName || '-'}</span>
                    </div>

                    <div className="col-span-2 flex items-center gap-1 text-sm text-gray-400">
                      <Mail size={12} />
                      <span className="truncate">{profile.userEmail}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="px-2 py-1 rounded text-xs bg-white/5 text-gray-300">
                        {roleLabels[profile.role] || profile.role}
                      </span>
                    </div>

                    <div className="col-span-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${config.bg} ${config.color} ${config.border} border`}
                      >
                        <StatusIcon size={12} />
                        {config.label}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-2">
                      {profile.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(profile.id, 'approve')}
                            disabled={actionLoading === profile.id}
                            className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            拒绝
                            <ChevronDown
                              size={12}
                              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                        </>
                      )}
                      {profile.status === 'approved' && (
                        <span className="text-xs text-gray-500">
                          {profile.approvedAt && new Date(profile.approvedAt).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                      {profile.status === 'rejected' && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                          className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
                        >
                          查看原因
                          <ChevronDown
                            size={12}
                            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Area */}
                  {isExpanded && (
                    <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5">
                      {profile.status === 'pending' ? (
                        <div className="flex items-end gap-4">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-2">
                              拒绝原因
                            </label>
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="请输入拒绝原因..."
                              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-red-500/50"
                            />
                          </div>
                          <button
                            onClick={() => handleAction(profile.id, 'reject')}
                            disabled={actionLoading === profile.id || !rejectReason}
                            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === profile.id ? '处理中...' : '确认拒绝'}
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          <span className="text-gray-500">拒绝原因：</span>
                          {profile.rejectionReason || '未填写'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
