'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Star,
  Trash2,
  RefreshCw,
  Plus,
  X,
  MapPin,
  Calendar,
  Monitor,
  Users,
  Globe,
  ChevronDown,
  Loader2,
  ExternalLink,
} from 'lucide-react';

// ---------- types ----------

interface PublishedHackathon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  startDate: string;
  endDate: string;
  mode: 'online' | 'offline' | 'hybrid';
  location: string | null;
  prizePool: string | null;
  organizer: string | null;
  tracks: { title: string; description?: string }[];
  tags: string[];
  status: 'upcoming' | 'ongoing' | 'ended';
  isFeatured: boolean;
  isVerified: boolean;
  sourceUrl: string | null;
  createdAt: string;
}

interface DraftItem {
  draftId: string;
  name?: string;
  city?: string;
  dateRange?: string;
  summary?: string;
  website?: string;
  prizePool?: string;
  mode?: string;
  organizers?: { name: string }[];
  tracks?: { title: string; description?: string }[];
  source?: string;
}

interface HackathonManagerProps {
  refreshKey?: number;
  onRefresh?: () => void;
}

// ---------- helpers ----------

function parseDateRange(dateRange?: string): { startDate: string; endDate: string } {
  if (!dateRange) {
    const now = new Date().toISOString().split('T')[0];
    return { startDate: now, endDate: now };
  }

  // Try common patterns: "2025-06-01 ~ 2025-06-03", "June 1-3, 2025", etc.
  const isoMatch = dateRange.match(/(\d{4}-\d{2}-\d{2})\s*[~\-–—to]+\s*(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return { startDate: isoMatch[1], endDate: isoMatch[2] };
  }

  // Fallback: try parsing the whole string as a single date
  const d = new Date(dateRange);
  if (!isNaN(d.getTime())) {
    const iso = d.toISOString().split('T')[0];
    return { startDate: iso, endDate: iso };
  }

  const now = new Date().toISOString().split('T')[0];
  return { startDate: now, endDate: now };
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  upcoming: { label: '即将开始', className: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  ongoing: { label: '进行中', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  ended: { label: '已结束', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

const MODE_LABELS: Record<string, string> = {
  online: '线上',
  offline: '线下',
  hybrid: '混合',
};

// ---------- component ----------

export function HackathonManager({ refreshKey, onRefresh }: HackathonManagerProps) {
  const [hackathons, setHackathons] = useState<PublishedHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Draft modal state
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null); // draftId being published

  // Status dropdown state
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);

  // ---------- fetch hackathons ----------

  const loadHackathons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/hackathons');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHackathons(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('加载黑客松列表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHackathons();
  }, [loadHackathons, refreshKey]);

  // ---------- fetch drafts ----------

  const loadDrafts = async () => {
    setDraftsLoading(true);
    try {
      const res = await fetch('/api/drafts');
      const data = await res.json();
      if (data.success) {
        setDrafts(data.drafts ?? []);
      }
    } catch (err) {
      console.error('Load drafts error:', err);
    } finally {
      setDraftsLoading(false);
    }
  };

  const handleOpenDraftModal = () => {
    setShowDraftModal(true);
    loadDrafts();
  };

  // ---------- publish from draft ----------

  const handlePublishDraft = async (draft: DraftItem) => {
    setPublishing(draft.draftId);
    try {
      const { startDate, endDate } = parseDateRange(draft.dateRange);

      const payload = {
        name: draft.name || '未命名黑客松',
        description: draft.summary || null,
        website: draft.website || null,
        startDate,
        endDate,
        mode: draft.mode || 'hybrid',
        location: draft.city || null,
        prizePool: draft.prizePool || null,
        organizer: draft.organizers?.[0]?.name || null,
        tracks: draft.tracks || [],
        sourceUrl: draft.source || null,
      };

      const res = await fetch('/api/admin/hackathons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      setShowDraftModal(false);
      await loadHackathons();
      onRefresh?.();
    } catch (err: any) {
      alert(`发布失败: ${err.message}`);
    } finally {
      setPublishing(null);
    }
  };

  // ---------- toggle featured ----------

  const handleToggleFeatured = async (h: PublishedHackathon) => {
    try {
      const res = await fetch(`/api/admin/hackathons/${h.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !h.isFeatured }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setHackathons((prev) => prev.map((item) => (item.id === h.id ? updated : item)));
    } catch {
      alert('更新精选状态失败');
    }
  };

  // ---------- change status ----------

  const handleChangeStatus = async (h: PublishedHackathon, newStatus: string) => {
    setStatusDropdownId(null);
    if (newStatus === h.status) return;
    try {
      const res = await fetch(`/api/admin/hackathons/${h.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setHackathons((prev) => prev.map((item) => (item.id === h.id ? updated : item)));
    } catch {
      alert('更新状态失败');
    }
  };

  // ---------- delete ----------

  const handleDelete = async (h: PublishedHackathon) => {
    if (!window.confirm(`确定要删除「${h.name}」吗？此操作不可撤销。`)) return;
    try {
      const res = await fetch(`/api/admin/hackathons/${h.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setHackathons((prev) => prev.filter((item) => item.id !== h.id));
      onRefresh?.();
    } catch {
      alert('删除失败');
    }
  };

  // ---------- close dropdown on outside click ----------

  useEffect(() => {
    if (!statusDropdownId) return;
    const handler = () => setStatusDropdownId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [statusDropdownId]);

  // ---------- render ----------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="text-cyan-400" size={20} />
          <h3 className="font-sora text-xl font-bold text-white">黑客松管理</h3>
          <span className="text-xs font-space-mono text-gray-500">
            共 {hackathons.length} 个
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenDraftModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-space-mono text-sm transition-colors"
          >
            <Plus size={14} />
            从草稿发布
          </button>
          <button
            onClick={loadHackathons}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-space-mono text-sm text-gray-400"
          >
            <RefreshCw size={14} />
            刷新
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300 font-space-mono">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-500" size={20} />
          <span className="ml-2 font-space-mono text-sm text-gray-400">加载中...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && hackathons.length === 0 && (
        <div className="text-center py-12">
          <p className="font-space-mono text-sm text-gray-400 mb-2">暂无已发布黑客松</p>
          <p className="font-space-mono text-xs text-gray-600">
            点击「从草稿发布」将草稿箱中的数据发布为正式黑客松
          </p>
        </div>
      )}

      {/* Hackathon list */}
      {!loading && hackathons.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_140px_100px_80px_60px_100px] gap-4 px-5 py-3 border-b border-white/10 text-xs font-space-mono text-gray-500 uppercase tracking-wide">
            <span>名称</span>
            <span>地点</span>
            <span>日期</span>
            <span>状态</span>
            <span>模式</span>
            <span className="text-center">精选</span>
            <span className="text-right">操作</span>
          </div>

          {/* Rows */}
          {hackathons.map((h) => {
            const statusCfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.upcoming;
            return (
              <div
                key={h.id}
                className="grid grid-cols-[1fr_120px_140px_100px_80px_60px_100px] gap-4 px-5 py-3.5 border-b border-white/5 hover:bg-white/[0.03] transition-colors items-center"
              >
                {/* Name */}
                <div className="min-w-0">
                  <p className="font-sora text-sm text-white truncate">{h.name}</p>
                  {h.organizer && (
                    <p className="text-[11px] text-gray-500 font-space-mono truncate">
                      {h.organizer}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin size={12} className="text-gray-600 shrink-0" />
                  <span className="text-xs text-gray-400 font-space-mono truncate">
                    {h.location || '—'}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar size={12} className="text-gray-600 shrink-0" />
                  <span className="text-xs text-gray-400 font-space-mono truncate">
                    {formatDateRange(h.startDate, h.endDate)}
                  </span>
                </div>

                {/* Status */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusDropdownId(statusDropdownId === h.id ? null : h.id);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-space-mono border transition-colors ${statusCfg.className} hover:brightness-110 cursor-pointer`}
                  >
                    {statusCfg.label}
                    <ChevronDown size={10} />
                  </button>

                  {statusDropdownId === h.id && (
                    <div
                      className="absolute z-50 top-full mt-1 left-0 bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[120px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => handleChangeStatus(h, key)}
                          className={`w-full text-left px-3 py-2 text-xs font-space-mono transition-colors hover:bg-white/10 ${
                            h.status === key ? 'text-white bg-white/5' : 'text-gray-400'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mode */}
                <div className="flex items-center gap-1.5">
                  <Monitor size={12} className="text-gray-600 shrink-0" />
                  <span className="text-[11px] text-gray-400 font-space-mono">
                    {MODE_LABELS[h.mode] || h.mode}
                  </span>
                </div>

                {/* Featured */}
                <div className="flex justify-center">
                  <button
                    onClick={() => handleToggleFeatured(h)}
                    className="p-1 rounded-md hover:bg-white/10 transition-colors"
                    title={h.isFeatured ? '取消精选' : '设为精选'}
                  >
                    <Star
                      size={16}
                      className={
                        h.isFeatured
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600 hover:text-gray-400'
                      }
                    />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  {h.website && (
                    <a
                      href={h.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-gray-500 hover:text-cyan-400"
                      title="访问官网"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(h)}
                    className="p-1.5 rounded-md hover:bg-red-500/20 transition-colors text-gray-500 hover:text-red-400"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Draft publish modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl mx-4 rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h4 className="font-sora text-lg font-bold text-white">从草稿发布</h4>
              <button
                onClick={() => setShowDraftModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-3">
              {draftsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-gray-500" size={18} />
                  <span className="ml-2 font-space-mono text-sm text-gray-400">加载草稿...</span>
                </div>
              )}

              {!draftsLoading && drafts.length === 0 && (
                <div className="text-center py-8">
                  <p className="font-space-mono text-sm text-gray-400">草稿箱为空</p>
                  <p className="font-space-mono text-xs text-gray-600 mt-1">
                    先使用「URL 爬取」或「文本解析」添加草稿
                  </p>
                </div>
              )}

              {!draftsLoading &&
                drafts.map((draft) => (
                  <div
                    key={draft.draftId}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-sora text-sm font-semibold text-white truncate">
                          {draft.name || '未命名'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 font-space-mono text-[11px] text-gray-500">
                          {draft.city && (
                            <span className="flex items-center gap-1">
                              <MapPin size={10} />
                              {draft.city}
                            </span>
                          )}
                          {draft.dateRange && (
                            <span className="flex items-center gap-1">
                              <Calendar size={10} />
                              {draft.dateRange}
                            </span>
                          )}
                        </div>
                        {draft.summary && (
                          <p className="mt-2 text-xs text-gray-400 font-space-mono line-clamp-2">
                            {draft.summary}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handlePublishDraft(draft)}
                        disabled={publishing === draft.draftId}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-space-mono transition-colors"
                      >
                        {publishing === draft.draftId ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            发布中
                          </>
                        ) : (
                          '发布'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowDraftModal(false)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-space-mono text-sm text-gray-400"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
