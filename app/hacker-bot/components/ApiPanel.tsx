'use client';

import { useState } from 'react';
import {
  Globe,
  Search,
  ExternalLink,
  Copy,
  ChevronRight,
  Key,
  Zap,
  BookOpen,
  Link2,
  Check,
  Plus,
  Settings,
  ShieldCheck,
  CircleDot,
} from 'lucide-react';
import { LLM_PROVIDERS } from '@/lib/openclaw/providers';
import type { ApiKeyStatus } from './SettingsModal';

interface ApiItem {
  id: string;
  name: string;
  description: string;
  category: 'ai' | 'data' | 'media' | 'infra' | 'social';
  baseUrl: string;
  authType: 'api-key' | 'oauth' | 'none';
  freeQuota?: string;
  docs?: string;
  status: 'available' | 'connected';
  keyHint?: string;
}

const COMMON_APIS: ApiItem[] = [
  {
    id: 'github',
    name: 'GitHub API',
    description: 'Repos, Issues, Actions — 代码托管和 CI/CD',
    category: 'infra',
    baseUrl: 'api.github.com',
    authType: 'oauth',
    freeQuota: '5000 req/h',
    docs: 'https://docs.github.com/rest',
    status: 'available',
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: '开源 Firebase 替代 — 数据库、认证、存储',
    category: 'infra',
    baseUrl: 'supabase.co',
    authType: 'api-key',
    freeQuota: 'Free tier',
    docs: 'https://supabase.com/docs',
    status: 'available',
  },
  {
    id: 'resend',
    name: 'Resend',
    description: '开发者友好的邮件发送服务',
    category: 'social',
    baseUrl: 'api.resend.com',
    authType: 'api-key',
    freeQuota: '100 emails/day',
    docs: 'https://resend.com/docs',
    status: 'available',
  },
  {
    id: 'unsplash',
    name: 'Unsplash API',
    description: '免费高质量图片搜索和下载',
    category: 'media',
    baseUrl: 'api.unsplash.com',
    authType: 'api-key',
    freeQuota: '50 req/h',
    docs: 'https://unsplash.com/documentation',
    status: 'available',
  },
  {
    id: 'vercel',
    name: 'Vercel API',
    description: '部署、域名管理、Serverless Functions',
    category: 'infra',
    baseUrl: 'api.vercel.com',
    authType: 'api-key',
    docs: 'https://vercel.com/docs/rest-api',
    status: 'available',
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  ai: { label: 'AI', color: 'text-purple-400 bg-purple-500/10' },
  data: { label: '数据', color: 'text-blue-400 bg-blue-500/10' },
  media: { label: '媒体', color: 'text-pink-400 bg-pink-500/10' },
  infra: { label: '基础设施', color: 'text-emerald-400 bg-emerald-500/10' },
  social: { label: '社交/通信', color: 'text-amber-400 bg-amber-500/10' },
};

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  anthropic: 'Claude Opus/Sonnet — 高级推理和分析',
  openai: 'GPT-4o, o1 — 文本生成和推理',
  google: 'Gemini 2.0 Flash — 多模态 AI',
  deepseek: 'DeepSeek Chat — 高性价比推理',
  mistral: 'Mistral Large — 欧洲开源 AI',
};

function buildApiList(apiKeyStatus: ApiKeyStatus | null): ApiItem[] {
  const items: ApiItem[] = [];
  const activeProvider = apiKeyStatus?.provider || null;

  // LLM providers (exclude 'custom')
  for (const p of Object.values(LLM_PROVIDERS)) {
    if (p.id === 'custom') continue;
    const isActive = activeProvider === p.id && apiKeyStatus?.providerKey;
    items.push({
      id: `llm-${p.id}`,
      name: p.name,
      description: PROVIDER_DESCRIPTIONS[p.id] || 'LLM API',
      category: 'ai',
      baseUrl: p.baseUrl.replace('https://', ''),
      authType: 'api-key',
      docs: p.keyLink,
      status: isActive ? 'connected' : 'available',
      keyHint: isActive && apiKeyStatus?.providerKeyLast4
        ? `****${apiKeyStatus.providerKeyLast4}`
        : undefined,
    });
  }

  // OpenClaw
  if (apiKeyStatus?.openclaw) {
    items.push({
      id: 'openclaw',
      name: 'OpenClaw',
      description: 'AI Agent 工具调用平台',
      category: 'ai',
      baseUrl: 'api.openclaw.com',
      authType: 'api-key',
      status: 'connected',
      keyHint: apiKeyStatus.openclawLast4
        ? `****${apiKeyStatus.openclawLast4}`
        : undefined,
    });
  }

  items.push(...COMMON_APIS);
  return items;
}

interface ApiPanelProps {
  apiKeyStatus: ApiKeyStatus | null;
  onOpenSettings: () => void;
}

export function ApiPanel({ apiKeyStatus, onOpenSettings }: ApiPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null);
  const [customDocs, setCustomDocs] = useState<Record<string, string>>({});
  const [docUrlInput, setDocUrlInput] = useState('');
  const [docSaved, setDocSaved] = useState(false);

  const allApis = buildApiList(apiKeyStatus);
  const sorted = [...allApis].sort((a, b) => {
    if (a.status === 'connected' && b.status !== 'connected') return -1;
    if (a.status !== 'connected' && b.status === 'connected') return 1;
    return 0;
  });
  const filtered = sorted.filter(
    (api) =>
      api.name.toLowerCase().includes(search.toLowerCase()) ||
      api.description.toLowerCase().includes(search.toLowerCase())
  );
  const connectedCount = allApis.filter((a) => a.status === 'connected').length;

  const handleSaveDocUrl = () => {
    if (!selectedApi || !docUrlInput.trim()) return;
    setCustomDocs((prev) => ({ ...prev, [selectedApi.id]: docUrlInput.trim() }));
    setDocSaved(true);
    setTimeout(() => setDocSaved(false), 1500);
  };

  // --- Detail view ---
  if (selectedApi) {
    const savedDocUrl = customDocs[selectedApi.id] || '';
    const isConnected = selectedApi.status === 'connected';

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <button
            onClick={() => {
              setSelectedApi(null);
              setDocUrlInput('');
              setDocSaved(false);
            }}
            className="p-1 rounded hover:bg-white/5 text-gray-400"
          >
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <h3 className="font-sora text-sm font-semibold text-white">
            {selectedApi.name}
          </h3>
          <span
            className={`font-space-mono text-[9px] px-1.5 py-0.5 rounded ${
              CATEGORY_LABELS[selectedApi.category].color
            }`}
          >
            {CATEGORY_LABELS[selectedApi.category].label}
          </span>
          {isConnected && (
            <ShieldCheck size={13} className="text-emerald-400 ml-auto" />
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="font-space-mono text-xs text-gray-400">
            {selectedApi.description}
          </p>

          {/* Status badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-space-mono ${
              isConnected
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-white/[0.03] border border-white/[0.06] text-gray-500'
            }`}
          >
            <CircleDot size={9} />
            {isConnected ? '已配置' : '未配置'}
          </div>

          <div className="space-y-2">
            <DetailRow icon={<Globe size={12} />} label="Base URL" value={selectedApi.baseUrl} copyable />
            <DetailRow icon={<Key size={12} />} label="认证方式" value={selectedApi.authType} />
            {selectedApi.keyHint && (
              <DetailRow icon={<ShieldCheck size={12} />} label="API Key" value={selectedApi.keyHint} />
            )}
            {selectedApi.freeQuota && (
              <DetailRow icon={<Zap size={12} />} label="免费额度" value={selectedApi.freeQuota} />
            )}
          </div>

          {selectedApi.docs && (
            <a
              href={selectedApi.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 transition-colors"
            >
              <BookOpen size={14} className="text-indigo-400" />
              <span className="font-space-mono text-xs text-indigo-300">
                查看文档
              </span>
              <ExternalLink size={10} className="text-indigo-400 ml-auto" />
            </a>
          )}

          {/* Custom API Docs URL Input */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Link2 size={12} className="text-cyan-400" />
              <span className="font-space-mono text-[10px] text-gray-400">
                参考文档 URL
              </span>
            </div>
            <div className="flex gap-1.5">
              <input
                value={docUrlInput || savedDocUrl}
                onChange={(e) => {
                  setDocUrlInput(e.target.value);
                  setDocSaved(false);
                }}
                onFocus={() => {
                  if (!docUrlInput && savedDocUrl) setDocUrlInput(savedDocUrl);
                }}
                placeholder="粘贴 API 接入文档链接..."
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] font-space-mono text-[11px] text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/30 transition-colors"
              />
              <button
                onClick={handleSaveDocUrl}
                disabled={!docUrlInput.trim() || docSaved}
                className={`px-2.5 py-1.5 rounded-lg font-space-mono text-[11px] transition-all flex items-center gap-1 flex-shrink-0 ${
                  docSaved
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {docSaved ? <Check size={11} /> : <Plus size={11} />}
                {docSaved ? '已保存' : '保存'}
              </button>
            </div>
            {savedDocUrl && !docSaved && (
              <a
                href={savedDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-space-mono text-[10px] text-cyan-400/70 hover:text-cyan-400 transition-colors truncate"
              >
                <ExternalLink size={9} />
                {savedDocUrl.replace(/^https?:\/\//, '').slice(0, 40)}
                {savedDocUrl.replace(/^https?:\/\//, '').length > 40 ? '...' : ''}
              </a>
            )}
          </div>

          <div className="pt-3 border-t border-white/5">
            <p className="font-space-mono text-[10px] text-gray-600">
              在 Agent 对话中输入 &ldquo;帮我接入 {selectedApi.name}&rdquo; 来让 Bot 协助配置
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- List view ---
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-white/5 space-y-2">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-indigo-400" />
          <h3 className="font-sora text-sm font-semibold text-white">API</h3>
          {connectedCount > 0 && (
            <span className="font-space-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {connectedCount} 已配置
            </span>
          )}
          <button
            onClick={onOpenSettings}
            className="ml-auto p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
            title="打开设置"
          >
            <Settings size={13} />
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 API..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] font-space-mono text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {(() => {
          const connected = filtered.filter((a) => a.status === 'connected');
          const available = filtered.filter((a) => a.status !== 'connected');

          return (
            <>
              {/* Connected APIs */}
              {connected.map((api) => (
                <ApiCard key={api.id} api={api} onClick={() => setSelectedApi(api)} />
              ))}

              {/* Divider between connected and recommended */}
              {connected.length > 0 && available.length > 0 && (
                <div className="flex items-center gap-2 py-2">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="font-space-mono text-[9px] text-gray-600 flex-shrink-0">
                    推荐常用
                  </span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
              )}

              {/* Available APIs */}
              {available.map((api) => (
                <ApiCard key={api.id} api={api} onClick={() => setSelectedApi(api)} />
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-6">
                  <p className="font-space-mono text-xs text-gray-600">没有找到匹配的 API</p>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

function ApiCard({ api, onClick }: { api: ApiItem; onClick: () => void }) {
  const isConnected = api.status === 'connected';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all group ${
        isConnected
          ? 'bg-emerald-500/[0.04] border-emerald-500/15 hover:bg-emerald-500/[0.08] hover:border-emerald-500/25'
          : 'bg-white/[0.015] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1]'
      }`}
    >
      <div className="flex items-center gap-2">
        <CircleDot
          size={10}
          className={`flex-shrink-0 ${isConnected ? 'text-emerald-400' : 'text-gray-600'}`}
        />
        <span
          className={`font-sora text-xs font-medium transition-colors ${
            isConnected
              ? 'text-emerald-300 group-hover:text-emerald-200'
              : 'text-gray-200 group-hover:text-white'
          }`}
        >
          {api.name}
        </span>
        <span
          className={`font-space-mono text-[9px] px-1.5 py-0.5 rounded ${
            CATEGORY_LABELS[api.category].color
          }`}
        >
          {CATEGORY_LABELS[api.category].label}
        </span>
        {api.keyHint && (
          <span className="ml-auto font-space-mono text-[9px] text-emerald-400/60">
            {api.keyHint}
          </span>
        )}
      </div>
      <p className="font-space-mono text-[10px] text-gray-500 mt-1 truncate pl-[18px]">
        {api.description}
      </p>
    </button>
  );
}

function DetailRow({
  icon,
  label,
  value,
  copyable,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-white/[0.02]">
      <span className="text-gray-500">{icon}</span>
      <span className="font-space-mono text-[10px] text-gray-500 w-16 flex-shrink-0">
        {label}
      </span>
      <span className="font-space-mono text-xs text-gray-300 flex-1 truncate">
        {value}
      </span>
      {copyable && (
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="p-0.5 rounded hover:bg-white/5 text-gray-600 hover:text-gray-400"
        >
          <Copy size={10} />
        </button>
      )}
    </div>
  );
}
