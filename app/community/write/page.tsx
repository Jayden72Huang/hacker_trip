'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  FileText, Edit3, Send, ChevronDown, ChevronUp, Save, Eye, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface MyArticle {
  article: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    type: string;
    content: string;
    excerpt: string | null;
    coverImage: string | null;
    tags: string[];
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  authorName: string | null;
  authorImage: string | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  invited: { label: '已邀请', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  draft: { label: '草稿', color: 'bg-gray-500/10 text-gray-300 border-gray-500/20' },
  in_review: { label: '审核中', color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' },
  published: { label: '已发布', color: 'bg-green-500/10 text-green-300 border-green-500/20' },
  rejected: { label: '已拒绝', color: 'bg-red-500/10 text-red-300 border-red-500/20' },
};

const typeLabels: Record<string, string> = {
  experience: '参赛经验',
  interview: '获奖访谈',
  guest_post: '嘉宾专栏',
};

export default function WritePage() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<MyArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);

  // Editor state
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editTags, setEditTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchArticles = () => {
    setLoading(true);
    fetch('/api/articles?mine=true')
      .then((r) => r.json())
      .then(({ data }) => setArticles(data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchArticles(); }, []);

  const startEditing = (a: MyArticle['article']) => {
    setEditing(a.id);
    setEditTitle(a.title);
    setEditSubtitle(a.subtitle || '');
    setEditContent(a.content);
    setEditExcerpt(a.excerpt || '');
    setEditTags((a.tags as string[])?.join(', ') || '');
    setShowPreview(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
      await fetch(`/api/articles/${editing}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          subtitle: editSubtitle || null,
          content: editContent,
          excerpt: editExcerpt || null,
          tags,
        }),
      });
      fetchArticles();
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!editing) return;
    // Save first
    await handleSave();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/articles/${editing}/submit`, {
        method: 'POST',
      });
      if (res.ok) {
        setEditing(null);
        fetchArticles();
      } else {
        const { error } = await res.json();
        alert(error || '提交失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (editing) {
    return (
      <div className="relative min-h-screen bg-[#05060a]">
        <div className="fixed inset-0 -z-10 opacity-[0.15]">
          <div className="absolute inset-0 grid-bg" />
        </div>
        <Navbar />

        <main className="relative pt-28 pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Editor header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setEditing(null)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={18} /> 返回文章列表
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white border border-white/10 transition-colors text-sm"
                >
                  <Eye size={14} /> {showPreview ? '编辑' : '预览'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white border border-white/10 transition-colors text-sm disabled:opacity-50"
                >
                  <Save size={14} /> {saving ? '保存中...' : '保存草稿'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !editTitle.trim() || !editContent.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all text-sm disabled:opacity-50"
                >
                  <Send size={14} /> {submitting ? '提交中...' : '提交审核'}
                </button>
              </div>
            </div>

            {/* Title & Meta */}
            <div className="mb-6 space-y-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="文章标题"
                className="w-full text-4xl font-bold bg-transparent text-white placeholder-gray-600 focus:outline-none border-b border-white/10 pb-4"
              />
              <input
                type="text"
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                placeholder="副标题（可选）"
                className="w-full text-lg bg-transparent text-gray-400 placeholder-gray-600 focus:outline-none"
              />
              <div className="flex gap-4">
                <input
                  type="text"
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                  placeholder="摘要（可选，用于列表页显示）"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
                />
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="标签（逗号分隔）"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            {/* Editor / Preview split */}
            <div className={`grid ${showPreview ? 'grid-cols-2 gap-6' : 'grid-cols-1'}`}>
              {/* Editor */}
              <div className={showPreview ? '' : ''}>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="在这里书写你的文章内容...&#10;&#10;支持 Markdown 格式"
                  className="w-full min-h-[600px] p-6 rounded-xl bg-white/[0.03] border border-white/10 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-y font-mono text-sm leading-relaxed"
                />
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="p-6 rounded-xl bg-white/[0.03] border border-white/10 overflow-y-auto max-h-[700px]">
                  <div className="text-xs text-gray-600 mb-4 uppercase tracking-wider">预览</div>
                  <h1 className="text-3xl font-bold text-white mb-2">{editTitle || '无标题'}</h1>
                  {editSubtitle && (
                    <p className="text-lg text-gray-400 mb-6">{editSubtitle}</p>
                  )}
                  <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-base">
                    {editContent || '暂无内容'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#05060a]">
      <div className="fixed inset-0 -z-10 opacity-[0.15]">
        <div className="absolute inset-0 grid-bg" />
      </div>
      <Navbar />

      <main className="relative pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white mb-3">我的文章</h1>
            <p className="text-gray-400">
              管理你的投稿内容，受邀后可以开始撰写文章
            </p>
          </div>

          {/* Article list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/10">
              <FileText size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg mb-2">暂无文章</p>
              <p className="text-gray-600 text-sm">等待管理员邀请你投稿</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map(({ article: a }) => {
                const canEdit = a.status === 'invited' || a.status === 'draft';
                const st = statusLabels[a.status] || { label: a.status, color: 'bg-gray-500/10 text-gray-300' };

                return (
                  <div
                    key={a.id}
                    className="rounded-xl bg-white/[0.03] border border-white/10 p-4 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-medium truncate">{a.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] border ${st.color}`}>
                          {st.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-500 text-[11px]">
                          {typeLabels[a.type] || a.type}
                        </span>
                      </div>
                      <div className="text-gray-500 text-sm">
                        更新于 {new Date(a.updatedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>

                    {canEdit ? (
                      <button
                        onClick={() => startEditing(a)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors text-sm"
                      >
                        <Edit3 size={14} /> 编辑
                      </button>
                    ) : a.status === 'published' ? (
                      <Link
                        href={`/community/articles/${a.slug}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors text-sm"
                      >
                        <Eye size={14} /> 查看
                      </Link>
                    ) : (
                      <span className="text-gray-600 text-sm">
                        {a.status === 'in_review' ? '等待审核' : ''}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
