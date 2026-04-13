'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, ChevronDown, ChevronUp, Star, StarOff,
  Send, Search, FileText, Eye,
} from 'lucide-react';

interface ArticleItem {
  article: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    type: 'experience' | 'interview' | 'guest_post';
    content: string;
    excerpt: string | null;
    status: string;
    isFeatured: boolean;
    viewCount: number;
    createdAt: string;
    submittedAt: string | null;
    publishedAt: string | null;
  };
  authorName: string | null;
  authorImage: string | null;
}

type FilterStatus = 'invited' | 'draft' | 'in_review' | 'published' | 'rejected';

const statusLabels: Record<FilterStatus, string> = {
  invited: '已邀请',
  draft: '草稿',
  in_review: '待审核',
  published: '已发布',
  rejected: '已拒绝',
};

const typeLabels: Record<string, string> = {
  experience: '参赛经验',
  interview: '获奖访谈',
  guest_post: '嘉宾专栏',
};

const typeColors: Record<string, string> = {
  experience: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  interview: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  guest_post: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
};

export function ArticleManager() {
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('in_review');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string | null; image: string | null }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string | null } | null>(null);
  const [inviteType, setInviteType] = useState<string>('experience');
  const [inviteTitle, setInviteTitle] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchArticles = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/articles?status=${status}`);
      const { data } = await res.json();
      setItems(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(filter); }, [filter]);

  // Search users for invite
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/user/search?q=${encodeURIComponent(query)}`);
      const { data } = await res.json();
      setSearchResults(data || []);
    } catch {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(userSearch), 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'feature' | 'unfeature') => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: reviewNotes }),
      });
      setReviewNotes('');
      setExpanded(null);
      fetchArticles(filter);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvite = async () => {
    if (!selectedUser) return;
    setInviteLoading(true);
    try {
      await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: selectedUser.id,
          type: inviteType,
          title: inviteTitle || undefined,
        }),
      });
      setShowInviteForm(false);
      setSelectedUser(null);
      setUserSearch('');
      setInviteTitle('');
      setFilter('invited');
      fetchArticles('invited');
    } finally {
      setInviteLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">社区内容管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 rounded-lg text-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors flex items-center gap-1.5"
          >
            <Send size={14} /> 邀请投稿
          </button>
        </div>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="mb-6 p-5 rounded-xl bg-white/[0.03] border border-white/10">
          <h3 className="text-sm font-medium text-white mb-4">邀请作者投稿</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User search */}
            <div className="relative">
              <label className="text-xs text-gray-500 mb-1 block">搜索用户</label>
              {selectedUser ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <span className="text-white text-sm">{selectedUser.name || selectedUser.id}</span>
                  <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white">
                    <XCircle size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="输入用户名搜索..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-lg bg-gray-900 border border-white/10 shadow-xl">
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedUser({ id: u.id, name: u.name });
                            setSearchResults([]);
                            setUserSearch('');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5"
                        >
                          {u.image && <img src={u.image} alt="" className="w-5 h-5 rounded-full" />}
                          {u.name || u.id}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Type select */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">文章类型</label>
              <select
                value={inviteType}
                onChange={(e) => setInviteType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50"
              >
                <option value="experience">参赛经验</option>
                <option value="interview">获奖访谈</option>
                <option value="guest_post">嘉宾专栏</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">标题（可选）</label>
              <input
                type="text"
                value={inviteTitle}
                onChange={(e) => setInviteTitle(e.target.value)}
                placeholder="建议标题..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleInvite}
              disabled={!selectedUser || inviteLoading}
              className="px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors text-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send size={14} /> {inviteLoading ? '发送中...' : '发送邀请'}
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.keys(statusLabels) as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === s
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Article List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          暂无{statusLabels[filter]}的文章
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(({ article: a, authorName, authorImage }) => (
            <div key={a.id} className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden">
              {/* Summary row */}
              <button
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                {authorImage && (
                  <img src={authorImage} alt="" className="w-8 h-8 rounded-full" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium truncate">{a.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] border ${typeColors[a.type] || ''}`}>
                      {typeLabels[a.type] || a.type}
                    </span>
                    {a.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 text-[11px] border border-yellow-500/20">
                        精选
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 text-sm mt-0.5">
                    <span>{authorName || '匿名'}</span>
                    <span>{formatDate(a.createdAt)}</span>
                    {a.viewCount > 0 && (
                      <span className="flex items-center gap-1"><Eye size={12} /> {a.viewCount}</span>
                    )}
                  </div>
                </div>
                {expanded === a.id ? (
                  <ChevronUp size={16} className="text-gray-500" />
                ) : (
                  <ChevronDown size={16} className="text-gray-500" />
                )}
              </button>

              {/* Expanded detail */}
              {expanded === a.id && (
                <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
                  {a.subtitle && (
                    <p className="text-gray-400 text-sm">{a.subtitle}</p>
                  )}
                  {a.excerpt && (
                    <p className="text-gray-500 text-sm italic">{a.excerpt}</p>
                  )}

                  {/* Content preview */}
                  {a.content && (
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 max-h-40 overflow-y-auto">
                      <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                        {a.content.slice(0, 500)}{a.content.length > 500 ? '...' : ''}
                      </pre>
                    </div>
                  )}

                  {/* Actions for in_review */}
                  {filter === 'in_review' && (
                    <div className="flex items-end gap-3 pt-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">审核备注（可选）</label>
                        <input
                          type="text"
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="输入审核备注..."
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <button
                        onClick={() => handleAction(a.id, 'approve')}
                        disabled={actionLoading === a.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50"
                      >
                        <CheckCircle size={14} /> 通过
                      </button>
                      <button
                        onClick={() => handleAction(a.id, 'reject')}
                        disabled={actionLoading === a.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
                      >
                        <XCircle size={14} /> 拒绝
                      </button>
                    </div>
                  )}

                  {/* Feature toggle for published */}
                  {filter === 'published' && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleAction(a.id, a.isFeatured ? 'unfeature' : 'feature')}
                        disabled={actionLoading === a.id}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50 ${
                          a.isFeatured
                            ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {a.isFeatured ? <StarOff size={14} /> : <Star size={14} />}
                        {a.isFeatured ? '取消精选' : '设为精选'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
