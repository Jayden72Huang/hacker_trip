'use client';

import { useCallback, useRef } from 'react';
import type { Artifact } from '../components/HackerBot';

export interface ToolCallInfo {
  id: string;
  name: string;
  input?: Record<string, unknown>;
  status: 'running' | 'success' | 'error';
  summary?: string;
}

interface StreamCallbacks {
  onToken: (chunk: string) => void;
  onArtifact: (artifact: Artifact) => void;
  onToolCall?: (toolCall: ToolCallInfo) => void;
  onToolResult?: (toolResult: ToolCallInfo) => void;
  onFallback?: (message: string) => void;
  onDone: (meta: { messageId: string; userMessageId: string; tokenCount: number }) => void;
  onError: (message: string, code?: string) => void;
}

export function useStreamingChat(sessionId: string | null) {
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      content: string,
      skillName: string | null,
      callbacks: StreamCallbacks
    ) => {
      if (!sessionId) {
        callbacks.onError('会话未初始化');
        return;
      }

      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const response = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, content, skillName }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          callbacks.onError(errData.error || `请求失败: ${response.status}`);
          return;
        }

        if (!response.body) {
          callbacks.onError('响应流不可用');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
              continue;
            }

            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;

              try {
                const data = JSON.parse(jsonStr);

                switch (currentEvent) {
                  case 'token':
                    if (data.content) {
                      callbacks.onToken(data.content);
                    }
                    break;

                  case 'tool_call':
                    callbacks.onToolCall?.({
                      id: data.id,
                      name: data.name,
                      input: data.input,
                      status: 'running',
                    });
                    break;

                  case 'tool_result':
                    callbacks.onToolResult?.({
                      id: data.id,
                      name: data.name,
                      status: data.status === 'success' ? 'success' : 'error',
                      summary: data.summary,
                    });
                    break;

                  case 'artifact':
                    callbacks.onArtifact({
                      id: data.id,
                      type: data.type,
                      title: data.title,
                      content: data.content || '',
                      version: data.version || 1,
                      isPinned: false,
                      createdAt: new Date(),
                    });
                    break;

                  case 'done':
                    callbacks.onDone({
                      messageId: data.messageId || '',
                      userMessageId: data.userMessageId || '',
                      tokenCount: data.tokenCount || 0,
                    });
                    break;

                  case 'meta':
                    // Meta event from server with saved message IDs
                    callbacks.onDone({
                      messageId: data.messageId || '',
                      userMessageId: data.userMessageId || '',
                      tokenCount: data.tokenCount || 0,
                    });
                    break;

                  case 'fallback':
                    callbacks.onFallback?.(data.message || 'Fallback active');
                    break;

                  case 'error':
                    callbacks.onError(data.message || '未知错误', data.code);
                    break;
                }
              } catch {
                // Skip unparseable JSON
              }

              currentEvent = '';
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return; // User cancelled, not an error
        }
        callbacks.onError(
          err instanceof Error ? err.message : '网络连接失败'
        );
      }
    },
    [sessionId]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { sendMessage, cancel };
}
