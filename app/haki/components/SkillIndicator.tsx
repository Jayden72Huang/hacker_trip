'use client';

import { X, Search, Lightbulb, ListTodo, FolderSearch, Presentation } from 'lucide-react';
import type { Skill } from './HackerBot';

interface SkillIndicatorProps {
  skill: Skill;
  onClear: () => void;
}

const SKILL_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  'hackathon-analysis': {
    label: '赛题分析',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    icon: <Search size={12} />,
  },
  brainstorm: {
    label: '创意脑暴',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    icon: <Lightbulb size={12} />,
  },
  'project-planning': {
    label: '项目规划',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    icon: <ListTodo size={12} />,
  },
  'resource-discovery': {
    label: '资源发现',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    icon: <FolderSearch size={12} />,
  },
  'pitch-prep': {
    label: '路演准备',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/20',
    icon: <Presentation size={12} />,
  },
};

export function SkillIndicator({ skill, onClear }: SkillIndicatorProps) {
  if (!skill) return null;

  const config = SKILL_CONFIG[skill];
  if (!config) return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bgColor}`}
    >
      <span className={config.color}>{config.icon}</span>
      <span className={`font-space-mono text-[11px] font-medium ${config.color}`}>
        {config.label}
      </span>
      <button
        onClick={onClear}
        className={`p-0.5 rounded-full hover:bg-white/10 transition-colors ${config.color}`}
        title="退出当前模式"
      >
        <X size={10} />
      </button>
    </div>
  );
}
