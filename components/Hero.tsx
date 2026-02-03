export function Hero() {
  return (
    <section className="relative pt-36 md:pt-40 lg:pt-44 pb-16 md:pb-20 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-24 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative w-full max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-10 text-center">
          <div className="glass rounded-full px-5 py-2.5 flex items-center gap-3 animate-premium-float">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            <span className="font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase text-indigo-300/80">
              Track Your Hacker Journey
            </span>
          </div>

          <h1 className="font-sans text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.9] text-gradient">
            Hackathon
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent italic px-2">
              Timeline
            </span>
          </h1>

          <p className="font-mono text-xs md:text-sm text-gray-400 max-w-xl leading-relaxed tracking-wide opacity-80 mt-2">
            Navigate through past achievements and upcoming opportunities across the globe with precision.
          </p>

          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
        </div>
      </div>
    </section>
  );
}

