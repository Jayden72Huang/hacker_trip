'use client';

import { useState } from 'react';
import {
  FileText,
  Pin,
  Download,
  Copy,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  Search,
  Lightbulb,
  ListTodo,
  FolderSearch,
  Presentation,
  Sparkles,
  BarChart3,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import type { Artifact } from './HackerBot';

interface ArtifactViewerProps {
  artifacts: Artifact[];
  selectedArtifact: Artifact | null;
  onSelectArtifact: (artifact: Artifact | null) => void;
}

const TYPE_LABELS: Record<string, string> = {
  analysis_report: '赛题分析',
  idea_card: '想法卡片',
  feasibility_matrix: '可行性矩阵',
  task_board: '任务看板',
  timeline: '时间线',
  resource_report: '资源报告',
  pitch_outline: 'Pitch 大纲',
  demo_script: 'Demo 脚本',
  project_description: '项目描述',
  checklist: '检查清单',
  custom: '自定义',
};

const TYPE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  analysis_report: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  idea_card: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  feasibility_matrix: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  task_board: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  timeline: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  resource_report: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  pitch_outline: { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  demo_script: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  project_description: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  checklist: { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  custom: { text: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  analysis_report: <Search size={14} />,
  idea_card: <Lightbulb size={14} />,
  feasibility_matrix: <BarChart3 size={14} />,
  task_board: <ListTodo size={14} />,
  timeline: <Clock size={14} />,
  resource_report: <FolderSearch size={14} />,
  pitch_outline: <Presentation size={14} />,
  demo_script: <FileText size={14} />,
  project_description: <FileText size={14} />,
  checklist: <CheckCircle2 size={14} />,
  custom: <Sparkles size={14} />,
};

// Group artifacts by skill/type category
const SKILL_SECTIONS = [
  { key: 'analysis', label: '赛题分析', types: ['analysis_report'], color: 'blue' },
  { key: 'brainstorm', label: '创意脑暴', types: ['idea_card', 'feasibility_matrix'], color: 'amber' },
  { key: 'planning', label: '项目规划', types: ['task_board', 'timeline'], color: 'purple' },
  { key: 'resources', label: '资源发现', types: ['resource_report'], color: 'emerald' },
  { key: 'pitch', label: '路演准备', types: ['pitch_outline', 'demo_script', 'project_description'], color: 'pink' },
  { key: 'other', label: '其他', types: ['checklist', 'custom'], color: 'gray' },
];

const SECTION_COLORS: Record<string, { tag: string; dot: string }> = {
  blue: { tag: 'bg-blue-500/15 text-blue-400 border-blue-500/25', dot: 'bg-blue-400' },
  amber: { tag: 'bg-amber-500/15 text-amber-400 border-amber-500/25', dot: 'bg-amber-400' },
  purple: { tag: 'bg-purple-500/15 text-purple-400 border-purple-500/25', dot: 'bg-purple-400' },
  emerald: { tag: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
  pink: { tag: 'bg-pink-500/15 text-pink-400 border-pink-500/25', dot: 'bg-pink-400' },
  gray: { tag: 'bg-gray-500/15 text-gray-400 border-gray-500/25', dot: 'bg-gray-400' },
};

// Progress tracking mock data (will be driven by real task data later)
interface ProgressItem {
  label: string;
  status: 'done' | 'in_progress' | 'pending';
}

const PROGRESS_ITEMS: ProgressItem[] = [
  { label: '赛题分析', status: 'pending' },
  { label: '创意脑暴', status: 'pending' },
  { label: '项目规划', status: 'pending' },
  { label: '资源发现', status: 'pending' },
  { label: '路演准备', status: 'pending' },
];

export function ArtifactViewer({
  artifacts,
  selectedArtifact,
  onSelectArtifact,
}: ArtifactViewerProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [progressCollapsed, setProgressCollapsed] = useState(false);

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Detail view for a selected artifact
  if (selectedArtifact) {
    const colors = TYPE_COLORS[selectedArtifact.type] || TYPE_COLORS.custom;
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <button
            onClick={() => onSelectArtifact(null)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
          >
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-sora text-sm font-medium text-white truncate">
              {selectedArtifact.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1 font-space-mono text-[10px] px-2 py-0.5 rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {TYPE_ICONS[selectedArtifact.type] || <FileText size={10} />}
                {TYPE_LABELS[selectedArtifact.type] || selectedArtifact.type}
              </span>
              <span className="font-space-mono text-[10px] text-gray-600">
                v{selectedArtifact.version}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => copyToClipboard(selectedArtifact.content)}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-500 hover:text-gray-300"
              title="复制内容"
            >
              <Copy size={14} />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-500 hover:text-gray-300"
              title="下载"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="font-space-mono text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {selectedArtifact.content}
          </div>
        </div>
      </div>
    );
  }

  // Group artifacts by section
  const groupedArtifacts: Record<string, Artifact[]> = {};
  for (const section of SKILL_SECTIONS) {
    const matched = artifacts.filter((a) => section.types.includes(a.type));
    if (matched.length > 0) {
      groupedArtifacts[section.key] = matched;
    }
  }

  const hasArtifacts = artifacts.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="font-sora text-sm font-semibold text-white">
          Artifacts
        </h3>
        <p className="font-space-mono text-[10px] text-gray-600 mt-0.5">
          {hasArtifacts ? `${artifacts.length} 个生成物` : '对话产出物'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ===== Progress Section ===== */}
        <div className="px-3 pt-3">
          <button
            onClick={() => setProgressCollapsed(!progressCollapsed)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
          >
            {progressCollapsed ? (
              <ChevronRight size={14} className="text-gray-500" />
            ) : (
              <ChevronDown size={14} className="text-gray-500" />
            )}
            <span className="font-sora text-xs font-medium text-gray-300">
              Progress
            </span>
            <span className="ml-auto font-space-mono text-[10px] px-2 py-0.5 rounded-md border bg-indigo-500/15 text-indigo-400 border-indigo-500/25">
              task-progress
            </span>
          </button>

          {!progressCollapsed && (
            <div className="mt-2 ml-2 space-y-1.5 pb-1">
              {PROGRESS_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 py-1 px-2"
                >
                  {item.status === 'done' ? (
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                  ) : item.status === 'in_progress' ? (
                    <Loader2 size={14} className="text-indigo-400 animate-spin flex-shrink-0" />
                  ) : (
                    <Circle size={14} className="text-gray-600 flex-shrink-0" />
                  )}
                  <span
                    className={`font-space-mono text-xs ${
                      item.status === 'done'
                        ? 'text-gray-500 line-through'
                        : item.status === 'in_progress'
                          ? 'text-indigo-300'
                          : 'text-gray-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Artifact Sections (grouped by skill) ===== */}
        {hasArtifacts ? (
          <div className="px-3 py-3 space-y-2">
            {SKILL_SECTIONS.map((section) => {
              const sectionArtifacts = groupedArtifacts[section.key];
              if (!sectionArtifacts) return null;

              const isCollapsed = collapsedSections.has(section.key);
              const sColors = SECTION_COLORS[section.color];

              return (
                <div key={section.key}>
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                  >
                    {isCollapsed ? (
                      <Folder size={14} className="text-gray-500" />
                    ) : (
                      <FolderOpen size={14} className="text-gray-400" />
                    )}
                    <span className="font-sora text-xs font-medium text-gray-300">
                      {section.label}
                    </span>
                    <span className="font-space-mono text-[10px] text-gray-600">
                      {sectionArtifacts.length}
                    </span>
                    <span
                      className={`ml-auto font-space-mono text-[10px] px-2 py-0.5 rounded-md border ${sColors.tag}`}
                    >
                      {section.key}
                    </span>
                  </button>

                  {/* Section Items */}
                  {!isCollapsed && (
                    <div className="mt-1.5 space-y-1 ml-1">
                      {sectionArtifacts.map((artifact) => {
                        const aColors = TYPE_COLORS[artifact.type] || TYPE_COLORS.custom;
                        return (
                          <button
                            key={artifact.id}
                            onClick={() => onSelectArtifact(artifact)}
                            className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all group"
                          >
                            <span className={`flex-shrink-0 ${aColors.text}`}>
                              {TYPE_ICONS[artifact.type] || <FileText size={14} />}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-sora text-[13px] text-gray-300 truncate group-hover:text-white transition-colors">
                                {artifact.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span
                                  className={`font-space-mono text-[9px] px-1.5 py-0.5 rounded border ${aColors.bg} ${aColors.text} ${aColors.border}`}
                                >
                                  {TYPE_LABELS[artifact.type] || artifact.type}
                                </span>
                                <span className="font-space-mono text-[9px] text-gray-600">
                                  v{artifact.version}
                                </span>
                              </div>
                            </div>
                            {artifact.isPinned && (
                              <Pin size={12} className="text-indigo-400 flex-shrink-0" />
                            )}
                            <ChevronRight size={12} className="text-gray-700 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ===== Empty State ===== */
          <div className="px-3 py-3 space-y-2">
            {/* Context Section */}
            <div className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen size={14} className="text-gray-500" />
                <span className="font-sora text-xs font-medium text-gray-400">
                  Context
                </span>
              </div>
              <p className="font-space-mono text-[11px] text-gray-600 leading-relaxed">
                与 Hacker Bot 对话后，分析报告、任务计划、Pitch 大纲等生成物将按类别归档到这里。
              </p>
            </div>

            {/* Skills Quick Reference */}
            <div className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles size={14} className="text-gray-500" />
                <span className="font-sora text-xs font-medium text-gray-400">
                  Skills
                </span>
              </div>
              <div className="space-y-1.5">
                {SKILL_SECTIONS.filter((s) => s.key !== 'other').map((section) => {
                  const sColors = SECTION_COLORS[section.color];
                  return (
                    <div
                      key={section.key}
                      className="flex items-center gap-2 py-1"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${sColors.dot}`} />
                      <span className="font-space-mono text-[11px] text-gray-500">
                        {section.label}
                      </span>
                      <span
                        className={`ml-auto font-space-mono text-[9px] px-1.5 py-0.5 rounded border ${sColors.tag}`}
                      >
                        {section.key}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connectors */}
            <div className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <FolderSearch size={14} className="text-gray-500" />
                <span className="font-sora text-xs font-medium text-gray-400">
                  Connectors
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="font-space-mono text-[11px] text-gray-500">
                    OpenClaw Gateway
                  </span>
                  <span className="ml-auto font-space-mono text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                    ready
                  </span>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  <span className="font-space-mono text-[11px] text-gray-500">
                    Claude Opus 4.6
                  </span>
                  <span className="ml-auto font-space-mono text-[9px] px-1.5 py-0.5 rounded border bg-gray-500/15 text-gray-400 border-gray-500/25">
                    standby
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
