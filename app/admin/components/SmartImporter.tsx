'use client';

import { useState } from 'react';
import {
  Globe,
  FileText,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  Send,
  Save,
  ArrowDown,
} from 'lucide-react';

interface ParsedHackathon {
  name: string;
  shortName: string;
  city: string;
  country: string;
  venue: string;
  startDate: string;
  endDate: string;
  mode: string;
  theme: string;
  summary: string;
  prizePool: string;
  teams: string;
  website: string;
  hostOrganizer: string;
  tracks: { title: string; description: string }[];
  agenda: { title: string; time: string; detail: string }[];
  organizers: { name: string }[];
  sponsors: { name: string; tier: string }[];
  tags: string[];
}

const EMPTY_HACKATHON: ParsedHackathon = {
  name: '', shortName: '', city: '', country: '中国', venue: '',
  startDate: '', endDate: '', mode: 'offline', theme: '', summary: '',
  prizePool: '', teams: '', website: '', hostOrganizer: '',
  tracks: [], agenda: [], organizers: [], sponsors: [], tags: [],
};

const FIELD_CONFIG: { key: keyof ParsedHackathon; label: string; type?: 'text' | 'select' | 'textarea' }[] = [
  { key: 'name', label: '活动名称' },
  { key: 'shortName', label: '简称' },
  { key: 'startDate', label: '开始日期' },
  { key: 'endDate', label: '结束日期' },
  { key: 'city', label: '城市' },
  { key: 'country', label: '国家' },
  { key: 'venue', label: '场地' },
  { key: 'mode', label: '形式', type: 'select' },
  { key: 'theme', label: '主题' },
  { key: 'prizePool', label: '奖金池' },
  { key: 'teams', label: '规模' },
  { key: 'website', label: '官网链接' },
  { key: 'hostOrganizer', label: '主办方' },
  { key: 'summary', label: '活动简介', type: 'textarea' },
];

interface Props {
  onSuccess: () => void;
  apiBase?: string;
}

export function SmartImporter({ onSuccess, apiBase }: Props) {
  const base = apiBase ?? '/api/admin';
  const draftsBase = apiBase ?? '/api';
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [fields, setFields] = useState<ParsedHackathon>({ ...EMPTY_HACKATHON });
  const [adapted, setAdapted] = useState(false);

  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 爬取 URL
  const handleScrape = async () => {
    if (!url.trim()) return;
    setScrapeLoading(true);
    setError('');

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '爬取失败');

      // 转为可读文本
      const lines: string[] = [];
      for (const [k, v] of Object.entries(data.data)) {
        if (v && typeof v !== 'object') lines.push(`${k}: ${v}`);
      }
      if (Array.isArray(data.data.tracks)) {
        lines.push('赛道:');
        data.data.tracks.forEach((t: { title: string; description?: string }) => {
          lines.push(`- ${t.title}${t.description ? ': ' + t.description : ''}`);
        });
      }
      if (Array.isArray(data.data.organizers)) {
        lines.push('组织方: ' + data.data.organizers.map((o: { name: string }) => o.name).join('、'));
      }
      setRawText(lines.join('\n'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '爬取失败');
    } finally {
      setScrapeLoading(false);
    }
  };

  // AI 适配
  const handleAIParse = async () => {
    if (!rawText.trim()) return;
    setAiLoading(true);
    setError('');

    try {
      const res = await fetch(`${base}/hackathons/ai-parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText.trim() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'AI 解析失败');

      setFields({ ...EMPTY_HACKATHON, ...result.data });
      setAdapted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 解析失败');
    } finally {
      setAiLoading(false);
    }
  };

  // 更新单个字段
  const updateField = (key: keyof ParsedHackathon, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  // 发布
  const handlePublish = async () => {
    if (!fields.name) { setError('活动名称不能为空'); return; }
    setPublishLoading(true);
    setError('');

    try {
      const res = await fetch(`${base}/hackathons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name,
          description: fields.summary || null,
          website: fields.website || url || null,
          startDate: fields.startDate,
          endDate: fields.endDate,
          mode: fields.mode || 'hybrid',
          location: fields.venue ? `${fields.venue}, ${fields.city}` : fields.city || null,
          prizePool: fields.prizePool || null,
          organizer: fields.hostOrganizer || fields.organizers?.[0]?.name || null,
          tracks: fields.tracks || [],
          tags: fields.tags || [],
          sponsors: fields.sponsors || [],
          sourceUrl: url || null,
          shortName: fields.shortName || null,
          city: fields.city || null,
          country: fields.country || '中国',
          venue: fields.venue || null,
          theme: fields.theme || null,
          summary: fields.summary || null,
          teams: fields.teams || null,
          hostOrganizer: fields.hostOrganizer || null,
          agenda: fields.agenda || [],
          organizers: fields.organizers || [],
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '发布失败');
      }
      setSuccessMsg('已成功发布为正式黑客松活动！');
      setTimeout(() => { onSuccess(); resetAll(); }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : '发布失败');
    } finally {
      setPublishLoading(false);
    }
  };

  // 存草稿
  const handleSaveDraft = async () => {
    setPublishLoading(true);
    setError('');
    try {
      const res = await fetch(`${draftsBase}/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...fields, website: fields.website || url },
          source: url || 'ai-import',
        }),
      });
      if (!res.ok) throw new Error('保存草稿失败');
      setSuccessMsg('已保存到草稿箱！');
      setTimeout(() => { onSuccess(); resetAll(); }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存草稿失败');
    } finally {
      setPublishLoading(false);
    }
  };

  const resetAll = () => {
    setUrl(''); setRawText(''); setFields({ ...EMPTY_HACKATHON });
    setAdapted(false); setError(''); setSuccessMsg('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-sora text-xl font-bold text-white">智能采集</h2>
          <p className="text-xs text-gray-500 font-space-mono">URL 爬取 + AI 智能适配字段</p>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <Check size={16} className="text-green-400" />
          <span className="text-green-400 text-sm">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={16} className="text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* ========== 上半部分：爬取/输入区 ========== */}
      <div className="glass rounded-xl border border-white/10 p-5 space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Step 1 · 获取原始内容</h3>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setInputMode('url')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              inputMode === 'url'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <Globe size={14} /> URL 爬取
          </button>
          <button
            onClick={() => setInputMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              inputMode === 'text'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <FileText size={14} /> 粘贴文本
          </button>
        </div>

        {inputMode === 'url' && (
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="输入黑客松页面 URL..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 text-sm"
            />
            <button
              onClick={handleScrape}
              disabled={scrapeLoading || !url.trim()}
              className="px-5 py-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
            >
              {scrapeLoading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
              {scrapeLoading ? '爬取中...' : '爬取'}
            </button>
          </div>
        )}

        {/* 原始文本区 */}
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={10}
          placeholder={inputMode === 'url'
            ? '爬取后原始内容会显示在这里，也可以手动编辑...'
            : '粘贴黑客松相关的原始文本内容...\n\n例如：\n2026 全球 AI 黑客松\n时间：2026年5月10-11日\n地点：上海市浦东新区 张江科学城\n奖金池：¥200,000\n主办方：XX科技'
          }
          className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-gray-600 text-sm font-space-mono leading-relaxed focus:outline-none focus:border-indigo-500/50 resize-y"
        />
      </div>

      {/* ========== AI 适配按钮 ========== */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/10" />
        <button
          onClick={handleAIParse}
          disabled={!rawText.trim() || aiLoading}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm hover:from-indigo-400 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          {aiLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <ArrowDown size={16} />
              <Sparkles size={16} />
            </>
          )}
          {aiLoading ? 'AI 适配中...' : 'AI 智能适配到下方字段'}
        </button>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* ========== 下半部分：字段表格 ========== */}
      <div className="glass rounded-xl border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300">Step 2 · 黑客松信息字段</h3>
          {adapted && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Check size={12} /> AI 已适配
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FIELD_CONFIG.map(({ key, label, type }) => (
            <div
              key={key}
              className={type === 'textarea' ? 'col-span-2' : ''}
            >
              <label className="block text-xs text-gray-500 font-space-mono mb-1">{label}</label>
              {type === 'textarea' ? (
                <textarea
                  value={String(fields[key] || '')}
                  onChange={(e) => updateField(key, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-y"
                />
              ) : type === 'select' ? (
                <select
                  value={String(fields[key] || '')}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="offline">线下</option>
                  <option value="online">线上</option>
                  <option value="hybrid">混合</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={String(fields[key] || '')}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                />
              )}
            </div>
          ))}
        </div>

        {/* 赛道标签展示 */}
        {fields.tracks?.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 font-space-mono mb-1">赛道</label>
            <div className="flex flex-wrap gap-1.5">
              {fields.tracks.map((t, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs">
                  {t.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 组织方 */}
        {fields.organizers?.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 font-space-mono mb-1">组织方</label>
            <div className="flex flex-wrap gap-1.5">
              {fields.organizers.map((o, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md bg-white/5 text-gray-300 text-xs">
                  {o.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 标签 */}
        {fields.tags?.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 font-space-mono mb-1">标签</label>
            <div className="flex flex-wrap gap-1.5">
              {fields.tags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md bg-white/5 text-gray-400 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handlePublish}
            disabled={publishLoading || !fields.name}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm hover:from-indigo-400 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {publishLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            直接发布
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={publishLoading || !fields.name}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Save size={14} />
            存为草稿
          </button>
          <button
            onClick={resetAll}
            className="px-6 py-3 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 text-sm transition-colors"
          >
            清空
          </button>
        </div>
      </div>
    </div>
  );
}
