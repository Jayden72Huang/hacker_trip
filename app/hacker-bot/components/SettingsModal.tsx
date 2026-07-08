'use client';

import { useState } from 'react';
import { Settings, X, Eye, EyeOff, ExternalLink, Check, Loader2, ChevronDown } from 'lucide-react';
import { LLM_PROVIDERS, type ProviderId } from '@/lib/openclaw/providers';

export interface ApiKeyStatus {
  anthropic: boolean;
  openclaw: boolean;
  anthropicLast4: string | null;
  openclawLast4: string | null;
  provider: string | null;
  providerKey: boolean;
  providerKeyLast4: string | null;
  providerBaseUrl: string | null;
}

interface SettingsModalProps {
  teamId: string;
  apiKeyStatus: ApiKeyStatus;
  onClose: () => void;
  onSaved: () => void;
}

const PROVIDER_ORDER: ProviderId[] = ['anthropic', 'openai', 'google', 'deepseek', 'mistral', 'custom'];

export function SettingsModal({ teamId, apiKeyStatus, onClose, onSaved }: SettingsModalProps) {
  const currentProvider = (apiKeyStatus.provider || 'anthropic') as ProviderId;
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(currentProvider);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(apiKeyStatus.providerBaseUrl || '');
  const [openclawKey, setOpenclawKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showOpenclaw, setShowOpenclaw] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const provider = LLM_PROVIDERS[selectedProvider];
  const isCurrentProvider = selectedProvider === currentProvider;
  const hasExistingKey = isCurrentProvider && apiKeyStatus.providerKey;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const body: Record<string, string | null> = {
        llmProvider: selectedProvider,
      };

      // API key: require if switching provider or no existing key
      if (apiKey.trim()) {
        body.llmApiKey = apiKey.trim();
      } else if (!hasExistingKey) {
        setError('请输入 API Key');
        setSaving(false);
        return;
      }

      // Base URL only for custom provider
      if (selectedProvider === 'custom') {
        if (!baseUrl.trim() && !apiKeyStatus.providerBaseUrl) {
          setError('自定义 Provider 需要填写 Base URL');
          setSaving(false);
          return;
        }
        if (baseUrl.trim()) body.llmBaseUrl = baseUrl.trim();
      } else {
        body.llmBaseUrl = null;
      }

      // OpenClaw key (advanced)
      if (openclawKey.trim()) body.openclawApiKey = openclawKey.trim();

      const res = await fetch(`/api/agent/team/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '保存失败');
      }

      setSuccess(true);
      setApiKey('');
      setOpenclawKey('');
      setTimeout(() => onSaved(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-[#0d0e14] border border-white/[0.08] rounded-2xl shadow-2xl shadow-[#7c5dff]/10 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#7c5dff] to-transparent flex-shrink-0" />

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c5dff]/20 to-[#c759ff]/20 border border-[#7c5dff]/20 flex items-center justify-center">
                <Settings size={16} className="text-[#7c5dff]" />
              </div>
              <h2 className="font-sora text-base font-semibold text-white">
                AI 模型设置
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            选择 AI 模型提供商并配置 API Key，用于驱动 Hacker Bot 对话能力。Key 仅用于你的团队，不会分享给其他人。
          </p>

          {/* Provider selector grid */}
          <div className="space-y-2.5">
            <label className="text-sm font-medium text-gray-300">选择模型提供商</label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDER_ORDER.map((pid) => {
                const p = LLM_PROVIDERS[pid];
                const isSelected = selectedProvider === pid;
                const isCurrent = pid === currentProvider && apiKeyStatus.providerKey;
                return (
                  <button
                    key={pid}
                    onClick={() => {
                      setSelectedProvider(pid);
                      setApiKey('');
                      setShowKey(false);
                      setError(null);
                    }}
                    className={`relative px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#7c5dff]/10 border-[#7c5dff]/40 ring-1 ring-[#7c5dff]/20'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="font-space-mono text-xs font-medium text-white truncate">
                      {p.name.split(' (')[0]}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                      {p.name.includes('(') ? p.name.match(/\(([^)]+)\)/)?.[1] : p.defaultModel}
                    </div>
                    {isCurrent && (
                      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                {provider.name} API Key
              </label>
              {hasExistingKey && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-space-mono">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  已配置 (****{apiKeyStatus.providerKeyLast4})
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasExistingKey ? '输入新 Key 替换现有配置...' : provider.keyPlaceholder}
                className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7c5dff]/40 focus:ring-1 focus:ring-[#7c5dff]/20 transition-all font-space-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {provider.keyLink && (
              <a
                href={provider.keyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#7c5dff]/70 hover:text-[#7c5dff] transition-colors"
              >
                获取 {provider.name.split(' (')[0]} API Key
                <ExternalLink size={10} />
              </a>
            )}
          </div>

          {/* Base URL input (custom provider only) */}
          {selectedProvider === 'custom' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://your-api.com/v1"
                className="w-full pl-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7c5dff]/40 focus:ring-1 focus:ring-[#7c5dff]/20 transition-all font-space-mono"
              />
              <p className="text-[10px] text-gray-600">
                需要兼容 OpenAI Chat Completions API 格式（/chat/completions 端点）
              </p>
            </div>
          )}

          {/* Advanced: OpenClaw Key */}
          <div className="border-t border-white/[0.06] pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ChevronDown
                size={12}
                className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
              高级设置
              {apiKeyStatus.openclaw && (
                <span className="ml-1.5 text-[10px] text-emerald-400/60">OpenClaw 已配置</span>
              )}
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">
                    OpenClaw API Key
                    <span className="text-gray-600 text-xs ml-1.5">（可选）</span>
                  </label>
                  {apiKeyStatus.openclaw && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-space-mono">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      已配置 (****{apiKeyStatus.openclawLast4})
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showOpenclaw ? 'text' : 'password'}
                    value={openclawKey}
                    onChange={(e) => setOpenclawKey(e.target.value)}
                    placeholder={apiKeyStatus.openclaw ? '输入新 Key 替换...' : 'OpenClaw Gateway Key'}
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7c5dff]/40 focus:ring-1 focus:ring-[#7c5dff]/20 transition-all font-space-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenclaw(!showOpenclaw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showOpenclaw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-600">
                  如果配置了 OpenClaw Key，将优先使用 OpenClaw 网关代理请求。
                </p>
              </div>
            )}
          </div>

          {/* Error / Success */}
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <Check size={12} />
              保存成功
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || (!apiKey.trim() && !hasExistingKey && !openclawKey.trim())}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#7c5dff] to-[#c759ff] text-white font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-[#7c5dff]/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                保存中...
              </>
            ) : (
              '保存配置'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
