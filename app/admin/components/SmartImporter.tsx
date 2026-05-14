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
  Zap,
  ChevronDown,
  ChevronUp,
  ImageIcon,
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

type ImportStep = 'idle' | 'detecting' | 'scraping' | 'recognizing' | 'extracting' | 'saving' | 'done' | 'error';

const STEP_LABELS: Record<ImportStep, string> = {
  idle: '',
  detecting: '识别平台...',
  scraping: '爬取页面内容...',
  recognizing: '识别图片信息...',
  extracting: '提取黑客松信息...',
  saving: '保存到草稿箱...',
  done: '导入成功！',
  error: '导入失败',
};

export function SmartImporter({ onSuccess, apiBase }: Props) {
  const base = apiBase ?? '/api/admin';
  const draftsBase = apiBase ?? '/api';
  const [url, setUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 一键导入状态
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [importResult, setImportResult] = useState<{
    draft?: Record<string, unknown>;
    confidence?: number;
    platform?: string;
    hasImageData?: boolean;
    error?: string;
    suggestion?: string;
    duplicate?: boolean;
    existingName?: string;
  } | null>(null);

  // 高级模式状态
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
  const [rawText, setRawText] = useState('');
  const [fields, setFields] = useState<ParsedHackathon>({ ...EMPTY_HACKATHON });
  const [adapted, setAdapted] = useState(false);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ========== 一键导入 ==========
  const handleOneClickImport = async () => {
    if (!url.trim()) return;
    setImportResult(null);
    setError('');
    setSuccessMsg('');

    const steps: ImportStep[] = ['detecting', 'scraping', 'extracting', 'saving'];
    let stepIndex = 0;

    const advanceStep = () => {
      if (stepIndex < steps.length) {
        setImportStep(steps[stepIndex]);
        stepIndex++;
      }
    };

    advanceStep(); // detecting

    try {
      // 模拟平台识别的短暂延迟
      await new Promise((r) => setTimeout(r, 300));
      advanceStep(); // scraping

      const res = await fetch('/api/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setImportStep('error');
        setImportResult({
          error: data.error,
          suggestion: data.suggestion,
          duplicate: data.duplicate,
          existingName: data.existingName,
        });
        return;
      }

      if (data.hasImageData) {
        setImportStep('recognizing');
        await new Promise((r) => setTimeout(r, 200));
      }

      setImportStep('done');
      setImportResult({
        draft: data.draft,
        confidence: data.confidence,
        platform: data.platform,
        hasImageData: data.hasImageData,
      });

      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setImportStep('error');
      setImportResult({
        error: err instanceof Error ? err.message : '导入失败',
      });
    }
  };

  const resetImport = () => {
    setImportStep('idle');
    setImportResult(null);
    setUrl('');
  };

  // ========== 高级模式: 爬取 ==========
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

  // ========== 高级模式: AI 适配 ==========
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

  const updateField = (key: keyof ParsedHackathon, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

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
    setImportStep('idle'); setImportResult(null);
  };

  const isImporting = importStep !== 'idle' && importStep !== 'done' && importStep !== 'error';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-sora text-xl font-bold text-white">智能采集</h2>
          <p className="text-xs text-gray-500 font-space-mono">粘贴链接，一键导入到草稿箱</p>
        </div>
      </div>

      {/* ========== 一键导入区域 ========== */}
      <div className="glass rounded-xl border border-white/10 p-5 space-y-4">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Zap size={14} className="text-yellow-400" />
          一键导入
        </h3>

        {/* URL 输入 + 按钮 */}
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="粘贴链接：小红书、公众号、文档、活动页..."
            disabled={isImporting}
            className="flex-1 px-4 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 text-sm disabled:opacity-50"
            onKeyDown={(e) => e.key === 'Enter' && !isImporting && handleOneClickImport()}
          />
          <button
            onClick={handleOneClickImport}
            disabled={isImporting || !url.trim()}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm hover:from-indigo-400 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 min-w-[140px] justify-center"
          >
            {isImporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            {isImporting ? '导入中...' : '一键导入'}
          </button>
        </div>

        {/* 进度条 */}
        {importStep !== 'idle' && (
          <ImportProgress step={importStep} result={importResult} onReset={resetImport} onRetry={handleOneClickImport} onSwitchManual={() => { setShowAdvanced(true); setImportStep('idle'); }} />
        )}
      </div>

      {/* ========== 高级模式折叠 ========== */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        高级模式：手动爬取 + AI 适配 + 逐字段编辑
      </button>

      {showAdvanced && (
        <>
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

          {/* Step 1: 爬取/输入区 */}
          <div className="glass rounded-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-300">Step 1 · 获取原始内容</h3>

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

          {/* AI 适配按钮 */}
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

          {/* Step 2: 字段表格 */}
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
                <div key={key} className={type === 'textarea' ? 'col-span-2' : ''}>
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
        </>
      )}
    </div>
  );
}

// ========== 导入进度组件 ==========

function ImportProgress({
  step,
  result,
  onReset,
  onRetry,
  onSwitchManual,
}: {
  step: ImportStep;
  result: {
    draft?: Record<string, unknown>;
    confidence?: number;
    platform?: string;
    hasImageData?: boolean;
    error?: string;
    suggestion?: string;
    duplicate?: boolean;
    existingName?: string;
  } | null;
  onReset: () => void;
  onRetry: () => void;
  onSwitchManual: () => void;
}) {
  const steps: { key: ImportStep; label: string }[] = [
    { key: 'detecting', label: '识别平台' },
    { key: 'scraping', label: '爬取内容' },
    { key: 'extracting', label: '提取信息' },
    { key: 'saving', label: '保存草稿' },
  ];

  const stepOrder = ['detecting', 'scraping', 'recognizing', 'extracting', 'saving', 'done'];
  const currentIndex = stepOrder.indexOf(step);

  if (step === 'done' && result?.draft) {
    const draft = result.draft;
    const confidence = result.confidence ?? 0;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <Check size={16} className="text-green-400" />
          <span className="text-green-400 text-sm font-medium">导入成功！已保存到草稿箱</span>
          {result.hasImageData && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs">
              <ImageIcon size={10} /> 含图片识别
            </span>
          )}
        </div>

        <div className="p-4 rounded-lg bg-white/[0.04] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-sora text-white font-medium">{String(draft.name || '未命名')}</h4>
            <div className="flex items-center gap-2">
              {result.platform && (
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-xs">
                  {result.platform}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                confidence > 70 ? 'bg-green-500/20 text-green-400' :
                confidence > 40 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {confidence}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-space-mono">
            {draft.dateRange ? (
              <div><span className="text-gray-500">时间: </span><span className="text-gray-300">{String(draft.dateRange)}</span></div>
            ) : null}
            {draft.city ? (
              <div><span className="text-gray-500">城市: </span><span className="text-gray-300">{String(draft.city)}</span></div>
            ) : null}
            {draft.prizePool ? (
              <div><span className="text-gray-500">奖金: </span><span className="text-gray-300">{String(draft.prizePool)}</span></div>
            ) : null}
          </div>

          {draft.summary ? (
            <p className="text-xs text-gray-400 line-clamp-2">{String(draft.summary)}</p>
          ) : null}
        </div>

        <button onClick={onReset} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          继续导入下一个
        </button>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={16} className="text-red-400" />
          <div className="flex-1">
            <span className="text-red-400 text-sm">{result?.error || '导入失败'}</span>
            {result?.suggestion && (
              <p className="text-xs text-red-400/60 mt-1">{result.suggestion}</p>
            )}
            {result?.duplicate && (
              <p className="text-xs text-yellow-400/80 mt-1">已存在：{result.existingName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
          >
            重试
          </button>
          <button
            onClick={onSwitchManual}
            className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
          >
            切换手动模式
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  // 进行中的进度指示
  return (
    <div className="flex items-center gap-3">
      {steps.map(({ key, label }, i) => {
        const keyIndex = stepOrder.indexOf(key);
        const isDone = currentIndex > keyIndex;
        const isCurrent = currentIndex === keyIndex || (step === 'recognizing' && key === 'extracting');
        const isActive = step === 'recognizing' && key === 'extracting';

        return (
          <div key={key} className="flex items-center gap-2">
            {i > 0 && <div className={`w-6 h-px ${isDone ? 'bg-green-500/50' : 'bg-white/10'}`} />}
            <div className="flex items-center gap-1.5">
              {isDone ? (
                <Check size={14} className="text-green-400" />
              ) : isCurrent ? (
                <Loader2 size={14} className="text-indigo-400 animate-spin" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
              )}
              <span className={`text-xs ${
                isDone ? 'text-green-400' :
                isCurrent ? 'text-indigo-400' :
                'text-gray-600'
              }`}>
                {isActive ? '识别图片' : label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
