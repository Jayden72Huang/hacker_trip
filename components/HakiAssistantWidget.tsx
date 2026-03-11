'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Bot, LoaderCircle, MessageCircle, Send, Sparkles, X, Zap } from 'lucide-react';
import { starterQuestions } from '@/data/platform-assistant';

type StreamPhase = 'connecting' | 'thinking' | 'streaming' | 'done' | 'error';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

type ErrorState = {
  code: string;
  message: string;
  hint: string;
  retryable: boolean;
};

const HIDDEN_PREFIXES = ['/admin', '/agent-studio', '/hacker-bot'];

const quickTags = [
  { label: '找比赛', prompt: starterQuestions[0] },
  { label: '新手入门', prompt: starterQuestions[1] },
  { label: '报名方式', prompt: starterQuestions[2] },
  { label: '项目推广', prompt: starterQuestions[3] },
  { label: '发起活动', prompt: starterQuestions[4] },
];

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      '我是 AI 小助手 Haki，可以帮你发现黑客松、理解报名方式、准备参赛，以及赛后推广项目。',
  },
];

function renderSimpleMarkdown(text: string) {
  // split into segments: bold (**text**) and plain text
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function HakiStatusIndicator({ phase }: { phase: StreamPhase }) {
  if (phase === 'connecting') {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="relative flex h-4 w-4 items-center justify-center">
          <span className="absolute h-4 w-4 animate-ping rounded-full bg-cyan-400/40" />
          <span className="relative h-2 w-2 rounded-full bg-cyan-400" />
        </span>
        <span className="text-white/70">连接中</span>
        <span className="animate-pulse text-white/40">...</span>
      </span>
    );
  }

  if (phase === 'thinking') {
    return (
      <span className="inline-flex items-center gap-2">
        <Bot size={14} className="animate-bounce text-fuchsia-400" />
        <span className="text-white/80">Haki 正在思考</span>
        <span className="inline-flex gap-[2px]">
          <span className="h-1 w-1 animate-[bounce_1s_ease-in-out_0ms_infinite] rounded-full bg-fuchsia-400/70" />
          <span className="h-1 w-1 animate-[bounce_1s_ease-in-out_150ms_infinite] rounded-full bg-fuchsia-400/70" />
          <span className="h-1 w-1 animate-[bounce_1s_ease-in-out_300ms_infinite] rounded-full bg-fuchsia-400/70" />
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <LoaderCircle size={14} className="animate-spin text-cyan-300" />
      <span className="text-white/70">生成中...</span>
    </span>
  );
}

export function HakiAssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [streamPhase, setStreamPhase] = useState<StreamPhase>('done');
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isThinking = streamPhase !== 'done' && streamPhase !== 'error';

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamPhase, open]);

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  async function requestAssistantReply(history: ChatMessage[], latestMessage: string) {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setStreamPhase('connecting');
    setErrorState(null);

    const assistantId = `assistant-${Date.now()}`;

    try {
      const response = await fetch('/api/haki/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abort.signal,
        body: JSON.stringify({
          message: latestMessage,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      // non-streaming error (JSON response)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setErrorState({
          code: data.code || 'request_failed',
          message: data.error || 'Haki 暂时无法回复，请稍后再试。',
          hint: data.hint || '请稍后重试。',
          retryable: Boolean(data.retryable),
        });
        setStreamPhase('error');
        return;
      }

      if (!response.body) {
        setErrorState({ code: 'empty_response', message: '未收到响应。', hint: '请重试。', retryable: true });
        setStreamPhase('error');
        return;
      }

      // add placeholder message for streaming
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event: ')) {
            const eventType = trimmed.slice(7);
            // read next data line
            const dataIdx = lines.indexOf(line) + 1;
            // we handle event+data in the data line below
            void eventType;
            continue;
          }

          if (!trimmed.startsWith('data: ')) continue;
          const payload = trimmed.slice(6);

          try {
            const parsed = JSON.parse(payload);

            if (parsed.phase === 'thinking') {
              setStreamPhase('thinking');
            } else if (parsed.phase === 'streaming') {
              setStreamPhase('streaming');
            } else if (parsed.text) {
              accumulated += parsed.text;
              const snapshot = accumulated;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot } : m))
              );
            } else if (parsed.code) {
              // inline error from stream
              setErrorState({
                code: parsed.code,
                message: parsed.message || '流式传输出错。',
                hint: parsed.hint || '请重试。',
                retryable: Boolean(parsed.retryable),
              });
            }
          } catch {
            // skip malformed JSON
          }
        }
      }

      // if no content was streamed, remove empty placeholder
      if (!accumulated) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        if (!errorState) {
          setErrorState({ code: 'empty_response', message: 'Haki 未返回内容。', hint: '请重试。', retryable: true });
        }
      }

      setStreamPhase('done');
    } catch (error) {
      if (abort.signal.aborted) return;

      setErrorState({
        code: 'network_error',
        message: 'Haki 暂时无法连接 AI 服务。',
        hint: '请检查网络，或稍后重试。',
        retryable: true,
      });
      setStreamPhase('error');
      // remove empty placeholder if exists
      setMessages((prev) => {
        const msg = prev.find((m) => m.id === assistantId);
        if (msg && !msg.content) return prev.filter((m) => m.id !== assistantId);
        return prev;
      });
    }
  }

  function submitMessage(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isThinking) return;

    setOpen(true);
    setLastPrompt(trimmed);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const previousHistory = messages;
    const nextHistory = [...previousHistory, userMessage];
    setMessages(nextHistory);
    setInput('');
    void requestAssistantReply(previousHistory, trimmed);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage(input);
  }

  function retryLastPrompt() {
    if (!lastPrompt || isThinking) return;
    submitMessage(lastPrompt);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[45] flex justify-center px-4 sm:bottom-6">
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="glass glow pointer-events-auto relative w-full max-w-[520px] overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.12] shadow-[0_24px_72px_rgba(7,12,24,0.34)]"
        style={{ maxHeight: open ? 'calc(100vh - 136px)' : undefined }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-65">
          <div className="absolute -left-8 top-2 h-20 w-24 rounded-full bg-fuchsia-500/18 blur-2xl" />
          <div className="absolute right-2 top-0 h-20 w-24 rounded-full bg-cyan-400/16 blur-2xl" />
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="relative flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <div className="relative flex items-center gap-4">
            <div className="glass flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.12] text-cyan-100 shadow-[0_0_22px_rgba(77,225,255,0.12)]">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="font-sora text-base font-semibold text-white">AI小助手 Haki</p>
              <p className="text-sm text-gray-200/90">发现黑客松、报名准备、项目推广</p>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            {!open && (
              <span className="glass hidden rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 font-space-mono text-[11px] uppercase tracking-[0.18em] text-cyan-100 sm:inline-flex">
                Ask
              </span>
            )}
            <div className="glass flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.1] text-white">
              {open ? <X size={16} /> : <ArrowUpRight size={16} />}
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="chat-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative border-t border-white/10 bg-white/[0.04]"
            >
              <div
                ref={scrollRef}
                className="haki-scrollbar max-h-[calc(100vh-310px)] min-h-[250px] overflow-y-auto px-4 py-4"
              >
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isStreaming = streamPhase === 'streaming' && message.role === 'assistant' && message === messages[messages.length - 1];
                    return (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={
                            message.role === 'user'
                              ? 'max-w-[84%] rounded-[22px] rounded-br-md border border-cyan-300/18 bg-cyan-400/16 px-4 py-3 text-sm leading-7 text-cyan-50 shadow-[0_0_18px_rgba(77,225,255,0.08)]'
                              : 'glass max-w-[88%] rounded-[22px] rounded-bl-md border border-white/10 bg-[rgba(255,255,255,0.11)] px-4 py-3 text-sm leading-7 text-white/92'
                          }
                        >
                          <div className="whitespace-pre-wrap">
                            {message.role === 'assistant'
                              ? renderSimpleMarkdown(message.content)
                              : message.content}
                            {isStreaming && (
                              <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-cyan-300/80" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isThinking && streamPhase !== 'streaming' && (
                    <div className="flex justify-start">
                      <div className="glass rounded-[22px] rounded-bl-md border border-white/10 bg-[rgba(255,255,255,0.11)] px-4 py-3 text-sm text-white/88">
                        <HakiStatusIndicator phase={streamPhase} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 bg-white/[0.05] px-4 py-4">
                {errorState && (
                  <div className="mb-3 rounded-[20px] border border-amber-300/18 bg-amber-400/12 px-4 py-3 text-sm text-amber-50/90">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-amber-100">{errorState.message}</p>
                        <p className="mt-1 text-xs leading-6 text-amber-50/75">{errorState.hint}</p>
                      </div>
                      {errorState.retryable && (
                        <button
                          type="button"
                          onClick={retryLastPrompt}
                          className="shrink-0 rounded-full border border-amber-200/18 bg-white/8 px-3 py-1.5 text-[11px] text-amber-50 transition-colors hover:bg-white/12"
                        >
                          重试
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="haki-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
                  {quickTags.map((tag) => (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => submitMessage(tag.prompt)}
                      className="glass shrink-0 rounded-full border border-white/10 bg-white/[0.09] px-3 py-1.5 text-xs text-white/84 transition-colors hover:bg-white/[0.14] hover:text-white"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex items-end gap-3">
                  <div className="glass relative min-h-[58px] flex-1 overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.12)]">
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder="问 Haki：我适合参加哪场 AI 黑客松？"
                      rows={1}
                      className="haki-scrollbar min-h-[58px] w-full resize-none bg-transparent px-4 py-4 text-sm text-white outline-none placeholder:text-white/45"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    className="glass flex h-[58px] w-[58px] items-center justify-center rounded-[22px] border border-cyan-300/18 bg-gradient-to-br from-cyan-400/88 to-indigo-500/88 text-white shadow-[0_12px_28px_rgba(77,225,255,0.16)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="发送消息"
                  >
                    <Send size={18} />
                  </button>
                </form>

                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-white/50">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles size={12} className="text-cyan-300" />
                    由 DeepSeek 驱动，仅回答平台公开信息
                  </span>
                  <Link href="/docs" className="inline-flex items-center gap-1 text-cyan-200 hover:text-white">
                    帮助中心
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
