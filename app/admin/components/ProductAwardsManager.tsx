'use client';

import { useMemo, useState } from 'react';
import { projects } from '@/data/projects';
import { hackathons } from '@/data/hackathons';
import { Trophy, Flame, CheckCircle2, Plus, X } from 'lucide-react';

type AwardForm = {
  projectId: string;
  title: string;
  tier: 'champion' | 'runner-up' | 'finalist' | 'special';
  prize?: string;
};

export function ProductAwardsManager() {
  const [selectedHackathon, setSelectedHackathon] = useState(hackathons[0]?.id ?? '');
  const [awardDraft, setAwardDraft] = useState<AwardForm>({
    projectId: '',
    title: '',
    tier: 'champion',
    prize: '',
  });
  const [localAwards, setLocalAwards] = useState<Record<string, AwardForm[]>>({});

  const filteredProjects = useMemo(
    () => projects.filter((p) => p.hackathonId === selectedHackathon),
    [selectedHackathon]
  );

  const currentAwards = useMemo(() => {
    const existing = filteredProjects
      .filter((p) => p.awards?.length)
      .flatMap((p) =>
        (p.awards || []).map((a) => ({ ...a, projectId: p.id, projectName: p.name }))
      );
    const pending = localAwards[selectedHackathon] || [];
    return [...existing, ...pending];
  }, [filteredProjects, localAwards, selectedHackathon]);

  const handleAddAward = () => {
    if (!awardDraft.projectId || !awardDraft.title) return;
    setLocalAwards((prev) => ({
      ...prev,
      [selectedHackathon]: [...(prev[selectedHackathon] || []), awardDraft],
    }));
    setAwardDraft({ projectId: '', title: '', tier: 'champion', prize: '' });
  };

  const removePending = (idx: number) => {
    setLocalAwards((prev) => ({
      ...prev,
      [selectedHackathon]: (prev[selectedHackathon] || []).filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="text-yellow-400" size={20} />
        <h3 className="font-sora text-xl font-bold text-white">作品榜单 & 奖项管理</h3>
        <span className="text-xs font-space-mono text-gray-500">仅示例：当前使用内置数据集</span>
      </div>

      <div className="glass rounded-2xl border border-white/5 p-4">
        <label className="block text-xs font-space-mono text-gray-500 mb-2">选择黑客松</label>
        <div className="flex flex-wrap gap-2">
          {hackathons.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHackathon(h.id)}
              className={`px-4 py-2 rounded-full text-sm font-space-mono transition-all ${
                selectedHackathon === h.id
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40'
                  : 'bg-white/5 text-gray-300 border border-white/10 hover:border-white/20'
              }`}
            >
              {h.shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={16} className="text-orange-400" />
            <p className="font-space-mono text-sm text-gray-300">当前作品</p>
          </div>
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {filteredProjects.map((p) => (
              <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-sora text-sm text-white">{p.name}</p>
                  <p className="text-[11px] text-gray-500 font-space-mono">{p.tagline}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.awards?.map((a) => (
                      <span key={a.title} className="px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-200 text-[10px] font-space-mono">
                        {a.title}
                      </span>
                    ))}
                    {p.tracks.slice(0, 2).map((t) => (
                      <span key={t} className="px-2 py-1 rounded-full bg-white/10 text-gray-200 text-[10px] font-space-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-space-mono">热度 {p.hotScore}</p>
                  <p className="text-xs text-gray-500 font-space-mono">{p.likes} 赞 · {p.views} 浏览</p>
                </div>
              </div>
            ))}
            {!filteredProjects.length && (
              <div className="text-sm text-gray-500 font-space-mono">暂无作品</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-4">
          <p className="font-sora text-base text-white flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-400" />
            标记获奖作品
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 font-space-mono mb-1">作品</label>
              <select
                value={awardDraft.projectId}
                onChange={(e) => setAwardDraft((p) => ({ ...p, projectId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-space-mono"
              >
                <option value="">选择作品</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 font-space-mono mb-1">奖项标题</label>
                <input
                  value={awardDraft.title}
                  onChange={(e) => setAwardDraft((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-space-mono"
                  placeholder="如 Overall Champion"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-space-mono mb-1">级别</label>
                <select
                  value={awardDraft.tier}
                  onChange={(e) => setAwardDraft((p) => ({ ...p, tier: e.target.value as AwardForm['tier'] }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-space-mono"
                >
                  <option value="champion">Champion</option>
                  <option value="runner-up">Runner-up</option>
                  <option value="finalist">Finalist</option>
                  <option value="special">Special</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-space-mono mb-1">奖金/备注</label>
              <input
                value={awardDraft.prize}
                onChange={(e) => setAwardDraft((p) => ({ ...p, prize: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-space-mono"
                placeholder="可选，如 $10,000"
              />
            </div>

            <button
              onClick={handleAddAward}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-space-mono text-sm transition-colors"
            >
              <Plus size={14} />
              添加到待发布列表
            </button>
          </div>

          <div className="border-t border-white/10 pt-3 space-y-2 max-h-[180px] overflow-y-auto">
            <p className="text-xs text-gray-500 font-space-mono">待发布奖项</p>
            {(localAwards[selectedHackathon] || []).map((a, idx) => {
              const proj = filteredProjects.find((p) => p.id === a.projectId);
              return (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-200 font-space-mono">
                  <span>{proj?.name || '未找到'} · {a.title} ({a.tier})</span>
                  <button onClick={() => removePending(idx)} className="text-gray-500 hover:text-red-400">
                    <X size={14}/>
                  </button>
                </div>
              );
            })}
            {!((localAwards[selectedHackathon] || []).length) && (
              <p className="text-xs text-gray-500 font-space-mono">暂无待发布</p>
            )}
          </div>
          <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-3 text-xs text-green-200 font-space-mono">
            提示：当前示例只在前端保存；接入 API 后可将待发布奖项提交到后端并写入 `projects.awards` 或独立 awards 表。
          </div>
        </div>
      </div>
    </div>
  );
}
