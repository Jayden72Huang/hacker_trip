'use client';

import { motion } from 'framer-motion';

type Logo = {
  name: string;
  image?: string;
};

const partners: Logo[] = [
  { name: 'Anthropic' },
  { name: 'OpenAI' },
  { name: 'Google Cloud' },
  { name: 'Microsoft' },
  { name: 'AWS' },
  { name: 'Meta' },
  { name: 'Vercel' },
  { name: 'Cloudflare' },
  { name: 'GitHub' },
  { name: 'Stripe' },
  { name: 'Figma' },
  { name: 'Notion' },
];

/**
 * Logo 无缝滚动轮播组件
 * 特性：
 * - 三份复制品实现无缝循环
 * - 左右渐变遮罩营造景深
 * - 悬停单个 Logo 暂停滚动
 * - 灰度 → 彩色的微交互
 */
export function LogoMarquee() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-purple-500/10 border border-purple-500/20">
            <span className="text-sm font-medium text-purple-200/90">Trusted by innovators</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white/90 mb-3">
            与全球顶尖科技公司合作
          </h2>
          <p className="text-gray-400 text-lg">
            为黑客松参赛者提供一流的技术支持和资源
          </p>
        </motion.div>

        {/* Marquee Container */}
        <div className="relative marquee-container">
          {/* Scrolling Content - 3 copies for seamless loop */}
          <div className="flex marquee-content" style={{ animation: 'marquee-left 40s linear infinite' }}>
            {/* Copy 1 */}
            <div className="flex items-center gap-12 px-6">
              {partners.map((logo) => (
                <LogoCard key={`1-${logo.name}`} logo={logo} />
              ))}
            </div>

            {/* Copy 2 */}
            <div className="flex items-center gap-12 px-6">
              {partners.map((logo) => (
                <LogoCard key={`2-${logo.name}`} logo={logo} />
              ))}
            </div>

            {/* Copy 3 */}
            <div className="flex items-center gap-12 px-6">
              {partners.map((logo) => (
                <LogoCard key={`3-${logo.name}`} logo={logo} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 单个 Logo 卡片
 * 悬停时暂停滚动并从灰度恢复彩色
 */
function LogoCard({ logo }: { logo: Logo }) {
  return (
    <motion.div
      className="flex-shrink-0 w-40 h-24 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center transition-all duration-300 hover:bg-white/[0.06] hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(124,93,255,0.15)] group cursor-pointer"
      whileHover={{ scale: 1.05 }}
      onMouseEnter={(e) => {
        const marqueeContent = e.currentTarget.closest('.marquee-content') as HTMLElement;
        if (marqueeContent) {
          marqueeContent.style.animationPlayState = 'paused';
        }
      }}
      onMouseLeave={(e) => {
        const marqueeContent = e.currentTarget.closest('.marquee-content') as HTMLElement;
        if (marqueeContent) {
          marqueeContent.style.animationPlayState = 'running';
        }
      }}
    >
      {logo.image ? (
        <img
          src={logo.image}
          alt={logo.name}
          className="w-24 h-auto object-contain grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all duration-300"
        />
      ) : (
        <span className="font-sora text-xl font-bold bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 bg-clip-text text-transparent group-hover:from-purple-400 group-hover:via-pink-400 group-hover:to-cyan-400 transition-all duration-500">
          {logo.name}
        </span>
      )}
    </motion.div>
  );
}
