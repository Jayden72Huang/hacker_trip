'use client';

import { useState, useEffect } from 'react';
import type { DraftHackathon } from '@/scrapers/core/types';
import type { InfoCard } from '@/data/hackathons';
import { PosterDesigner } from './PosterDesigner';
import { Trophy, Users, Globe, MapPin, Clock, Ticket, Gift, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

// 图标选项
const iconOptions = [
  { value: 'trophy', label: '奖杯', Icon: Trophy },
  { value: 'users', label: '团队', Icon: Users },
  { value: 'globe', label: '主题', Icon: Globe },
  { value: 'mapPin', label: '地点', Icon: MapPin },
  { value: 'clock', label: '时间', Icon: Clock },
  { value: 'ticket', label: '门票', Icon: Ticket },
  { value: 'gift', label: '礼物', Icon: Gift },
] as const;

interface HackathonEditorProps {
  draft: DraftHackathon;
  onSave: (data: any) => void;
  onPublish: () => void;
  onDelete: () => void;
  publishing: boolean;
}

export function HackathonEditor({ draft, onSave, onPublish, onDelete, publishing }: HackathonEditorProps) {
  const [formData, setFormData] = useState(draft);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(draft);
    setHasChanges(false);
  }, [draft]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(formData);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-sora text-xl font-bold text-white">
          编辑黑客松信息
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-space-mono text-sm text-white"
          >
            💾 保存
          </button>
          <button
            onClick={onPublish}
            disabled={publishing}
            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-space-mono text-sm text-white"
          >
            {publishing ? '发布中...' : '✅ 发布'}
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors font-space-mono text-sm text-red-400"
          >
            🗑️ 删除
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="font-space-mono text-xs text-yellow-400">
            ⚠️ 有未保存的更改
          </p>
        </div>
      )}

      {/* Form */}
      <div className="grid gap-4">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="font-space-mono text-sm font-medium text-gray-400">基本信息</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-space-mono text-xs text-gray-500 mb-2">
                活动名称 *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-space-mono text-xs text-gray-500 mb-2">
                短名称
              </label>
              <input
                type="text"
                value={formData.shortName || ''}
                onChange={(e) => handleChange('shortName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-space-mono text-xs text-gray-500 mb-2">
                时间范围 *
              </label>
              <input
                type="text"
                value={formData.dateRange || ''}
                onChange={(e) => handleChange('dateRange', e.target.value)}
                placeholder="例: Mar 15-16"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-space-mono text-xs text-gray-500 mb-2">
                城市 *
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-space-mono text-xs text-gray-500 mb-2">
                场地
              </label>
              <input
                type="text"
                value={formData.venue || ''}
                onChange={(e) => handleChange('venue', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-space-mono text-xs text-gray-500 mb-2">
                形式 *
              </label>
              <select
                value={formData.format || 'offline'}
                onChange={(e) => handleChange('format', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
              >
                <option value="offline">线下</option>
                <option value="online">线上</option>
                <option value="hybrid">混合</option>
              </select>
            </div>

            <div>
              <label className="block font-space-mono text-xs text-gray-500 mb-2">
                奖金
              </label>
              <input
                type="text"
                value={formData.prizePool || ''}
                onChange={(e) => handleChange('prizePool', e.target.value)}
                placeholder="例: ¥50,000"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-space-mono text-xs text-gray-500 mb-2">
                参赛队伍
              </label>
              <input
                type="text"
                value={formData.teams || ''}
                onChange={(e) => handleChange('teams', e.target.value)}
                placeholder="例: 50 组"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-space-mono text-xs text-gray-500 mb-2">
                主题
              </label>
              <input
                type="text"
                value={formData.theme || ''}
                onChange={(e) => handleChange('theme', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-space-mono text-xs text-gray-500 mb-2">
                网站链接
              </label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-space-mono text-xs text-gray-500 mb-2">
                主办方（多个用顿号分隔，如：BEYOND · 澳门政府）
              </label>
              <input
                type="text"
                value={
                  Array.isArray(formData.organizers) && formData.organizers.length > 0
                    ? formData.organizers.map((o: { name: string }) => o.name).join('、')
                    : ''
                }
                onChange={(e) => {
                  const names = e.target.value.split(/[、,，]/).map(s => s.trim()).filter(Boolean);
                  handleChange('organizers', names.map(name => ({ name })));
                }}
                placeholder="例：BEYOND · 澳门政府"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-space-mono text-xs text-gray-500 mb-2">
              简介
            </label>
            <textarea
              value={formData.summary || ''}
              onChange={(e) => handleChange('summary', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm resize-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          <PosterDesigner hackathon={formData} />
        </div>

        {/* Info Cards - 可自定义的信息卡片 */}
        <div className="space-y-3">
          <h4 className="font-space-mono text-sm font-medium text-gray-400">
            信息卡片（4个固定坑位，可自定义标题和内容）
          </h4>
          <p className="font-space-mono text-xs text-gray-500">
            这4个卡片将显示在活动详情页，点击可展开查看详细内容
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(((formData as any).infoCards as InfoCard[]) || [
              { icon: 'trophy', label: '奖金池', value: formData.prizePool || '', expandedContent: '' },
              { icon: 'users', label: '团队数', value: formData.teams || '', expandedContent: '' },
              { icon: 'globe', label: '主题', value: formData.theme || '', expandedContent: '' },
              { icon: 'mapPin', label: '举办地点', value: formData.venue || '', expandedContent: '' },
            ]).map((card: InfoCard, index: number) => {
              const IconOption = iconOptions.find(opt => opt.value === card.icon);
              const IconComponent = IconOption?.Icon || Trophy;

              return (
                <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <GripVertical size={16} className="text-gray-500" />
                    <span className="font-space-mono text-xs text-gray-400">卡片 {index + 1}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-space-mono text-xs text-gray-500 mb-1">图标</label>
                      <select
                        value={card.icon}
                        onChange={(e) => {
                          const newCards = [...(((formData as any).infoCards as InfoCard[]) || [
                            { icon: 'trophy', label: '奖金池', value: formData.prizePool || '', expandedContent: '' },
                            { icon: 'users', label: '团队数', value: formData.teams || '', expandedContent: '' },
                            { icon: 'globe', label: '主题', value: formData.theme || '', expandedContent: '' },
                            { icon: 'mapPin', label: '举办地点', value: formData.venue || '', expandedContent: '' },
                          ])];
                          newCards[index] = { ...card, icon: e.target.value as InfoCard['icon'] };
                          handleChange('infoCards', newCards);
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-xs"
                      >
                        {iconOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-space-mono text-xs text-gray-500 mb-1">小标题</label>
                      <input
                        type="text"
                        value={card.label}
                        onChange={(e) => {
                          const newCards = [...(((formData as any).infoCards as InfoCard[]) || [
                            { icon: 'trophy', label: '奖金池', value: formData.prizePool || '', expandedContent: '' },
                            { icon: 'users', label: '团队数', value: formData.teams || '', expandedContent: '' },
                            { icon: 'globe', label: '主题', value: formData.theme || '', expandedContent: '' },
                            { icon: 'mapPin', label: '举办地点', value: formData.venue || '', expandedContent: '' },
                          ])];
                          newCards[index] = { ...card, label: e.target.value };
                          handleChange('infoCards', newCards);
                        }}
                        placeholder="例：奖金池"
                        className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-space-mono text-xs text-gray-500 mb-1">显示内容</label>
                    <input
                      type="text"
                      value={card.value}
                      onChange={(e) => {
                        const newCards = [...(((formData as any).infoCards as InfoCard[]) || [
                          { icon: 'trophy', label: '奖金池', value: formData.prizePool || '', expandedContent: '' },
                          { icon: 'users', label: '团队数', value: formData.teams || '', expandedContent: '' },
                          { icon: 'globe', label: '主题', value: formData.theme || '', expandedContent: '' },
                          { icon: 'mapPin', label: '举办地点', value: formData.venue || '', expandedContent: '' },
                        ])];
                        newCards[index] = { ...card, value: e.target.value };
                        handleChange('infoCards', newCards);
                      }}
                      placeholder="例：¥500,000"
                      className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-space-mono text-xs text-gray-500 mb-1">展开详情（点击卡片后显示）</label>
                    <textarea
                      value={card.expandedContent || ''}
                      onChange={(e) => {
                        const newCards = [...(((formData as any).infoCards as InfoCard[]) || [
                          { icon: 'trophy', label: '奖金池', value: formData.prizePool || '', expandedContent: '' },
                          { icon: 'users', label: '团队数', value: formData.teams || '', expandedContent: '' },
                          { icon: 'globe', label: '主题', value: formData.theme || '', expandedContent: '' },
                          { icon: 'mapPin', label: '举办地点', value: formData.venue || '', expandedContent: '' },
                        ])];
                        newCards[index] = { ...card, expandedContent: e.target.value };
                        handleChange('infoCards', newCards);
                      }}
                      rows={3}
                      placeholder="点击展开后显示的详细内容...&#10;例：一等奖 ¥200,000 × 1名&#10;二等奖 ¥100,000 × 2名"
                      className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-xs resize-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tracks */}
        <div className="space-y-3">
          <h4 className="font-space-mono text-sm font-medium text-gray-400">赛道信息</h4>
          <div className="space-y-2">
            {(formData.tracks || []).map((track, index) => (
              <div key={index} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <input
                  type="text"
                  value={track.title}
                  onChange={(e) => {
                    const newTracks = [...(formData.tracks || [])];
                    newTracks[index] = { ...track, title: e.target.value };
                    handleChange('tracks', newTracks);
                  }}
                  placeholder="赛道标题"
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm"
                />
                <textarea
                  value={track.description}
                  onChange={(e) => {
                    const newTracks = [...(formData.tracks || [])];
                    newTracks[index] = { ...track, description: e.target.value };
                    handleChange('tracks', newTracks);
                  }}
                  placeholder="赛道描述"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-sm resize-none"
                />
              </div>
            ))}
            <button
              onClick={() => {
                const newTracks = [...(formData.tracks || []), { title: '', description: '' }];
                handleChange('tracks', newTracks);
              }}
              className="w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-space-mono text-sm text-gray-400"
            >
              + 添加赛道
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
