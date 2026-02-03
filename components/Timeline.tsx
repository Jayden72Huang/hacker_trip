'use client';

import { hackathons } from '@/data/hackathons';

type TimelineProps = {
  selectedId: string;
  onSelect: (id: string) => void;
};

export function Timeline({ selectedId, onSelect }: TimelineProps) {
  return (
    <section className="relative py-12 md:py-16">
      <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="w-full max-w-[1240px] mx-auto flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-indigo-400/60">Timeline</span>
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">2026</h2>
          </div>

          <div className="w-full">
            {/* Short Names */}
            <div className="flex justify-between items-center mb-8 px-4">
              {hackathons.map((h) => (
                <div key={h.id} className="flex-1 flex justify-center">
                  <button
                    onClick={() => onSelect(h.id)}
                    className={`font-sans text-[11px] md:text-xs font-semibold tracking-wider transition-all cursor-pointer uppercase ${selectedId === h.id
                        ? 'text-white'
                        : h.isPast
                          ? 'text-gray-500 hover:text-gray-300'
                          : 'text-gray-600 hover:text-gray-400'
                      }`}
                  >
                    {h.shortName}
                  </button>
                </div>
              ))}
            </div>

            {/* Path and Nodes */}
            <div className="relative h-16 mb-8">
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="absolute inset-0 flex justify-between items-center px-4">
                {hackathons.map((h) => (
                  <div key={h.id} className="flex-1 flex justify-center">
                    <button onClick={() => onSelect(h.id)} className="relative cursor-pointer group p-4">
                      {selectedId === h.id && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-500/20 blur-md" />
                      )}

                      <div
                        className={`relative w-2.5 h-2.5 rounded-full transition-all duration-500 ${selectedId === h.id
                            ? 'bg-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                            : h.isPast
                              ? 'bg-indigo-500/40 group-hover:bg-indigo-400'
                              : 'bg-white/10 group-hover:bg-white/30'
                          }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="flex justify-between items-center px-4">
              {hackathons.map((h) => (
                <div key={h.id} className="flex-1 flex justify-center">
                  <button
                    onClick={() => onSelect(h.id)}
                    className={`font-mono text-[10px] md:text-xs transition-colors cursor-pointer ${selectedId === h.id
                        ? 'text-indigo-300 font-medium'
                        : 'text-gray-600'
                      }`}
                  >
                    {h.dateRange}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

