'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Globe,
  Loader2,
  Pen,
  Save,
  Send,
  Sparkles,
  Zap,
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

const FIELD_CONFIG: { key: keyof ParsedHackathon; label: string; type?: 'text' | 'select' | 'textarea'; required?: boolean }[] = [
  { key: 'name', label: '活动名称', required: true },
  { key: 'shortName', label: '简称' },
  { key: 'startDate', label: '开始日期', required: true },
  { key: 'endDate', label: '结束日期', required: true },
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

type WizardStep = 'choose' | 'edit' | 'preview';

interface Props {
  onSuccess: () => void;
  apiBase?: string;
}

export function CreateHackathonWizard({ onSuccess, apiBase }: Props) {
  const base = apiBase ?? '/api/organizer';
  const [step, setStep] = useState<WizardStep>('choose');
  const [method, setMethod] = useState<'url' | 'manual' | null>(null);

  const [url, setUrl] = useState('');
  const [fields, setFields] = useState<ParsedHackathon>({ ...EMPTY_HACKATHON });

  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const updateField = (key: keyof ParsedHackathon, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleURLImport = async () => {
    if (!url.trim()) return;
    setImporting(true);
    setError('');
    setImportStatus('正在识别平台...');

    try {
      setImportStatus('正在爬取页面内容...');
      const res = await fetch('/api/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.duplicate) {
          setError(`该活动已存在：${data.existingName || '同名活动'}`);
        } else {
          setError(data.error || '导入失败');
        }
        return;
      }

      setImportStatus('正在提取信息...');

      const draft = data.draft || {};
      setFields({
        ...EMPTY_HACKATHON,
        name: draft.name || '',
        shortName: draft.shortName || '',
        city: draft.city || '',
        country: draft.country || '中国',
        venue: draft.venue || '',
        startDate: draft.startDate || '',
        endDate: draft.endDate || '',
        mode: draft.format || draft.mode || 'offline',
        theme: draft.theme || '',
        summary: draft.summary || '',
        prizePool: draft.prizePool || '',
        teams: draft.teams || '',
        website: draft.website || url,
        hostOrganizer: draft.hostOrganizer || '',
        tracks: draft.tracks || [],
        agenda: draft.agenda || [],
        organizers: draft.organizers || [],
        sponsors: draft.sponsors || [],
        tags: draft.tags || [],
      });

      setStep('edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setImporting(false);
      setImportStatus('');
    }
  };

  const handleStartManual = () => {
    setMethod('manual');
    setFields({ ...EMPTY_HACKATHON });
    setStep('edit');
  };

  const handleSaveDraft = async () => {
    if (!fields.name) { setError('活动名称不能为空'); return; }
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`${base}/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...fields, website: fields.website || url },
          source: url || 'manual',
        }),
      });
      if (!res.ok) throw new Error('保存草稿失败');
      setSuccessMsg('已保存到草稿箱！');
      setTimeout(() => onSuccess(), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存草稿失败');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!fields.name) { setError('活动名称不能为空'); return; }
    setSaving(true);
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
      setSuccessMsg('活动已成功发布！');
      setTimeout(() => onSuccess(), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : '发布失败');
    } finally {
      setSaving(false);
    }
  };

  if (successMsg) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <Check size={28} className="text-green-400" />
        </div>
        <h3 className="font-sora text-xl font-bold text-white mb-2">{successMsg}</h3>
        <p className="font-space-mono text-sm text-gray-400">页面将自动跳转...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 步骤指示器 */}
      <div className="flex items-center gap-3 mb-8">
        {(['choose', 'edit', 'preview'] as const).map((s, i) => {
          const labels = ['选择方式', '编辑信息', '预览发布'];
          const isActive = step === s;
          const isPast = (['choose', 'edit', 'preview'] as const).indexOf(step) > i;

          return (
            <div key={s} className="flex items-center gap-3">
              {i > 0 && <div className={`w-8 h-px ${isPast ? 'bg-indigo-500' : 'bg-white/10'}`} />}
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  isActive ? 'bg-indigo-500 text-white' :
                  isPast ? 'bg-indigo-500/30 text-indigo-300' :
                  'bg-white/5 text-gray-500'
                }`}>
                  {isPast ? <Check size={12} /> : i + 1}
                </div>
                <span className={`font-space-mono text-xs ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}>
                  {labels[i]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: 选择创建方式 */}
      {step === 'choose' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-sora text-xl font-bold text-white mb-2">如何创建你的黑客松？</h2>
            <p className="font-space-mono text-sm text-gray-400">选择最适合你的方式</p>
          </div>

          {/* URL 导入方式 */}
          <div className="glass rounded-xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                <Globe size={18} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="font-sora text-base font-semibold text-white">粘贴链接，AI 自动填充</h3>
                <p className="font-space-mono text-xs text-gray-500">支持公众号、小红书、活动页面等链接</p>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="粘贴活动链接..."
                disabled={importing}
                className="flex-1 px-4 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 text-sm disabled:opacity-50"
                onKeyDown={(e) => e.key === 'Enter' && !importing && handleURLImport()}
              />
              <button
                onClick={handleURLImport}
                disabled={!url.trim() || importing}
                className="px-5 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {importStatus || '导入中...'}
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    一键导入
                  </>
                )}
              </button>
            </div>

            {error && step === 'choose' && (
              <p className="text-sm text-red-400 font-space-mono">{error}</p>
            )}
          </div>

          {/* 分隔线 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="font-space-mono text-xs text-gray-500">或者</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* 手动创建 */}
          <button
            onClick={handleStartManual}
            className="w-full glass rounded-xl border border-white/10 hover:border-white/20 p-6 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <Pen size={18} className="text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-sora text-base font-semibold text-white">从零开始手动创建</h3>
                <p className="font-space-mono text-xs text-gray-500">填写表单来创建活动信息</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-gray-600 group-hover:text-white transition-colors" />
            </div>
          </button>
        </div>
      )}

      {/* Step 2: 编辑信息 */}
      {step === 'edit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-sora text-xl font-bold text-white mb-1">编辑活动信息</h2>
              <p className="font-space-mono text-xs text-gray-500">
                {method === 'url' ? 'AI 已自动填充，你可以检查并修改' : '填写你的黑客松活动信息'}
              </p>
            </div>
            <button
              onClick={() => { setStep('choose'); setError(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-colors"
            >
              <ArrowLeft size={12} />
              返回
            </button>
          </div>

          <div className="glass rounded-xl border border-white/10 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELD_CONFIG.map(({ key, label, type, required }) => {
                const val = fields[key];
                if (typeof val !== 'string') return null;

                if (type === 'textarea') {
                  return (
                    <div key={key} className="md:col-span-2">
                      <label className="block font-space-mono text-xs text-gray-400 mb-1.5">
                        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                      </label>
                      <textarea
                        value={val}
                        onChange={(e) => updateField(key, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
                      />
                    </div>
                  );
                }

                if (type === 'select') {
                  return (
                    <div key={key}>
                      <label className="block font-space-mono text-xs text-gray-400 mb-1.5">{label}</label>
                      <select
                        value={val}
                        onChange={(e) => updateField(key, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                      >
                        <option value="offline">线下</option>
                        <option value="online">线上</option>
                        <option value="hybrid">混合</option>
                      </select>
                    </div>
                  );
                }

                return (
                  <div key={key}>
                    <label className="block font-space-mono text-xs text-gray-400 mb-1.5">
                      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    <input
                      type={key.includes('Date') ? 'date' : 'text'}
                      value={val}
                      onChange={(e) => updateField(key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 font-space-mono">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm transition-all disabled:opacity-50"
            >
              <Save size={14} />
              保存草稿
            </button>
            <button
              onClick={() => {
                if (!fields.name) { setError('活动名称不能为空'); return; }
                setError('');
                setStep('preview');
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium transition-all"
            >
              预览
              <Eye size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 预览 + 发布 */}
      {step === 'preview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-sora text-xl font-bold text-white mb-1">预览活动</h2>
              <p className="font-space-mono text-xs text-gray-500">确认信息无误后发布</p>
            </div>
            <button
              onClick={() => setStep('edit')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-colors"
            >
              <ArrowLeft size={12} />
              返回编辑
            </button>
          </div>

          <div className="glass rounded-xl border border-white/10 p-6 space-y-4">
            <h3 className="font-sora text-2xl font-bold text-white">{fields.name}</h3>

            {fields.shortName && (
              <span className="inline-block px-2 py-0.5 rounded bg-white/5 text-gray-400 font-space-mono text-xs">
                {fields.shortName}
              </span>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-white/10">
              {fields.startDate && (
                <div>
                  <span className="font-space-mono text-[10px] text-gray-500 uppercase block">日期</span>
                  <span className="font-sora text-sm text-white">
                    {fields.startDate}{fields.endDate ? ` ~ ${fields.endDate}` : ''}
                  </span>
                </div>
              )}
              {fields.city && (
                <div>
                  <span className="font-space-mono text-[10px] text-gray-500 uppercase block">城市</span>
                  <span className="font-sora text-sm text-white">{fields.city}</span>
                </div>
              )}
              {fields.mode && (
                <div>
                  <span className="font-space-mono text-[10px] text-gray-500 uppercase block">形式</span>
                  <span className="font-sora text-sm text-white">
                    {fields.mode === 'online' ? '线上' : fields.mode === 'offline' ? '线下' : '混合'}
                  </span>
                </div>
              )}
              {fields.prizePool && (
                <div>
                  <span className="font-space-mono text-[10px] text-gray-500 uppercase block">奖金</span>
                  <span className="font-sora text-sm text-white">{fields.prizePool}</span>
                </div>
              )}
            </div>

            {fields.summary && (
              <div>
                <span className="font-space-mono text-[10px] text-gray-500 uppercase block mb-1">简介</span>
                <p className="text-sm text-gray-300 leading-relaxed">{fields.summary}</p>
              </div>
            )}

            {fields.hostOrganizer && (
              <div>
                <span className="font-space-mono text-[10px] text-gray-500 uppercase block mb-1">主办方</span>
                <span className="text-sm text-gray-300">{fields.hostOrganizer}</span>
              </div>
            )}

            {fields.tracks.length > 0 && (
              <div>
                <span className="font-space-mono text-[10px] text-gray-500 uppercase block mb-2">赛道</span>
                <div className="flex flex-wrap gap-2">
                  {fields.tracks.map((t, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-white/5 text-xs text-gray-300">
                      {t.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 font-space-mono">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              保存草稿
            </button>
            <button
              onClick={handlePublish}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              发布活动
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
