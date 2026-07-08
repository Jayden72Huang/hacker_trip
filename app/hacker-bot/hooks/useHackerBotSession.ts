'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, Artifact, TeamMember } from '../components/HackerBot';
import type { HackathonInfo } from '../components/HackathonBar';
import type { ApiKeyStatus } from '../components/SettingsModal';

interface HackerBotSessionState {
  teamId: string | null;
  teamName: string | null;
  sessionId: string | null;
  messages: Message[];
  artifacts: Artifact[];
  teamMembers: TeamMember[];
  hackathon: HackathonInfo | null;
  apiKeyStatus: ApiKeyStatus | null;
  isInitializing: boolean;
  needsOnboarding: boolean;
  error: string | null;
}

const WELCOME_MESSAGE_CONTENT = `Hey! 我是 **Hacker_Bot**，你的黑客松 AI 数字队友 🤖\n\n我可以帮你：\n- **/analyze** — 分析赛题、规则和评分标准\n- **/brainstorm** — 一起脑暴项目想法\n- **/plan** — 规划任务、分工和排期\n- **/resources** — 找开源项目、框架和工具\n- **/pitch** — 准备路演材料和 Demo 脚本\n\n先告诉我，你在参加哪个黑客松？可以发我比赛链接或者描述一下比赛。`;

export function useHackerBotSession(user: {
  id?: string;
  name?: string | null;
}) {
  const [state, setState] = useState<HackerBotSessionState>({
    teamId: null,
    teamName: null,
    sessionId: null,
    messages: [],
    artifacts: [],
    teamMembers: [],
    hackathon: null,
    apiKeyStatus: null,
    isInitializing: true,
    needsOnboarding: false,
    error: null,
  });

  const initRef = useRef(false);

  const initialize = useCallback(async () => {
    if (!user.id) return;

    try {
      setState((prev) => ({ ...prev, isInitializing: true, error: null }));

      // Check for invite token in URL
      const urlParams = new URLSearchParams(window.location.search);
      const inviteToken = urlParams.get('invite');

      if (inviteToken) {
        // Try to accept the invite before initializing
        try {
          // Decode JWT payload to extract teamId (JWT is base64, not encrypted)
          const payloadBase64 = inviteToken.split('.')[1];
          const payload = JSON.parse(atob(payloadBase64));
          const teamId = payload.teamId as string;

          if (teamId) {
            const inviteRes = await fetch(`/api/agent/team/${teamId}/invite`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: inviteToken }),
            });
            const inviteData = await inviteRes.json();

            if (!inviteRes.ok && inviteRes.status !== 409) {
              // 409 = already a member, not an error
              console.warn('Accept invite failed:', inviteData.error);
            }
          }
        } catch (e) {
          console.warn('Failed to process invite token:', e);
        }

        // Clean invite param from URL
        urlParams.delete('invite');
        const newUrl = urlParams.toString()
          ? `${window.location.pathname}?${urlParams}`
          : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }

      // Single request to get all initialization data
      const res = await fetch('/api/agent/init');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `初始化请求失败 (${res.status})`);
      }

      // Check if user needs onboarding
      if (data.needsOnboarding) {
        setState((prev) => ({
          ...prev,
          isInitializing: false,
          needsOnboarding: true,
        }));
        return;
      }

      // Map messages to frontend type
      const messages: Message[] = (data.messages || []).map(
        (m: {
          id: string;
          role: string;
          content: string;
          skillName?: string;
          createdAt: string;
        }) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
          skillName: m.skillName || undefined,
          timestamp: new Date(m.createdAt),
        })
      );

      // Fallback welcome message
      if (messages.length === 0) {
        messages.push({
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_MESSAGE_CONTENT,
          timestamp: new Date(),
        });
      }

      // Map artifacts to frontend type
      const artifacts: Artifact[] = (data.artifacts || []).map(
        (a: {
          id: string;
          type: string;
          title: string;
          content: string;
          version: number;
          isPinned: boolean;
          createdAt: string;
        }) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          content: a.content,
          version: a.version ?? 1,
          isPinned: a.isPinned ?? false,
          createdAt: new Date(a.createdAt),
        })
      );

      // Map members to frontend type
      const members: TeamMember[] = (data.members || []).map(
        (m: {
          userId: string;
          name: string | null;
          image?: string;
          skills?: string[];
          role: string;
        }) => ({
          userId: m.userId,
          name: m.name || 'Unknown',
          image: m.image || undefined,
          skills: Array.isArray(m.skills) ? m.skills : [],
          role: m.role as 'leader' | 'member',
        })
      );

      // Build hackathon info
      let hackathon: HackathonInfo | null = null;
      if (data.hackathon) {
        hackathon = {
          id: data.hackathon.id,
          name: data.hackathon.name,
          tagline: '',
          startDate: new Date(),
          endDate: new Date(),
          status: 'upcoming' as const,
        };
      }

      setState({
        teamId: data.team.id,
        teamName: data.team.name || null,
        sessionId: data.session.id,
        messages,
        artifacts,
        teamMembers: members,
        hackathon,
        apiKeyStatus: data.team.apiKeyStatus || null,
        isInitializing: false,
        needsOnboarding: false,
        error: null,
      });
    } catch (err) {
      console.error('HackerBot session init error:', err);
      setState((prev) => ({
        ...prev,
        isInitializing: false,
        error: err instanceof Error ? err.message : '初始化失败',
        messages:
          prev.messages.length === 0
            ? [
                {
                  id: 'welcome',
                  role: 'assistant' as const,
                  content: WELCOME_MESSAGE_CONTENT,
                  timestamp: new Date(),
                },
              ]
            : prev.messages,
      }));
    }
  }, [user.id]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initialize();
  }, [initialize]);

  const setMessages = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    setState((prev) => ({
      ...prev,
      messages: typeof updater === 'function' ? updater(prev.messages) : updater,
    }));
  }, []);

  const setArtifacts = useCallback((updater: Artifact[] | ((prev: Artifact[]) => Artifact[])) => {
    setState((prev) => ({
      ...prev,
      artifacts: typeof updater === 'function' ? updater(prev.artifacts) : updater,
    }));
  }, []);

  const createTeam = useCallback(
    async (data: { teamName: string; hackathonId?: string }) => {
      try {
        const res = await fetch('/api/agent/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.teamName,
            hackathonId: data.hackathonId || null,
          }),
        });
        if (!res.ok) throw new Error('创建团队失败');

        // Reset and re-initialize
        setState((prev) => ({ ...prev, needsOnboarding: false }));
        initRef.current = false;
        await initialize();
      } catch (err) {
        console.error('Create team error:', err);
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : '创建团队失败',
        }));
      }
    },
    [initialize]
  );

  return {
    ...state,
    setMessages,
    setArtifacts,
    createTeam,
    reinitialize: initialize,
  };
}
