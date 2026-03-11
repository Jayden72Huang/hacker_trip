'use client';

import { useState } from 'react';
import {
  Puzzle,
  Search,
  Download,
  CheckCircle,
  ExternalLink,
  Server,
  Wrench,
  ChevronRight,
  Github,
  Globe,
  Bell,
} from 'lucide-react';

interface McpServer {
  id: string;
  name: string;
  description: string;
  category: 'dev' | 'data' | 'ai' | 'design' | 'productivity';
  tools: string[];
  installCmd: string;
  status: 'installed' | 'available';
  builtin?: boolean;
}

const BUILTIN_TOOLS: McpServer[] = [
  {
    id: 'github_search',
    name: 'GitHub 搜索',
    description: '搜索 GitHub 公开仓库、代码和 Issues，发现开源项目和技术方案',
    category: 'dev',
    tools: ['search_repositories', 'search_code', 'search_issues'],
    installCmd: '内置工具，无需安装',
    status: 'installed',
    builtin: true,
  },
  {
    id: 'web_scrape',
    name: 'Web 抓取',
    description: '抓取黑客松活动页面，提取赛题、奖金、日程等结构化信息',
    category: 'data',
    tools: ['scrape_hackathon_page', 'extract_fields'],
    installCmd: '内置工具，无需安装',
    status: 'installed',
    builtin: true,
  },
  {
    id: 'set_reminder',
    name: '定时提醒',
    description: '为团队设置截止日期、Check-in、Demo 彩排等提醒',
    category: 'productivity',
    tools: ['set_reminder', 'list_reminders'],
    installCmd: '内置工具，无需安装',
    status: 'installed',
    builtin: true,
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  dev: { label: '开发', color: 'text-blue-400 bg-blue-500/10' },
  data: { label: '数据', color: 'text-emerald-400 bg-emerald-500/10' },
  ai: { label: 'AI', color: 'text-purple-400 bg-purple-500/10' },
  design: { label: '设计', color: 'text-pink-400 bg-pink-500/10' },
  productivity: { label: '效率', color: 'text-amber-400 bg-amber-500/10' },
};

export function McpPanel() {
  const [search, setSearch] = useState('');
  const [selectedMcp, setSelectedMcp] = useState<McpServer | null>(null);

  const installed = BUILTIN_TOOLS.filter(
    (m) =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedMcp) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <button
            onClick={() => setSelectedMcp(null)}
            className="p-1 rounded hover:bg-white/5 text-gray-400"
          >
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <Server size={14} className="text-indigo-400" />
          <h3 className="font-sora text-sm font-semibold text-white">
            {selectedMcp.name}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="font-space-mono text-xs text-gray-400">
            {selectedMcp.description}
          </p>

          {/* Status badge */}
          {selectedMcp.builtin ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle size={12} className="text-emerald-400" />
              <span className="font-space-mono text-[11px] text-emerald-300">
                内置工具 · 自动可用
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-black/30 border border-white/[0.06]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Download size={11} className="text-gray-500" />
                <span className="font-space-mono text-[10px] text-gray-500">
                  安装命令
                </span>
              </div>
              <code className="font-space-mono text-xs text-emerald-300 block">
                {selectedMcp.installCmd}
              </code>
            </div>
          )}

          {/* Tools list */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Wrench size={12} className="text-gray-500" />
              <span className="font-space-mono text-[10px] text-gray-500">
                提供的工具 ({selectedMcp.tools.length})
              </span>
            </div>
            <div className="space-y-1">
              {selectedMcp.tools.map((tool) => (
                <div
                  key={tool}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.02]"
                >
                  <span className="w-1 h-1 rounded-full bg-indigo-400" />
                  <code className="font-space-mono text-[11px] text-gray-300">
                    {tool}
                  </code>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/5">
            <p className="font-space-mono text-[10px] text-gray-600">
              {selectedMcp.builtin
                ? 'HackerBot 会根据对话上下文自动调用此工具，无需手动触发'
                : '安装后在 Agent 对话中自动可用，Bot 会根据需要调用这些工具'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-white/5 space-y-2">
        <div className="flex items-center gap-2">
          <Puzzle size={16} className="text-indigo-400" />
          <h3 className="font-sora text-sm font-semibold text-white">MCP</h3>
          <span className="font-space-mono text-[10px] text-gray-500">
            Model Context Protocol
          </span>
        </div>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索工具..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] font-space-mono text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Installed */}
        {installed.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Wrench size={12} className="text-indigo-400" />
              <span className="font-space-mono text-[10px] text-indigo-400 font-medium">
                内置工具 ({installed.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {installed.map((mcp) => (
                <McpCard key={mcp.id} mcp={mcp} onClick={() => setSelectedMcp(mcp)} />
              ))}
            </div>
          </div>
        )}

        {/* Coming soon */}
        <div className="px-1 pt-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Puzzle size={12} className="text-gray-600" />
            <span className="font-space-mono text-[10px] text-gray-600 font-medium">
              即将支持
            </span>
          </div>
          <p className="font-space-mono text-[10px] text-gray-600 leading-relaxed">
            团队可接入自定义 MCP Server 扩展 HackerBot 能力，如 Supabase、Figma、Slack 等。敬请期待。
          </p>
        </div>
      </div>
    </div>
  );
}

const TOOL_ICONS: Record<string, typeof Github> = {
  github_search: Github,
  web_scrape: Globe,
  set_reminder: Bell,
};

function McpCard({
  mcp,
  onClick,
}: {
  mcp: McpServer;
  onClick: () => void;
}) {
  const Icon = TOOL_ICONS[mcp.id] || Server;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg bg-white/[0.015] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
    >
      <div className="flex items-center gap-2">
        <Icon size={12} className="text-indigo-400 flex-shrink-0" />
        <span className="font-sora text-xs font-medium text-gray-200 group-hover:text-white transition-colors">
          {mcp.name}
        </span>
        <span
          className={`font-space-mono text-[9px] px-1.5 py-0.5 rounded ${
            CATEGORY_LABELS[mcp.category].color
          }`}
        >
          {CATEGORY_LABELS[mcp.category].label}
        </span>
        {mcp.builtin && (
          <CheckCircle size={11} className="text-emerald-400 ml-auto flex-shrink-0" />
        )}
      </div>
      <p className="font-space-mono text-[10px] text-gray-500 mt-1">
        {mcp.description}
      </p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="font-space-mono text-[9px] text-gray-600">
          {mcp.tools.length} tools
        </span>
        {mcp.builtin && (
          <span className="font-space-mono text-[9px] text-indigo-400/60">
            Built-in
          </span>
        )}
      </div>
    </button>
  );
}
