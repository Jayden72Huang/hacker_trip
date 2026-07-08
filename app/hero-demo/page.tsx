// 临时预览页：主角行走穿行的无缝循环视频背景 + 标题。确认后正式集成首页 hero。
export default function HeroDemo() {
  return (
    <div className="bg-[#05060a]">
      <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
        {/* 背景层：主角往前穿行的无缝循环视频（首帧=尾帧） */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/walk-loop4.mp4"
          autoPlay
          loop
          muted
          playsInline
        />

        {/* 压暗遮罩：让画面退为氛围底、文字突出 */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(5,6,10,0.78) 0%, rgba(5,6,10,0.35) 35%, rgba(5,6,10,0.45) 65%, rgba(5,6,10,0.95) 100%)',
          }}
        />
        <div className="absolute inset-0 z-[1] bg-[#05060a]/25" />

        {/* 标题内容层 */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
          <div className="glass glow flex items-center gap-3 rounded-full px-5 py-2.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
            <span className="font-space-mono text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
              人群穿行 AI 科技街区 · 无缝循环（首帧=尾帧）
            </span>
          </div>
          <h1 className="font-sora text-4xl font-extrabold leading-tight text-gray-100 md:text-6xl">
            HackerTrip{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300">
              记录你的黑客松之旅
            </span>
          </h1>
          <p className="font-space-mono max-w-2xl text-base text-gray-300 md:text-lg">
            汇聚全球优质黑客松活动，帮你找到最适合的比赛，轻松报名参赛
          </p>
        </div>
      </section>
    </div>
  );
}
