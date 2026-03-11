'use client';

import { Users, Plus, Clock, Target, Zap } from 'lucide-react';
import Image from 'next/image';
import type { TeamMember } from './HackerBot';

interface TeamSidebarProps {
  teamMembers: TeamMember[];
  onAddMember: () => void;
}

export function TeamSidebar({ teamMembers, onAddMember }: TeamSidebarProps) {
  return (
    <div className="flex flex-col h-full p-3 space-y-4">
      {/* Hackathon Context - Placeholder */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-indigo-400" />
          <span className="font-sora text-xs font-medium text-gray-300">
            当前黑客松
          </span>
        </div>
        <div className="space-y-2">
          <p className="font-space-mono text-xs text-gray-500 italic">
            尚未关联黑客松
          </p>
          <p className="font-space-mono text-[10px] text-gray-600">
            使用 /analyze 分析比赛后自动关联
          </p>
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-purple-400" />
            <span className="font-sora text-xs font-medium text-gray-300">
              团队成员
            </span>
            <span className="font-space-mono text-[10px] text-gray-600">
              ({teamMembers.length})
            </span>
          </div>
          <button
            onClick={onAddMember}
            className="p-1 rounded hover:bg-white/5 transition-colors text-gray-500 hover:text-gray-300"
            title="添加成员"
          >
            <Plus size={14} />
          </button>
        </div>

        {teamMembers.length === 0 ? (
          <div className="text-center py-3">
            <p className="font-space-mono text-xs text-gray-500">
              暂无团队成员
            </p>
            <button
              onClick={onAddMember}
              className="mt-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all font-space-mono text-[10px] text-gray-400"
            >
              + 创建团队
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-[10px] text-white font-medium">
                      {member.name[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-space-mono text-xs text-gray-300 truncate">
                    {member.name}
                    {member.role === 'leader' && (
                      <span className="ml-1 text-amber-400/60 text-[10px]">
                        leader
                      </span>
                    )}
                  </p>
                  {member.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {member.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="font-space-mono text-[9px] text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-amber-400" />
          <span className="font-sora text-xs font-medium text-gray-300">
            进度概览
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-white/[0.02]">
            <p className="font-sora text-base font-bold text-white">0</p>
            <p className="font-space-mono text-[9px] text-gray-600">待办</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/[0.02]">
            <p className="font-sora text-base font-bold text-indigo-400">0</p>
            <p className="font-space-mono text-[9px] text-gray-600">进行中</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/[0.02]">
            <p className="font-sora text-base font-bold text-emerald-400">0</p>
            <p className="font-space-mono text-[9px] text-gray-600">完成</p>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={14} className="text-cyan-400" />
          <span className="font-sora text-xs font-medium text-gray-300">
            剩余时间
          </span>
        </div>
        <p className="font-space-mono text-xs text-gray-500 italic">
          关联黑客松后显示倒计时
        </p>
      </div>
    </div>
  );
}
