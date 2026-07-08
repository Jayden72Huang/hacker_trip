'use client';

import {
  Search,
  Lightbulb,
  ListTodo,
  FolderSearch,
  Presentation,
  Sparkles,
  ChevronRight,
  Play,
  Settings2,
} from 'lucide-react';
import type { Skill } from './HackerBot';

interface SkillPanelProps {
  activeSkill: Skill;
  onActivateSkill: (skill: Skill) => void;
}

interface SkillDef {
  id: Skill;
  name: string;
  label: string;
  description: string;
  triggers: string[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  status: 'ready' | 'active' | 'completed';
}

export function SkillPanel({ activeSkill, onActivateSkill }: SkillPanelProps) {
  const skills: SkillDef[] = [
    {
      id: 'hackathon-analysis',
      name: '/analyze',
      label: '赛题分析',
      description:
        '解析黑客松赛题、规则和评分标准，生成完整的比赛分析报告、时间分配建议和参赛策略',
      triggers: ['赛题', '分析', '规则', '评分标准', '赛道', 'URL 粘贴'],
      icon: <Search size={20} />,
      color: 'text-blue-400',
      bgColor: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20',
      status: activeSkill === 'hackathon-analysis' ? 'active' : 'ready',
    },
    {
      id: 'brainstorm',
      name: '/brainstorm',
      label: '创意脑暴',
      description:
        '苏格拉底式多轮对话，帮你从问题发现到方案收敛，输出可行性评估矩阵和 Idea Cards',
      triggers: ['脑暴', '想法', '创意', '做什么项目', '方向'],
      icon: <Lightbulb size={20} />,
      color: 'text-amber-400',
      bgColor: 'from-amber-500/20 to-orange-500/20 border-amber-500/20',
      status: activeSkill === 'brainstorm' ? 'active' : 'ready',
    },
    {
      id: 'project-planning',
      name: '/plan',
      label: '项目规划',
      description:
        'WBS 任务拆解 + 技能匹配自动分配 + 甘特时间线 + 里程碑追踪 + 定时 Check-in',
      triggers: ['规划', '任务', '分工', '排期', 'timeline', '看板'],
      icon: <ListTodo size={20} />,
      color: 'text-purple-400',
      bgColor: 'from-purple-500/20 to-violet-500/20 border-purple-500/20',
      status: activeSkill === 'project-planning' ? 'active' : 'ready',
    },
    {
      id: 'resource-discovery',
      name: '/resources',
      label: '资源发现',
      description:
        '搜索 GitHub 开源项目、推荐技术框架、发现 MCP 工具、生成 Quick-Start 指南',
      triggers: ['资源', '开源', '框架', '工具', '技术栈', 'MCP'],
      icon: <FolderSearch size={20} />,
      color: 'text-emerald-400',
      bgColor: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/20',
      status: activeSkill === 'resource-discovery' ? 'active' : 'ready',
    },
    {
      id: 'pitch-prep',
      name: '/pitch',
      label: '路演准备',
      description:
        'Pitch Deck 结构设计、Demo 脚本、项目文案、Q&A 预案、Rehearsal Checklist',
      triggers: ['路演', 'PPT', 'pitch', 'demo', '提交', '演示'],
      icon: <Presentation size={20} />,
      color: 'text-pink-400',
      bgColor: 'from-pink-500/20 to-rose-500/20 border-pink-500/20',
      status: activeSkill === 'pitch-prep' ? 'active' : 'ready',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" />
          <h3 className="font-sora text-sm font-semibold text-white">Skills</h3>
          <span className="font-space-mono text-[10px] text-gray-500">
            5 个核心能力
          </span>
        </div>
        <p className="font-space-mono text-[10px] text-gray-600 mt-1">
          点击激活 Skill，在 Agent 对话中自动使用对应能力
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className={`p-3 rounded-xl border transition-all ${
              skill.status === 'active'
                ? `bg-gradient-to-r ${skill.bgColor} border-opacity-40`
                : 'bg-white/[0.015] border-white/[0.05] hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${skill.bgColor} flex items-center justify-center flex-shrink-0`}
              >
                <span className={skill.color}>{skill.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-sora text-xs font-semibold text-white">
                    {skill.label}
                  </span>
                  <code className="font-space-mono text-[9px] text-gray-500 bg-white/[0.04] px-1 py-0.5 rounded">
                    {skill.name}
                  </code>
                  {skill.status === 'active' && (
                    <span className="ml-auto flex items-center gap-1 text-[9px] font-space-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
                <p className="font-space-mono text-[10px] text-gray-400 mt-1 leading-relaxed">
                  {skill.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {skill.triggers.map((t) => (
                    <span
                      key={t}
                      className="font-space-mono text-[8px] text-gray-600 bg-white/[0.03] px-1.5 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
              <button
                onClick={() =>
                  onActivateSkill(skill.status === 'active' ? null : skill.id)
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-space-mono text-[10px] transition-all ${
                  skill.status === 'active'
                    ? 'bg-white/10 text-gray-300 hover:bg-white/15'
                    : `${skill.color} bg-white/[0.04] hover:bg-white/[0.08]`
                }`}
              >
                <Play size={10} />
                {skill.status === 'active' ? '停用' : '激活'}
              </button>
              <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/[0.03] font-space-mono text-[10px] transition-all">
                <Settings2 size={10} />
                配置
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
