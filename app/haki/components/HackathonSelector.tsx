'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Trophy, MapPin, Calendar, X, Check } from 'lucide-react';
import { hackathons } from '@/data/hackathons';

interface HackathonSelectorProps {
  onSelect: (hackathon: { id: string; name: string }) => void;
  onClose: () => void;
}

export function HackathonSelector({ onSelect, onClose }: HackathonSelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const filtered = hackathons.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      h.shortName.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      h.theme.toLowerCase().includes(q)
    );
  });

  const handleConfirm = () => {
    if (!selectedId) return;
    const h = hackathons.find((x) => x.id === selectedId);
    if (h) onSelect({ id: h.id, name: h.name });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-[#0d0e14] border border-white/[0.08] rounded-2xl shadow-2xl shadow-[#7c5dff]/10 overflow-hidden">
        {/* Top accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                <Trophy size={16} className="text-amber-400" />
              </div>
              <h2 className="font-sora text-base font-semibold text-white">
                关联比赛
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索比赛名称、城市..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
          </div>

          {/* Hackathon list */}
          <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1 -mr-1 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500 text-sm">没有找到匹配的比赛</p>
              </div>
            ) : (
              filtered.map((h) => {
                const isSelected = selectedId === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedId(isSelected ? null : h.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-amber-500/10 border border-amber-500/25'
                        : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-lg mt-0.5 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/[0.06] text-gray-500'
                    }`}>
                      {isSelected ? <Check size={12} /> : <Trophy size={10} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-amber-200' : 'text-gray-200'}`}>
                        {h.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[11px] text-gray-500">
                          <MapPin size={10} />
                          {h.city}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-500">
                          <Calendar size={10} />
                          {h.dateRange}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-space-mono px-1.5 py-0.5 rounded ${
                          h.status === 'live'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : h.status === 'upcoming'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-white/[0.04] text-gray-500'
                        }`}>
                          {h.status === 'live' ? '进行中' : h.status === 'upcoming' ? '即将开始' : '已结束'}
                        </span>
                        <span className="text-[10px] text-gray-600 font-space-mono">
                          {h.prizePool}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            确认关联
          </button>
        </div>
      </div>
    </div>
  );
}
