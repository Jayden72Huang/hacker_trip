'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import type { Skill } from './HackerBot';

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading: boolean;
  activeSkill: Skill;
  onClearSkill?: () => void;
  onActivateSkill?: (skill: Skill) => void;
}

const SLASH_COMMANDS = [
  { command: '/analyze', label: '赛题分析', description: '分析黑客松赛题和规则' },
  { command: '/brainstorm', label: '创意脑暴', description: '一起碰撞项目想法' },
  { command: '/plan', label: '项目规划', description: '任务分配和排期' },
  { command: '/resources', label: '资源发现', description: '找开源项目和工具' },
  { command: '/pitch', label: '路演准备', description: '准备 pitch 和 demo' },
];

const COMMAND_TO_SKILL: Record<string, Skill> = {
  '/analyze': 'hackathon-analysis',
  '/brainstorm': 'brainstorm',
  '/plan': 'project-planning',
  '/resources': 'resource-discovery',
  '/pitch': 'pitch-prep',
};

const SKILL_TO_COMMAND: Record<string, string> = Object.fromEntries(
  Object.entries(COMMAND_TO_SKILL).map(([cmd, skill]) => [skill, cmd])
);

// Per-skill colors synced with SkillIndicator
const SKILL_COLORS: Record<string, { pill: string; pillLabel: string; tag: string; tagX: string }> = {
  'hackathon-analysis': {
    pill: 'bg-blue-500/15 border-blue-500/30 text-blue-300 shadow-sm shadow-blue-500/10',
    pillLabel: 'text-blue-400/70',
    tag: 'bg-blue-500/15 border border-blue-500/25 text-blue-300',
    tagX: 'text-blue-400 hover:bg-blue-500/20',
  },
  brainstorm: {
    pill: 'bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-sm shadow-amber-500/10',
    pillLabel: 'text-amber-400/70',
    tag: 'bg-amber-500/15 border border-amber-500/25 text-amber-300',
    tagX: 'text-amber-400 hover:bg-amber-500/20',
  },
  'project-planning': {
    pill: 'bg-purple-500/15 border-purple-500/30 text-purple-300 shadow-sm shadow-purple-500/10',
    pillLabel: 'text-purple-400/70',
    tag: 'bg-purple-500/15 border border-purple-500/25 text-purple-300',
    tagX: 'text-purple-400 hover:bg-purple-500/20',
  },
  'resource-discovery': {
    pill: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/10',
    pillLabel: 'text-emerald-400/70',
    tag: 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300',
    tagX: 'text-emerald-400 hover:bg-emerald-500/20',
  },
  'pitch-prep': {
    pill: 'bg-pink-500/15 border-pink-500/30 text-pink-300 shadow-sm shadow-pink-500/10',
    pillLabel: 'text-pink-400/70',
    tag: 'bg-pink-500/15 border border-pink-500/25 text-pink-300',
    tagX: 'text-pink-400 hover:bg-pink-500/20',
  },
};

export function ChatInput({ onSend, isLoading, activeSkill, onClearSkill, onActivateSkill }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (input.startsWith('/')) {
      const query = input.toLowerCase();
      const filtered = SLASH_COMMANDS.filter((cmd) =>
        cmd.command.startsWith(query)
      );
      setFilteredCommands(filtered);
      setShowCommands(filtered.length > 0);
    } else {
      setShowCommands(false);
    }
  }, [input]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    setShowCommands(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectCommand = (command: string) => {
    setInput(command + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-white/5 px-4 py-3">
      {/* Slash Command Palette */}
      {showCommands && (
        <div className="mb-2 bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.command}
              onClick={() => selectCommand(cmd.command)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
            >
              <Sparkles size={14} className="text-indigo-400 flex-shrink-0" />
              <div>
                <span className="font-space-mono text-sm text-indigo-300">
                  {cmd.command}
                </span>
                <span className="font-space-mono text-xs text-gray-500 ml-2">
                  {cmd.label}
                </span>
              </div>
              <span className="font-space-mono text-xs text-gray-600 ml-auto">
                {cmd.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Quick Command Pills - always visible, click to toggle skill */}
      <div className="flex flex-wrap gap-2 mb-3">
        {SLASH_COMMANDS.map((cmd) => {
          const skillId = COMMAND_TO_SKILL[cmd.command];
          const isActive = activeSkill === skillId;
          const colors = skillId ? SKILL_COLORS[skillId] : null;
          return (
            <button
              key={cmd.command}
              onClick={() => {
                if (onActivateSkill) {
                  onActivateSkill(isActive ? null : skillId);
                } else {
                  selectCommand(cmd.command);
                }
                textareaRef.current?.focus();
              }}
              className={`px-3 py-1.5 rounded-full border transition-all font-space-mono text-xs ${
                isActive && colors
                  ? colors.pill
                  : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-gray-400 hover:text-gray-200'
              }`}
            >
              {cmd.command}{' '}
              <span className={isActive && colors ? colors.pillLabel : 'text-gray-600'}>
                {cmd.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          {/* Active skill tag inside input */}
          {activeSkill && (() => {
            const tagColors = SKILL_COLORS[activeSkill];
            return (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-space-mono text-[10px] ${tagColors?.tag || 'bg-indigo-500/15 border border-indigo-500/25 text-indigo-300'}`}>
                  {SKILL_TO_COMMAND[activeSkill] || activeSkill}
                  {onClearSkill && (
                    <button
                      onClick={onClearSkill}
                      className={`ml-0.5 p-0.5 rounded transition-colors ${tagColors?.tagX || 'text-indigo-400 hover:bg-indigo-500/20'}`}
                    >
                      <X size={8} />
                    </button>
                  )}
                </span>
              </div>
            );
          })()}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeSkill
                ? '输入消息...'
                : '输入消息，或输入 / 查看可用命令...'
            }
            rows={1}
            style={activeSkill ? { paddingLeft: `${(SKILL_TO_COMMAND[activeSkill]?.length || 8) * 7.5 + 40}px` } : undefined}
            className="w-full resize-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 font-space-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>

      <p className="mt-2 font-space-mono text-[10px] text-gray-600 text-center">
        Hacker Bot powered by OpenClaw + Claude Opus 4.6
      </p>
    </div>
  );
}
