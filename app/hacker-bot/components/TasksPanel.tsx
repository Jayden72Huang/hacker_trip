'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Clock, Loader2 } from 'lucide-react';

interface SessionItem {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  firstMessage?: string;
}

interface TasksPanelProps {
  teamId: string | null;
  currentSessionId: string | null;
  onSwitchSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export function TasksPanel({
  teamId,
  currentSessionId,
  onSwitchSession,
  onNewSession,
}: TasksPanelProps) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    const loadSessions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/agent/sessions?teamId=${teamId}`);
        const data = await res.json();
        if (data.sessions) {
          setSessions(
            data.sessions.map((s: SessionItem) => ({
              id: s.id,
              status: s.status,
              createdAt: s.createdAt,
              updatedAt: s.updatedAt,
              firstMessage: s.firstMessage,
            }))
          );
        }
      } catch {
        // Silently handle
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [teamId]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getSessionTitle = (session: SessionItem, index: number) => {
    if (session.firstMessage) {
      // Trim and truncate
      const text = session.firstMessage.replace(/[#*_>`\n]/g, '').trim();
      return text.length > 40 ? text.slice(0, 40) + '...' : text;
    }
    return `对话 ${sessions.length - index}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-medium text-gray-300">历史对话</h3>
        <button
          onClick={onNewSession}
          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-[#7c5dff] transition-colors"
          title="新对话"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={18} className="text-gray-500 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageSquare size={24} className="text-gray-600 mb-2" />
            <p className="text-sm text-gray-500">暂无历史对话</p>
            <p className="text-[11px] text-gray-600 mt-1">开始一段新对话吧</p>
          </div>
        ) : (
          sessions.map((session, index) => {
            const isCurrent = session.id === currentSessionId;
            return (
              <button
                key={session.id}
                onClick={() => onSwitchSession(session.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                  isCurrent
                    ? 'bg-[#7c5dff]/10 border border-[#7c5dff]/20'
                    : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
                    isCurrent
                      ? 'bg-[#7c5dff]/20 text-[#7c5dff]'
                      : 'bg-white/[0.04] text-gray-500 group-hover:text-gray-400'
                  }`}>
                    <MessageSquare size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${
                      isCurrent ? 'text-white font-medium' : 'text-gray-300'
                    }`}>
                      {getSessionTitle(session, index)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={10} className="text-gray-600" />
                      <span className="text-[10px] text-gray-600 font-space-mono">
                        {formatTime(session.updatedAt || session.createdAt)}
                      </span>
                      {session.status === 'active' && isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-space-mono">
                          当前
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
