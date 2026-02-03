'use client';

import { useState } from 'react';

interface URLScraperProps {
  onSuccess?: () => void;
}

export function URLScraper({ onSuccess }: URLScraperProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleScrape = async () => {
    if (!url.trim()) {
      setError('请输入 URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 爬取 URL
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const scrapeData = await scrapeRes.json();

      if (!scrapeRes.ok || !scrapeData.success) {
        throw new Error(scrapeData.error || '爬取失败');
      }

      // 保存到草稿箱
      const draftRes = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: scrapeData.data,
          source: url
        })
      });

      const draftData = await draftRes.json();

      if (!draftRes.ok || !draftData.success) {
        throw new Error('保存草稿失败');
      }

      setResult({
        ...scrapeData,
        draft: draftData.draft
      });

      // 清空输入
      setUrl('');

      // 通知父组件
      onSuccess?.();

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sora text-xl font-bold text-white mb-2">
          输入网站 URL
        </h2>
        <p className="font-space-mono text-sm text-gray-400">
          支持 DoraHacks、活动行、牛客网等平台，或任何包含黑客松信息的网页
        </p>
      </div>

      {/* URL Input */}
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

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="font-space-mono text-sm text-red-400">
            ❌ {error}
          </p>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="font-space-mono text-sm text-green-400">
              ✅ 爬取成功！已保存到草稿箱
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-space-mono text-xs text-gray-500">平台:</span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-space-mono text-xs">
                {result.platform}
              </span>
              <span className="font-space-mono text-xs text-gray-500">置信度:</span>
              <span className={`font-space-mono text-sm font-bold ${
                result.confidence > 0.7 ? 'text-green-400' :
                result.confidence > 0.4 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {(result.confidence * 100).toFixed(0)}%
              </span>
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
                <div>
                  <span className="text-gray-500">奖金: </span>
                  <span className="text-gray-300">{result.data.prizePool || '未知'}</span>
                </div>
                <div>
                  <span className="text-gray-500">形式: </span>
                  <span className="text-gray-300">{result.data.format || '未知'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Examples */}
      <div className="pt-6 border-t border-white/10">
        <h3 className="font-space-mono text-sm font-medium text-gray-400 mb-3">
          支持的平台示例:
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'DoraHacks', url: 'https://dorahacks.io/zh/hackathon/*' },
            { name: '牛客网', url: 'https://www.nowcoder.com/activity/*' },
            { name: '活动行', url: 'https://www.huodongxing.com/event/*' },
            { name: '通用网站', url: '任何包含黑客松信息的网页' }
          ].map((platform) => (
            <div
              key={platform.name}
              className="p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <p className="font-space-mono text-xs font-medium text-white">
                {platform.name}
              </p>
              <p className="font-space-mono text-xs text-gray-500 mt-1">
                {platform.url}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
