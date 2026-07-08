'use client';

import { MessagesSquare, Globe, Sparkles, Puzzle, Settings } from 'lucide-react';

export type MenuTab = 'tasks' | 'api' | 'skill' | 'mcp';

interface LeftMenuProps {
  activeTab: MenuTab;
  onTabChange: (tab: MenuTab) => void;
  onOpenSettings?: () => void;
}

const TABS: { id: MenuTab; label: string; icon: React.ReactNode }[] = [
  { id: 'tasks', label: 'Tasks', icon: <MessagesSquare size={20} /> },
  { id: 'api', label: 'API', icon: <Globe size={20} /> },
  { id: 'skill', label: 'Skill', icon: <Sparkles size={20} /> },
  { id: 'mcp', label: 'MCP', icon: <Puzzle size={20} /> },
];

export function LeftMenu({ activeTab, onTabChange, onOpenSettings }: LeftMenuProps) {
  return (
    <div className="w-[72px] flex-shrink-0 border-r border-white/5 flex flex-col items-center py-3 gap-1.5 bg-white/[0.01]">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-[52px] h-[52px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              isActive
                ? 'bg-indigo-500/15 text-indigo-400 shadow-sm shadow-indigo-500/10 border border-indigo-500/20'
                : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300 border border-transparent'
            }`}
            title={tab.label}
          >
            {tab.icon}
            <span className="font-space-mono text-[9px] font-medium leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="w-[52px] h-[52px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-gray-500 hover:bg-white/[0.04] hover:text-gray-300 border border-transparent"
        title="Settings"
      >
        <Settings size={20} />
        <span className="font-space-mono text-[9px] font-medium leading-none">
          设置
        </span>
      </button>
    </div>
  );
}
