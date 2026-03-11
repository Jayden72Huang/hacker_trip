'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BlockEditor, type Block } from '@/components/BlockEditor';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Sparkles,
  Image,
  Calendar,
  MapPin,
  Trophy,
  Users,
  Ticket,
  Globe,
  FileText,
  Clock,
  Save,
  Eye,
  Send,
} from 'lucide-react';

type Step = 'input-method' | 'basic-info' | 'details' | 'preview';

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function CreateHackathonPage() {
  const [step, setStep] = useState<Step>('input-method');
  const [inputMethod, setInputMethod] = useState<'manual' | 'import' | null>(null);
  const [importText, setImportText] = useState('');
  const [isParsingImport, setIsParsingImport] = useState(false);

  // 基本信息（必填）
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    shortName: '',
    theme: '',
    dateRange: '',
    city: '',
    country: '',
    venue: '',
    format: 'offline' as 'offline' | 'online' | 'hybrid',
    prizePool: '',
    teams: '',
    website: '',
    brief: '',
    summary: '',
  });

  // 详细信息（Notion 风格块编辑）
  const [detailBlocks, setDetailBlocks] = useState<Block[]>([
    { id: generateId(), type: 'heading2', content: '赛道介绍' },
    { id: generateId(), type: 'paragraph', content: '' },
    { id: generateId(), type: 'heading2', content: '活动日程' },
    { id: generateId(), type: 'paragraph', content: '' },
    { id: generateId(), type: 'heading2', content: '参与福利' },
    { id: generateId(), type: 'bulletList', content: '' },
    { id: generateId(), type: 'heading2', content: '注意事项' },
    { id: generateId(), type: 'paragraph', content: '' },
  ]);

  // 模拟 AI 解析导入文本
  const handleImportParse = async () => {
    if (!importText.trim()) return;

    setIsParsingImport(true);

    // 模拟解析延迟
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 模拟解析结果（实际应该调用 AI API）
    const parsed = {
      name: importText.match(/(?:名称|活动|黑客松)[：:]\s*(.+)/)?.[1] || '',
      theme: importText.match(/(?:主题|方向)[：:]\s*(.+)/)?.[1] || '',
      dateRange: importText.match(/(?:时间|日期)[：:]\s*(.+)/)?.[1] || '',
      city: importText.match(/(?:城市|地点)[：:]\s*(.+)/)?.[1] || '',
      prizePool: importText.match(/(?:奖金|奖池)[：:]\s*(.+)/)?.[1] || '',
      summary: importText.slice(0, 200),
    };

    setBasicInfo((prev) => ({
      ...prev,
      name: parsed.name || prev.name,
      theme: parsed.theme || prev.theme,
      dateRange: parsed.dateRange || prev.dateRange,
      city: parsed.city || prev.city,
      prizePool: parsed.prizePool || prev.prizePool,
      summary: parsed.summary || prev.summary,
    }));

    setIsParsingImport(false);
    setStep('basic-info');
  };

  const canProceedToDetails =
    basicInfo.name &&
    basicInfo.dateRange &&
    basicInfo.city &&
    basicInfo.format &&
    basicInfo.summary;

  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed inset-0 -z-10 grid-bg opacity-50" aria-hidden />
      <Navbar />

      <main className="pt-40 pb-20">
        <div className="w-full max-w-[1000px] mx-auto px-6">
          {/* 返回按钮 */}
          <Link
            href="/organize"
            className="inline-flex items-center gap-2 font-space-mono text-sm text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            返回组织者中心
          </Link>

          {/* 步骤指示器 */}
          <div className="flex items-center gap-4 mb-10">
            {[
              { key: 'input-method', label: '选择方式' },
              { key: 'basic-info', label: '基本信息' },
              { key: 'details', label: '详细内容' },
              { key: 'preview', label: '预览发布' },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center gap-4">
                <div
                  className={`flex items-center gap-2 ${
                    step === s.key
                      ? 'text-white'
                      : ['input-method', 'basic-info', 'details', 'preview'].indexOf(step) >
                        ['input-method', 'basic-info', 'details', 'preview'].indexOf(s.key)
                      ? 'text-indigo-400'
                      : 'text-gray-500'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-space-mono text-sm font-bold ${
                      step === s.key
                        ? 'bg-indigo-500'
                        : ['input-method', 'basic-info', 'details', 'preview'].indexOf(step) >
                          ['input-method', 'basic-info', 'details', 'preview'].indexOf(s.key)
                        ? 'bg-indigo-500/30'
                        : 'bg-white/10'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="font-space-mono text-sm hidden sm:block">
                    {s.label}
                  </span>
                </div>
                {i < 3 && (
                  <div className="w-8 lg:w-16 h-px bg-white/10" />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: 选择输入方式 */}
          {step === 'input-method' && (
            <div>
              <h1 className="font-sora text-3xl font-bold text-white mb-3">
                创建新的黑客松
              </h1>
              <p className="font-space-mono text-gray-400 mb-10">
                选择信息录入方式，开始创建你的活动
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 手动输入 */}
                <button
                  onClick={() => {
                    setInputMethod('manual');
                    setStep('basic-info');
                  }}
                  className={`glass rounded-2xl p-8 border text-left transition-all hover:scale-[1.02] ${
                    inputMethod === 'manual'
                      ? 'border-indigo-500/50 bg-indigo-500/10'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center mb-6">
                    <FileText size={28} className="text-indigo-400" />
                  </div>
                  <h3 className="font-sora text-xl font-semibold text-white mb-2">
                    手动输入
                  </h3>
                  <p className="font-space-mono text-sm text-gray-400">
                    逐步填写活动信息，完整掌控每个细节
                  </p>
                </button>

                {/* 导入文本 */}
                <button
                  onClick={() => setInputMethod('import')}
                  className={`glass rounded-2xl p-8 border text-left transition-all hover:scale-[1.02] ${
                    inputMethod === 'import'
                      ? 'border-indigo-500/50 bg-indigo-500/10'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
                    <Sparkles size={28} className="text-purple-400" />
                  </div>
                  <h3 className="font-sora text-xl font-semibold text-white mb-2">
                    智能导入
                  </h3>
                  <p className="font-space-mono text-sm text-gray-400">
                    粘贴活动文本，AI 自动解析并填充信息
                  </p>
                </button>
              </div>

              {/* 导入文本区域 */}
              {inputMethod === 'import' && (
                <div className="mt-8 glass rounded-2xl p-6 border border-white/5">
                  <h3 className="font-sora text-lg font-semibold text-white mb-4">
                    粘贴活动信息
                  </h3>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={`粘贴活动介绍文本，例如：

名称：2026 全球 AI 黑客松
主题：下一代 AI Agent
时间：2026年3月15-16日
地点：上海·张江
奖金：$100,000
...`}
                    rows={10}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                  />

                  <div className="flex items-center justify-between mt-4">
                    <p className="font-space-mono text-xs text-gray-500">
                      AI 将自动识别并提取关键信息
                    </p>
                    <button
                      onClick={handleImportParse}
                      disabled={!importText.trim() || isParsingImport}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all font-space-mono text-sm text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isParsingImport ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          解析中...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          开始解析
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: 基本信息 */}
          {step === 'basic-info' && (
            <div>
              <h1 className="font-sora text-3xl font-bold text-white mb-3">
                基本信息
              </h1>
              <p className="font-space-mono text-gray-400 mb-8">
                填写黑客松的核心信息（带 * 为必填项）
              </p>

              <div className="glass rounded-2xl p-6 md:p-8 border border-white/5 space-y-6">
                {/* 活动名称 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      活动名称 *
                    </label>
                    <input
                      type="text"
                      value={basicInfo.name}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, name: e.target.value })
                      }
                      placeholder="例如：Global AI Hackathon 2026"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      简称
                    </label>
                    <input
                      type="text"
                      value={basicInfo.shortName}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, shortName: e.target.value })
                      }
                      placeholder="例如：GAI 2026"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* 主题 */}
                <div>
                  <label className="block font-space-mono text-sm text-gray-400 mb-2">
                    主题/方向
                  </label>
                  <input
                    type="text"
                    value={basicInfo.theme}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, theme: e.target.value })
                    }
                    placeholder="例如：AI for Good, Web3, Climate Tech"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                </div>

                {/* 时间地点 */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      <Calendar size={14} className="inline mr-1" />
                      活动日期 *
                    </label>
                    <input
                      type="text"
                      value={basicInfo.dateRange}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, dateRange: e.target.value })
                      }
                      placeholder="例如：Mar 15–16"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      <MapPin size={14} className="inline mr-1" />
                      城市 *
                    </label>
                    <input
                      type="text"
                      value={basicInfo.city}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, city: e.target.value })
                      }
                      placeholder="例如：Shanghai, CN"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      具体场地
                    </label>
                    <input
                      type="text"
                      value={basicInfo.venue}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, venue: e.target.value })
                      }
                      placeholder="例如：张江人工智能岛"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* 形式和规模 */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      <Ticket size={14} className="inline mr-1" />
                      活动形式 *
                    </label>
                    <select
                      value={basicInfo.format}
                      onChange={(e) =>
                        setBasicInfo({
                          ...basicInfo,
                          format: e.target.value as 'offline' | 'online' | 'hybrid',
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="offline" className="bg-gray-900">
                        线下
                      </option>
                      <option value="online" className="bg-gray-900">
                        线上
                      </option>
                      <option value="hybrid" className="bg-gray-900">
                        混合
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      <Trophy size={14} className="inline mr-1" />
                      奖金池
                    </label>
                    <input
                      type="text"
                      value={basicInfo.prizePool}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, prizePool: e.target.value })
                      }
                      placeholder="例如：$100,000"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      <Users size={14} className="inline mr-1" />
                      团队规模
                    </label>
                    <input
                      type="text"
                      value={basicInfo.teams}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, teams: e.target.value })
                      }
                      placeholder="例如：100 组"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* 链接 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      <Globe size={14} className="inline mr-1" />
                      官方网站/报名链接/推文链接
                    </label>
                    <input
                      type="url"
                      value={basicInfo.website}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, website: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-space-mono text-sm text-gray-400 mb-2">
                      <FileText size={14} className="inline mr-1" />
                      题目/Brief 链接
                    </label>
                    <input
                      type="url"
                      value={basicInfo.brief}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, brief: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* 简介 */}
                <div>
                  <label className="block font-space-mono text-sm text-gray-400 mb-2">
                    活动简介 *
                  </label>
                  <textarea
                    value={basicInfo.summary}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, summary: e.target.value })
                    }
                    placeholder="用一两句话介绍这个黑客松的特点和亮点..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                  />
                </div>
              </div>

              {/* 导航按钮 */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setStep('input-method')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-space-mono text-sm text-gray-300"
                >
                  <ArrowLeft size={16} />
                  上一步
                </button>
                <button
                  onClick={() => setStep('details')}
                  disabled={!canProceedToDetails}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all font-space-mono text-sm text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: 详细内容（Notion 风格编辑器） */}
          {step === 'details' && (
            <div>
              <h1 className="font-sora text-3xl font-bold text-white mb-3">
                详细内容
              </h1>
              <p className="font-space-mono text-gray-400 mb-8">
                自由编辑活动详情，添加赛道、日程、福利等信息（类似 Notion）
              </p>

              <div className="glass rounded-2xl p-6 md:p-8 border border-white/5 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-sora text-lg font-semibold text-white">
                    内容编辑器
                  </h3>
                  <div className="flex items-center gap-2 text-gray-500 font-space-mono text-xs">
                    <span>按 Enter 添加新块</span>
                    <span>·</span>
                    <span>拖拽调整顺序</span>
                  </div>
                </div>

                <BlockEditor
                  blocks={detailBlocks}
                  onChange={setDetailBlocks}
                  placeholder="输入内容，或点击左侧 + 选择块类型..."
                />
              </div>

              {/* 导航按钮 */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep('basic-info')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-space-mono text-sm text-gray-300"
                >
                  <ArrowLeft size={16} />
                  上一步
                </button>
                <div className="flex items-center gap-3">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-space-mono text-sm text-gray-300">
                    <Save size={16} />
                    保存草稿
                  </button>
                  <button
                    onClick={() => setStep('preview')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all font-space-mono text-sm text-white shadow-lg shadow-indigo-500/30"
                  >
                    预览
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 预览和发布 */}
          {step === 'preview' && (
            <div>
              <h1 className="font-sora text-3xl font-bold text-white mb-3">
                预览与发布
              </h1>
              <p className="font-space-mono text-gray-400 mb-8">
                确认信息无误后提交审核
              </p>

              {/* 预览卡片 */}
              <div className="glass rounded-2xl p-6 md:p-8 border border-white/5 mb-8">
                {/* 基本信息预览 */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-white font-sora font-bold text-2xl flex-shrink-0">
                    {basicInfo.shortName?.charAt(0) || basicInfo.name?.charAt(0) || 'H'}
                  </div>
                  <div>
                    <h3 className="font-sora text-2xl font-bold text-white mb-1">
                      {basicInfo.name || '活动名称'}
                    </h3>
                    <p className="font-space-mono text-sm text-gray-400">
                      {basicInfo.theme || '主题'}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar size={14} />
                      <span className="font-space-mono text-xs">日期</span>
                    </div>
                    <span className="font-sora text-sm text-white">
                      {basicInfo.dateRange || '-'}
                    </span>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <MapPin size={14} />
                      <span className="font-space-mono text-xs">地点</span>
                    </div>
                    <span className="font-sora text-sm text-white">
                      {basicInfo.city || '-'}
                    </span>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Trophy size={14} />
                      <span className="font-space-mono text-xs">奖金</span>
                    </div>
                    <span className="font-sora text-sm text-white">
                      {basicInfo.prizePool || '-'}
                    </span>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Ticket size={14} />
                      <span className="font-space-mono text-xs">形式</span>
                    </div>
                    <span className="font-sora text-sm text-white">
                      {basicInfo.format === 'offline'
                        ? '线下'
                        : basicInfo.format === 'online'
                        ? '线上'
                        : '混合'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="font-space-mono text-sm text-gray-300">
                    {basicInfo.summary || '活动简介...'}
                  </p>
                </div>

                {/* 详细内容预览 */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <h4 className="font-sora text-sm font-semibold text-gray-400 mb-4">
                    详细内容预览
                  </h4>
                  <div className="space-y-2 text-sm text-gray-400">
                    {detailBlocks.filter((b) => b.content).slice(0, 5).map((block) => (
                      <div key={block.id} className="truncate">
                        {block.type === 'heading1' && (
                          <span className="font-bold text-white"># {block.content}</span>
                        )}
                        {block.type === 'heading2' && (
                          <span className="font-semibold text-gray-300">## {block.content}</span>
                        )}
                        {block.type === 'paragraph' && block.content}
                        {block.type === 'bulletList' && `• ${block.content}`}
                      </div>
                    ))}
                    {detailBlocks.filter((b) => b.content).length > 5 && (
                      <span className="text-gray-500">...还有更多内容</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 导航按钮 */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep('details')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-space-mono text-sm text-gray-300"
                >
                  <ArrowLeft size={16} />
                  返回编辑
                </button>
                <button className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all font-space-mono text-sm text-white shadow-lg shadow-green-500/30">
                  <Send size={16} />
                  提交审核
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
