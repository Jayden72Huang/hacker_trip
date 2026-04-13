'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Clock, ExternalLink, Github, Globe, ChevronDown, ChevronUp,
} from 'lucide-react';

interface WorkItem {
  project: {
    id: string;
    name: string;
    tagline: string | null;
    description: string | null;
    hackathonName: string | null;
    externalHackathonUrl: string | null;
    repoUrl: string | null;
    demoUrl: string | null;
    techStack: string[];
    awards: { name: string }[];
    verificationStatus: string;
    aiConfidenceScore: number | null;
    aiReviewResult: Record<string, unknown> | null;
    createdAt: string;
  };
  authorName: string | null;
  authorImage: string | null;
}

type FilterStatus = 'pending' | 'approved' | 'rejected';

export function WorksReview() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchWorks = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/works?status=${status}`);
      const { data } = await res.json();
      setWorks(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorks(filter); }, [filter]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/works/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: reviewNotes }),
      });
      setReviewNotes('');
      setExpanded(null);
      fetchWorks(filter);
    } finally {
      setActionLoading(null);
    }
  };

  const scoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">作品审核</h2>
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === s
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {s === 'pending' ? '待审核' : s === 'approved' ? '已通过' : '已拒绝'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : works.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          暂无{filter === 'pending' ? '待审核' : filter === 'approved' ? '已通过' : '已拒绝'}的作品
        </div>
      ) : (
        <div className="space-y-3">
          {works.map(({ project: w, authorName, authorImage }) => (
            <div key={w.id} className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden">
              {/* Summary row */}
              <button
                onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                {authorImage && (
                  <img src={authorImage} alt="" className="w-8 h-8 rounded-full" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">{w.name}</span>
                    {w.hackathonName && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[11px] shrink-0">
                        {w.hackathonName}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500 text-sm">{authorName || '匿名'}</span>
                </div>
                {w.aiConfidenceScore != null && (
                  <span className={`text-sm font-mono ${scoreColor(w.aiConfidenceScore)}`}>
                    {w.aiConfidenceScore}分
                  </span>
                )}
                {expanded === w.id ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
              </button>

              {/* Expanded detail */}
              {expanded === w.id && (
                <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
                  {w.tagline && <p className="text-gray-400 text-sm">{w.tagline}</p>}
                  {w.description && (
                    <p className="text-gray-500 text-sm line-clamp-4">{w.description}</p>
                  )}

                  {/* Links */}
                  <div className="flex gap-3">
                    {w.repoUrl && (
                      <a href={w.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-cyan-400 hover:underline">
                        <Github size={14} /> GitHub
                      </a>
                    )}
                    {w.demoUrl && (
                      <a href={w.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-cyan-400 hover:underline">
                        <Globe size={14} /> Demo
                      </a>
                    )}
                    {w.externalHackathonUrl && (
                      <a href={w.externalHackathonUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-purple-400 hover:underline">
                        <ExternalLink size={14} /> 黑客松页面
                      </a>
                    )}
                  </div>

                  {/* Tech & awards */}
                  {(w.techStack as string[])?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(w.techStack as string[]).map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[11px]">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* AI review result */}
                  {w.aiReviewResult && (
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-gray-500 font-mono">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(w.aiReviewResult, null, 2)}</pre>
                    </div>
                  )}

                  {/* Action area */}
                  {filter === 'pending' && (
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
                        onClick={() => handleAction(w.id, 'approve')}
                        disabled={actionLoading === w.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50"
                      >
                        <CheckCircle size={14} /> 通过
                      </button>
                      <button
                        onClick={() => handleAction(w.id, 'reject')}
                        disabled={actionLoading === w.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
                      >
                        <XCircle size={14} /> 拒绝
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
