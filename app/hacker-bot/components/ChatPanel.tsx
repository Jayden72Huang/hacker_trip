'use client';

import { useRef, useEffect } from 'react';
import { Bot, User, Github, Globe, Bell, Loader2, CheckCircle2, XCircle, Wrench, Settings } from 'lucide-react';
import type { Message } from './HackerBot';
import type { ToolCallInfo } from '../hooks/useStreamingChat';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onOpenSettings?: () => void;
}

export function ChatPanel({ messages, isLoading, onOpenSettings }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' && (
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mt-0.5">
              <Bot size={16} className="text-white" />
            </div>
          )}

          <div
            className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                : 'bg-white/[0.04] border border-white/[0.06] text-gray-200'
            }`}
          >
            {msg.isFallback && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-space-mono text-[10px] text-amber-400/70 tracking-wider">
                  AI大模型站岗ing
                </span>
              </div>
            )}
            {msg.skillName && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-space-mono text-[10px] text-emerald-400/70 uppercase tracking-wider">
                  {msg.skillName}
                </span>
              </div>
            )}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {msg.toolCalls.map((tc) => (
                  <ToolCallBadge key={tc.id} toolCall={tc} />
                ))}
              </div>
            )}
            <div className="font-space-mono text-sm leading-relaxed whitespace-pre-wrap">
              {msg.isStreaming && !msg.content && (!msg.toolCalls || msg.toolCalls.length === 0) ? (
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse font-semibold">
                    HackerBot
                  </span>
                  <span className="text-gray-400 animate-pulse">正在思考</span>
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              ) : (
                <>
                  <FormattedContent content={msg.content} />
                  {msg.isStreaming && (
                    <span className="inline-block w-[2px] h-4 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
                  )}
                </>
              )}
            </div>
            {/* CTA button for API key configuration errors */}
            {msg.role === 'assistant' && msg.content.includes('配置 API Key') && onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c5dff]/15 border border-[#7c5dff]/25 text-[#7c5dff] text-xs font-medium hover:bg-[#7c5dff]/25 transition-colors"
              >
                <Settings size={12} />
                配置 API Key
              </button>
            )}
            <div className="mt-2 font-space-mono text-[10px] text-gray-600">
              {msg.timestamp.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {msg.role === 'user' && (
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mt-0.5">
              <User size={16} className="text-gray-400" />
            </div>
          )}
        </div>
      ))}

      {isLoading && !messages.some((m) => m.isStreaming) && (
        <div className="flex gap-3 justify-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mt-0.5">
            <Bot size={16} className="text-white" />
          </div>
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  // Simple markdown-like formatting: **bold**, *italic*, `code`, > blockquote
  const lines = content.split('\n');

  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith('> ')) {
          return (
            <div key={i} className="border-l-2 border-indigo-500/50 pl-3 my-1 text-gray-400">
              <FormattedLine text={line.slice(2)} />
            </div>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2 my-0.5">
              <span className="text-indigo-400 flex-shrink-0">&#8226;</span>
              <FormattedLine text={line.slice(2)} />
            </div>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const [num, ...rest] = line.split('. ');
          return (
            <div key={i} className="flex gap-2 my-0.5">
              <span className="text-indigo-400 flex-shrink-0 font-medium">{num}.</span>
              <FormattedLine text={rest.join('. ')} />
            </div>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <div key={i} className="font-sora font-semibold text-white mt-3 mb-1">
              {line.slice(4)}
            </div>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <div key={i} className="font-sora font-bold text-white mt-3 mb-1 text-base">
              {line.slice(3)}
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        return (
          <div key={i}>
            <FormattedLine text={line} />
          </div>
        );
      })}
    </>
  );
}

const TOOL_META: Record<string, { label: string; icon: typeof Github; color: string }> = {
  github_search: { label: '搜索 GitHub', icon: Github, color: 'text-gray-300 bg-gray-500/10 border-gray-500/20' },
  web_scrape: { label: '抓取页面', icon: Globe, color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20' },
  set_reminder: { label: '设置提醒', icon: Bell, color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
};

function ToolCallBadge({ toolCall }: { toolCall: ToolCallInfo }) {
  const meta = TOOL_META[toolCall.name] || {
    label: toolCall.name,
    icon: Wrench,
    color: 'text-gray-300 bg-gray-500/10 border-gray-500/20',
  };
  const Icon = meta.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-space-mono ${meta.color}`}
    >
      <Icon size={12} />
      <span>{meta.label}</span>
      {toolCall.status === 'running' && (
        <Loader2 size={10} className="animate-spin ml-0.5" />
      )}
      {toolCall.status === 'success' && (
        <CheckCircle2 size={10} className="text-emerald-400 ml-0.5" />
      )}
      {toolCall.status === 'error' && (
        <XCircle size={10} className="text-red-400 ml-0.5" />
      )}
    </div>
  );
}

function FormattedLine({ text }: { text: string }) {
  // Process inline formatting: **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </span>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <span key={i} className="italic text-gray-300">
              {part.slice(1, -1)}
            </span>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 text-xs"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
