'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Compass,
  Rocket,
  Users,
  Trophy,
  Globe2,
  FileText,
  Megaphone,
  Settings,
  HelpCircle,
  UserCheck,
  Building2,
  LayoutDashboard,
  Ticket,
  Star,
  MessageSquareText,
} from 'lucide-react';

type TabKey = 'general' | 'participant' | 'organizer';

interface HelpItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: string;
  tags: TabKey[];
}

const helpItems: HelpItem[] = [
  // ========== 通用 ==========
  {
    id: 'what-is-hackertrip',
    icon: <Compass size={18} />,
    title: 'HackerTrip 是什么？',
    content:
      'HackerTrip 是一个面向 AI 黑客松生态的一站式平台。无论你是参赛选手、主办方还是赞助商，都可以在这里发现赛事、报名参赛、展示作品、发起活动和对接合作资源。我们的目标是降低参与黑客松的门槛，让每一场比赛的价值最大化。',
    tags: ['general'],
  },
  {
    id: 'core-features',
    icon: <Star size={18} />,
    title: '平台有哪些核心功能？',
    content:
      '• 发现黑客松 — 首页时间线和探索页展示即将举办的赛事，支持按形式、日期筛选\n• 活动详情 — 每个黑客松都有独立页面，包含赛道、日程、奖金、报名入口等完整信息\n• 作品榜 — 赛后项目展示区，让优秀作品持续获得曝光\n• 社区 — 开发者交流、文章分享、经验复盘\n• 组织者中心 — 主办方可以创建和管理黑客松活动\n• Haki AI 助手 — 智能客服帮你快速了解赛事信息和平台使用方法',
    tags: ['general'],
  },
  {
    id: 'account-login',
    icon: <UserCheck size={18} />,
    title: '如何注册和登录？',
    content:
      'HackerTrip 使用 GitHub OAuth 登录，点击右上角「登录」按钮即可通过 GitHub 账号快速注册。首次登录后系统会自动创建你的账户。目前不支持邮箱注册，后续会增加更多登录方式。',
    tags: ['general'],
  },
  {
    id: 'haki-assistant',
    icon: <MessageSquareText size={18} />,
    title: 'Haki AI 助手是什么？',
    content:
      'Haki 是 HackerTrip 内置的 AI 智能客服，它了解平台上所有活动的信息。你可以问它"最近有什么适合我的黑客松""这场比赛怎么报名""赛后怎么展示项目"等问题。Haki 只回答平台和赛事相关问题，不会帮你写代码。',
    tags: ['general'],
  },
  {
    id: 'contact-us',
    icon: <HelpCircle size={18} />,
    title: '遇到问题怎么联系我们？',
    content:
      '如果你在使用过程中遇到 bug 或有功能建议，可以通过以下方式联系我们：\n• 在页面右下角使用 Haki AI 助手提问\n• 在社区发帖反馈\n• 发送邮件至团队邮箱\n我们会尽快回复并处理。',
    tags: ['general'],
  },

  // ========== 参赛选手 ==========
  {
    id: 'find-hackathon',
    icon: <Search size={18} />,
    title: '如何找到适合我的黑客松？',
    content:
      '你可以通过以下几种方式发现赛事：\n• 首页时间线 — 按时间顺序展示即将举办的活动，点击可查看详情\n• 探索页 (/explore) — 支持按形式（线上/线下/混合）和日期筛选，也可以搜索关键词\n• Haki AI 助手 — 告诉它你的城市、技术方向和时间偏好，它会推荐合适的赛事\n\n建议根据你的技术栈、所在城市和可投入时间来选择最匹配的活动。',
    tags: ['participant'],
  },
  {
    id: 'how-to-register',
    icon: <Ticket size={18} />,
    title: '如何报名参赛？',
    content:
      '每个黑客松详情页都有「立即报名」按钮，报名方式分为两种：\n• 外部报名 — 按钮会跳转到主办方官网或报名表单，你需要在主办方网站完成报名\n• 站内报名 — 部分活动支持在 HackerTrip 内直接填写报名信息\n\n详情页会明确标注当前活动的报名模式。如果按钮旁有外链图标 ↗，说明会跳转到站外。',
    tags: ['participant'],
  },
  {
    id: 'prepare-for-hackathon',
    icon: <Rocket size={18} />,
    title: '赛前应该如何准备？',
    content:
      '• 仔细阅读活动详情页的赛道说明和日程安排，了解评审标准\n• 确定项目方向，选择最匹配的赛道\n• 组建团队，明确分工（建议包含开发、设计、产品角色）\n• 提前准备开发环境和工具链\n• 如果是线下赛，提前确认场地、交通和住宿\n• 准备一个简短的项目 pitch，比赛中可能需要快速介绍你的想法',
    tags: ['participant'],
  },
  {
    id: 'team-building',
    icon: <Users size={18} />,
    title: '没有队友怎么办？',
    content:
      '很多黑客松允许个人报名，赛前会有组队环节。你可以：\n• 在活动详情页查看是否支持个人参赛\n• 在社区发帖寻找队友\n• 参加线下赛的开场组队环节\n• 先个人报名，赛事开始后现场组队\n\n即使是第一次参加也不用担心，很多选手都是现场认识队友的。',
    tags: ['participant'],
  },
  {
    id: 'submit-project',
    icon: <Trophy size={18} />,
    title: '赛后如何展示和推广我的作品？',
    content:
      '比赛结束后，你可以把项目提交到 HackerTrip 的作品榜 (/works)：\n• 点击「提交作品」填写项目信息\n• 建议包含：一句话介绍、项目截图/Demo 链接、技术栈、参赛成绩\n• 提交后作品会展示在作品榜上，获得持续曝光\n\n你也可以在社区写复盘文章，分享参赛经历和技术细节，帮助其他开发者。',
    tags: ['participant'],
  },
  {
    id: 'participant-faq',
    icon: <HelpCircle size={18} />,
    title: '参赛选手常见问题',
    content:
      'Q: 报名后可以取消吗？\nA: 外部报名需要联系主办方取消；站内报名可以在个人设置中管理。\n\nQ: 一个人可以同时报名多个黑客松吗？\nA: 可以，但请注意时间是否冲突。\n\nQ: 没有获奖的项目也能展示吗？\nA: 当然可以！作品榜面向所有参赛项目，不限于获奖作品。\n\nQ: 平台收费吗？\nA: HackerTrip 对参赛选手完全免费。',
    tags: ['participant'],
  },

  // ========== 组织者 ==========
  {
    id: 'create-hackathon',
    icon: <Building2 size={18} />,
    title: '如何在平台上发起黑客松？',
    content:
      '进入「发起黑客松」页面 (/organize)，你可以：\n• 填写活动基本信息（名称、时间、地点、形式等）\n• 添加赛道、日程、奖金池等详细内容\n• 设置报名方式（跳转你的官网，或使用平台站内报名）\n• 提交后活动会进入审核，审核通过后展示在平台首页和探索页\n\n你也可以提供活动页面 URL，平台支持 AI 自动解析活动信息，减少手动填写。',
    tags: ['organizer'],
  },
  {
    id: 'manage-event',
    icon: <LayoutDashboard size={18} />,
    title: '如何管理已发布的活动？',
    content:
      '在组织者后台 (/organize/events) 你可以：\n• 查看所有已提交的活动和草稿\n• 编辑活动信息（修改后重新发布即可更新）\n• 查看活动的曝光数据\n\n如果活动信息有变更（如日期调整、新增赛道），建议尽快更新，确保参赛者看到最新信息。',
    tags: ['organizer'],
  },
  {
    id: 'registration-modes',
    icon: <Settings size={18} />,
    title: '报名方式有哪些选项？',
    content:
      'HackerTrip 支持三种报名模式：\n• 官方站点 — 「立即报名」按钮跳转到你的官网，适合已有完整报名系统的主办方\n• 外部表单 — 跳转到你指定的报名表单链接（如腾讯问卷、Google Form 等）\n• 站内报名 — 使用 HackerTrip 的报名系统，参赛者在平台内直接填写信息\n\n你可以在创建活动时选择最适合的模式。',
    tags: ['organizer'],
  },
  {
    id: 'attract-developers',
    icon: <Megaphone size={18} />,
    title: '如何吸引更多开发者参赛？',
    content:
      '• 完善活动信息 — 详细的赛道说明、清晰的日程和有竞争力的奖金池能显著提升报名率\n• 设置精准的标签和主题 — 帮助平台精准推荐你的活动给匹配的开发者\n• 在社区互动 — 发布活动预告、赛前 AMA、评委介绍等内容\n• 利用平台曝光 — 活动会展示在首页时间线、探索页和 AI 助手推荐中',
    tags: ['organizer'],
  },
  {
    id: 'sponsor-partner',
    icon: <Globe2 size={18} />,
    title: '赞助商和合作伙伴如何参与？',
    content:
      '赞助商和合作伙伴可以通过以下方式获得价值：\n• 品牌曝光 — 在活动详情页展示赞助商 logo 和信息\n• 赛道冠名 — 以品牌名义设置专属赛道\n• 奖项支持 — 提供特别奖项，接触高质量项目\n• 社区联动 — 通过平台触达活跃的开发者社区\n\n如需合作，可以在发起活动时添加赞助商信息，或联系平台团队探讨合作方案。',
    tags: ['organizer'],
  },
  {
    id: 'organizer-faq',
    icon: <HelpCircle size={18} />,
    title: '组织者常见问题',
    content:
      'Q: 发布活动需要审核吗？\nA: 是的，提交后会经过审核确保信息质量，通常 1-2 个工作日内完成。\n\nQ: 可以修改已发布的活动信息吗？\nA: 可以，在草稿箱中编辑后重新发布即可更新。\n\nQ: 平台对组织者收费吗？\nA: 目前基础功能免费。如需定制化服务，请联系团队。\n\nQ: 如何查看报名数据？\nA: 如果使用站内报名，可以在后台查看报名情况；外部报名需在你自己的系统中查看。',
    tags: ['organizer'],
  },
];

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'general', label: '通用', icon: <FileText size={16} /> },
  { key: 'participant', label: '参赛选手', icon: <Rocket size={16} /> },
  { key: 'organizer', label: '组织者', icon: <Building2 size={16} /> },
];

export function HelpCenter() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return helpItems.filter((item) => {
      const matchesTab = q ? true : item.tags.includes(activeTab);
      const matchesSearch = q
        ? item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q)
        : true;
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2">
          <HelpCircle size={15} className="text-cyan-300" />
          <span className="font-space-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
            Help Center
          </span>
        </div>
        <h1 className="font-sora text-3xl md:text-4xl font-bold text-white">
          帮助中心
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          快速了解如何使用 HackerTrip，找到你需要的答案
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mx-auto">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="搜索帮助内容..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      {/* Tabs */}
      {!searchQuery && (
        <div className="flex justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/8 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search result hint */}
      {searchQuery && (
        <p className="text-center text-sm text-gray-500">
          找到 {filteredItems.length} 个相关结果
        </p>
      )}

      {/* Items */}
      <div className="space-y-3 max-w-3xl mx-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">没有找到相关内容，试试其他关键词</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedIds.has(item.id);
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden transition-all hover:border-white/15"
              >
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-300">
                    {item.icon}
                  </div>
                  <span className="flex-1 font-sora text-base font-medium text-white">
                    {item.title}
                  </span>
                  {searchQuery && (
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-gray-500 font-space-mono">
                      {item.tags.map((t) => tabs.find((tab) => tab.key === t)?.label).join(' · ')}
                    </span>
                  )}
                  <div className="flex-shrink-0 text-gray-500">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 pl-[4.25rem]">
                    <div className="text-sm leading-7 text-gray-300 whitespace-pre-line">
                      {item.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">
          没有找到答案？试试页面右下角的{' '}
          <span className="text-cyan-300">Haki AI 助手</span>，或在{' '}
          <a href="/community" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            社区
          </a>{' '}
          中提问
        </p>
      </div>
    </div>
  );
}
