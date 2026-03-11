'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { FloatingBlob } from '@/components/ui/FloatingBlob';
import { ArrowLeft, Terminal, Sparkles, Layers, Palette, Mail, Zap, MessageCircle, Workflow } from 'lucide-react';
import { FeatureCard } from '@/components/ui/FeatureCard';
import { StackedCard } from '@/components/ui/StackedCard';

export default function DesignDemoPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorVariant, setCursorVariant] = useState('default');
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#05060a] overflow-hidden">
      {/* Custom Cursor */}
      <motion.div
        className="fixed pointer-events-none z-50 mix-blend-difference"
        animate={{
          x: mousePosition.x - 12,
          y: mousePosition.y - 12,
          scale: cursorVariant === 'hover' ? 1.5 : 1,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      >
        <div className="w-6 h-6 border border-white rounded-full" />
      </motion.div>

      {/* Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] bg-[length:100%_4px] animate-[scan_8s_linear_infinite]" />
      </div>

      {/* Grid */}
      <div className="fixed inset-0 -z-10 opacity-[0.15]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(124, 93, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124, 93, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 40%, black 40%, transparent 80%)',
        }} />
      </div>

      {/* Atmospheric Blobs */}
      <div className="fixed inset-0 -z-5 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] opacity-30">
          <FloatingBlob colors={['#7c5dff', '#c759ff', '#7c5dff']} size={800} duration={28} blur={120} />
        </div>
        <div className="absolute top-[30%] -right-[15%] opacity-25">
          <FloatingBlob colors={['#4de1ff', '#7c5dff', '#4de1ff']} size={700} duration={35} blur={130} />
        </div>
      </div>

      <Navbar />

      <main className="relative">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 pt-20">
          <motion.div style={{ opacity, scale }} className="max-w-6xl w-full">
            {/* Back Link */}
            <Link
              href="/"
              className="group inline-flex items-center gap-2 mb-16 text-gray-500 hover:text-white transition-colors font-mono text-sm"
              onMouseEnter={() => setCursorVariant('hover')}
              onMouseLeave={() => setCursorVariant('default')}
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="tracking-wider">BACK_TO_ROOT</span>
            </Link>

            {/* Main Title */}
            <div className="space-y-8">
              <div className="font-mono text-sm text-purple-400 tracking-[0.2em] uppercase">
                Design System v2.0
              </div>

              <h1 className="text-[clamp(3rem,8vw,7rem)] font-bold leading-[0.95] tracking-tight">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <span className="inline-block bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                    Terminal
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <span className="inline-block text-white/10 font-mono" style={{ WebkitTextStroke: '1px rgba(124, 93, 255, 0.5)' }}>
                    Elegance
                  </span>
                </motion.div>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="text-xl md:text-2xl text-gray-400 max-w-2xl font-light leading-relaxed"
              >
                Where cyberpunk aesthetics meet refined interface design.
                <br />
                <span className="text-purple-300/60">A design system that doesn't apologize.</span>
              </motion.p>

              {/* Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex gap-12 pt-8"
              >
                {[
                  { label: 'Components', value: '24+' },
                  { label: 'Animations', value: '∞' },
                  { label: 'Generic AI', value: '0%' },
                ].map((metric, i) => (
                  <div key={i} className="border-l-2 border-purple-500/30 pl-4">
                    <div className="font-mono text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      {metric.value}
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-widest mt-1">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2"
            >
              <div className="flex flex-col items-center gap-2 text-gray-600 text-xs font-mono">
                <span className="tracking-wider">SCROLL_DOWN</span>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-px h-16 bg-gradient-to-b from-purple-500/50 to-transparent"
                />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Showcase */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="inline-block font-mono text-xs text-purple-400 tracking-[0.3em] uppercase mb-4"
              >
                Core_Features
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-6xl font-bold text-white"
              >
                What Makes It
                <br />
                <span className="text-white/20 font-mono" style={{ WebkitTextStroke: '1px rgba(77, 225, 255, 0.4)' }}>
                  Unforgettable
                </span>
              </motion.h2>
            </div>

            {/* Feature Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Feature 1 - Blob Animation */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={() => setCursorVariant('hover')}
                onMouseLeave={() => setCursorVariant('default')}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-[400px] rounded-3xl border border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden">
                  {/* Blob Demo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FloatingBlob colors={['#7c5dff', '#c759ff', '#7c5dff']} size={300} duration={15} blur={60} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center z-10">
                        <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        <div className="font-mono text-sm text-purple-300">BLOB_ANIMATION</div>
                      </div>
                    </div>
                  </div>

                  {/* Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-2xl font-bold text-white mb-2">Organic Motion</h3>
                    <p className="text-gray-400 text-sm font-light">
                      Conic gradients spinning infinitely. Hypnotic, never-ending flow.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Feature 2 - Scroll Animations */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={() => setCursorVariant('hover')}
                onMouseLeave={() => setCursorVariant('default')}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-[400px] rounded-3xl border border-white/5 bg-black/20 backdrop-blur-sm p-8 flex flex-col justify-between overflow-hidden">
                  {/* Animated Cards Stack */}
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-16 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10 flex items-center px-4"
                      >
                        <div className="w-2 h-2 rounded-full bg-cyan-400 mr-3" />
                        <div className="font-mono text-xs text-gray-400">Element {i + 1}</div>
                      </motion.div>
                    ))}
                  </div>

                  <div>
                    <Layers className="w-12 h-12 text-cyan-400 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Scroll Choreography</h3>
                    <p className="text-gray-400 text-sm font-light">
                      Every entrance orchestrated. Staggered reveals that feel intentional.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Feature 3 - Microinteractions */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={() => setCursorVariant('hover')}
                onMouseLeave={() => setCursorVariant('default')}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-[400px] rounded-3xl border border-white/5 bg-black/20 backdrop-blur-sm p-8 flex flex-col justify-between">
                  {/* Interactive Elements */}
                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-mono text-sm tracking-wider relative overflow-hidden group/btn"
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6 }}
                      />
                      <span className="relative">HOVER_ME</span>
                    </motion.button>

                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          whileHover={{ y: -4 }}
                          className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:border-pink-500/50 transition-colors cursor-pointer flex items-center justify-center"
                        >
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Terminal className="w-12 h-12 text-pink-400 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Tactile Feedback</h3>
                    <p className="text-gray-400 text-sm font-light">
                      Buttons that respond. Hovers that delight. Every click matters.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Feature 4 - Color System */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={() => setCursorVariant('hover')}
                onMouseLeave={() => setCursorVariant('default')}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-[400px] rounded-3xl border border-white/5 bg-black/20 backdrop-blur-sm p-8 flex flex-col justify-between">
                  {/* Color Swatches */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="h-24 rounded-lg bg-[#7c5dff] shadow-[0_0_40px_rgba(124,93,255,0.3)]" />
                      <div className="font-mono text-xs text-gray-500">#7c5dff</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-24 rounded-lg bg-[#c759ff] shadow-[0_0_40px_rgba(199,89,255,0.3)]" />
                      <div className="font-mono text-xs text-gray-500">#c759ff</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-24 rounded-lg bg-[#4de1ff] shadow-[0_0_40px_rgba(77,225,255,0.3)]" />
                      <div className="font-mono text-xs text-gray-500">#4de1ff</div>
                    </div>
                  </div>

                  <div>
                    <Palette className="w-12 h-12 text-indigo-400 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Chromatic Unity</h3>
                    <p className="text-gray-400 text-sm font-light">
                      Purple. Cyan. Pink. No amber apologism. Pure cyberpunk palette.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Interactive Playground */}
        <section className="py-32 px-6 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="font-mono text-xs text-cyan-400 tracking-[0.3em] uppercase mb-4">
                Interactive_Playground
              </div>
              <h2 className="text-5xl font-bold text-white mb-4">
                Try It Yourself
              </h2>
              <p className="text-gray-400 font-light">
                These aren't mockups. Every interaction is real.
              </p>
            </motion.div>

            {/* Button Variants */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="rounded-2xl border border-white/5 bg-black/20 p-8">
                <div className="text-sm font-mono text-purple-400 mb-6 tracking-wider">PRIMARY_ACTIONS</div>
                <div className="flex flex-wrap gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-[0_0_30px_rgba(124,93,255,0.3)] hover:shadow-[0_0_50px_rgba(124,93,255,0.5)] transition-shadow"
                  >
                    Primary Button
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 rounded-xl border border-purple-500/50 bg-purple-500/10 text-purple-300 font-medium hover:bg-purple-500/20 transition-colors"
                  >
                    Secondary Button
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 rounded-xl border border-white/10 text-gray-400 font-medium hover:border-white/30 hover:text-white transition-colors"
                  >
                    Ghost Button
                  </motion.button>
                </div>
              </div>

              {/* Input Fields */}
              <div className="rounded-2xl border border-white/5 bg-black/20 p-8">
                <div className="text-sm font-mono text-cyan-400 mb-6 tracking-wider">INPUT_FIELDS</div>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter something..."
                    className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(124,93,255,0.2)] transition-all font-light"
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="email"
                      placeholder="email@example.com"
                      className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(77,225,255,0.2)] transition-all font-light"
                    />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(199,89,255,0.2)] transition-all font-light"
                    />
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div className="rounded-2xl border border-white/5 bg-black/20 p-8">
                <div className="text-sm font-mono text-pink-400 mb-6 tracking-wider">CARD_COMPONENTS</div>
                <div className="grid md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -4 }}
                      className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(124,93,255,0.2)] transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400" />
                      </div>
                      <h4 className="text-white font-semibold mb-2">Card {i + 1}</h4>
                      <p className="text-gray-500 text-sm font-light">
                        Hover to feel the elevation
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="font-mono text-xs text-purple-400 tracking-[0.3em] uppercase mb-4">
                Premium_Card_Design
              </div>
              <h2 className="text-5xl font-bold text-white mb-6">
                高质感卡片组件
              </h2>
              <p className="text-gray-400 font-light max-w-2xl mx-auto">
                参考第一梯队产品的卡片设计，左右分栏布局，内嵌小卡片展示特性
              </p>
            </motion.div>

            <div className="space-y-8">
              {/* Purple Card - AI BDR */}
              <FeatureCard
                title="AI BDR 代理"
                subtitle="立即吸引潜在客户。全天候推动销售渠道发展。"
                description="适应任何销售模式。符合任何销售策略。轻松实现研究、跟进和 CRM 更新的自动化。"
                features={[
                  {
                    icon: Mail,
                    title: '没有冷绪索',
                    description: '每次后续处理',
                  },
                  {
                    icon: Zap,
                    title: '领先速度',
                    description: '即时，每次都如此',
                  },
                  {
                    icon: MessageCircle,
                    title: '多销售，少管理',
                    description: '人工智能会处理其余的事情',
                  },
                  {
                    icon: Workflow,
                    title: '自定义工作流程',
                    description: '专为复杂性而设计',
                  },
                ]}
                illustration={
                  <div className="relative w-full aspect-square max-w-sm mx-auto">
                    {/* 3D Pixel Character Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Base Platform */}
                        <div className="w-48 h-32 bg-white rounded-3xl shadow-2xl transform perspective-1000 rotate-x-10" />
                        {/* Character Placeholder - Using gradient to simulate pixel art */}
                        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-24 h-32">
                          <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg shadow-lg relative overflow-hidden">
                            {/* Pixel effect overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_48%,rgba(255,255,255,0.1)_48%,rgba(255,255,255,0.1)_52%,transparent_52%),linear-gradient(90deg,transparent_48%,rgba(255,255,255,0.1)_48%,rgba(255,255,255,0.1)_52%,transparent_52%)] bg-[length:8px_8px]" />
                            {/* Head */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-pink-300 to-pink-400 rounded-lg" />
                            {/* Floating animation */}
                            <motion.div
                              className="absolute inset-0"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
                bgColor="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                delay={0}
              />

              {/* Yellow Card - AI Research */}
              <FeatureCard
                title="AI 研究代理"
                subtitle="人工智能会处理你的研究，所以你无需......"
                description="每一次通话都经过充分准备，并包含正确的见解。完全根据您的需求进行定制。"
                features={[
                  {
                    icon: Sparkles,
                    title: '智能分析',
                    description: 'AI 驱动的深度洞察',
                  },
                  {
                    icon: Layers,
                    title: '多维度研究',
                    description: '全方位数据收集',
                  },
                  {
                    icon: Terminal,
                    title: '自动化流程',
                    description: '节省 80% 时间',
                  },
                  {
                    icon: Palette,
                    title: '定制化输出',
                    description: '根据需求调整',
                  },
                ]}
                illustration={
                  <div className="relative w-full aspect-square max-w-sm mx-auto">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Base Platform */}
                        <div className="w-48 h-32 bg-white rounded-3xl shadow-2xl transform perspective-1000 rotate-x-10" />
                        {/* Character with book */}
                        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-24 h-32">
                          <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_48%,rgba(255,255,255,0.1)_48%,rgba(255,255,255,0.1)_52%,transparent_52%),linear-gradient(90deg,transparent_48%,rgba(255,255,255,0.1)_48%,rgba(255,255,255,0.1)_52%,transparent_52%)] bg-[length:8px_8px]" />
                            {/* Head */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-cyan-300 to-cyan-400 rounded-lg" />
                            {/* Book/Tablet */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-6 bg-white/90 rounded" />
                            <motion.div
                              className="absolute inset-0"
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
                bgColor="linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                delay={0.2}
              />
            </div>
          </div>
        </section>

        {/* Stacked Cards Section */}
        <section className="py-32 px-6 bg-gradient-to-b from-purple-950/10 to-transparent">
          <div className="max-w-6xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="font-mono text-xs text-cyan-400 tracking-[0.3em] uppercase mb-4">
                Stacked_Cards_Effect
              </div>
              <h2 className="text-5xl font-bold text-white mb-6">
                层层递进的卡片
              </h2>
              <p className="text-gray-400 font-light max-w-2xl mx-auto">
                每张卡片下方有多层阴影，创造出真正的堆叠效果
              </p>
            </motion.div>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Card 1 */}
            <StackedCard
              title="Blob 动画"
              subtitle="有机形态的视觉焦点"
              content={
                <div className="space-y-4">
                  <p>锥形渐变 + 无限旋转动画，创造永不停歇的流动感。</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center">
                      <div className="text-2xl font-bold text-white mb-1">3</div>
                      <div className="text-xs text-white/60">颜色渐变</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center">
                      <div className="text-2xl font-bold text-white mb-1">25s</div>
                      <div className="text-xs text-white/60">周期</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center">
                      <div className="text-2xl font-bold text-white mb-1">∞</div>
                      <div className="text-xs text-white/60">循环</div>
                    </div>
                  </div>
                </div>
              }
              bgColor="linear-gradient(135deg, #7c5dff 0%, #c759ff 100%)"
              stackLayers={3}
              delay={0}
            />

            {/* Card 2 */}
            <StackedCard
              title="滚动动画"
              subtitle="GSAP 风格的渐入效果"
              content={
                <div className="space-y-4">
                  <p>Framer Motion 驱动，每个元素精心编排入场时机。</p>
                  <div className="space-y-2">
                    {['元素 1', '元素 2', '元素 3'].map((text, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false }}
                        transition={{ delay: i * 0.1 }}
                        className="p-2 rounded-lg bg-white/10 backdrop-blur-sm flex items-center gap-2"
                      >
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-sm">{text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              }
              bgColor="linear-gradient(135deg, #4de1ff 0%, #7c5dff 100%)"
              stackLayers={3}
              delay={0.1}
            />

            {/* Card 3 */}
            <StackedCard
              title="微交互"
              subtitle="每个细节都有响应"
              content={
                <div className="space-y-4">
                  <p>悬停光晕、缩放动画、边框流动，充满生命力。</p>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-2 px-4 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium"
                    >
                      主按钮
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-2 px-4 rounded-xl border border-white/30 hover:border-white/50 transition-colors text-sm font-medium"
                    >
                      次按钮
                    </motion.button>
                  </div>
                </div>
              }
              bgColor="linear-gradient(135deg, #c759ff 0%, #4de1ff 100%)"
              stackLayers={3}
              delay={0.2}
            />

            {/* Card 4 */}
            <StackedCard
              title="配色统一"
              subtitle="紫青粉暗黑风格"
              content={
                <div className="space-y-4">
                  <p>消除 amber 配色，全面使用主题色，视觉一致性 100%。</p>
                  <div className="flex gap-2">
                    {['#7c5dff', '#c759ff', '#4de1ff'].map((color, i) => (
                      <div key={i} className="flex-1 space-y-1">
                        <div
                          className="h-16 rounded-lg"
                          style={{
                            background: color,
                            boxShadow: `0 0 20px ${color}40`,
                          }}
                        />
                        <div className="text-[10px] text-white/60 font-mono text-center">
                          {color}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
              bgColor="linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
              stackLayers={3}
              delay={0.3}
            />
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <div className="font-mono text-xs text-purple-400 tracking-[0.3em] uppercase mb-4">
                Before_After
              </div>
              <h2 className="text-5xl font-bold text-white mb-6">
                The Transformation
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Before */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-4"
              >
                <div className="text-sm font-mono text-gray-600 tracking-wider">BEFORE</div>
                <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-8 backdrop-blur-sm">
                  <ul className="space-y-3 text-gray-400">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                      <span>Generic Inter + Space Grotesk fonts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                      <span>Inconsistent amber/orange accents</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                      <span>Static backgrounds, no atmosphere</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                      <span>Basic hover states, no choreography</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                      <span>AI-generated aesthetic monotony</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* After */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-4"
              >
                <div className="text-sm font-mono text-cyan-400 tracking-wider">AFTER</div>
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-8 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
                  <ul className="space-y-3 text-gray-300 relative">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                      <span>Deliberate typography hierarchy</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                      <span>Unified purple-cyan-pink palette</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                      <span>Living, breathing blob animations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                      <span>Orchestrated scroll choreography</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                      <span>Distinctive Terminal Elegance concept</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-32 px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/20 to-cyan-950/20 p-16 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />

              <div className="relative">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Upgrade?
                </h2>
                <p className="text-xl text-gray-400 mb-10 font-light">
                  This design system can elevate your entire platform.
                  <br />
                  Say goodbye to generic AI aesthetics.
                </p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white font-semibold text-lg shadow-[0_0_50px_rgba(124,93,255,0.4)] hover:shadow-[0_0_80px_rgba(124,93,255,0.6)] transition-shadow relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%', skewX: -20 }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 0.8 }}
                  />
                  <span className="relative font-mono tracking-wider">DEPLOY_SYSTEM</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Tech Stack Footer */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-8 text-sm text-gray-600 font-mono">
              <div className="flex items-center gap-8">
                <span className="tracking-wider">TECH_STACK:</span>
                <span className="text-purple-400">Next.js_16</span>
                <span className="text-cyan-400">React_19</span>
                <span className="text-pink-400">Framer_Motion</span>
              </div>
              <div className="tracking-wider">
                © 2026 Terminal_Elegance_v2.0
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
}
