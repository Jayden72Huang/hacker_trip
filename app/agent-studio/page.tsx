'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SignInModal } from '@/components/SignInModal';
import ScrollFloat from '@/components/ScrollFloat';
import { motion } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SchoolIcon from '@mui/icons-material/School';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ExtensionIcon from '@mui/icons-material/Extension';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const AGENT_TYPE = 'hacker-agent';
const STORAGE_KEY = 'hacker-agent-beta-data';

export default function AgentStudioPage() {
  const { data: session, status } = useSession();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(1258);

  // 表单数据
  const [name, setName] = useState('');
  const [selectedFeature, setSelectedFeature] = useState('');

  // 获取当前等待人数
  useEffect(() => {
    fetch(`/api/beta-request?agentType=${AGENT_TYPE}`)
      .then(res => res.json())
      .then(data => {
        if (data.count) setWaitlistCount(data.count);
      })
      .catch(() => {});
  }, []);

  // 提交内测申请
  const submitBetaRequest = useCallback(async (formData: { name: string; feature: string }) => {
    setIsLoading(true);
    try {
      const feedbackText = `姓名: ${formData.name || '未填写'}\n期待功能: ${formData.feature || '未填写'}`;

      const response = await fetch('/api/beta-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentType: AGENT_TYPE,
          feedback: feedbackText,
        }),
      });

      const result = await response.json();
      setWaitlistCount(result?.count || waitlistCount + 1);
      setIsSubmitted(true);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      setIsSubmitted(true);
      setWaitlistCount(prev => prev + 1);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, [waitlistCount]);

  // 登录成功后自动提交保存的内容
  useEffect(() => {
    if (session?.user?.id && status === 'authenticated') {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setName(parsed.name || '');
          setSelectedFeature(parsed.feature || '');
          setShowBetaModal(true);
          submitBetaRequest(parsed);
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [session?.user?.id, status, submitBetaRequest]);

  const handleOpenModal = () => {
    setShowBetaModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = { name, feature: selectedFeature };

    // 如果未登录，保存内容到 localStorage 并引导登录
    if (!session?.user?.id) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      setShowSignInModal(true);
      return;
    }

    // 已登录，直接提交
    await submitBetaRequest(formData);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* 背景 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          {/* 增加上方行间距空间 */}
          <div className="h-10 md:h-14" />
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-10 rounded-full bg-purple-500/10 border border-purple-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400"></span>
            </span>
            <span className="text-sm font-medium text-purple-200/90">即将上线...</span>
          </div>

          {/* 主标题 */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
            <span className="text-white/90 block">Hacker Agent</span>
            <span className="block">
              <ScrollFloat
                animationDuration={1}
                ease="back.inOut(2)"
                scrollStart="top 95%"
                scrollEnd="top 70%"
                stagger={0.03}
                gradientColors={{
                  from: '#818cf8',
                  via: '#c084fc',
                  to: '#f472b6'
                }}
              >
                你的黑客松全能助手
              </ScrollFloat>
            </span>
          </h1>

          {/* 副标题 */}
          <p className="text-base md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            在 Hacker Agent 创作空间，你将拥有赛题上下文和100+插件，全程一站式助力，让你轻松参赛。
          </p>

          {/* Slogan + 申请内测按钮 */}
          <div className="mb-6">
            <p className="text-lg md:text-xl font-light text-gray-300 italic">
              "加入内测白名单，<br className="md:hidden" />
              <span className="text-white font-normal">抢先体验专属你的 AI 黑客松助手</span>"
            </p>
          </div>

          {/* 申请内测按钮 */}
          <div className="max-w-xl mx-auto mb-8">
            {isSubmitted ? (
              <div className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-green-500/10 border border-green-500/20">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-300">已成功提交需求并加入内测白名单！</span>
              </div>
            ) : (
              <button
                onClick={handleOpenModal}
                className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02]"
              >
                <span className="text-lg">申请内测</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* Hacker Agent 目标标题（与上方加大间距） */}
          <div className="mt-20 md:mt-40" />
          <h2 className="text-2xl md:text-6xl font-bold text-white/90 mb-6">
            Hacker Agent 初心
          </h2>

          <p className="text-gray-500 max-w-xl mx-auto mb-16">
            让你不再为 Demo 演示焦虑，不再为材料准备熬夜。<br/>
            让 AI 处理繁琐，你只需专注于改变世界的创意。
          </p>

          {/* 愿景展示 */}
          <div className="relative mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 卡片 1 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/5 hover:border-blue-500/20 transition-all duration-500">
                  <div className="text-5xl mb-6">🎬</div>
                  <h3 className="text-lg font-semibold text-white mb-3">Demo 不再是难题</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    脚本、PPT、演示流程<br/>
                    3 分钟 Demo 背后的<br/>
                    3 小时准备工作
                  </p>
                  <div className="mt-6 text-xs text-blue-400/60 font-mono">
                    → 交给 Agent
                  </div>
                </div>
              </div>

              {/* 卡片 2 */}
              <div className="group relative md:-mt-4">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/5 hover:border-purple-500/20 transition-all duration-500">
                  <div className="text-5xl mb-6">💡</div>
                  <h3 className="text-lg font-semibold text-white mb-3">想法碰撞火花</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    凌晨 3 点的灵感<br/>
                    需要一个不会困的<br/>
                    脑暴伙伴
                  </p>
                  <div className="mt-6 text-xs text-purple-400/60 font-mono">
                    → 随时在线
                  </div>
                </div>
              </div>

              {/* 卡片 3 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-teal-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/5 hover:border-cyan-500/20 transition-all duration-500">
                  <div className="text-5xl mb-6">🛠️</div>
                  <h3 className="text-lg font-semibold text-white mb-3">工具随手可得</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    MCP、Skills、APIs<br/>
                    你需要的能力<br/>
                    一键接入
                  </p>
                  <div className="mt-6 text-xs text-cyan-400/60 font-mono">
                    → 即插即用
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Agent Showcase */}
          <div className="mb-24 w-full">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                <SmartToyIcon sx={{ fontSize: 16 }} className="text-purple-400" />
                <span className="text-sm font-medium text-purple-300">Hacker Agent 空间</span>
              </div>
              <h2 className="text-2xl md:text-5xl font-bold text-white mb-4">
                在这里组建你的 AI{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c5dff] to-[#4de1ff]">
                  黑客松战队
                </span>
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                从备赛到路演，专属领域 AI Agent 全程陪跑！
              </p>
            </motion.div>

            <div className="space-y-8">
              {/* Card 1: AI 黑客松导师 Agent */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="grid md:grid-cols-2 gap-0 rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden hover:border-purple-500/30 transition-all duration-500"
              >
                <div className="p-8 md:p-10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-6">
                      AI <span className="text-[#7c5dff]">黑客松导师</span> Agent
                    </h3>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-3 text-gray-300 border-b border-white/5 pb-3">
                        <span className="text-purple-400 mt-0.5">▸</span>
                        深度解析赛题要求，帮你找到最佳切入点
                      </li>
                      <li className="flex items-start gap-3 text-gray-300 border-b border-white/5 pb-3">
                        <span className="text-purple-400 mt-0.5">▸</span>
                        推荐技术栈方案，从架构到部署一站式指导
                      </li>
                      <li className="flex items-start gap-3 text-gray-300 border-b border-white/5 pb-3">
                        <span className="text-purple-400 mt-0.5">▸</span>
                        智能规划开发进度，48 小时内高效交付
                      </li>
                      <li className="flex items-start gap-3 text-gray-300">
                        <span className="text-purple-400 mt-0.5">▸</span>
                        7×24 实时技术问答，不让任何 Bug 拖慢你
                      </li>
                    </ul>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <DescriptionIcon sx={{ fontSize: 20 }} className="text-[#7c5dff] mb-2" />
                        <div className="text-sm font-medium text-white">赛题解析</div>
                        <div className="text-xs text-gray-500">精准理解评审标准</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <CodeIcon sx={{ fontSize: 20 }} className="text-[#7c5dff] mb-2" />
                        <div className="text-sm font-medium text-white">技术选型</div>
                        <div className="text-xs text-gray-500">智能推荐最优方案</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <SupportAgentIcon sx={{ fontSize: 20 }} className="text-[#7c5dff] mb-2" />
                        <div className="text-sm font-medium text-white">实时答疑</div>
                        <div className="text-xs text-gray-500">全天候技术支持</div>
                      </div>
                    </div>
                  </div>
                  <Link href="/products" className="inline-flex items-center gap-1 text-[#7c5dff] hover:text-[#4de1ff] transition-colors text-sm font-medium group">
                    了解更多 <ArrowForwardIcon sx={{ fontSize: 16 }} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                {/* Right mockup - Chat interface */}
                <div className="relative bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 p-8 flex items-center justify-center min-h-[320px] border-l border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7c5dff]/10 to-transparent" />
                  <div className="relative w-full max-w-[300px] space-y-3">
                    <div className="flex gap-2 items-end">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7c5dff] to-[#c759ff] flex items-center justify-center flex-shrink-0">
                        <SchoolIcon sx={{ fontSize: 14 }} className="text-white" />
                      </div>
                      <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-300 border border-white/5">
                        已分析赛题要求，建议从 <span className="text-[#7c5dff]">Web3 + AI</span> 方向切入...
                      </div>
                    </div>
                    <div className="flex gap-2 items-end justify-end">
                      <div className="bg-[#7c5dff]/20 backdrop-blur-sm rounded-2xl rounded-br-sm px-4 py-3 text-sm text-purple-200 border border-purple-500/20">
                        推荐什么技术栈？
                      </div>
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7c5dff] to-[#c759ff] flex items-center justify-center flex-shrink-0">
                        <SchoolIcon sx={{ fontSize: 14 }} className="text-white" />
                      </div>
                      <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-300 border border-white/5">
                        <span className="text-[#4de1ff]">Next.js + Solidity</span>，预计开发时间 36h，我来帮你规划里程碑...
                      </div>
                    </div>
                    <div className="flex gap-2 items-center mt-2">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                      <span className="text-[10px] text-gray-600 px-2">实时对话中</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: AI 路演助教 Agent */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid md:grid-cols-2 gap-0 rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden hover:border-cyan-500/30 transition-all duration-500"
              >
                <div className="p-8 md:p-10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-6">
                      AI <span className="text-[#4de1ff]">路演助教</span> Agent
                    </h3>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-3 text-gray-300 border-b border-white/5 pb-3">
                        <span className="text-cyan-400 mt-0.5">▸</span>
                        一键生成投资人级别 Pitch Deck
                      </li>
                      <li className="flex items-start gap-3 text-gray-300 border-b border-white/5 pb-3">
                        <span className="text-cyan-400 mt-0.5">▸</span>
                        模拟评委犀利提问，提前准备应对策略
                      </li>
                      <li className="flex items-start gap-3 text-gray-300 border-b border-white/5 pb-3">
                        <span className="text-cyan-400 mt-0.5">▸</span>
                        优化演讲节奏与表达，让 Demo 更有说服力
                      </li>
                      <li className="flex items-start gap-3 text-gray-300">
                        <span className="text-cyan-400 mt-0.5">▸</span>
                        从投资人视角给出反馈，提升获奖概率
                      </li>
                    </ul>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <AutoAwesomeIcon sx={{ fontSize: 20 }} className="text-[#4de1ff] mb-2" />
                        <div className="text-sm font-medium text-white">Deck 生成</div>
                        <div className="text-xs text-gray-500">专业级 PPT 模板</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <RecordVoiceOverIcon sx={{ fontSize: 20 }} className="text-[#4de1ff] mb-2" />
                        <div className="text-sm font-medium text-white">模拟路演</div>
                        <div className="text-xs text-gray-500">AI 评委实战演练</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <HandshakeIcon sx={{ fontSize: 20 }} className="text-[#4de1ff] mb-2" />
                        <div className="text-sm font-medium text-white">投资对接</div>
                        <div className="text-xs text-gray-500">连接潜在投资人</div>
                      </div>
                    </div>
                  </div>
                  <Link href="/products" className="inline-flex items-center gap-1 text-[#4de1ff] hover:text-[#7c5dff] transition-colors text-sm font-medium group">
                    了解更多 <ArrowForwardIcon sx={{ fontSize: 16 }} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                {/* Right mockup - Pitch deck preview */}
                <div className="relative bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 p-8 flex items-center justify-center min-h-[320px] border-l border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4de1ff]/10 to-transparent" />
                  <div className="relative w-full max-w-[300px]">
                    <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                      <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                        </div>
                        <span className="text-[10px] text-gray-500 ml-2">pitch_deck_v3.pdf</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="bg-gradient-to-br from-[#4de1ff]/10 to-[#7c5dff]/10 rounded-lg p-4 border border-cyan-500/10">
                          <div className="text-xs text-gray-500 mb-1">Slide 1 / 12</div>
                          <div className="text-sm font-bold text-white mb-1">HackerTrip</div>
                          <div className="text-[10px] text-gray-400">AI-Powered Hackathon Platform</div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 h-12 rounded-md bg-white/[0.03] border border-white/5" />
                          <div className="flex-1 h-12 rounded-md bg-white/[0.03] border border-white/5" />
                          <div className="flex-1 h-12 rounded-md bg-cyan-500/10 border border-cyan-500/20" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between px-1">
                      <span className="text-xs text-gray-500">AI 评分</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-[#4de1ff] to-[#7c5dff]" />
                        </div>
                        <span className="text-xs font-medium text-[#4de1ff]">92</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 3: Build Your Own Custom Agent */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid md:grid-cols-2 gap-0 rounded-3xl bg-gradient-to-br from-purple-500/[0.04] to-cyan-500/[0.04] border border-purple-500/20 overflow-hidden hover:border-purple-500/40 transition-all duration-500"
              >
                <div className="p-8 md:p-10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-6">
                      打造你的{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c5dff] to-[#4de1ff]">
                        专属 AI 助手
                      </span>
                    </h3>
                    <ul className="grid grid-cols-2 gap-x-6 gap-y-3 mb-8">
                      <li className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-purple-400 mt-0.5">▸</span>
                        零代码可视化搭建
                      </li>
                      <li className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-purple-400 mt-0.5">▸</span>
                        自动执行重复任务
                      </li>
                      <li className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-purple-400 mt-0.5">▸</span>
                        无缝接入工具链
                      </li>
                      <li className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-purple-400 mt-0.5">▸</span>
                        学习你的工作流
                      </li>
                      <li className="flex items-start gap-2 text-gray-300 text-sm col-span-2">
                        <span className="text-purple-400 mt-0.5">▸</span>
                        配备 AI 工具扩展能力
                      </li>
                    </ul>
                    <div className="mb-6">
                      <div className="text-sm font-medium text-gray-400 mb-3">支持主流 LLM 模型切换：</div>
                      <div className="flex gap-3">
                        {['OpenAI', 'Claude', 'Gemini', 'Llama'].map((model) => (
                          <div key={model} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-gray-400 font-medium">
                            {model}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link href="/products" className="inline-flex items-center gap-1 text-[#7c5dff] hover:text-[#4de1ff] transition-colors text-sm font-medium group">
                    开始搭建 <ArrowForwardIcon sx={{ fontSize: 16 }} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                {/* Right mockup - Builder interface */}
                <div className="relative bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 p-8 flex items-center justify-center min-h-[320px] border-l border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7c5dff]/10 via-transparent to-[#4de1ff]/10" />
                  <div className="relative w-full max-w-[300px]">
                    <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                        </div>
                        <span className="text-[10px] text-gray-500">Agent Builder</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c5dff] to-[#c759ff] flex items-center justify-center">
                            <ExtensionIcon sx={{ fontSize: 14 }} className="text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-white">My Custom Agent</div>
                            <div className="text-[10px] text-gray-500">3 tools · 2 workflows</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                            <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
                              <CodeIcon sx={{ fontSize: 12 }} className="text-purple-400" />
                            </div>
                            <span className="text-[11px] text-gray-300">代码审查</span>
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                            <div className="w-5 h-5 rounded bg-cyan-500/20 flex items-center justify-center">
                              <DescriptionIcon sx={{ fontSize: 12 }} className="text-cyan-400" />
                            </div>
                            <span className="text-[11px] text-gray-300">文档生成</span>
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-dashed border-white/10 cursor-pointer hover:bg-white/[0.05] transition-colors">
                            <span className="text-[11px] text-gray-500">+ 添加工具</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-block p-8 md:p-12 rounded-3xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 backdrop-blur-sm">
              <div className="text-5xl mb-6">🎯</div>
              <h3 className="text-2xl md:text-4xl font-bold text-white mb-4">
                抢先体验内测版
              </h3>
              <p className="text-sm md:text-lg text-gray-400 mb-8 max-w-xl mx-auto">
                Agent 功能正在全力开发中，前 <span className="text-purple-400 font-bold">100</span> 名内测用户将获得
                <span className="text-cyan-400 font-bold"> 终身 Pro 权益</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleOpenModal}
                  className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(124,93,255,0.5)]"
                >
                  <span className="relative z-10">立即申请内测</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <Link
                  href="/"
                  className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all hover:border-purple-500/30"
                >
                  了解更多
                </Link>
              </div>
            </div>
          </motion.div>

          {/* 返回 */}
          <div className="mt-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-400 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回首页
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* 内测申请弹窗 - 左右布局 */}
      {showBetaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 border border-indigo-900/50">
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowBetaModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>

            <div className="flex flex-col md:flex-row min-h-[500px]">
              {/* 左侧 - 等待人数展示 */}
              <div className="md:w-1/2 bg-gradient-to-br from-indigo-950 to-gray-950 p-8 md:p-12 flex flex-col justify-center items-center relative overflow-hidden">
                {/* 背景装饰 */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-600/15 rounded-full blur-3xl" />
                </div>

                {/* 人数显示 */}
                <div className="relative text-center">
                  <div className="text-8xl md:text-10xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    {waitlistCount.toLocaleString()}
                  </div>
                  <div className="mt-4 text-lg md:text-xl tracking-[0.3em] text-indigo-400/70 uppercase font-medium">
                    人与你共同期待
                  </div>
                  {/* 动态指示点 */}
                  <div className="mt-6 flex justify-center">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-400"></span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 右侧 - 表单 */}
              <div className="md:w-1/2 bg-gradient-to-br from-indigo-950/80 to-gray-900 p-8 md:p-12 flex flex-col justify-center">
                {isSubmitted ? (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center">
                      <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      成功加入内测白名单！
                    </h3>
                    <p className="text-gray-400">
                      我们将在择时发送邮件邀请你参与内测！
                    </p>
                    <p className="text-sm text-gray-500">
                    💌 任何疑问请联系创始人：Jayden0702work@outlook.com
                    </p>
                    <button
                      onClick={() => setShowBetaModal(false)}
                      className="w-full py-4 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 transition-all"
                    >
                      共同期待！
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                      加入到内测白名单
                    </h2>
                    <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                    抢先体验 Hacker Agent
                    </h3>
                    <p className="text-gray-400 mb-8 text-sm">
                      填写你的需求，共同打造专属你的 AI 黑客松助手。
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* 名字输入 */}
                      <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="你的名字"
                          className="w-full px-4 py-3.5 rounded-xl bg-gray-900/80 border border-indigo-900/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-gray-900 transition-all"
                        />
                      </div>

                      {/* 期待功能输入 */}
                      <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                          Most Anticipated Feature
                        </label>
                        <input
                          type="text"
                          value={selectedFeature}
                          onChange={(e) => setSelectedFeature(e.target.value)}
                          placeholder="你期待的功能 / 你遇到的问题"
                          className="w-full px-4 py-3.5 rounded-xl bg-gray-900/80 border border-indigo-900/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-gray-900 transition-all"
                        />
                      </div>

                      {/* 提交按钮 */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                      >
                        <span>{isLoading ? '提交中...' : '加入白名单'}</span>
                        {!isLoading && <ArrowRight size={18} />}
                      </button>

                      {!session?.user?.id && (
                        <p className="text-xs text-gray-500 text-center">
                          点击后将引导你完成登录
                        </p>
                      )}
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 登录弹窗 */}
      <SignInModal isOpen={showSignInModal} onClose={() => setShowSignInModal(false)} />
    </main>
  );
}
