'use client';

import { useMemo, useState } from 'react';

interface GoogleSearchProps {
  onSuccess?: () => void;
}

type SearchItem = {
  title: string;
  link: string;
  snippet?: string;
  displayLink?: string;
};

const sitePresets = [
  { label: '全部网站', value: '' },
  { label: 'DoraHacks', value: 'dorahacks.io' },
  { label: '牛客网', value: 'nowcoder.com' },
  { label: '活动行', value: 'huodongxing.com' },
  { label: 'Juejin', value: 'juejin.cn' }
];

export function GoogleSearch({ onSuccess }: GoogleSearchProps) {
  const [query, setQuery] = useState('黑客松 2026 报名');
  const [language, setLanguage] = useState('zh-CN');
  const [region, setRegion] = useState('cn');
  const [dateRestrict, setDateRestrict] = useState('');
  const [site, setSite] = useState('');
  const [num, setNum] = useState(8);
  const [loading, setLoading] = useState(false);
  const [scrapingUrl, setScrapingUrl] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ total: number; done: number } | null>(null);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setResults([]);

    try {
      const res = await fetch('/api/google-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          num,
          language,
          region,
          dateRestrict,
          sites: site ? [site] : []
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '检索失败');
      }

      setResults(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const scrapeAndSave = async (targetUrl: string) => {
    setScrapingUrl(targetUrl);
    setError('');
    setSuccessMsg('');

    try {
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
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
          source: targetUrl
        })
      });

      const draftData = await draftRes.json();

      if (!draftRes.ok || !draftData.success) {
        throw new Error('保存草稿失败');
      }

      setSuccessMsg(`已添加「${scrapeData.data?.name || '未命名'}」到草稿箱`);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setScrapingUrl(null);
    }
  };

  const handleBulkScrape = async () => {
    if (results.length === 0) return;
    const targets = results.slice(0, Math.min(results.length, 5));
    setBulkProgress({ total: targets.length, done: 0 });
    setError('');
    setSuccessMsg('');

    for (let index = 0; index < targets.length; index += 1) {
      const item = targets[index];
      await scrapeAndSave(item.link);
      setBulkProgress(prev => prev ? { ...prev, done: prev.done + 1 } : null);
    }

    setBulkProgress(null);
  };

  const resultSummary = useMemo(() => {
    if (results.length === 0) return '';
    return `共找到 ${results.length} 条结果`;
  }, [results.length]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sora text-xl font-bold text-white mb-2">
          Google 黑客松检索
        </h2>
        <p className="font-space-mono text-sm text-gray-400">
          使用 Google Custom Search API 自动检索黑客松活动链接，并一键爬取为草稿
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block font-space-mono text-xs text-gray-500 mb-2">
            关键词
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
            placeholder="例如：北京 AI 黑客松 报名"
          />
        </div>

        <div>
          <label className="block font-space-mono text-xs text-gray-500 mb-2">
            语言
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
          >
            <option value="zh-CN">中文</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block font-space-mono text-xs text-gray-500 mb-2">
            地区
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
          >
            <option value="cn">中国</option>
            <option value="us">美国</option>
            <option value="sg">新加坡</option>
            <option value="global">全球</option>
          </select>
        </div>

        <div>
          <label className="block font-space-mono text-xs text-gray-500 mb-2">
            时间范围
          </label>
          <select
            value={dateRestrict}
            onChange={(e) => setDateRestrict(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
          >
            <option value="">不限</option>
            <option value="w1">最近 1 周</option>
            <option value="m1">最近 1 月</option>
            <option value="y1">最近 1 年</option>
          </select>
        </div>

        <div>
          <label className="block font-space-mono text-xs text-gray-500 mb-2">
            指定平台
          </label>
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
          >
            {sitePresets.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-space-mono text-xs text-gray-500 mb-2">
            结果数量
          </label>
          <select
            value={num}
            onChange={(e) => setNum(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
          >
            <option value={5}>5</option>
            <option value={8}>8</option>
            <option value={10}>10</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all font-space-mono text-sm font-medium text-white"
        >
          {loading ? '检索中...' : '开始检索'}
        </button>
        <button
          onClick={handleBulkScrape}
          disabled={results.length === 0 || !!bulkProgress}
          className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors font-space-mono text-sm text-gray-300"
        >
          {bulkProgress ? `批量爬取中 ${bulkProgress.done}/${bulkProgress.total}` : '批量爬取前 5 条'}
        </button>
        {resultSummary && (
          <span className="inline-flex items-center text-xs text-gray-500 font-space-mono">
            {resultSummary}
          </span>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="font-space-mono text-sm text-red-400">❌ {error}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="font-space-mono text-sm text-green-400">✅ {successMsg}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((item) => (
            <div
              key={item.link}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-sora text-lg font-bold text-white mb-1">
                    {item.title}
                  </h3>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-space-mono text-xs text-indigo-300 hover:text-indigo-200 break-all"
                  >
                    {item.displayLink || item.link}
                  </a>
                  {item.snippet && (
                    <p className="mt-2 font-space-mono text-xs text-gray-400">
                      {item.snippet}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => scrapeAndSave(item.link)}
                  disabled={scrapingUrl === item.link}
                  className="px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-60 transition-colors font-space-mono text-xs text-indigo-200"
                >
                  {scrapingUrl === item.link ? '爬取中...' : '一键爬取'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
