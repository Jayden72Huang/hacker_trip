'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ToolPageHero } from '@/components/ToolPageHero';
import { Sparkles, ExternalLink, Star, AlertTriangle, Clock, Loader2, ChevronDown } from 'lucide-react';

const TRACKS = ['AI', 'Web3', 'DeFi', 'SaaS', 'GameFi', 'Social', 'Other'] as const;

interface RepoInfo {
  url: string;
  stars: number;
  updatedAt: string;
}

interface TechItem {
  name: string;
  reason: string;
  repo: RepoInfo;
}

interface Feasibility {
  difficulty: number;
  estimatedHours: number;
  communitySupport: number;
  docQuality: number;
  hackathonFit: number;
}

interface Milestone {
  time: string;
  task: string;
}

interface ArsenalResult {
  techStack: {
    frontend: TechItem[];
    backend: TechItem[];
    ai: TechItem[];
    deploy: TechItem[];
  };
  feasibility: Feasibility;
  milestones: Milestone[];
  risks: string[];
  summary: string;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  frontend: { label: '前端', color: 'text-[#7c5dff]' },
  backend: { label: '后端', color: 'text-[#4de1ff]' },
  ai: { label: 'AI', color: 'text-[#c759ff]' },
  deploy: { label: '部署', color: 'text-emerald-400' },
};

const FEASIBILITY_LABELS: Record<string, string> = {
  difficulty: '技术难度',
  communitySupport: '社区支持',
  docQuality: '文档质量',
  hackathonFit: '黑客松适配',
};

function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return String(stars);
}

export default function ArsenalPage() {
  const [description, setDescription] = useState('');
  const [track, setTrack] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ArsenalResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (description.trim().length < 10) {
      setError('请输入至少 10 个字的项目描述');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/arsenal/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          track: track || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '请求失败，请稍后重试');
        return;
      }

      setResult(data);
    } catch {
      setError('网络错误，请检查连接后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05060a] text-white">
      <div className="fixed inset-0 -z-20 grid-bg opacity-40" aria-hidden />
      <Navbar />

      <ToolPageHero
        eyebrow="AI-Powered Tech Stack"
        title="AI 武器库"
        description="描述你的项目想法，AI 帮你配齐最强技术栈"
        backgroundImage="/images/tool-arsenal-bg.png"
      />

      {/* Input Section */}
      <section className="relative z-10 -mt-10 px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 md:p-8">
            <label className="block text-sm text-white/40 mb-2">项目描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述你的黑客松项目想法，比如：一个基于 AI 的去中心化社交平台..."
              rows={4}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#7c5dff]/50 focus:ring-1 focus:ring-[#7c5dff]/30 resize-none transition-colors"
            />

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <label className="block text-sm text-white/40 mb-2">赛道（可选）</label>
                <div className="relative">
                  <select
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                    className="w-full appearance-none bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7c5dff]/50 focus:ring-1 focus:ring-[#7c5dff]/30 transition-colors cursor-pointer"
                  >
                    <option value="" className="bg-[#0a0a0a]">选择赛道</option>
                    {TRACKS.map((t) => (
                      <option key={t} value={t} className="bg-[#0a0a0a]">
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSubmit}
                  disabled={loading || description.trim().length < 10}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#7c5dff] hover:bg-[#6b4de6] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      生成技术方案
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto text-center">
            <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#7c5dff] mx-auto mb-4" />
              <p className="text-white/50">正在搜索 GitHub 开源项目并分析技术方案...</p>
              <p className="text-white/30 text-sm mt-2">大约需要 10-20 秒</p>
            </div>
          </div>
        </section>
      )}

      {/* Results */}
      {result && !loading && (
        <section className="px-4 pb-20">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Tech Stack - 大框模块 */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#7c5dff] rounded-full" />
                推荐技术栈
              </h2>
              <p className="text-sm text-white/40 mb-6">基于项目需求，为你精选最适合 48h 黑客松的技术组合</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.entries(result.techStack) as [string, TechItem[]][]).map(
                  ([category, items]) => {
                    const meta = CATEGORY_LABELS[category];
                    if (!meta || items.length === 0) return null;

                    return (
                      <div
                        key={category}
                        className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4"
                      >
                        <h3 className={`text-sm font-semibold ${meta.color} mb-4 uppercase tracking-wider`}>
                          {meta.label}
                        </h3>
                        <div className="space-y-4">
                          {items.map((item, i) => (
                            <div key={i}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-white/90 text-sm">
                                  {item.name}
                                </span>
                                {item.repo?.stars > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-yellow-400/70">
                                    <Star className="w-3 h-3" />
                                    {formatStars(item.repo.stars)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white/40 mb-1.5 line-clamp-2">
                                {item.reason}
                              </p>
                              {item.repo?.url && (
                                <a
                                  href={item.repo.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-[#4de1ff]/60 hover:text-[#4de1ff] transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  GitHub
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Feasibility + Milestones Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Feasibility */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6">
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#4de1ff] rounded-full" />
                  可行性评估
                </h2>

                <div className="space-y-4">
                  {(
                    Object.entries(FEASIBILITY_LABELS) as [
                      keyof typeof FEASIBILITY_LABELS,
                      string,
                    ][]
                  ).map(([key, label]) => {
                    const value =
                      result.feasibility[key as keyof Feasibility] ?? 0;
                    const numValue = typeof value === 'number' ? value : 0;
                    const barColor =
                      key === 'difficulty'
                        ? numValue > 7
                          ? 'bg-red-400'
                          : numValue > 4
                            ? 'bg-yellow-400'
                            : 'bg-emerald-400'
                        : 'bg-[#7c5dff]';

                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-white/60">{label}</span>
                          <span className="text-white/80 font-medium">
                            {numValue}/10
                          </span>
                        </div>
                        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor} transition-all duration-700`}
                            style={{ width: `${numValue * 10}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Clock className="w-4 h-4" />
                    预计核心功能开发时间：
                    <span className="text-white/80 font-medium">
                      {result.feasibility.estimatedHours}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6">
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#c759ff] rounded-full" />
                  48h 里程碑
                </h2>
                <div className="space-y-0">
                  {result.milestones.map((milestone, i) => (
                    <div key={i} className="flex gap-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#c759ff] mt-1.5 shrink-0" />
                        {i < result.milestones.length - 1 && (
                          <div className="w-px flex-1 bg-white/10 my-1" />
                        )}
                      </div>
                      <div className="pb-5">
                        <span className="text-xs font-mono text-[#c759ff]/70 block mb-1">
                          {milestone.time}
                        </span>
                        <p className="text-sm text-white/70">{milestone.task}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risks */}
            {result.risks.length > 0 && (
              <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-yellow-400 rounded-full" />
                  风险提示
                </h2>
                <ul className="space-y-2">
                  {result.risks.map((risk, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-white/60"
                    >
                      <AlertTriangle className="w-4 h-4 text-yellow-400/60 shrink-0 mt-0.5" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary */}
            {result.summary && (
              <div className="rounded-2xl bg-gradient-to-r from-[#7c5dff]/10 to-[#4de1ff]/10 border border-white/10 p-6">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7c5dff]" />
                  总结
                </h2>
                <p className="text-sm text-white/60 leading-relaxed">
                  {result.summary}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
