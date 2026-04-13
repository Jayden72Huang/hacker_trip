'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatPanel } from './ChatPanel';
import { ChatInput } from './ChatInput';
import { ArtifactViewer } from './ArtifactViewer';
import { LeftMenu, type MenuTab } from './LeftMenu';
import { NotificationBar, type Notification } from './NotificationBar';
import { HackathonBar } from './HackathonBar';
import { HackathonDetailPopup } from './HackathonDetailPopup';
import { ApiPanel } from './ApiPanel';
import { SkillPanel } from './SkillPanel';
import { McpPanel } from './McpPanel';
import { OnboardingWizard } from './OnboardingWizard';
import { InviteModal } from './InviteModal';
import { HackathonSelector } from './HackathonSelector';
import { SettingsModal } from './SettingsModal';
import { TasksPanel } from './TasksPanel';
import {
  PanelRightClose,
  PanelRightOpen,
  Check,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useHakiSession } from '../hooks/useHakiSession';
import { useStreamingChat, type ToolCallInfo } from '../hooks/useStreamingChat';
import { getDefaultAvatar } from '../utils/avatars';

export type Skill =
  | 'hackathon-analysis'
  | 'brainstorm'
  | 'project-planning'
  | 'resource-discovery'
  | 'pitch-prep'
  | null;

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  skillName?: string;
  toolCalls?: ToolCallInfo[];
  timestamp: Date;
  isStreaming?: boolean;
  isFallback?: boolean;
}

export interface Artifact {
  id: string;
  type: string;
  title: string;
  content: string;
  version: number;
  isPinned: boolean;
  createdAt: Date;
}

export interface TeamMember {
  userId: string;
  name: string;
  image?: string;
  skills: string[];
  role: 'leader' | 'member';
}

interface HakiProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'announce',
    content: 'Haki 已上线，输入 /analyze 开始分析赛题',
  },
];

export function Haki({ user }: HakiProps) {
  // --- Session state (from DB) ---
  const {
    teamId,
    teamName,
    sessionId,
    messages,
    setMessages,
    artifacts,
    setArtifacts,
    teamMembers,
    hackathon,
    apiKeyStatus,
    isInitializing,
    needsOnboarding,
    createTeam,
    reinitialize,
  } = useHakiSession(user);

  const [activeSkill, setActiveSkill] = useState<Skill>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // --- Streaming chat ---
  const { sendMessage: streamSend } = useStreamingChat(sessionId);

  // --- Sync activeSkill to session in DB ---
  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/agent/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeSkill }),
    }).catch(() => {}); // Fire and forget
  }, [sessionId, activeSkill]);

  // --- Layout state ---
  const [activeTab, setActiveTab] = useState<MenuTab>('tasks');
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [showHackathonDetail, setShowHackathonDetail] = useState(false);
  const [showHackathonSelector, setShowHackathonSelector] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] =
    useState<Notification[]>(INITIAL_NOTIFICATIONS);

  // --- Toast ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // --- Editable project name ---
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const isLeader = teamMembers.some(
    (m) => m.userId === user.id && m.role === 'leader'
  );

  const handleSaveProjectName = useCallback(async () => {
    const trimmed = editNameValue.trim();
    if (!trimmed || !teamId || trimmed === teamName) {
      setIsEditingName(false);
      return;
    }
    try {
      const res = await fetch(`/api/agent/team/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        showToast('项目名称已更新');
        await reinitialize();
      }
    } catch {}
    setIsEditingName(false);
  }, [editNameValue, teamId, teamName, showToast, reinitialize]);

  const startEditName = useCallback(() => {
    if (!isLeader) return;
    setEditNameValue(teamName || '');
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [isLeader, teamName]);

  // --- Reminder polling ---
  useEffect(() => {
    if (!teamId) return;

    const pollReminders = async () => {
      try {
        const res = await fetch(`/api/agent/reminders?teamId=${teamId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.reminders?.length) return;

        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.reminderId).filter(Boolean));
          const newNotifs = data.reminders
            .filter((r: { id: string }) => !existingIds.has(r.id))
            .map((r: { id: string; title: string; message?: string }) => ({
              id: `reminder-${r.id}`,
              type: 'reminder' as const,
              content: r.message ? `${r.title} — ${r.message}` : r.title,
              reminderId: r.id,
            }));
          return newNotifs.length > 0 ? [...prev, ...newNotifs] : prev;
        });
      } catch {}
    };

    pollReminders();
    const interval = setInterval(pollReminders, 30_000);
    return () => clearInterval(interval);
  }, [teamId]);

  const handleDismissNotification = useCallback((id: string, reminderId?: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // If it's a reminder, dismiss it in the DB
    if (reminderId) {
      fetch(`/api/agent/reminders/${reminderId}`, { method: 'PATCH' }).catch(() => {});
    }
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!sessionId) return;

      // Detect slash commands
      const slashCommands: Record<string, Skill> = {
        '/analyze': 'hackathon-analysis',
        '/brainstorm': 'brainstorm',
        '/plan': 'project-planning',
        '/resources': 'resource-discovery',
        '/pitch': 'pitch-prep',
      };

      const command = Object.keys(slashCommands).find((cmd) =>
        content.toLowerCase().startsWith(cmd)
      );
      if (command) {
        setActiveSkill(slashCommands[command]);
      }

      const skillLabel = activeSkill || (command ? slashCommands[command] : null);

      // Add user message optimistically
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Add a streaming placeholder for the bot response
      const botMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          role: 'assistant',
          content: '',
          skillName: skillLabel || undefined,
          timestamp: new Date(),
          isStreaming: true,
        },
      ]);
      setIsLoading(true);

      await streamSend(content, skillLabel, {
        onToken: (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? { ...m, content: m.content + chunk }
                : m
            )
          );
        },
        onToolCall: (tc) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    toolCalls: [
                      ...(m.toolCalls || []),
                      { ...tc, status: 'running' as const },
                    ],
                  }
                : m
            )
          );
        },
        onToolResult: (tr) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    toolCalls: (m.toolCalls || []).map((tc) =>
                      tc.id === tr.id
                        ? { ...tc, status: tr.status, summary: tr.summary }
                        : tc
                    ),
                  }
                : m
            )
          );
        },
        onFallback: (notice) => {
          // Prepend fallback notice to the bot message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    content: `> ⚠️ ${notice}\n\n`,
                    isFallback: true,
                  }
                : m
            )
          );
        },
        onArtifact: (artifact) => {
          setArtifacts((prev) => [...prev, artifact]);
          setRightPanelOpen(true);
        },
        onDone: (meta) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === userMsg.id && meta.userMessageId) {
                return { ...m, id: meta.userMessageId };
              }
              if (m.id === botMsgId) {
                return {
                  ...m,
                  id: meta.messageId || m.id,
                  isStreaming: false,
                };
              }
              return m;
            })
          );
          setIsLoading(false);
        },
        onError: (errMsg, code) => {
          const errorContent = code === 'NO_API_KEY'
            ? `> 错误: ${errMsg}\n\n请点击下方按钮配置 API Key，即可开始使用 Haki。`
            : `> 错误: ${errMsg}`;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    content: m.content || errorContent,
                    isStreaming: false,
                  }
                : m
            )
          );
          setIsLoading(false);
        },
      });
    },
    [sessionId, activeSkill, setMessages, setArtifacts, streamSend]
  );

  // --- Render left panel content based on active tab ---
  const renderLeftContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <TasksPanel
            teamId={teamId}
            currentSessionId={sessionId}
            onSwitchSession={(id) => {
              // For now, reload with the new session
              // In the future, this could update state directly
              window.location.href = `/haki?session=${id}`;
            }}
            onNewSession={async () => {
              if (!teamId) return;
              try {
                const res = await fetch('/api/agent/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ teamId }),
                });
                if (res.ok) {
                  window.location.reload();
                }
              } catch {}
            }}
          />
        );
      case 'api':
        return <ApiPanel apiKeyStatus={apiKeyStatus} onOpenSettings={() => setShowSettings(true)} />;
      case 'skill':
        return (
          <SkillPanel
            activeSkill={activeSkill}
            onActivateSkill={setActiveSkill}
          />
        );
      case 'mcp':
        return <McpPanel />;
      default:
        return null;
    }
  };

  if (needsOnboarding) {
    return (
      <OnboardingWizard
        userName={user.name || 'Hacker'}
        onComplete={createTeam}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#05060a] relative">
      {/* ===== Toast ===== */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-up">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
                : 'bg-red-500/15 border-red-500/25 text-red-300'
            }`}
          >
            {toast.type === 'success' ? (
              <Check size={15} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={15} className="flex-shrink-0" />
            )}
            <span className="font-sora text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* ===== Top Bar ===== */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.01] backdrop-blur-sm">
        {/* Left: Logo + Title + Hackathon info */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <Image
              src="/logo.png"
              alt="HackerTrip"
              width={28}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
          <div className="w-px h-5 bg-white/10 flex-shrink-0" />
          <h1 className="font-sora text-3xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent flex-shrink-0">
            Haki
          </h1>

          {!isInitializing && (
            <>
              {/* Hackathon info inline */}
              <div className="w-px h-5 bg-white/10 flex-shrink-0" />
              <HackathonBar
                hackathon={hackathon}
                teamMembers={teamMembers}
                onClickTitle={() => {
                  if (hackathon) {
                    setShowHackathonDetail(!showHackathonDetail);
                  } else {
                    setShowHackathonSelector(true);
                  }
                }}
                onInvite={() => setShowInviteModal(true)}
              />

              {/* Editable project name */}
              <div className="w-px h-5 bg-white/10 flex-shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0 flex-shrink">
                {isEditingName ? (
                  <input
                    ref={nameInputRef}
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onBlur={handleSaveProjectName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveProjectName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    className="font-sora text-sm font-medium text-white bg-white/[0.06] border border-[#7c5dff]/40 rounded-lg px-2.5 py-1 outline-none focus:ring-1 focus:ring-[#7c5dff]/50 w-40 transition-all"
                    placeholder="输入项目名称"
                    maxLength={30}
                  />
                ) : (
                  <button
                    onClick={startEditName}
                    disabled={!isLeader}
                    className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all min-w-0 ${
                      isLeader
                        ? 'hover:bg-white/[0.04] cursor-pointer'
                        : 'cursor-default'
                    }`}
                    title={isLeader ? '点击修改项目名称' : '项目名称'}
                  >
                    <span className="font-sora text-sm font-medium text-gray-300 truncate max-w-[160px]">
                      {teamName || '未命名项目'}
                    </span>
                    {isLeader && (
                      <Pencil
                        size={11}
                        className="text-gray-600 group-hover:text-[#7c5dff] transition-colors flex-shrink-0"
                      />
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Actions + User */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isInitializing && (
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
              title={rightPanelOpen ? '收起 Artifacts' : '展开 Artifacts'}
            >
              {rightPanelOpen ? (
                <PanelRightClose size={16} />
              ) : (
                <PanelRightOpen size={16} />
              )}
            </button>
          )}
          <div className="w-px h-5 bg-white/8 flex-shrink-0" />
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || ''}
              width={28}
              height={28}
              className="w-7 h-7 rounded-full ring-1 ring-white/10 object-cover"
            />
          ) : (
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getDefaultAvatar(user.id || 'default').gradient} flex items-center justify-center ring-1 ring-white/10 overflow-hidden p-0.5`}>
              <Image
                src={getDefaultAvatar(user.id || 'default').icon}
                alt={user.name || ''}
                width={18}
                height={18}
                className="opacity-90"
              />
            </div>
          )}
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <div className="flex flex-1 min-h-0">
        {/* Left Menu Tabs */}
        <LeftMenu activeTab={activeTab} onTabChange={setActiveTab} onOpenSettings={() => setShowSettings(true)} />

        {/* Left Panel Content */}
        <div className="w-72 border-r border-white/5 flex-shrink-0 overflow-hidden">
          {isInitializing ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : (
            renderLeftContent()
          )}
        </div>

        {/* Center Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {isInitializing ? (
            /* Skeleton for chat area */
            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-6 space-y-4 overflow-hidden">
                {/* Skeleton message bubbles */}
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-white/[0.06] animate-pulse flex-shrink-0" />
                  <div className="space-y-2 flex-1 max-w-md">
                    <div className="h-4 rounded bg-white/[0.04] animate-pulse w-3/4" />
                    <div className="h-4 rounded bg-white/[0.04] animate-pulse w-1/2" />
                    <div className="h-4 rounded bg-white/[0.04] animate-pulse w-5/6" />
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-white/[0.06] animate-pulse flex-shrink-0" />
                  <div className="space-y-2 flex-1 max-w-sm">
                    <div className="h-4 rounded bg-white/[0.04] animate-pulse w-2/3" />
                    <div className="h-4 rounded bg-white/[0.04] animate-pulse w-1/3" />
                  </div>
                </div>
              </div>
              {/* Skeleton input bar */}
              <div className="p-4 border-t border-white/[0.06]">
                <div className="h-11 rounded-xl bg-white/[0.04] animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              {/* Notification Bar - below top bar, inside content area */}
              <NotificationBar
                notifications={notifications}
                onDismiss={handleDismissNotification}
              />

              {/* Hackathon Detail Popup */}
              {showHackathonDetail && hackathon && (
                <HackathonDetailPopup
                  hackathon={hackathon}
                  onClose={() => setShowHackathonDetail(false)}
                />
              )}

              {/* Hackathon Selector */}
              {showHackathonSelector && teamId && (
                <HackathonSelector
                  onSelect={async (h) => {
                    setShowHackathonSelector(false);
                    try {
                      const res = await fetch(`/api/agent/team/${teamId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          hackathonId: h.id,
                          hackathonName: h.name,
                        }),
                      });
                      if (!res.ok) {
                        showToast('比赛关联失败，请重试', 'error');
                        return;
                      }
                      showToast(`已关联「${h.name}」`);
                      await reinitialize();
                    } catch (err) {
                      console.error('Link hackathon error:', err);
                      showToast('比赛关联失败', 'error');
                    }
                  }}
                  onClose={() => setShowHackathonSelector(false)}
                />
              )}

              {/* Invite Modal */}
              {showInviteModal && teamId && (
                <InviteModal
                  teamId={teamId}
                  teamName={teamName || undefined}
                  onClose={() => setShowInviteModal(false)}
                />
              )}

              {/* Settings Modal */}
              {showSettings && teamId && (
                <SettingsModal
                  teamId={teamId}
                  apiKeyStatus={apiKeyStatus || { anthropic: false, openclaw: false, anthropicLast4: null, openclawLast4: null, provider: null, providerKey: false, providerKeyLast4: null, providerBaseUrl: null }}
                  onClose={() => setShowSettings(false)}
                  onSaved={async () => {
                    setShowSettings(false);
                    await reinitialize();
                  }}
                />
              )}

              {/* Chat area - always visible */}
              <ChatPanel messages={messages} isLoading={isLoading} onOpenSettings={() => setShowSettings(true)} />
              <ChatInput
                onSend={handleSendMessage}
                isLoading={isLoading}
                activeSkill={activeSkill}
                onClearSkill={() => setActiveSkill(null)}
                onActivateSkill={setActiveSkill}
              />
            </>
          )}
        </div>

        {/* Right Panel - Artifacts */}
        {rightPanelOpen && (
          <div className="w-96 border-l border-white/5 flex-shrink-0 overflow-y-auto">
            <ArtifactViewer
              artifacts={artifacts}
              selectedArtifact={selectedArtifact}
              onSelectArtifact={setSelectedArtifact}
            />
          </div>
        )}
      </div>
    </div>
  );
}

