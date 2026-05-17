'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ToolPageHero } from '@/components/ToolPageHero';

interface GeneratedContent {
  productHunt: {
    tagline: string;
    description: string;
    firstComment: string;
  };
  tweets: string[];
  blog: string;
  pitchOneLiner: string;
}

type TabKey = 'producthunt' | 'twitter' | 'blog' | 'poster';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-2 py-1 text-xs rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
    >
      {copied ? '已复制' : '复制'}
    </button>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdown(md: string) {
  // Simple safe markdown to HTML.
  let html = escapeHtml(md)
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[#4de1ff] text-sm">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-300 mb-1">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-gray-300 mb-4 leading-relaxed">')
    .replace(/\n/g, '<br />');

  html = '<p class="text-gray-300 mb-4 leading-relaxed">' + html + '</p>';
  return html;
}

export default function LaunchPage() {
  const [projectName, setProjectName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [posterData, setPosterData] = useState<{ imageData: string; mimeType: string } | null>(null);

  const [loadingText, setLoadingText] = useState(false);
  const [loadingPoster, setLoadingPoster] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [errorPoster, setErrorPoster] = useState('');

  const [activeTab, setActiveTab] = useState<TabKey>('producthunt');

  const handleGenerateText = async () => {
    if (!projectName.trim() || !description.trim()) return;
    setLoadingText(true);
    setErrorText('');
    try {
      const res = await fetch('/api/launch/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectName.trim(),
          description: description.trim(),
          githubUrl: githubUrl.trim() || undefined,
          targetAudience: targetAudience.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }
      const data = await res.json();
      setContent(data);
      setActiveTab('producthunt');
    } catch (e) {
      setErrorText(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoadingText(false);
    }
  };

  const handleGeneratePoster = async () => {
    if (!projectName.trim()) return;
    setLoadingPoster(true);
    setErrorPoster('');
    try {
      const res = await fetch('/api/launch/poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectName.trim(),
          tagline: content?.productHunt?.tagline || '',
          description: description.trim(),
          targetAudience: targetAudience.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Poster generation failed');
      }
      const data = await res.json();
      setPosterData(data);
      setActiveTab('poster');
    } catch (e) {
      setErrorPoster(e instanceof Error ? e.message : 'Poster generation failed');
    } finally {
      setLoadingPoster(false);
    }
  };

  const handleDownloadPoster = () => {
    if (!posterData) return;
    const link = document.createElement('a');
    link.href = `data:${posterData.mimeType};base64,${posterData.imageData}`;
    link.download = `${projectName || 'poster'}-pitch.png`;
    link.click();
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'producthunt', label: 'Product Hunt' },
    { key: 'twitter', label: 'Twitter/X' },
    { key: 'blog', label: 'Blog' },
    { key: 'poster', label: 'Pitch 海报' },
  ];

  const hasResults = content || posterData;

  return (
    <div className="relative min-h-screen bg-[#05060a] text-white">
      <div className="fixed inset-0 -z-20 grid-bg opacity-40" aria-hidden />
      <Navbar />

      <ToolPageHero
        eyebrow="AI Launch Toolkit"
        title="赛后加速器"
        description="AI 一键生成推广素材，让你的项目被全世界看见"
        backgroundImage="/images/tool-launch-bg.png"
      />

      <main className="relative z-10 max-w-4xl mx-auto px-4 pb-20 -mt-10">
        {/* Input Form */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8 mb-10">
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">项目名称 *</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome Project"
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7c5dff]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">GitHub URL (可选)</label>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7c5dff]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">项目描述 *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述你的项目做了什么、解决了什么问题..."
                rows={4}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7c5dff]/50 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">目标受众 (可选)</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="开发者、创业者、投资人..."
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7c5dff]/50 transition-colors"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleGenerateText}
                disabled={loadingText || !projectName.trim() || !description.trim()}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#7c5dff] to-[#c759ff] hover:opacity-90 text-white"
              >
                {loadingText ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    生成中...
                  </span>
                ) : '生成推广文案'}
              </button>
              <button
                onClick={handleGeneratePoster}
                disabled={loadingPoster || !projectName.trim()}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-[#7c5dff]/50 text-[#7c5dff] hover:bg-[#7c5dff]/10"
              >
                {loadingPoster ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    生成中...
                  </span>
                ) : '生成 Pitch 海报'}
              </button>
            </div>

            {errorText && <p className="text-red-400 text-sm">{errorText}</p>}
            {errorPoster && <p className="text-red-400 text-sm">{errorPoster}</p>}
          </div>
        </div>

        {/* Results */}
        {hasResults && (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/10 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'border-b-2 border-[#7c5dff] text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 md:p-8">
              {/* Product Hunt */}
              {activeTab === 'producthunt' && content && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm text-gray-400 uppercase tracking-wide">Tagline</h3>
                      <CopyButton text={content.productHunt.tagline} />
                    </div>
                    <p className="text-white text-lg">{content.productHunt.tagline}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm text-gray-400 uppercase tracking-wide">Description</h3>
                      <CopyButton text={content.productHunt.description} />
                    </div>
                    <p className="text-gray-300">{content.productHunt.description}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm text-gray-400 uppercase tracking-wide">First Comment</h3>
                      <CopyButton text={content.productHunt.firstComment} />
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">{content.productHunt.firstComment}</p>
                  </div>
                  {content.pitchOneLiner && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm text-gray-400 uppercase tracking-wide">Pitch One-Liner</h3>
                        <CopyButton text={content.pitchOneLiner} />
                      </div>
                      <p className="text-[#4de1ff] font-medium">{content.pitchOneLiner}</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'producthunt' && !content && (
                <p className="text-gray-500 text-center py-8">点击「生成推广文案」获取 Product Hunt 文案</p>
              )}

              {/* Twitter */}
              {activeTab === 'twitter' && content && (
                <div className="space-y-4">
                  {content.tweets.map((tweet, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-gray-300 flex-1 whitespace-pre-wrap">{tweet}</p>
                        <CopyButton text={tweet} />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{tweet.length}/280</p>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'twitter' && !content && (
                <p className="text-gray-500 text-center py-8">点击「生成推广文案」获取 Twitter 推文</p>
              )}

              {/* Blog */}
              {activeTab === 'blog' && content && (
                <div>
                  <div className="flex justify-end mb-4">
                    <CopyButton text={content.blog} />
                  </div>
                  <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(content.blog) }}
                  />
                </div>
              )}
              {activeTab === 'blog' && !content && (
                <p className="text-gray-500 text-center py-8">点击「生成推广文案」获取博客文章</p>
              )}

              {/* Poster */}
              {activeTab === 'poster' && posterData && (
                <div className="text-center space-y-4">
                  <img
                    src={`data:${posterData.mimeType};base64,${posterData.imageData}`}
                    alt={`${projectName} pitch poster`}
                    className="max-w-full rounded-lg border border-white/10 mx-auto"
                  />
                  <button
                    onClick={handleDownloadPoster}
                    className="px-5 py-2.5 rounded-lg font-medium bg-gradient-to-r from-[#7c5dff] to-[#4de1ff] text-white hover:opacity-90 transition-opacity"
                  >
                    下载海报
                  </button>
                </div>
              )}
              {activeTab === 'poster' && !posterData && (
                <p className="text-gray-500 text-center py-8">点击「生成 Pitch 海报」获取宣传海报</p>
              )}
            </div>
          </div>
        )}
        {/* Showcase Cases */}
        <section className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              他们用 AI 推广，效果拉满
            </h2>
            <p className="text-gray-500 text-sm">
              以下案例均由本工具生成推广素材后实际投放
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                name: 'HookFlow',
                tagline: 'AI 电商视频生成，3 分钟产出爆款带货短视频',
                pitch: '粘贴商品链接 → AI 生成爆款开头 → 一键出片',
                hackathon: 'hookflow.xyz',
                channels: ['Product Hunt', 'Twitter/X', 'Blog'],
                stats: { upvotes: 467, impressions: '52K', stars: 1800 },
                accent: '#7c5dff',
                gradient: 'from-[#7c5dff] via-[#6a4dff] to-[#4d3bcc]',
                cardBg: 'from-[#7c5dff]/20 to-[#7c5dff]/5',
                border: 'border-[#7c5dff]/20',
                emoji: '🎬',
              },
              {
                name: 'SnapAudit',
                tagline: '30 秒智能合约安全扫描',
                pitch: '上传合约地址 → 自动检测漏洞 → 生成审计报告',
                hackathon: 'Solana Hyperdrive',
                channels: ['Twitter/X', 'Pitch 海报', 'Blog'],
                stats: { upvotes: 189, impressions: '15K', stars: 860 },
                accent: '#c759ff',
                gradient: 'from-[#c759ff] via-[#a847dd] to-[#8636bb]',
                cardBg: 'from-[#c759ff]/20 to-[#c759ff]/5',
                border: 'border-[#c759ff]/20',
                emoji: '🛡️',
              },
              {
                name: 'DataForge',
                tagline: '零代码构建链上数据仪表盘',
                pitch: '选择链 → 拖拽指标 → 实时可视化',
                hackathon: 'HackaTUM 2024',
                channels: ['Product Hunt', 'Twitter/X'],
                stats: { upvotes: 275, impressions: '22K', stars: 950 },
                accent: '#4de1ff',
                gradient: 'from-[#4de1ff] via-[#3bbfdd] to-[#2a9dbb]',
                cardBg: 'from-[#4de1ff]/20 to-[#4de1ff]/5',
                border: 'border-[#4de1ff]/20',
                emoji: '📊',
              },
              {
                name: 'VoiceDAO',
                tagline: '语音投票的去中心化治理方案',
                pitch: '语音验证身份 → 匿名投票 → 链上计票',
                hackathon: 'ETHDenver 2025',
                channels: ['Blog', 'Pitch 海报', 'Product Hunt'],
                stats: { upvotes: 410, impressions: '35K', stars: 1500 },
                accent: '#7c5dff',
                gradient: 'from-[#7c5dff] via-[#a855f7] to-[#c759ff]',
                cardBg: 'from-[#7c5dff]/20 to-[#c759ff]/5',
                border: 'border-[#7c5dff]/15',
                emoji: '🗳️',
              },
            ].map((c) => (
              <div
                key={c.name}
                className={`bg-gradient-to-br ${c.cardBg} border ${c.border} rounded-2xl overflow-hidden transition-transform hover:scale-[1.01]`}
              >
                {/* Mini Pitch Poster */}
                <div className={`relative bg-gradient-to-br ${c.gradient} px-5 py-6 overflow-hidden`}>
                  {/* decorative circles */}
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/[0.08] blur-sm" />
                  <div className="pointer-events-none absolute -left-4 bottom-0 h-16 w-16 rounded-full bg-black/[0.12] blur-sm" />

                  <div className="relative">
                    <span className="text-2xl">{c.emoji}</span>
                    <h3 className="mt-2 text-xl font-bold text-white tracking-tight">{c.name}</h3>
                    <p className="mt-1 text-sm font-medium text-white/90">{c.tagline}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-white/20" />
                      <span className="text-[10px] font-medium uppercase tracking-widest text-white/50">How it works</span>
                      <div className="h-px flex-1 bg-white/20" />
                    </div>
                    <p className="mt-2 text-xs text-white/70 leading-relaxed">{c.pitch}</p>
                  </div>

                  <div className="relative mt-4 grid grid-cols-3 gap-2">
                    {[
                      { val: c.stats.upvotes.toString(), label: 'Upvotes' },
                      { val: c.stats.impressions, label: '曝光' },
                      { val: c.stats.stars.toLocaleString(), label: 'Stars' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg bg-black/20 px-2 py-1.5 text-center backdrop-blur-sm">
                        <p className="text-sm font-bold text-white">{s.val}</p>
                        <p className="text-[9px] text-white/50">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Info */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-gray-500 border border-white/8 rounded-full px-2.5 py-1">
                      {c.hackathon}
                    </span>
                    <div className="flex gap-1.5">
                      {c.channels.map((ch) => (
                        <span
                          key={ch}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400 border border-white/[0.06]"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
