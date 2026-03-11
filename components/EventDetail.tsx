'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  Gift,
  Globe2,
  Info,
  MapPin,
  Ticket,
  Trophy,
  Users,
} from 'lucide-react';
import type { Hackathon, InfoCard } from '@/data/hackathons';

type Props = {
  hackathon: Hackathon;
  isSubscribed: boolean;
  onToggleSubscribe: () => Promise<'subscribed' | 'unsubscribed' | 'login-required'>;
};

/**
 * 计算倒计时天数
 */
function calculateCountdown(dateRange: string): number | null {
  try {
    const monthMap: { [key: string]: number } = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const match = dateRange.match(/([A-Z][a-z]+)\s+(\d{1,2})/);
    if (!match) return null;

    const [, month, day] = match;
    const monthIndex = monthMap[month];
    if (monthIndex === undefined) return null;

    const eventDate = new Date(2026, monthIndex, parseInt(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : null;
  } catch {
    return null;
  }
}

/**
 * 获取状态显示信息
 */
function getStatusInfo(hackathon: Hackathon) {
  if (hackathon.isPast || hackathon.status === 'closed') {
    return {
      text: '已结束',
      color: 'bg-gray-600/80',
      textColor: 'text-gray-300',
      dotColor: 'bg-gray-400'
    };
  }

  if (hackathon.status === 'live') {
    return {
      text: '进行中',
      color: 'bg-green-500/20',
      textColor: 'text-green-400',
      dotColor: 'bg-green-500',
      pulse: true
    };
  }

  const countdown = calculateCountdown(hackathon.dateRange);
  if (countdown !== null && countdown > 0) {
    return {
      text: `倒计时 ${countdown} 天`,
      color: 'bg-indigo-500/20',
      textColor: 'text-indigo-400',
      dotColor: 'bg-indigo-500'
    };
  }

  return {
    text: '即将开始',
    color: 'bg-indigo-500/20',
    textColor: 'text-indigo-400',
    dotColor: 'bg-indigo-500'
  };
}

/**
 * 解析日期格式
 */
function parseDateDisplay(dateRange: string): string {
  const monthMap: { [key: string]: string } = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };

  const match = dateRange.match(/([A-Z][a-z]+)\s+(\d{1,2})(?:–(\d{1,2}))?/);
  if (!match) return dateRange;

  const [, month, startDay, endDay] = match;
  const monthNum = monthMap[month] || month;

  if (endDay) {
    return `2026.${monthNum}.${startDay.padStart(2, '0')}-${endDay.padStart(2, '0')}`;
  }
  return `2026.${monthNum}.${startDay.padStart(2, '0')}`;
}

// 图标映射
const iconMap = {
  trophy: Trophy,
  users: Users,
  globe: Globe2,
  mapPin: MapPin,
  clock: Clock3,
  ticket: Ticket,
  gift: Gift,
};

function withReferral(url: string, campaign: string) {
  if (!url) return url;
  const hasQuery = url.includes('?');
  const delimiter = hasQuery ? '&' : '?';
  return `${url}${delimiter}utm_source=hackertrip&utm_medium=referral&utm_campaign=${campaign}`;
}

function getRegistrationAction(hackathon: Hackathon) {
  const campaignId = `hackathon_${hackathon.id}_signup`;
  const reg = hackathon.registration;

  if (!reg) {
    return {
      label: '立即报名',
      href: withReferral(hackathon.website, campaignId),
      external: true,
      note: '跳转主办方官网',
      siteName: hackathon.hostOrganizer || '主办方'
    };
  }

  if (reg.mode === 'platform') {
    return {
      label: '立即报名',
      href: reg.platformPath || `/hackathon/${hackathon.id}#register`,
      external: false,
      note: reg.note || '使用 HackerTrip 提供的报名流程'
    };
  }

  return {
    label: '立即报名',
    href: withReferral(reg.url, campaignId),
    external: true,
    note: reg.siteName || '将跳转至主办方站点',
    siteName: reg.siteName
  };
}

// 默认信息卡片
function getDefaultInfoCards(hackathon: Hackathon): InfoCard[] {
  return [
    { icon: 'trophy', label: '奖金池', value: hackathon.prizePool },
    { icon: 'users', label: '团队数', value: hackathon.teams },
    { icon: 'globe', label: '主题', value: hackathon.theme },
    { icon: 'mapPin', label: '举办地点', value: hackathon.venue },
  ];
}

export function EventDetail({ hackathon, isSubscribed, onToggleSubscribe }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);
  const [subscribeFeedback, setSubscribeFeedback] = useState<{ type: 'success' | 'warning'; text: string } | null>(null);
  const [pendingExternal, setPendingExternal] = useState<{ href: string; siteName?: string } | null>(null);

  const statusInfo = getStatusInfo(hackathon);
  const formattedDate = parseDateDisplay(hackathon.dateRange);
  const registrationAction = getRegistrationAction(hackathon);
  const router = useRouter();

  const organizers = hackathon.organizers || [];
  const sponsors = hackathon.sponsors || [];

  // 使用自定义卡片或默认卡片
  const infoCards = hackathon.infoCards || getDefaultInfoCards(hackathon);

  // 切换卡片展开状态
  const toggleCard = (index: number) => {
    setExpandedCardIndex(expandedCardIndex === index ? null : index);
  };

  const handleSubscribe = async () => {
    try {
      const result = await onToggleSubscribe();
      if (result === 'login-required') {
        setSubscribeFeedback({ type: 'warning', text: '请先登录后再订阅提醒' });
        return;
      }
      if (result === 'subscribed') {
        setSubscribeFeedback({ type: 'success', text: '已订阅，报名截止和开赛前会提醒你' });
      } else {
        setSubscribeFeedback({ type: 'success', text: '已取消订阅提醒' });
      }
    } catch {
      setSubscribeFeedback({ type: 'warning', text: '订阅失败，请稍后重试' });
    }
  };

  const handleRegister = () => {
    if (registrationAction.external) {
      setPendingExternal({ href: registrationAction.href, siteName: registrationAction.siteName });
      return;
    }
    router.push(registrationAction.href);
  };

  const confirmExternal = () => {
    if (pendingExternal?.href) {
      window.open(pendingExternal.href, '_blank', 'noopener,noreferrer');
    }
    setPendingExternal(null);
  };

  return (
    <section className="relative pb-20">
      <div className="w-full max-w-[1240px] mx-auto px-6 lg:px-10">
        <div className="glass rounded-[32px] overflow-hidden border border-white/5 bg-white/[0.02]">
          {/* ====== Hero Section within Card ====== */}
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* 订阅按钮 - 移到倒计时左边 */}
                  <button
                    onClick={handleSubscribe}
                    className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all text-sm font-medium ${
                      isSubscribed
                        ? `${statusInfo.color} ${statusInfo.textColor} border-current`
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-200'
                    }`}
                  >
                    <Bell size={14} />
                    {isSubscribed ? '已订阅' : '订阅'}
                  </button>

                  {/* 倒计时状态 */}
                  <div className={`px-4 py-1.5 rounded-full ${statusInfo.color} border border-white/5 flex items-center gap-2`}>
                    <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor} ${statusInfo.pulse ? 'animate-pulse' : ''}`} />
                    <span className={`font-mono text-sm uppercase tracking-wider ${statusInfo.textColor}`}>{statusInfo.text}</span>
                  </div>
                  <span className="font-mono text-sm text-gray-500 uppercase tracking-widest">{hackathon.format}</span>
                </div>

                <h3 className="font-sans text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                  {hackathon.name}
                </h3>

                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-400 font-mono text-base tracking-wide">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-indigo-400/60" />
                    {formattedDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-indigo-400/60" />
                    {hackathon.city}
                  </div>
                  {hackathon.hostOrganizer && (
                    <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-indigo-400/60" />
                      <span className="text-gray-300">主办方：</span>
                      <span className="text-white">{hackathon.hostOrganizer}</span>
                    </div>
                  )}
                </div>

                {subscribeFeedback && (
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                      subscribeFeedback.type === 'success'
                        ? 'bg-green-500/10 text-green-200 border border-green-500/20'
                        : 'bg-amber-500/10 text-amber-200 border border-amber-500/30'
                    }`}
                  >
                    <Info size={14} />
                    <span>{subscribeFeedback.text}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 min-w-[180px]">
                <button
                  type="button"
                  onClick={handleRegister}
                  className={`w-full py-3 px-6 rounded-xl font-sans text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                    registrationAction.external
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                  }`}
                >
                  立即报名
                  {registrationAction.external && <ArrowUpRight size={16} />}
                </button>
                <a
                  href={`/hackathon/${hackathon.id}`}
                  className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  查看详情
                </a>
              </div>
            </div>

            {/* Grid Stats - 可展开卡片 */}
            <div className="mb-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {infoCards.map((card, i) => {
                  const IconComponent = iconMap[card.icon] || Globe2;
                  const colorMap: Record<string, string> = {
                    trophy: 'text-yellow-500',
                    users: 'text-blue-500',
                    globe: 'text-purple-500',
                    mapPin: 'text-green-500',
                    clock: 'text-orange-500',
                    ticket: 'text-pink-500',
                    gift: 'text-red-500',
                  };
                  const color = colorMap[card.icon] || 'text-indigo-500';
                  const isCardExpanded = expandedCardIndex === i;
                  const hasExpandedContent = !!card.expandedContent;
                  const isOtherExpanded = expandedCardIndex !== null && expandedCardIndex !== i;

                  return (
                    <button
                      key={i}
                      onClick={() => hasExpandedContent && toggleCard(i)}
                      style={{
                        transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      className={`w-full p-5 rounded-2xl bg-white/[0.03] border text-left will-change-transform ${
                        isCardExpanded
                          ? 'border-indigo-500/50 bg-white/[0.06] scale-[1.02] shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                          : 'border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                      } ${hasExpandedContent ? 'cursor-pointer' : 'cursor-default'} ${
                        isOtherExpanded ? 'opacity-40 grayscale-[30%] scale-[0.98]' : 'opacity-100 scale-100'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent size={18} className={`${color} opacity-80`} />
                            <p className="text-sm text-gray-400 font-mono">{card.label}</p>
                          </div>
                          {hasExpandedContent && (
                            <ChevronDown
                              size={16}
                              className={`text-gray-500 transition-transform duration-300 ${isCardExpanded ? 'rotate-180' : ''}`}
                            />
                          )}
                        </div>
                        <p className="text-lg font-sans font-bold text-white truncate">{card.value}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 统一展开内容区域 - 使用 Grid 实现丝滑动画 */}
              <div
                className="grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  gridTemplateRows: expandedCardIndex !== null ? '1fr' : '0fr',
                  marginTop: expandedCardIndex !== null ? '16px' : '0px',
                }}
              >
                <div className="overflow-hidden">
                  <div
                    className={`p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.02] border border-white/10 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      expandedCardIndex !== null
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 -translate-y-2'
                    }`}
                  >
                    {expandedCardIndex !== null && infoCards[expandedCardIndex]?.expandedContent && (
                      <div
                        className={`space-y-3 transition-all duration-300 delay-100 ${
                          expandedCardIndex !== null ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                        }`}
                      >
                        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                          {(() => {
                            const card = infoCards[expandedCardIndex];
                            const IconComponent = iconMap[card.icon] || Globe2;
                            const colorMap: Record<string, string> = {
                              trophy: 'text-yellow-500',
                              users: 'text-blue-500',
                              globe: 'text-purple-500',
                              mapPin: 'text-green-500',
                              clock: 'text-orange-500',
                              ticket: 'text-pink-500',
                              gift: 'text-red-500',
                            };
                            const color = colorMap[card.icon] || 'text-indigo-500';
                            return (
                              <>
                                <IconComponent size={20} className={color} />
                                <span className="font-sans text-lg font-bold text-white">{card.label}详情</span>
                              </>
                            );
                          })()}
                        </div>
                        <pre className="text-base text-gray-300 font-sans whitespace-pre-wrap leading-relaxed">
                          {infoCards[expandedCardIndex].expandedContent}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm uppercase tracking-[0.2em] text-gray-500">关于本次活动</span>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>
              <p className="font-sans text-xl text-gray-300 leading-relaxed max-w-4xl">
                {hackathon.summary}
              </p>
            </div>

            <div className="mt-12 flex justify-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="group flex items-center gap-2 text-indigo-400 font-mono text-sm uppercase tracking-widest hover:text-indigo-300 transition-colors"
              >
                {isExpanded ? '收起详情' : '查看完整日程和赛道'}
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* ====== Expanded Area ====== */}
          <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-8 md:px-12 pb-12 pt-8 border-t border-white/5 bg-black/20">
              <div className="grid lg:grid-cols-2 gap-16">
                {/* Tracks */}
                <div className="space-y-8">
                  <h4 className="font-sans text-2xl font-bold text-white flex items-center gap-3">
                    赛道
                    <div className="h-px flex-1 bg-white/5" />
                  </h4>
                  <div className="space-y-6">
                    {hackathon.tracks.map((track, i) => (
                      <div key={i} className="group relative pl-6 border-l border-white/10 hover:border-indigo-500/50 transition-colors">
                        <div className="absolute -left-[1px] top-0 w-[1px] h-0 bg-indigo-500 group-hover:h-full transition-all duration-500" />
                        <h5 className="font-sans text-lg font-bold text-white mb-2">{track.title}</h5>
                        <p className="font-sans text-base text-gray-400 leading-relaxed">{track.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agenda */}
                <div className="space-y-8">
                  <h4 className="font-sans text-2xl font-bold text-white flex items-center gap-3">
                    日程安排
                    <div className="h-px flex-1 bg-white/5" />
                  </h4>
                  <div className="space-y-8">
                    {hackathon.agenda.map((item, i) => (
                      <div key={i} className="flex gap-6">
                        <div className="flex flex-col items-center gap-2 pt-1">
                          <div className="w-2 h-2 rounded-full bg-white/30" />
                          <div className="w-[1px] flex-1 bg-white/5" />
                        </div>
                        <div className="space-y-1.5">
                          <span className="font-mono text-xs uppercase tracking-tighter text-indigo-400">{item.time}</span>
                          <h5 className="font-sans text-base font-bold text-white">{item.title}</h5>
                          <p className="font-sans text-sm text-gray-500 leading-relaxed">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Partners placeholder refined */}
              {(organizers.length > 0 || sponsors.length > 0) && (
                <div className="mt-20 pt-16 border-t border-white/5 space-y-10">
                  <div className="text-center space-y-2">
                    <span className="font-mono text-sm uppercase tracking-[0.3em] text-gray-400">合作伙伴与赞助商</span>
                  </div>
                  <div className="flex flex-wrap justify-center items-center gap-8">
                    {[...organizers, ...sponsors].map((p, i) => (
                      <span key={i} className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-sm font-medium text-gray-300">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {pendingExternal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="max-w-sm w-full rounded-2xl bg-[#0e0e15] border border-white/10 p-6 space-y-4 shadow-2xl shadow-purple-900/40">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <ArrowUpRight size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-semibold">即将跳转到主办方页面</p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    将打开 {pendingExternal.siteName || '主办方'} 的报名链接完成报名，关闭后可返回继续浏览。
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingExternal(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-200 hover:bg-white/5 transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={confirmExternal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition-colors"
                >
                  确认跳转
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
