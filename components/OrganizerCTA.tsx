import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function OrganizerCTA() {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.06]">
      <div className="flex flex-col md:flex-row min-h-[380px]">
        {/* 左侧 - 背景图 + 标语 */}
        <div className="relative md:w-[45%] min-h-[200px] md:min-h-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/organizer-cta.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0a12]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12]/80 via-transparent to-transparent md:bg-none" />

          <div className="relative h-full flex flex-col justify-end p-6 md:p-8">
            <p className="font-sora text-2xl md:text-3xl font-bold leading-snug">
              <span className="bg-gradient-to-r from-[#7c5dff] to-[#c759ff] bg-clip-text text-transparent">数据驱动，</span>
              <br />
              <span className="text-white">高效触达。</span>
            </p>
          </div>
        </div>

        {/* 右侧 - 主办方入驻信息 */}
        <div className="flex-1 bg-[#0a0a12] p-6 md:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-px bg-[#7c5dff]" />
            <span className="font-space-mono text-xs tracking-[0.2em] text-[#7c5dff] uppercase">
              主 办 方 入 驻
            </span>
          </div>

          <h3 className="font-sora text-2xl md:text-3xl font-bold text-white mb-3">
            你是黑客松主办方？
          </h3>
          <p className="font-space-mono text-sm text-gray-400 leading-relaxed mb-8">
            在 HackerTrip 发布你的黑客松活动，触达全球开发者社区。我们提供智能导入工具，3 分钟即可完成活动上架。
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/organize"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-sora text-sm font-semibold transition-all hover:scale-[1.01] shadow-lg shadow-indigo-500/20"
            >
              立即入驻
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/organize"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 font-sora text-sm font-medium transition-all hover:bg-white/[0.08] hover:border-white/[0.12]"
            >
              了解更多
            </Link>
          </div>

          <div className="flex items-center gap-3 mt-8">
            <span className="w-5 h-px bg-gray-600" />
            <span className="w-2 h-2 rounded-full bg-[#4de1ff] animate-pulse" />
            <span className="font-space-mono text-xs text-gray-500">
              免费发布 · 智能导入 · 数据看板
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
