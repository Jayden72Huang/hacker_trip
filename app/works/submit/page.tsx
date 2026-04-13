'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  ArrowLeft, ArrowRight, Upload, X, Plus, Check,
  Github, Globe, Video, Users, Trophy, Send,
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

interface TeamMember {
  name: string;
  role: string;
  github?: string;
}

export default function SubmitWorkPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [roleInProject, setRoleInProject] = useState('');
  const [hackathonName, setHackathonName] = useState('');
  const [externalHackathonUrl, setExternalHackathonUrl] = useState('');
  const [awards, setAwards] = useState<string[]>([]);
  const [newAward, setNewAward] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [newTech, setNewTech] = useState('');
  const [screenshots, setScreenshots] = useState<{ key: string; publicUrl: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const addAward = () => {
    if (newAward.trim()) {
      setAwards((prev) => [...prev, newAward.trim()]);
      setNewAward('');
    }
  };

  const addTech = () => {
    if (newTech.trim()) {
      setTechStack((prev) => [...prev, newTech.trim()]);
      setNewTech('');
    }
  };

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/works/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const { data } = await res.json();
          setScreenshots((prev) => [...prev, { key: data.key, publicUrl: data.publicUrl }]);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setUploading(false);
    e.target.value = '';
  }, []);

  const handleSubmit = async (asDraft: boolean) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tagline,
          description,
          roleInProject,
          hackathonName: hackathonName || undefined,
          externalHackathonUrl: externalHackathonUrl || undefined,
          awards: awards.map((a) => ({ name: a })),
          repoUrl: repoUrl || undefined,
          demoUrl: demoUrl || undefined,
          videoUrl: videoUrl || undefined,
          techStack,
          screenshots: screenshots.map((s) => s.key),
          teamMembers: teamMembers.length > 0 ? teamMembers : undefined,
          submitForReview: !asDraft,
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        if (!asDraft) {
          // 触发提交审核
          await fetch(`/api/works/${data.id}/submit`, { method: 'POST' });
        }
        router.push('/works/my');
      }
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: '基本信息' },
    { num: 2, label: '关联比赛' },
    { num: 3, label: '链接与媒体' },
    { num: 4, label: '团队与预览' },
  ];

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    return true;
  };

  const inputClass = 'w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-2';

  return (
    <div className="relative min-h-screen bg-[#05060a]">
      <div className="fixed inset-0 -z-10 opacity-[0.15]">
        <div className="absolute inset-0 grid-bg" />
      </div>
      <Navbar />

      <main className="relative pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">提交作品</h1>
            <p className="text-gray-400">展示你的黑客松作品，让更多人看到</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-10">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => s.num <= step && setStep(s.num as Step)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    step === s.num
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : step > s.num
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-white/5 text-gray-500 border border-white/5'
                  }`}
                >
                  {step > s.num ? <Check size={14} /> : <span>{s.num}</span>}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`h-px flex-1 ${step > s.num ? 'bg-green-500/30' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: 基本信息 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className={labelClass}>作品名称 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="你的项目叫什么？"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>一句话介绍</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="用一句话描述你的项目"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>详细描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="介绍项目的功能、技术亮点、灵感来源..."
                  rows={5}
                  className={inputClass + ' resize-none'}
                />
              </div>
              <div>
                <label className={labelClass}>你在项目中的角色</label>
                <select
                  value={roleInProject}
                  onChange={(e) => setRoleInProject(e.target.value)}
                  className={inputClass}
                >
                  <option value="">选择角色</option>
                  <option value="leader">Team Lead</option>
                  <option value="fullstack">全栈开发</option>
                  <option value="frontend">前端开发</option>
                  <option value="backend">后端开发</option>
                  <option value="design">设计师</option>
                  <option value="pm">产品经理</option>
                  <option value="ai">AI/ML 工程师</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: 关联比赛 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className={labelClass}>黑客松名称</label>
                <input
                  type="text"
                  value={hackathonName}
                  onChange={(e) => setHackathonName(e.target.value)}
                  placeholder="参加的黑客松名称"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>黑客松链接（可选）</label>
                <input
                  type="url"
                  value={externalHackathonUrl}
                  onChange={(e) => setExternalHackathonUrl(e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>获得的奖项</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newAward}
                    onChange={(e) => setNewAward(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAward())}
                    placeholder="如：一等奖、最佳创意奖"
                    className={inputClass + ' flex-1'}
                  />
                  <button onClick={addAward} className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors">
                    <Plus size={18} />
                  </button>
                </div>
                {awards.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {awards.map((a, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-300 text-sm border border-yellow-500/20">
                        <Trophy size={12} />
                        {a}
                        <button onClick={() => setAwards((prev) => prev.filter((_, j) => j !== i))}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: 链接与媒体 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className={labelClass}>
                  <Github size={14} className="inline mr-1.5" />GitHub 仓库
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Globe size={14} className="inline mr-1.5" />Demo 链接
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Video size={14} className="inline mr-1.5" />视频链接（可选）
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="YouTube / Bilibili 链接"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>技术栈</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                    placeholder="如：React, Python, GPT-4"
                    className={inputClass + ' flex-1'}
                  />
                  <button onClick={addTech} className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors">
                    <Plus size={18} />
                  </button>
                </div>
                {techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {techStack.map((t, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 text-sm border border-cyan-500/20">
                        {t}
                        <button onClick={() => setTechStack((prev) => prev.filter((_, j) => j !== i))}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  <Upload size={14} className="inline mr-1.5" />截图（最多 10 张）
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  {screenshots.map((s, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10">
                      <img src={s.publicUrl || ''} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setScreenshots((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {screenshots.length < 10 && (
                    <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/30 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-all">
                      <Upload size={24} className="text-gray-500 mb-1" />
                      <span className="text-xs text-gray-500">{uploading ? '上传中...' : '点击上传'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 团队与预览 */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className={labelClass}>
                  <Users size={14} className="inline mr-1.5" />团队成员
                </label>
                {teamMembers.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const updated = [...teamMembers];
                        updated[i] = { ...m, name: e.target.value };
                        setTeamMembers(updated);
                      }}
                      placeholder="姓名"
                      className={inputClass + ' flex-1'}
                    />
                    <input
                      type="text"
                      value={m.role}
                      onChange={(e) => {
                        const updated = [...teamMembers];
                        updated[i] = { ...m, role: e.target.value };
                        setTeamMembers(updated);
                      }}
                      placeholder="角色"
                      className={inputClass + ' w-32'}
                    />
                    <button
                      onClick={() => setTeamMembers((prev) => prev.filter((_, j) => j !== i))}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setTeamMembers((prev) => [...prev, { name: '', role: '' }])}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm"
                >
                  <Plus size={16} /> 添加成员
                </button>
              </div>

              {/* 预览卡片 */}
              <div className="mt-8 p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-1">{name || '作品名称'}</h3>
                <p className="text-gray-400 text-sm mb-4">{tagline || '一句话介绍'}</p>
                {hackathonName && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20">
                      {hackathonName}
                    </span>
                  </div>
                )}
                {awards.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {awards.map((a, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 text-xs">
                        🏆 {a}
                      </span>
                    ))}
                  </div>
                )}
                {techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {techStack.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs">{t}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 text-sm text-gray-500">
                  {repoUrl && <span className="flex items-center gap-1"><Github size={14} /> GitHub</span>}
                  {demoUrl && <span className="flex items-center gap-1"><Globe size={14} /> Demo</span>}
                  {teamMembers.filter((m) => m.name).length > 0 && (
                    <span className="flex items-center gap-1"><Users size={14} /> {teamMembers.filter((m) => m.name).length} 人团队</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
            {step > 1 ? (
              <button
                onClick={() => setStep((step - 1) as Step)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft size={18} /> 上一步
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={() => canNext() && setStep((step + 1) as Step)}
                disabled={!canNext()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一步 <ArrowRight size={18} />
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={submitting}
                  className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
                >
                  存为草稿
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting || !name.trim()}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={18} /> {submitting ? '提交中...' : '提交审核'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
