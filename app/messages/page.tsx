'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface Conversation {
  id: string;
  otherParticipant: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  type: string;
  status: string;
  isFromAgent: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-1)] border-t-transparent rounded-full" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/conversations');
      if (res.ok) {
        const { data } = await res.json();
        setConversations(data);
      }
    } catch {
      // network error — keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      if (res.ok) {
        const { data } = await res.json();
        setMessages([...data].reverse());
      }
      fetch(`/api/messages/conversations/${conversationId}/read`, { method: 'PATCH' }).catch(() => {});
    } catch {
      // network error — keep existing messages
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId) setActiveConversation(convId);
  }, [searchParams]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
      const interval = setInterval(() => fetchMessages(activeConversation), 5000);
      return () => clearInterval(interval);
    }
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return;
    setSending(true);
    const res = await fetch(`/api/messages/conversations/${activeConversation}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newMessage }),
    });
    if (res.ok) {
      setNewMessage('');
      await fetchMessages(activeConversation);
      await fetchConversations();
    }
    setSending(false);
  };

  const activeConv = conversations.find((c) => c.id === activeConversation);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-1)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">消息</h1>

        <div className="flex gap-4 h-[calc(100vh-160px)]">
          {/* Conversation list */}
          <div className="w-80 shrink-0 glass rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-medium text-[rgba(255,255,255,0.5)]">
                会话 ({conversations.length})
              </h2>
            </div>
            <div className="overflow-y-auto flex-1">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-[rgba(255,255,255,0.4)] text-sm">
                  还没有消息，去组队搜索页找到志同道合的伙伴吧！
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    className={`w-full p-4 flex items-center gap-3 text-left transition-colors hover:bg-[rgba(255,255,255,0.04)] ${
                      activeConversation === conv.id ? 'bg-[rgba(124,93,255,0.1)] border-l-2 border-[var(--accent-1)]' : ''
                    }`}
                  >
                    {conv.otherParticipant.image ? (
                      <Image
                        src={conv.otherParticipant.image}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded-full shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--accent-1)] flex items-center justify-center text-sm font-bold shrink-0">
                        {(conv.otherParticipant.name || '?')[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {conv.otherParticipant.name || conv.otherParticipant.username || 'User'}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-[var(--accent-1)] rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[rgba(255,255,255,0.4)] truncate mt-0.5">
                        {conv.lastMessagePreview || '...'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 glass rounded-xl overflow-hidden flex flex-col">
            {activeConversation && activeConv ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                  {activeConv.otherParticipant.image ? (
                    <Image
                      src={activeConv.otherParticipant.image}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-1)] flex items-center justify-center text-xs font-bold">
                      {(activeConv.otherParticipant.name || '?')[0]}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-sm">
                      {activeConv.otherParticipant.name || activeConv.otherParticipant.username}
                    </span>
                    {activeConv.otherParticipant.username && (
                      <span className="text-xs text-[rgba(255,255,255,0.4)] ml-2">
                        @{activeConv.otherParticipant.username}
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isMine = msg.senderId === session?.user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] text-white'
                              : 'bg-[rgba(255,255,255,0.06)] text-[var(--foreground)]'
                          }`}
                        >
                          {msg.type === 'team_invite' && (
                            <div className="text-xs font-medium mb-1 opacity-70">
                              组队邀请
                            </div>
                          )}
                          {msg.type === 'team_request' && (
                            <div className="text-xs font-medium mb-1 opacity-70">
                              组队请求
                            </div>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={`text-[10px] mt-1 ${isMine ? 'text-white/50' : 'text-[rgba(255,255,255,0.3)]'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {isMine && msg.status === 'read' && ' · 已读'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[var(--border)]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="输入消息..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent-1)] transition-colors"
                      maxLength={2000}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] text-sm font-medium disabled:opacity-40 transition-opacity hover:opacity-90"
                    >
                      {sending ? '...' : '发送'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-[rgba(255,255,255,0.3)]">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">选择一个会话开始聊天</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
