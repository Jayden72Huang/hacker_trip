export function Footer() {
  return (
    <footer className="relative mt-14 md:mt-16">
      <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-10 py-12 md:py-16">
        <div className="glass rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="font-sora text-sm font-extrabold text-white">H</span>
              </div>
              <div className="flex flex-col">
                <span className="font-sora text-sm font-bold text-white">HackerTrip</span>
                <span className="font-space-mono text-xs text-gray-500">© 2026 All rights reserved</span>
              </div>
            </div>

            <div className="flex items-center gap-7">
              <div className="flex flex-col items-center gap-1">
                <span className="font-sora text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  380+
                </span>
                <span className="font-space-mono text-[11px] text-gray-400">Hackers</span>
              </div>
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-sora text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  6
                </span>
                <span className="font-space-mono text-[11px] text-gray-400">Events</span>
              </div>
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-sora text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  $230K+
                </span>
                <span className="font-space-mono text-[11px] text-gray-400">Prizes</span>
              </div>
            </div>

            <div className="glass rounded-full px-4 py-2">
              <span className="font-space-mono text-[11px] text-gray-400">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
