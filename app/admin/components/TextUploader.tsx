'use client';

import { useState } from 'react';

interface TextUploaderProps {
  onSuccess?: () => void;
}

export function TextUploader({ onSuccess }: TextUploaderProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!text.trim() || text.trim().length < 10) {
      setError('请输入至少10个字符的文本');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 解析文本
      const parseRes = await fetch('/api/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const parseData = await parseRes.json();

      if (!parseRes.ok || !parseData.success) {
        throw new Error(parseData.error || '解析失败');
      }

      // 保存到草稿箱
      const draftRes = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: parseData.data,
          source: 'manual'
        })
      });

      const draftData = await draftRes.json();

      if (!draftRes.ok || !draftData.success) {
        throw new Error('保存草稿失败');
      }

      setResult({
        ...parseData,
        draft: draftData.draft
      });

      // 清空输入
      setText('');

      // 通知父组件
      onSuccess?.();

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
    };
    reader.readAsText(file);
  };

  const exampleText = `2024 北京 AI 黑客松
时间: 3月15日-16日
地点: 中关村创业大街
奖金: ¥50,000
形式: 线下
主题: 人工智能与大模型应用

简介:
聚焦 AI 大模型应用创新，邀请开发者、设计师、产品经理共同探索 AI 的无限可能。

赛道:
1. AI 工具与效率提升
2. AI + 教育创新
3. AI 内容创作

日程:
9:00 报到签到
10:00 开幕式
12:00 午餐
18:00 第一天结束`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sora text-xl font-bold text-white mb-2">
          上传或粘贴文本
        </h2>
        <p className="font-space-mono text-sm text-gray-400">
          支持纯文本、TXT 文件，系统将自动提取黑客松信息
        </p>
      </div>

      {/* File Upload */}
      <div className="flex gap-3">
        <label className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors cursor-pointer">
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <span className="font-space-mono text-sm text-gray-400">
            📎 点击上传 TXT 文件
          </span>
        </label>
        <button
          onClick={() => setText(exampleText)}
          className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-space-mono text-sm text-gray-400"
        >
          加载示例
        </button>
      </div>

      {/* Text Area */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="在此粘贴黑客松信息...&#10;&#10;包括: 活动名称、时间、地点、奖金、主题、简介等"
        className="w-full h-64 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm resize-none"
        disabled={loading}
      />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="font-space-mono text-xs text-gray-500">
          {text.length} 字符
        </span>
        <div className="flex gap-3">
          <button
            onClick={() => setText('')}
            disabled={loading || !text}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-space-mono text-sm text-gray-400"
          >
            清空
          </button>
          <button
            onClick={handleParse}
            disabled={loading || !text.trim() || text.trim().length < 10}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all font-space-mono text-sm font-medium text-white"
          >
            {loading ? '解析中...' : '开始解析'}
          </button>
        </div>
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
              ✅ 解析成功！已保存到草稿箱
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-space-mono text-xs text-gray-500">置信度:</span>
              <span className={`font-space-mono text-sm font-bold ${
                result.confidence > 0.7 ? 'text-green-400' :
                result.confidence > 0.4 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {(result.confidence * 100).toFixed(0)}%
              </span>
              {result.confidence < 0.7 && (
                <span className="font-space-mono text-xs text-yellow-400">
                  建议在草稿箱中完善信息
                </span>
              )}
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
    </div>
  );
}
