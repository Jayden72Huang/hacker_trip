'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import {
  User,
  Mail,
  MapPin,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Save,
  Camera,
  Trash2,
  Shield,
  Bell,
  Palette,
  Home,
  Trophy,
  Code,
  Calendar,
  Plus,
  ExternalLink,
  Medal,
  Sparkles,
} from 'lucide-react';

type Tab = 'home' | 'profile' | 'account' | 'notifications' | 'appearance';

// 模拟数据 - 实际应从数据库获取
const mockParticipations = [
  {
    id: '1',
    hackathonName: 'ETHGlobal Bangkok',
    hackathonLogo: null,
    location: 'Bangkok, TH',
    dateRange: 'Nov 15-17, 2025',
    role: 'winner',
    teamName: 'Web3 Wizards',
    placement: '1st Place',
    teammates: [
      { name: 'Alice Chen', avatar: null, role: 'leader' },
      { name: 'Bob Wang', avatar: null, role: 'member' },
      { name: 'Carol Liu', avatar: null, role: 'member' },
    ],
  },
  {
    id: '2',
    hackathonName: 'HackMIT 2025',
    hackathonLogo: null,
    location: 'Boston, USA',
    dateRange: 'Sep 14-15, 2025',
    role: 'participant',
    teamName: 'Code Crusaders',
    placement: 'Finalist',
    teammates: [
      { name: 'David Kim', avatar: null, role: 'leader' },
      { name: 'Eva Martinez', avatar: null, role: 'member' },
    ],
  },
  {
    id: '3',
    hackathonName: 'Junction Helsinki',
    hackathonLogo: null,
    location: 'Helsinki, FI',
    dateRange: 'Nov 8-10, 2025',
    role: 'participant',
    teamName: 'Nordic Coders',
    placement: null,
    teammates: [
      { name: 'Frank Lee', avatar: null, role: 'member' },
    ],
  },
];

const mockProjects = [
  {
    id: '1',
    name: 'DeFi Dashboard',
    description: 'A comprehensive dashboard for tracking DeFi protocols and yields across multiple chains.',
    coverImage: null,
    techStack: ['React', 'TypeScript', 'Web3.js', 'TailwindCSS'],
    hackathonName: 'ETHGlobal Bangkok',
    demoUrl: 'https://demo.example.com',
    repoUrl: 'https://github.com/example/defi-dashboard',
  },
  {
    id: '2',
    name: 'AI Study Buddy',
    description: 'An AI-powered study companion that helps students learn more effectively.',
    coverImage: null,
    techStack: ['Next.js', 'OpenAI', 'PostgreSQL', 'Prisma'],
    hackathonName: 'HackMIT 2025',
    demoUrl: null,
    repoUrl: 'https://github.com/example/ai-study-buddy',
  },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [profile, setProfile] = useState({
    name: session?.user?.name || '',
    username: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    twitter: '',
    linkedin: '',
    skills: '',
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-sora text-2xl font-bold text-white mb-4">
            请先登录
          </h1>
          <Link
            href="/"
            className="text-indigo-400 hover:text-indigo-300 font-space-mono text-sm"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const user = session.user;

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: 实现保存逻辑
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const stats = {
    hackathons: mockParticipations.length,
    projects: mockProjects.length,
    wins: mockParticipations.filter((p) => p.placement?.includes('1st')).length,
  };

  const tabs = [
    { id: 'home' as Tab, label: '我的主页', icon: Home },
    { id: 'profile' as Tab, label: '个人资料', icon: User },
    { id: 'account' as Tab, label: '账号安全', icon: Shield },
    { id: 'notifications' as Tab, label: '通知设置', icon: Bell },
    { id: 'appearance' as Tab, label: '外观主题', icon: Palette },
  ];

  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed inset-0 -z-10 grid-bg opacity-50" aria-hidden />
      <Navbar />

      <main className="pt-36 pb-16">
        <div className="w-full max-w-[1200px] mx-auto px-6 lg:px-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name || ''}
                  width={56}
                  height={56}
                  className="rounded-xl object-cover border-2 border-white/10"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-sora text-xl font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <h1 className="font-sora text-2xl font-bold text-white">
                {user?.name}
              </h1>
              <p className="font-space-mono text-sm text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-[240px] flex-shrink-0">
              <div className="glass rounded-2xl p-2 border border-white/5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        activeTab === tab.id
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-space-mono text-sm">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              {activeTab === 'home' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                          <Trophy size={20} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-sora text-2xl font-bold text-white">
                            {stats.hackathons}
                          </p>
                          <p className="font-space-mono text-xs text-gray-500">
                            参赛次数
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <Code size={20} className="text-purple-400" />
                        </div>
                        <div>
                          <p className="font-sora text-2xl font-bold text-white">
                            {stats.projects}
                          </p>
                          <p className="font-space-mono text-xs text-gray-500">
                            作品数量
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                          <Medal size={20} className="text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-sora text-2xl font-bold text-white">
                            {stats.wins}
                          </p>
                          <p className="font-space-mono text-xs text-gray-500">
                            获奖次数
                          </p>
                        </div>
                      </div>
                      {stats.wins > 0 && (
                        <div className="ml-auto px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center gap-2">
                          <Sparkles size={16} className="text-yellow-500" />
                          <span className="font-space-mono text-sm text-yellow-400">
                            {stats.wins}x Winner
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hackathon History */}
                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
                        <h2 className="font-sora text-lg font-bold text-white">
                          参赛记录
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-space-mono text-xs">
                          {mockParticipations.length}
                        </span>
                      </div>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-xs font-space-mono text-gray-400 hover:text-white">
                        <Plus size={14} />
                        添加
                      </button>
                    </div>

                    <div className="space-y-3">
                      {mockParticipations.map((participation) => (
                        <div
                          key={participation.id}
                          className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                        >
                          <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-white font-sora font-bold text-sm flex-shrink-0">
                                {participation.hackathonName.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-sora text-sm font-bold text-white">
                                    {participation.hackathonName}
                                  </h3>
                                  {participation.placement && (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-space-mono ${
                                        participation.placement.includes('1st')
                                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                      }`}
                                    >
                                      {participation.placement}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-gray-400 font-space-mono text-xs">
                                  <div className="flex items-center gap-1">
                                    <Calendar size={11} />
                                    {participation.dateRange}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin size={11} />
                                    {participation.location}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 lg:border-l border-white/5 lg:pl-4">
                              <div className="flex -space-x-2">
                                {participation.teammates.slice(0, 3).map((teammate, idx) => (
                                  <div
                                    key={idx}
                                    className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-[#0a0a0f] flex items-center justify-center text-white font-space-mono text-xs"
                                    title={teammate.name}
                                  >
                                    {teammate.name.charAt(0)}
                                  </div>
                                ))}
                              </div>
                              <span className="font-space-mono text-xs text-gray-500">
                                {participation.teamName}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Projects */}
                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-purple-500 to-pink-600" />
                        <h2 className="font-sora text-lg font-bold text-white">
                          作品展示
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-space-mono text-xs">
                          {mockProjects.length}
                        </span>
                      </div>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-xs font-space-mono text-gray-400 hover:text-white">
                        <Plus size={14} />
                        添加
                      </button>
                    </div>

                    <div className="grid gap-4">
                      {mockProjects.map((project) => (
                        <div
                          key={project.id}
                          className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                        >
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                            <Code size={28} className="text-white/30" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-sora text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                                {project.name}
                              </h3>
                              {project.hackathonName && (
                                <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 font-space-mono text-xs">
                                  {project.hackathonName}
                                </span>
                              )}
                            </div>
                            <p className="font-space-mono text-xs text-gray-400 mb-2 line-clamp-1">
                              {project.description}
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex flex-wrap gap-1">
                                {project.techStack.slice(0, 3).map((tech, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded bg-white/5 text-gray-500 font-space-mono text-xs"
                                  >
                                    {tech}
                                  </span>
                                ))}
                                {project.techStack.length > 3 && (
                                  <span className="text-gray-500 font-space-mono text-xs">
                                    +{project.techStack.length - 3}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 ml-auto">
                                {project.demoUrl && (
                                  <a
                                    href={project.demoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-space-mono text-xs transition-colors"
                                  >
                                    <ExternalLink size={11} />
                                    Demo
                                  </a>
                                )}
                                {project.repoUrl && (
                                  <a
                                    href={project.repoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-gray-400 hover:text-white font-space-mono text-xs transition-colors"
                                  >
                                    <Github size={11} />
                                    Code
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className={`glass rounded-2xl p-6 border border-white/5 ${activeTab === 'home' ? 'hidden' : ''}`}>
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    {/* Avatar Section */}
                    <div>
                      <label className="font-space-mono text-sm text-gray-400 mb-3 block">
                        头像
                      </label>
                      <div className="flex items-center gap-4">
                        {user?.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || ''}
                            width={80}
                            height={80}
                            className="rounded-2xl object-cover border-2 border-white/10"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-sora text-2xl font-bold">
                            {user?.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-space-mono text-gray-300">
                            <Camera size={16} />
                            更换头像
                          </button>
                        </div>
                      </div>
                      <p className="font-space-mono text-xs text-gray-500 mt-2">
                        头像由 Google 账号同步，暂不支持自定义
                      </p>
                    </div>

                    {/* Basic Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-space-mono text-sm text-gray-400 mb-2 block">
                          显示名称
                        </label>
                        <div className="relative">
                          <User
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                          />
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) =>
                              setProfile({ ...profile, name: e.target.value })
                            }
                            placeholder={user?.name || '你的名字'}
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-space-mono text-sm text-gray-400 mb-2 block">
                          用户名
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-space-mono text-sm">
                            @
                          </span>
                          <input
                            type="text"
                            value={profile.username}
                            onChange={(e) =>
                              setProfile({ ...profile, username: e.target.value })
                            }
                            placeholder="username"
                            className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="font-space-mono text-sm text-gray-400 mb-2 block">
                        个人简介
                      </label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) =>
                          setProfile({ ...profile, bio: e.target.value })
                        }
                        placeholder="介绍一下你自己..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                      />
                    </div>

                    {/* Location & Website */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-space-mono text-sm text-gray-400 mb-2 block">
                          所在地
                        </label>
                        <div className="relative">
                          <MapPin
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                          />
                          <input
                            type="text"
                            value={profile.location}
                            onChange={(e) =>
                              setProfile({ ...profile, location: e.target.value })
                            }
                            placeholder="城市, 国家"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-space-mono text-sm text-gray-400 mb-2 block">
                          个人网站
                        </label>
                        <div className="relative">
                          <Globe
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                          />
                          <input
                            type="url"
                            value={profile.website}
                            onChange={(e) =>
                              setProfile({ ...profile, website: e.target.value })
                            }
                            placeholder="https://yoursite.com"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div>
                      <label className="font-space-mono text-sm text-gray-400 mb-3 block">
                        社交链接
                      </label>
                      <div className="space-y-3">
                        <div className="relative">
                          <Github
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                          />
                          <input
                            type="text"
                            value={profile.github}
                            onChange={(e) =>
                              setProfile({ ...profile, github: e.target.value })
                            }
                            placeholder="GitHub 用户名"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                          />
                        </div>
                        <div className="relative">
                          <Twitter
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                          />
                          <input
                            type="text"
                            value={profile.twitter}
                            onChange={(e) =>
                              setProfile({ ...profile, twitter: e.target.value })
                            }
                            placeholder="Twitter/X 用户名"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                          />
                        </div>
                        <div className="relative">
                          <Linkedin
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                          />
                          <input
                            type="text"
                            value={profile.linkedin}
                            onChange={(e) =>
                              setProfile({ ...profile, linkedin: e.target.value })
                            }
                            placeholder="LinkedIn 用户名"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="font-space-mono text-sm text-gray-400 mb-2 block">
                        技能标签
                      </label>
                      <input
                        type="text"
                        value={profile.skills}
                        onChange={(e) =>
                          setProfile({ ...profile, skills: e.target.value })
                        }
                        placeholder="React, TypeScript, Web3, AI (用逗号分隔)"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-white/5">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-space-mono text-white disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            保存中...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            保存更改
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-sora text-lg font-bold text-white mb-4">
                        账号信息
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-3">
                            <Mail size={18} className="text-gray-400" />
                            <div>
                              <p className="font-space-mono text-sm text-white">
                                {user?.email}
                              </p>
                              <p className="font-space-mono text-xs text-gray-500">
                                登录邮箱
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 font-space-mono text-xs">
                            已验证
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5">
                              <svg viewBox="0 0 24 24" className="text-gray-400">
                                <path
                                  fill="currentColor"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="font-space-mono text-sm text-white">
                                Google 账号
                              </p>
                              <p className="font-space-mono text-xs text-gray-500">
                                已关联登录
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 font-space-mono text-xs">
                            已连接
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      <h3 className="font-sora text-lg font-bold text-red-400 mb-4">
                        危险区域
                      </h3>
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-space-mono text-sm text-white mb-1">
                              删除账号
                            </p>
                            <p className="font-space-mono text-xs text-gray-400">
                              永久删除你的账号和所有数据，此操作不可撤销
                            </p>
                          </div>
                          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-space-mono text-sm transition-all">
                            <Trash2 size={16} />
                            删除账号
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="font-sora text-lg font-bold text-white mb-4">
                      通知偏好
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          title: '新黑客松通知',
                          desc: '当有符合你兴趣的新黑客松时通知你',
                        },
                        {
                          title: '报名提醒',
                          desc: '在你关注的黑客松报名截止前提醒你',
                        },
                        {
                          title: '队友邀请',
                          desc: '当有人邀请你加入队伍时通知你',
                        },
                        {
                          title: '系统公告',
                          desc: '接收平台重要更新和公告',
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div>
                            <p className="font-space-mono text-sm text-white">
                              {item.title}
                            </p>
                            <p className="font-space-mono text-xs text-gray-500">
                              {item.desc}
                            </p>
                          </div>
                          <button className="relative w-12 h-6 rounded-full bg-white/10 transition-colors">
                            <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-gray-400 transition-transform" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <h3 className="font-sora text-lg font-bold text-white mb-4">
                      外观设置
                    </h3>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="font-space-mono text-sm text-white mb-4">
                        主题模式
                      </p>
                      <div className="flex gap-3">
                        <button className="flex-1 p-4 rounded-xl bg-indigo-500/20 border-2 border-indigo-500/50 text-center">
                          <div className="w-8 h-8 rounded-lg bg-gray-900 mx-auto mb-2" />
                          <span className="font-space-mono text-xs text-indigo-400">
                            深色模式
                          </span>
                        </button>
                        <button className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10 text-center opacity-50">
                          <div className="w-8 h-8 rounded-lg bg-white mx-auto mb-2" />
                          <span className="font-space-mono text-xs text-gray-500">
                            浅色模式
                          </span>
                        </button>
                        <button className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10 text-center opacity-50">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-white to-gray-900 mx-auto mb-2" />
                          <span className="font-space-mono text-xs text-gray-500">
                            跟随系统
                          </span>
                        </button>
                      </div>
                      <p className="font-space-mono text-xs text-gray-500 mt-3">
                        目前仅支持深色模式，浅色模式即将推出
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
