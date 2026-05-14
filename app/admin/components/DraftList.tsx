'use client';

import { useCallback, useEffect, useState } from 'react';
import { HackathonEditor } from './HackathonEditor';
import type { DraftHackathon } from '@/scrapers/core/types';

interface DraftListProps {
  apiBase?: string;
}

export function DraftList({ apiBase }: DraftListProps) {
  const base = apiBase ?? '/api';
  const [drafts, setDrafts] = useState<DraftHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<DraftHackathon | null>(null);
  const [publishing, setPublishing] = useState(false);

  const loadDrafts = useCallback(async () => {
    try {
      const res = await fetch(`${base}/drafts`);
      const data = await res.json();
      if (data.success) {
        setDrafts(data.drafts);
      }
    } catch (error) {
      console.error('Load drafts error:', error);
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const handleDelete = async (draftId: string) => {
    if (!confirm('确定要删除这条草稿吗？')) return;

    try {
      const res = await fetch(`${base}/drafts?draftId=${draftId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.draftId !== draftId));
        if (selectedDraft?.draftId === draftId) {
          setSelectedDraft(null);
        }
      }
    } catch (error) {
      console.error('Delete draft error:', error);
      alert('删除失败');
    }
  };

  const handleUpdate = async (draftId: string, data: any) => {
    try {
      const res = await fetch(`${base}/drafts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, data })
      });

      const result = await res.json();

      if (result.success) {
        setDrafts(prev => prev.map(d =>
          d.draftId === draftId ? result.draft : d
        ));
        setSelectedDraft(result.draft);
        alert('更新成功！');
      } else {
        alert(`更新失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Update draft error:', error);
      alert('更新失败');
    }
  };

  const handlePublish = async (draft: DraftHackathon) => {
    const draftAny = draft as unknown as Record<string, unknown>;
    const isUpdate = draftAny.status === 'published';
    const confirmMsg = isUpdate
      ? '确定要更新到正式列表吗?'
      : '确定要发布到正式列表吗?';
    if (!confirm(confirmMsg)) return;

    setPublishing(true);

    try {
      const res = await fetch(`${base}/drafts/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.draftId }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(`${isUpdate ? '更新' : '发布'}失败: ${result.error}`);
        return;
      }

      const action = result.action || '发布';
      alert(action + '成功!');
      loadDrafts();

    } catch (error) {
      console.error('Publish error:', error);
      alert('发布失败，请稍后重试');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="font-space-mono text-sm text-gray-400">加载中...</p>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-space-mono text-sm text-gray-400 mb-4">
          暂无草稿
        </p>
        <p className="font-space-mono text-xs text-gray-600">
          使用「URL 爬取」或「文本解析」来添加新的黑客松信息
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-sora text-xl font-bold text-white">
          草稿箱 ({drafts.length})
        </h2>
        <button
          onClick={loadDrafts}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-space-mono text-sm text-gray-400"
        >
          🔄 刷新
        </button>
      </div>

      {selectedDraft ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedDraft(null)}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-space-mono text-sm text-gray-400"
          >
            ← 返回列表
          </button>
          <HackathonEditor
            draft={selectedDraft}
            onSave={(data) => handleUpdate(selectedDraft.draftId, data)}
            onPublish={() => handlePublish(selectedDraft)}
            onDelete={() => handleDelete(selectedDraft.draftId)}
            publishing={publishing}
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => (
            <div
              key={draft.draftId}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-colors cursor-pointer"
              onClick={() => setSelectedDraft(draft)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-sora text-lg font-bold text-white mb-1">
                    {draft.name || '未命名'}
                  </h3>
                  <p className="font-space-mono text-xs text-gray-500">
                    来源: {draft.source === 'manual' ? '手动添加' : draft.source}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {draft.confidence != null && (
                    <span className={`px-2 py-1 rounded-full font-space-mono text-xs ${
                      draft.confidence > 70 ? 'bg-green-500/20 text-green-400' :
                      draft.confidence > 40 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {draft.confidence}%
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(draft.draftId);
                    }}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    <span className="text-red-400 text-sm">🗑️</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 font-space-mono text-xs">
                <div>
                  <span className="text-gray-500">时间: </span>
                  <span className="text-gray-300">{draft.dateRange || '未知'}</span>
                </div>
                <div>
                  <span className="text-gray-500">城市: </span>
                  <span className="text-gray-300">{draft.city || '未知'}</span>
                </div>
                <div>
                  <span className="text-gray-500">奖金: </span>
                  <span className="text-gray-300">{draft.prizePool || '未知'}</span>
                </div>
              </div>

              {draft.summary && (
                <p className="mt-3 font-space-mono text-xs text-gray-400 line-clamp-2">
                  {draft.summary}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="font-space-mono text-xs text-gray-500">
                  创建时间: {new Date(draft.createdAt || '').toLocaleDateString('zh-CN')}
                </span>
                <span className="font-space-mono text-xs text-indigo-400">
                  点击编辑 →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
