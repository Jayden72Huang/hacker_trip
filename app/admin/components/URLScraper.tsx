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
  Edit2,
  AlertCircle,
  RefreshCw,
  Timer,
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

// 定时爬取目标（DB-backed）
type CronTarget = {
  id: string;
  name: string;
  url: string;
  platform: string;
  enabled: boolean;
  schedule: string;
  lastScrapedAt: string | null;
  lastStatus: string | null;
  successCount: number;
  errorCount: number;
  createdAt: string;
};

type ScraperMode = 'single' | 'batch' | 'cron';

const defaultSites: SavedSite[] = [
  { id: '1', name: 'DoraHacks 中国', url: 'https://dorahacks.io/zh/hackathon', platform: 'DoraHacks' },
  { id: '2', name: 'DoraHacks Global', url: 'https://dorahacks.io/hackathon', platform: 'DoraHacks' },
  { id: '3', name: '牛客竞赛', url: 'https://ac.nowcoder.com/acm/contest/vip-index', platform: '牛客网' },
  { id: '4', name: '活动行科技', url: 'https://www.huodongxing.com/eventlist?tag=%E7%A7%91%E6%8A%80', platform: '活动行' },
];

const platformOptions = ['DoraHacks', '牛客网', '活动行', '互动吧', '掘金', 'Devpost', 'MLH', '小红书', '微信公众号', '其他'];

const scheduleOptions = [
  { value: 'daily', label: '每日', desc: '每天凌晨 2 点自动爬取' },
  { value: 'weekly', label: '每周', desc: '每周一上午 9 点自动爬取' },
  { value: 'hourly', label: '每小时', desc: '每小时爬取一次' },
  { value: 'custom', label: '手动', desc: '仅手动触发爬取' },
];

export function URLScraper({ onSuccess }: URLScraperProps) {
  const [mode, setMode] = useState<ScraperMode>('single');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // 网站列表管理
  const [savedSites, setSavedSites] = useState<SavedSite[]>([]);
  const [showSiteManager, setShowSiteManager] = useState(false);
  const [newSite, setNewSite] = useState({ name: '', url: '', platform: 'DoraHacks' });

  // 批量爬取
  const [batchTargets, setBatchTargets] = useState<ScrapeTarget[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);

  // 定时爬取（CronManager）
  const [cronTargets, setCronTargets] = useState<CronTarget[]>([]);
  const [cronLoading, setCronLoading] = useState(false);
  const [showCronModal, setShowCronModal] = useState(false);
  const [editingCron, setEditingCron] = useState<CronTarget | null>(null);
  const [scrapingIds, setScrapingIds] = useState<Set<string>>(new Set());
  const [scrapeResults, setScrapeResults] = useState<Record<string, { status: 'success' | 'error'; message: string }>>({});
  const [cronForm, setCronForm] = useState({
    name: '',
    url: '',
    platform: 'DoraHacks',
    schedule: 'daily',
    enabled: true,
  });

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

  // 加载定时爬取目标
  const loadCronTargets = async () => {
    setCronLoading(true);
    try {
      const response = await fetch('/api/admin/scrape-targets');
      const data = await response.json();
      if (data.success) {
        setCronTargets(data.data);
      }
    } catch (error) {
      console.error('加载定时目标失败:', error);
    } finally {
      setCronLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'cron') {
      loadCronTargets();
    }
  }, [mode]);

  // 定时爬取 CRUD
  const handleCronCreate = async () => {
    try {
      const response = await fetch('/api/admin/scrape-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cronForm),
      });
      const data = await response.json();
      if (data.success) {
        setCronTargets([data.data, ...cronTargets]);
        setShowCronModal(false);
        resetCronForm();
      } else {
        alert(data.error || '创建失败');
      }
    } catch {
      alert('创建失败');
    }
  };

  const handleCronUpdate = async () => {
    if (!editingCron) return;
    try {
      const response = await fetch(`/api/admin/scrape-targets/${editingCron.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cronForm),
      });
      const data = await response.json();
      if (data.success) {
        setCronTargets(cronTargets.map((t) => (t.id === editingCron.id ? data.data : t)));
        setEditingCron(null);
        resetCronForm();
      } else {
        alert(data.error || '更新失败');
      }
    } catch {
      alert('更新失败');
    }
  };

  const handleCronDelete = async (id: string) => {
    if (!confirm('确定要删除这个爬取目标吗？')) return;
    try {
      const response = await fetch(`/api/admin/scrape-targets/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setCronTargets(cronTargets.filter((t) => t.id !== id));
      } else {
        alert(data.error || '删除失败');
      }
    } catch {
      alert('删除失败');
    }
  };

  const handleManualScrape = async (targetId: string) => {
    if (scrapingIds.has(targetId)) return;
    setScrapeResults((prev) => { const next = { ...prev }; delete next[targetId]; return next; });
    setScrapingIds((prev) => new Set(prev).add(targetId));
    try {
      const response = await fetch('/api/cron/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });
      const data = await response.json();
      if (data.success) {
        setScrapeResults((prev) => ({ ...prev, [targetId]: { status: 'success', message: `置信度 ${((data.result?.confidence || 0) * 100).toFixed(0)}% · ${(data.result?.duration / 1000).toFixed(1)}s` } }));
        loadCronTargets();
      } else {
        setScrapeResults((prev) => ({ ...prev, [targetId]: { status: 'error', message: data.message || '爬取失败' } }));
      }
    } catch {
      setScrapeResults((prev) => ({ ...prev, [targetId]: { status: 'error', message: '网络错误' } }));
    } finally {
      setScrapingIds((prev) => { const next = new Set(prev); next.delete(targetId); return next; });
      setTimeout(() => {
        setScrapeResults((prev) => { const next = { ...prev }; delete next[targetId]; return next; });
      }, 5000);
    }
  };

  const handleToggleCronEnabled = async (target: CronTarget) => {
    try {
      const response = await fetch(`/api/admin/scrape-targets/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !target.enabled }),
      });
      const data = await response.json();
      if (data.success) {
        setCronTargets(cronTargets.map((t) => (t.id === target.id ? data.data : t)));
      }
    } catch {
      console.error('切换状态失败');
    }
  };

  const resetCronForm = () => {
    setCronForm({ name: '', url: '', platform: 'DoraHacks', schedule: 'daily', enabled: true });
  };

  const openCronEdit = (target: CronTarget) => {
    setEditingCron(target);
    setCronForm({
      name: target.name,
      url: target.url,
      platform: target.platform,
      schedule: target.schedule,
      enabled: target.enabled,
    });
  };

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
            支持单次爬取、批量爬取和定时自动爬取
          </p>
        </div>
        {mode === 'cron' && (
          <button
            onClick={() => setShowCronModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            添加目标
          </button>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
        {([
          { key: 'single' as ScraperMode, label: '单个 URL', icon: Globe },
          { key: 'batch' as ScraperMode, label: '批量爬取', icon: Zap },
          { key: 'cron' as ScraperMode, label: '定时任务', icon: Timer },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === key
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* 单个爬取模式 */}
      {mode === 'single' && (
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
      {mode === 'batch' && (
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

      {/* 定时任务模式 */}
      {mode === 'cron' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass rounded-xl p-4">
              <div className="text-xs text-gray-500">总目标</div>
              <div className="text-xl font-bold mt-1">{cronTargets.length}</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-xs text-gray-500">已启用</div>
              <div className="text-xl font-bold mt-1 text-green-400">
                {cronTargets.filter((t) => t.enabled).length}
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-xs text-gray-500">成功</div>
              <div className="text-xl font-bold mt-1 text-blue-400">
                {cronTargets.reduce((sum, t) => sum + t.successCount, 0)}
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-xs text-gray-500">失败</div>
              <div className="text-xl font-bold mt-1 text-red-400">
                {cronTargets.reduce((sum, t) => sum + t.errorCount, 0)}
              </div>
            </div>
          </div>

          {cronLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-gray-500" size={20} />
              <span className="ml-2 text-sm text-gray-500">加载中...</span>
            </div>
          ) : cronTargets.length === 0 ? (
            <div className="text-center py-12 glass rounded-xl">
              <AlertCircle size={40} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">还没有配置定时爬取目标</p>
              <button
                onClick={() => setShowCronModal(true)}
                className="mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm"
              >
                添加第一个目标
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cronTargets.map((target) => {
                const isScraping = scrapingIds.has(target.id);
                const scrapeResult = scrapeResults[target.id];

                return (
                  <div
                    key={target.id}
                    className={`glass rounded-xl p-5 relative overflow-hidden transition-all duration-300 ${
                      isScraping ? 'ring-1 ring-indigo-500/50' : ''
                    }`}
                  >
                    {/* 爬取进度条 */}
                    {isScraping && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
                          style={{ width: '40%', animation: 'shimmer-bar 1.5s ease-in-out infinite' }}
                        />
                      </div>
                    )}

                    {/* 结果提示 */}
                    {scrapeResult && (
                      <div className={`mb-3 px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                        scrapeResult.status === 'success'
                          ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                          : 'bg-red-500/10 border border-red-500/20 text-red-400'
                      }`}>
                        {scrapeResult.status === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {scrapeResult.status === 'success' ? '爬取成功' : '爬取失败'} · {scrapeResult.message}
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-white">{target.name}</h3>
                          {isScraping && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-400 flex items-center gap-1">
                              <Loader2 size={10} className="animate-spin" />
                              爬取中
                            </span>
                          )}
                          {!isScraping && (
                            <>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                target.enabled
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-gray-500/20 text-gray-500'
                              }`}>
                                {target.enabled ? '启用' : '禁用'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-400">
                                {scheduleOptions.find((s) => s.value === target.schedule)?.label || target.schedule}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <ExternalLink size={12} />
                            {target.platform}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {target.lastScrapedAt
                              ? new Date(target.lastScrapedAt).toLocaleString('zh-CN')
                              : '从未执行'}
                          </span>
                          {target.lastStatus && !isScraping && (
                            <span className="flex items-center gap-1">
                              {target.lastStatus === 'success'
                                ? <CheckCircle2 size={12} className="text-green-400" />
                                : <XCircle size={12} className="text-red-400" />}
                              {target.lastStatus === 'success' ? '成功' : '失败'}
                            </span>
                          )}
                          <span className="text-green-400/70">成功 {target.successCount}</span>
                          <span className="text-red-400/70">失败 {target.errorCount}</span>
                        </div>

                        <a
                          href={target.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 text-xs text-gray-600 hover:text-indigo-400 transition-colors block truncate"
                        >
                          {target.url}
                        </a>
                      </div>

                      <div className="flex items-center gap-1.5 ml-4 shrink-0">
                        <button
                          onClick={() => handleToggleCronEnabled(target)}
                          disabled={isScraping}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isScraping ? 'opacity-40 cursor-not-allowed' :
                            target.enabled
                              ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                              : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                          }`}
                          title={target.enabled ? '禁用' : '启用'}
                        >
                          {target.enabled ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button
                          onClick={() => handleManualScrape(target.id)}
                          disabled={isScraping}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isScraping
                              ? 'bg-indigo-500/30 text-indigo-300 cursor-not-allowed'
                              : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400'
                          }`}
                          title="立即执行"
                        >
                          {isScraping
                            ? <Loader2 size={16} className="animate-spin" />
                            : <RefreshCw size={16} />}
                        </button>
                        <button
                          onClick={() => openCronEdit(target)}
                          disabled={isScraping}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isScraping ? 'opacity-40 cursor-not-allowed' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                          }`}
                          title="编辑"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleCronDelete(target.id)}
                          disabled={isScraping}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isScraping ? 'opacity-40 cursor-not-allowed' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                          }`}
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 支持的平台 */}
      {mode === 'single' && (
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

      {/* 定时爬取 Modal */}
      {(showCronModal || editingCron) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-xl p-6 max-w-md w-full glass border border-white/10">
            <h3 className="text-lg font-bold mb-4">
              {editingCron ? '编辑爬取目标' : '添加爬取目标'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">名称</label>
                <input
                  type="text"
                  value={cronForm.name}
                  onChange={(e) => setCronForm({ ...cronForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="DoraHacks 中国"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">URL</label>
                <input
                  type="url"
                  value={cronForm.url}
                  onChange={(e) => setCronForm({ ...cronForm, url: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-sm font-space-mono"
                  placeholder="https://dorahacks.io/zh/hackathon"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">平台</label>
                  <select
                    value={cronForm.platform}
                    onChange={(e) => setCronForm({ ...cronForm, platform: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    {platformOptions.map((p) => (
                      <option key={p} value={p} className="bg-gray-900">{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">频率</label>
                  <select
                    value={cronForm.schedule}
                    onChange={(e) => setCronForm({ ...cronForm, schedule: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    {scheduleOptions.map((s) => (
                      <option key={s.value} value={s.value} className="bg-gray-900">{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cronForm.enabled}
                  onChange={(e) => setCronForm({ ...cronForm, enabled: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm text-gray-400">创建后立即启用</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCronModal(false);
                  setEditingCron(null);
                  resetCronForm();
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={editingCron ? handleCronUpdate : handleCronCreate}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm font-medium"
              >
                {editingCron ? '更新' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
