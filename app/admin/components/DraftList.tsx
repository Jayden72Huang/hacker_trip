'use client';

import { useEffect, useState } from 'react';
import { HackathonEditor } from './HackathonEditor';
import type { DraftHackathon } from '@/scrapers/core/types';

export function DraftList() {
  const [drafts, setDrafts] = useState<DraftHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<DraftHackathon | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const res = await fetch('/api/drafts');
      const data = await res.json();
      if (data.success) {
        setDrafts(data.drafts);
      }
    } catch (error) {
      console.error('Load drafts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!confirm('确定要删除这条草稿吗？')) return;

    try {
      const res = await fetch(`/api/drafts?draftId=${draftId}`, {
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
      const res = await fetch('/api/drafts', {
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
      }
    } catch (error) {
      console.error('Update draft error:', error);
      alert('更新失败');
    }
  };

  const handlePublish = async (draft: DraftHackathon) => {
    if (!confirm(`确定要发布「${draft.name}」吗？\n\n发布后将添加到正式数据中。`)) {
      return;
    }

    setPublishing(true);

    try {
      // TODO: 实现发布到 hackathons.ts 的逻辑
      // 这里需要修改 data/hackathons.ts 文件
      alert('发布功能需要手动实现：\n\n1. 将草稿数据复制到 data/hackathons.ts\n2. 删除该草稿\n\n或者可以连接数据库来实现自动发布。');

      // 暂时只是标记为已发布
      await handleUpdate(draft.draftId, {
        ...draft,
        status: 'approved'
      });

    } catch (error) {
      console.error('Publish error:', error);
      alert('发布失败');
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
                  {draft.confidence && (
                    <span className={`px-2 py-1 rounded-full font-space-mono text-xs ${
                      draft.confidence > 0.7 ? 'bg-green-500/20 text-green-400' :
                      draft.confidence > 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {(draft.confidence * 100).toFixed(0)}%
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
