'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CommunityCarousel } from '@/components/CommunityCarousel';
import { FloatingBlob } from '@/components/ui/FloatingBlob';
import { fadeInUp } from '@/lib/animations';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function CommunityPage() {
  const stats = [
    {
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      value: '10,000+',
      label: '活跃黑客',
      color: 'text-purple-400',
    },
    {
      icon: <AccessTimeIcon sx={{ fontSize: 40 }} />,
      value: '24/7',
      label: 'AI 助手在线',
      color: 'text-cyan-400',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      value: '85%',
      label: '成功组队率',
      color: 'text-emerald-400',
    },
  ];

  return (
    <main className="min-h-screen bg-[#05060a] text-white relative overflow-hidden">
      <Navbar />

      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 opacity-15">
        <div className="absolute top-20 left-[10%]">
          <FloatingBlob colors={['#7c5dff', '#c759ff']} size={600} duration={35} blur={120} />
        </div>
        <div className="absolute bottom-20 right-[15%]">
          <FloatingBlob colors={['#4de1ff', '#7c5dff']} size={500} duration={30} blur={100} />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <FloatingBlob colors={['#c759ff', '#4de1ff']} size={400} duration={40} blur={110} />
        </div>
      </div>

      {/* Grid Background */}
      <div className="fixed inset-0 -z-5 opacity-[0.08]">
        <div className="absolute inset-0 grid-bg" />
      </div>

      <section className="relative pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400"></span>
              </span>
              <span className="text-sm font-medium text-purple-200/90">Community Plaza · 即将上线</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                不再孤军奋战
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              AI 驱动的黑客松社区，从组队到夺冠
              <br />
              <span className="text-purple-400">全程陪伴你的每一步</span>
            </p>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto mb-20"
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1, type: 'spring' }}
                className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-purple-500/30 transition-all duration-300 hover:scale-105"
              >
                <div className={`${stat.color} mb-3 flex justify-center`}>
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-20"
          >
            <CommunityCarousel />
          </motion.div>

          {/* Why Join Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              为什么选择我们？
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              传统黑客松平台只提供赛事信息，我们提供<span className="text-purple-400">全流程 AI 支持</span>
            </p>
          </motion.div>

          {/* Comparison Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-20"
          >
            {/* Traditional Platform */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10">
              <div className="text-3xl mb-4">😐</div>
              <h3 className="text-2xl font-bold text-gray-400 mb-4">传统平台</h3>
              <ul className="space-y-3 text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span>只能自己找队友</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span>赛题理解全靠 Google</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span>技术问题无人解答</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span>作品提交后石沉大海</span>
                </li>
              </ul>
            </div>

            {/* HackerTrip */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-xs text-purple-300">
                AI 加持
              </div>
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-4">HackerTrip</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>AI 智能匹配最佳队友</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>AI 导师 24/7 赛题解析</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>实时技术方案建议</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>自动生成 Demo + 推荐给 VC</span>
                </li>
              </ul>
            </div>
          </motion.div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
