'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  ListPlus,
  Zap,
} from 'lucide-react';

interface URLScraperProps {
  onSuccess?: () => void;
}

type ScrapeTarget = {
  id: string;
  url: string;
  name: string;
  status: 'pending' | 'scraping' | 'success' | 'error';
  error?: string;
  result?: any;
};

type SavedSite = {
  id: string;
  name: string;
  url: string;
  platform: string;
};

const defaultSites: SavedSite[] = [
  { id: '1', name: 'DoraHacks 中国', url: 'https://dorahacks.io/zh/hackathon', platform: 'DoraHacks' },
  { id: '2', name: 'DoraHacks Global', url: 'https://dorahacks.io/hackathon', platform: 'DoraHacks' },
  { id: '3', name: '牛客竞赛', url: 'https://ac.nowcoder.com/acm/contest/vip-index', platform: '牛客网' },
  { id: '4', name: '活动行科技', url: 'https://www.huodongxing.com/eventlist?tag=%E7%A7%91%E6%8A%80', platform: '活动行' },
];

const platformOptions = ['DoraHacks', '牛客网', '活动行', 'Devpost', 'MLH', '其他'];

export function URLScraper({ onSuccess }: URLScraperProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // 网站列表管理
  const [savedSites, setSavedSites] = useState<SavedSite[]>([]);
  const [showSiteManager, setShowSiteManager] = useState(false);
  const [newSite, setNewSite] = useState({ name: '', url: '', platform: 'DoraHacks' });

  // 批量爬取
  const [batchMode, setBatchMode] = useState(false);
  const [batchTargets, setBatchTargets] = useState<ScrapeTarget[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);

  // 加载保存的网站列表
  useEffect(() => {
    const saved = localStorage.getItem('scraper_sites');
    if (saved) {
      try {
        setSavedSites(JSON.parse(saved));
      } catch {
        setSavedSites(defaultSites);
      }
    } else {
      setSavedSites(defaultSites);
    }
  }, []);

  // 保存网站列表
  const saveSites = (sites: SavedSite[]) => {
    setSavedSites(sites);
    localStorage.setItem('scraper_sites', JSON.stringify(sites));
  };

  const addSite = () => {
    if (!newSite.name || !newSite.url) return;
    const site: SavedSite = {
      id: Date.now().toString(),
      ...newSite,
    };
    saveSites([...savedSites, site]);
    setNewSite({ name: '', url: '', platform: 'DoraHacks' });
  };

  const removeSite = (id: string) => {
    saveSites(savedSites.filter((s) => s.id !== id));
  };

  // 单个 URL 爬取
  const handleScrape = async () => {
    if (!url.trim()) {
      setError('请输入 URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const scrapeData = await scrapeRes.json();

      if (!scrapeRes.ok || !scrapeData.success) {
        throw new Error(scrapeData.error || '爬取失败');
      }

      const draftRes = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: scrapeData.data,
          source: url,
        }),
      });

      const draftData = await draftRes.json();

      if (!draftRes.ok || !draftData.success) {
        throw new Error('保存草稿失败');
      }

      setResult({
        ...scrapeData,
        draft: draftData.draft,
      });

      setUrl('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 添加到批量队列
  const addToBatch = (site: SavedSite) => {
    if (batchTargets.some((t) => t.url === site.url)) return;
    setBatchTargets([
      ...batchTargets,
      {
        id: site.id,
        url: site.url,
        name: site.name,
        status: 'pending',
      },
    ]);
  };

  const addAllToBatch = () => {
    const newTargets = savedSites
      .filter((site) => !batchTargets.some((t) => t.url === site.url))
      .map((site) => ({
        id: site.id,
        url: site.url,
        name: site.name,
        status: 'pending' as const,
      }));
    setBatchTargets([...batchTargets, ...newTargets]);
  };

  const removeFromBatch = (id: string) => {
    setBatchTargets(batchTargets.filter((t) => t.id !== id));
  };

  const clearBatch = () => {
    setBatchTargets([]);
  };

  // 批量爬取
  const runBatch = async () => {
    if (batchTargets.length === 0) return;

    setBatchRunning(true);
    const updatedTargets = [...batchTargets];

    for (let i = 0; i < updatedTargets.length; i++) {
      const target = updatedTargets[i];
      if (target.status !== 'pending') continue;

      // 更新状态为爬取中
      updatedTargets[i] = { ...target, status: 'scraping' };
      setBatchTargets([...updatedTargets]);

      try {
        const scrapeRes = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: target.url }),
        });

        const scrapeData = await scrapeRes.json();

        if (!scrapeRes.ok || !scrapeData.success) {
          throw new Error(scrapeData.error || '爬取失败');
        }

        // 保存到草稿
        await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: scrapeData.data,
            source: target.url,
          }),
        });

        updatedTargets[i] = { ...target, status: 'success', result: scrapeData.data };
      } catch (err) {
        updatedTargets[i] = {
          ...target,
          status: 'error',
          error: err instanceof Error ? err.message : '未知错误',
        };
      }

      setBatchTargets([...updatedTargets]);

      // 延迟避免请求过快
      if (i < updatedTargets.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setBatchRunning(false);
    onSuccess?.();
  };

  const getStatusIcon = (status: ScrapeTarget['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} className="text-gray-500" />;
      case 'scraping':
        return <Loader2 size={14} className="text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircle2 size={14} className="text-green-400" />;
      case 'error':
        return <XCircle size={14} className="text-red-400" />;
    }
  };

  const pendingCount = batchTargets.filter((t) => t.status === 'pending').length;
  const successCount = batchTargets.filter((t) => t.status === 'success').length;
  const errorCount = batchTargets.filter((t) => t.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sora text-xl font-bold text-white mb-1">URL 爬取</h2>
          <p className="font-space-mono text-sm text-gray-400">
            支持 DoraHacks、活动行、牛客网等平台
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setBatchMode(!batchMode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              batchMode
                ? 'bg-indigo-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Zap size={16} />
            批量模式
          </button>
        </div>
      </div>

      {/* 单个爬取模式 */}
      {!batchMode && (
        <>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
              placeholder="https://example.com/hackathon"
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
              disabled={loading}
            />
            <button
              onClick={handleScrape}
              disabled={loading || !url.trim()}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all font-space-mono text-sm font-medium text-white"
            >
              {loading ? '爬取中...' : '开始爬取'}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
              <p className="font-space-mono text-sm text-red-400 font-medium">
                {error}
              </p>
              {error.includes('403') && (
                <div className="text-xs text-gray-400 space-y-1">
                  <p>可能的原因：</p>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-500">
                    <li>网站有反爬虫机制，限制了访问</li>
                    <li>需要登录或特殊权限才能访问</li>
                    <li>请求频率过高被暂时封禁</li>
                  </ul>
                  <p className="mt-2">建议：稍后重试，或使用"文本解析"功能手动粘贴内容</p>
                </div>
              )}
              {error.includes('超时') && (
                <p className="text-xs text-gray-500">
                  建议：检查网络连接，或稍后重试
                </p>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="font-space-mono text-sm text-green-400">
                  爬取成功！已保存到草稿箱
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="font-sora text-lg font-bold text-white mb-3">
                  {result.data.name || '未命名'}
                </h3>
                <div className="grid grid-cols-2 gap-3 font-space-mono text-sm">
                  <div>
                    <span className="text-gray-500">时间: </span>
                    <span className="text-gray-300">{result.data.dateRange || '未知'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">城市: </span>
                    <span className="text-gray-300">{result.data.city || '未知'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 批量爬取模式 */}
      {batchMode && (
        <div className="space-y-6">
          {/* 网站列表管理 */}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setShowSiteManager(!showSiteManager)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/[0.07] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-indigo-400" />
                <span className="text-sm font-medium text-white">黑客松网站列表</span>
                <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300">
                  {savedSites.length} 个网站
                </span>
              </div>
              {showSiteManager ? (
                <ChevronUp size={16} className="text-gray-500" />
              ) : (
                <ChevronDown size={16} className="text-gray-500" />
              )}
            </button>

            {showSiteManager && (
              <div className="p-4 border-t border-white/10 space-y-4">
                {/* 添加新网站 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSite.name}
                    onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                    placeholder="网站名称"
                    className="w-32 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50"
                  />
                  <input
                    type="url"
                    value={newSite.url}
                    onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50"
                  />
                  <select
                    value={newSite.platform}
                    onChange={(e) => setNewSite({ ...newSite, platform: e.target.value })}
                    className="w-28 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                  >
                    {platformOptions.map((p) => (
                      <option key={p} value={p} className="bg-gray-900">
                        {p}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addSite}
                    disabled={!newSite.name || !newSite.url}
                    className="px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* 网站列表 */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {savedSites.map((site) => (
                    <div
                      key={site.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium">{site.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-gray-500">
                              {site.platform}
                            </span>
                          </div>
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-gray-500 hover:text-indigo-400 truncate block"
                          >
                            {site.url}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addToBatch(site)}
                          disabled={batchTargets.some((t) => t.url === site.url)}
                          className="px-2 py-1 rounded text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ListPlus size={14} />
                        </button>
                        <button
                          onClick={() => removeSite(site.id)}
                          className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addAllToBatch}
                  className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  全部添加到队列
                </button>
              </div>
            )}
          </div>

          {/* 爬取队列 */}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">爬取队列</span>
                {batchTargets.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400">
                      {pendingCount} 待处理
                    </span>
                    {successCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                        {successCount} 成功
                      </span>
                    )}
                    {errorCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                        {errorCount} 失败
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {batchTargets.length > 0 && (
                  <button
                    onClick={clearBatch}
                    disabled={batchRunning}
                    className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
                  >
                    清空
                  </button>
                )}
                <button
                  onClick={runBatch}
                  disabled={batchRunning || pendingCount === 0}
                  className="px-4 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  {batchRunning ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      爬取中...
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      开始批量爬取
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {batchTargets.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  从上方网站列表添加目标网站
                </div>
              ) : (
                batchTargets.map((target) => (
                  <div
                    key={target.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(target.status)}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white">{target.name}</span>
                        {target.status === 'error' && target.error && (
                          <p className="text-xs text-red-400 mt-0.5">{target.error}</p>
                        )}
                        {target.status === 'success' && target.result && (
                          <p className="text-xs text-green-400 mt-0.5">
                            已保存: {target.result.name || '未命名'}
                          </p>
                        )}
                      </div>
                    </div>
                    {target.status === 'pending' && !batchRunning && (
                      <button
                        onClick={() => removeFromBatch(target.id)}
                        className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 支持的平台 */}
      {!batchMode && (
        <div className="pt-6 border-t border-white/10">
          <h3 className="font-space-mono text-sm font-medium text-gray-400 mb-3">
            支持的平台:
          </h3>
          <div className="flex flex-wrap gap-2">
            {platformOptions.slice(0, -1).map((platform) => (
              <span
                key={platform}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
