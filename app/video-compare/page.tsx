// 临时对比页：本会话生成的所有 hero 候选视频汇总，网格同屏对比。选定后删除此页及未用视频。

interface Cand {
  src: string;
  title: string;
  note: string;
  star?: boolean;
}

interface Group {
  name: string;
  desc: string;
  items: Cand[];
}

const GROUPS: Group[] = [
  {
    name: '① 人群 / 主角行走版（最新方向）',
    desc: '主角或人群背影穿行赛博朋克街道，首帧=尾帧无缝循环',
    items: [
      {
        src: '/videos/walk-loop4.mp4',
        title: '⭐ 单主角 · AI-Coin 黑客松街区（细化版）',
        note: 'Gemini 图生图（基于单主角底图）+ Seedance · 厂商 logo + 悬浮 AI-Coin 代币 + HACKATHON 横幅 + 奖杯 · 材质多样不全荧光 · 无缝循环',
        star: true,
      },
      {
        src: '/videos/walk-loop3.mp4',
        title: 'Gemini 版 · 人群穿行 AI 街区',
        note: 'Gemini 首帧 + Seedance · 人群自然电影感 · AI 品牌 logo + 资讯广告牌 · 无缝循环',
      },
      {
        src: '/videos/walk-loop2.mp4',
        title: 'codex 版 · 人群穿行 AI 街区',
        note: 'gpt-image-1 首帧 + Seedance · 同款 AI 元素 · logo 更锐利但画面偏"生硬" · 无缝循环',
      },
      {
        src: '/videos/walk-loop.mp4',
        title: 'codex 版 · 单主角行走',
        note: '单个长风衣主角背影 · 无 AI 品牌元素 · 最早的行走版 · 无缝循环',
      },
    ],
  },
  {
    name: '② 城市穿越 Loop 版（早期方向）',
    desc: '镜头穿越/俯瞰霓虹城市，无人物行走主体',
    items: [
      {
        src: '/videos/seedB-loop.mp4',
        title: '方向2 · 镜头持续飞越楼群',
        note: '无人机视角穿越霓虹城市 · 穿越感最强（你之前喜欢这个运镜）· 10s crossfade',
      },
      {
        src: '/videos/seedA-loop.mp4',
        title: '方向1 · 人物眺望加长版',
        note: '人物眺望 + 城市脉动 · 接缝最自然 · 8s 无缝',
      },
      {
        src: '/videos/seedloop.mp4',
        title: '首尾帧一致 · 城市霓虹脉动',
        note: '首帧=尾帧 RMSE 0.02 · 真·无缝循环 · 5s',
      },
      {
        src: '/videos/seed2-loop.mp4',
        title: '5s 原氛围版（对照）',
        note: '较短循环周期 · 1080p',
      },
    ],
  },
  {
    name: '③ 早期现成素材（多数不够主题，可忽略）',
    desc: '从素材库找的现成视频，非生成',
    items: [
      { src: '/videos/nc1.mp4', title: 'nc1 · 男女走 LED 走廊', note: '真实棚拍 · 朝镜头走来' },
      { src: '/videos/nc4.mp4', title: 'nc4 · Blade Runner 街道', note: 'CG 动画 · 街景氛围' },
      { src: '/videos/nc6.mp4', title: 'nc6 · CG 男子走霓虹城市', note: 'CG 渲染 · 人物前景' },
    ],
  },
];

export default function VideoCompare() {
  return (
    <div className="min-h-screen bg-[#05060a] px-6 py-12 text-gray-100">
      <div className="mx-auto max-w-7xl">
        <h1 className="font-sora text-2xl font-extrabold md:text-3xl">
          Hero 背景视频对比{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300">
            候选汇总
          </span>
        </h1>
        <p className="font-space-mono mt-2 text-sm text-gray-400">
          所有视频自动循环播放，点击可放大。⭐ 为当前推荐版本。选定后我会删除本页和未采用的视频。
        </p>

        {GROUPS.map((g) => (
          <section key={g.name} className="mt-12">
            <h2 className="font-sora text-lg font-bold text-gray-200">{g.name}</h2>
            <p className="font-space-mono mt-1 text-xs text-gray-500">{g.desc}</p>
            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((c) => (
                <div
                  key={c.src}
                  className={`glass overflow-hidden rounded-xl border ${
                    c.star ? 'border-purple-400/50 glow' : 'border-white/10'
                  }`}
                >
                  <div className="relative aspect-video w-full bg-black">
                    <video
                      className="h-full w-full object-cover"
                      src={c.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                    />
                  </div>
                  <div className="p-4">
                    <p
                      className={`font-space-mono text-sm font-medium ${
                        c.star ? 'text-purple-300' : 'text-gray-200'
                      }`}
                    >
                      {c.title}
                    </p>
                    <p className="font-space-mono mt-1.5 text-xs leading-relaxed text-gray-500">
                      {c.note}
                    </p>
                    <a
                      href={c.src}
                      target="_blank"
                      rel="noreferrer"
                      className="font-space-mono mt-2 inline-block text-xs text-cyan-400 hover:underline"
                    >
                      单独打开 ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
