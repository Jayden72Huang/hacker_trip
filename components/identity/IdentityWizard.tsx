'use client';

/**
 * ============================================================================
 *  HackerTrip — 身份卡录入向导 IdentityWizard (核心可玩页)
 * ============================================================================
 *
 *  左栏：录入表单
 *    - 4 核心字段：项目名 / 参赛时间 / 技术栈(多选) / 一句话介绍
 *    - 选填：赛事名 / 获奖 / Demo·Repo 链接
 *    - 配置卡字段：工具链 / AI 工具 / 打法 / 组队状态
 *    - 顶部「一键扫描导入示例」(调 /api/identity/scan，失败 mock 降级)
 *  右栏：实时预览
 *    - <IdentityCardPreview> + <ConfigCard> + <CareerTimeline>
 *    - computeRole 实时判定主角色，可手动点击切换(锁定 manualOverride)
 *  保存：写 localStorage(HT_IDENTITY_STORAGE_KEY)，无需登录；
 *        best-effort POST /api/identity/save；保存后展示 <ShareDock>。
 *
 *  全链路 mock + 客户端 state，不依赖 DB / 登录。深色玻璃风。
 * ============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ScanLine,
  Save,
  Check,
  Lock,
  Plus,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import IdentityCardPreview from './IdentityCardPreview';
import ConfigCard from './ConfigCard';
import CareerTimeline from './CareerTimeline';
import ShareDock from './ShareDock';
import { computeRole } from '@/lib/identity/roles';
import { createDevConfig, DEV_CONFIG_PRESETS } from '@/lib/identity/config';
import {
  ROLES,
  ROLE_MAP,
  PLAY_STYLE_META,
  LOOKING_FOR_META,
  HT_IDENTITY_STORAGE_KEY,
  type DevConfig,
  type RoleSignals,
  type CareerItem,
  type IdentityCardData,
  type HackathonRoleKey,
  type PlayStyle,
  type LookingFor,
} from '@/lib/identity/types';

const PLAY_OPTIONS: PlayStyle[] = ['solo', 'duo', 'squad', 'flexible'];
const LOOKING_OPTIONS: LookingFor[] = ['none', 'teammate', 'cofounder'];

/** 表单内部状态（含核心 4 字段 + 选填 + 配置卡） */
interface FormState {
  projectName: string;
  dateRange: string;
  intro: string;
  hackathonName: string;
  placement: string;
  demoUrl: string;
  config: DevConfig;
  manualRole: HackathonRoleKey | null;
}

const EMPTY_FORM: FormState = {
  projectName: '',
  dateRange: '',
  intro: '',
  hackathonName: '',
  placement: '',
  demoUrl: '',
  config: createDevConfig(),
  manualRole: null,
};

function isWin(placement?: string | null): boolean {
  if (!placement) return false;
  return /1st|2nd|3rd|first|second|third|winner|champion|finalist|grand|冠|亚|季|获奖|入围/i.test(
    placement,
  );
}

/** 由表单推导 IdentityCardData，用于喂给预览组件 */
function formToIdentity(form: FormState): IdentityCardData {
  const career: CareerItem[] = [];
  if (form.projectName || form.hackathonName) {
    career.push({
      id: 'draft-1',
      hackathonName: form.hackathonName || '我的黑客松',
      hackathonLogo: null,
      dateRange: form.dateRange || null,
      role: isWin(form.placement) ? 'winner' : 'participant',
      placement: form.placement || null,
      projectName: form.projectName || null,
      projectTagline: form.intro || null,
      track: null,
      verified: false,
    });
  }

  const taglineKeywords = form.intro
    .toLowerCase()
    .split(/[^a-z0-9一-龥]+/)
    .filter((w) => w.length > 1);

  const projectCount = career.filter((c) => c.projectName).length;
  const winCount = career.filter((c) => isWin(c.placement)).length;

  const signals: RoleSignals = {
    techStack: form.config.techStack,
    awards: form.placement ? [form.placement] : [],
    projectCount,
    participationCount: career.length,
    winCount,
    taglineKeywords,
    participantRoles: career.map((c) => c.role),
    shippingVelocity: career.length > 0 ? projectCount / career.length : 0,
  };

  const role = computeRole(signals, form.manualRole);

  return {
    username: 'me',
    displayName: '我',
    avatar: null,
    bio: form.intro || null,
    location: null,
    github: null,
    twitter: null,
    role,
    config: form.config,
    career,
    stats: {
      projects: projectCount,
      hackathons: career.length,
      awards: winCount,
    },
    profileViews: 0,
    source: 'local',
  };
}

export default function IdentityWizard({ refFrom }: { refFrom?: string | null }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // 回填 localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HT_IDENTITY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FormState>;
        setForm((prev) => ({
          ...prev,
          ...parsed,
          config: createDevConfig(parsed.config),
          manualRole: (parsed.manualRole as HackathonRoleKey | null) ?? null,
        }));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const identity = useMemo(() => formToIdentity(form), [form]);
  const roleMeta = ROLE_MAP[identity.role.primary];

  const patchConfig = (patch: Partial<DevConfig>) =>
    setForm((f) => ({ ...f, config: createDevConfig({ ...f.config, ...patch }) }));

  const toggleChip = (field: 'techStack' | 'tools' | 'aiTools' | 'strengths', value: string) => {
    setForm((f) => {
      const cur = f.config[field];
      const exists = cur.some((v) => v.toLowerCase() === value.toLowerCase());
      const next = exists
        ? cur.filter((v) => v.toLowerCase() !== value.toLowerCase())
        : [...cur, value];
      return { ...f, config: createDevConfig({ ...f.config, [field]: next }) };
    });
  };

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/identity/scan', { method: 'POST', body: JSON.stringify({}) });
      const json = await res.json();
      const cfg = createDevConfig(json.config);
      setForm((f) => ({
        ...f,
        projectName: f.projectName || 'ShipFast',
        intro: f.intro || '一句话生成可部署的全栈 SaaS 脚手架，48 小时跑通 Demo',
        hackathonName: f.hackathonName || 'AdventureX 2026',
        dateRange: f.dateRange || '2026.07',
        placement: f.placement || '1st',
        config: createDevConfig({ ...cfg, playStyle: 'solo', lookingFor: 'cofounder' }),
        manualRole: null,
      }));
    } catch {
      // 兜底：本地填一份示例
      setForm((f) => ({
        ...f,
        projectName: f.projectName || 'ShipFast',
        intro: f.intro || '一句话生成可部署的全栈 SaaS 脚手架',
        config: createDevConfig({
          techStack: ['TypeScript', 'Next.js', 'React', 'Tailwind CSS', 'PostgreSQL'],
          aiTools: ['Claude Code', 'Claude'],
          tools: ['VS Code', 'Vercel'],
          playStyle: 'solo',
          lookingFor: 'cofounder',
          strengths: ['全栈开发', 'AI Agent'],
        }),
      }));
    } finally {
      setScanning(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      localStorage.setItem(HT_IDENTITY_STORAGE_KEY, JSON.stringify(form));
    } catch {
      /* ignore quota */
    }
    // best-effort 写库（未登录也返回 200）
    try {
      await fetch('/api/identity/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: form.config, manualRole: form.manualRole }),
      });
    } catch {
      /* 静默降级 */
    }
    setSaving(false);
    setSaved(true);
    // 滚动到分享区
    setTimeout(() => {
      document.getElementById('share-dock')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const hasInput =
    form.projectName || form.intro || form.config.techStack.length > 0 || form.hackathonName;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ───────────── 左栏：录入表单 ───────────── */}
      <div className="flex flex-col gap-6">
        {refFrom && (
          <div
            className="animate-fade-up rounded-2xl px-4 py-3 text-sm"
            style={{ background: 'rgba(124,93,255,0.08)', border: '1px solid rgba(124,93,255,0.25)' }}
          >
            <span className="text-[#ededed]/70">
              来自 <span className="font-semibold text-[#ededed]">@{refFrom}</span> 的邀请 —
              生成你自己的黑客松身份卡 ✨
            </span>
          </div>
        )}

        {/* 一键扫描 */}
        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          style={{
            color: '#ededed',
            background: 'linear-gradient(135deg, rgba(124,93,255,0.16), rgba(77,225,255,0.12))',
            border: '1px solid rgba(124,93,255,0.3)',
          }}
        >
          {scanning ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
          {scanning ? '扫描中…' : '一键导入示例（模拟 ht-scan 扫描本地项目）'}
        </button>

        {/* 核心 4 字段 */}
        <Section title="核心信息" subtitle="4 个字段，30 秒生成你的身份卡">
          <Field label="项目名">
            <input
              value={form.projectName}
              onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))}
              placeholder="如 ShipFast"
              className="ht-input"
            />
          </Field>
          <Field label="参赛时间">
            <input
              value={form.dateRange}
              onChange={(e) => setForm((f) => ({ ...f, dateRange: e.target.value }))}
              placeholder="如 2026.07"
              className="ht-input"
            />
          </Field>
          <Field label="一句话介绍">
            <textarea
              value={form.intro}
              onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))}
              placeholder="这个项目做什么？（影响角色判定）"
              rows={2}
              className="ht-input resize-none"
            />
          </Field>
          <Field label="技术栈（多选）">
            <ChipSelector
              options={DEV_CONFIG_PRESETS.techStack as readonly string[]}
              selected={form.config.techStack}
              onToggle={(v) => toggleChip('techStack', v)}
              accent="#7c5dff"
              allowCustom
              onAddCustom={(v) => patchConfig({ techStack: [...form.config.techStack, v] })}
            />
          </Field>
        </Section>

        {/* 选填 */}
        <Section title="参赛履历（选填）" subtitle="赛事与获奖会成为你的隐形资产">
          <div className="grid grid-cols-2 gap-3">
            <Field label="赛事名">
              <input
                value={form.hackathonName}
                onChange={(e) => setForm((f) => ({ ...f, hackathonName: e.target.value }))}
                placeholder="AdventureX 2026"
                className="ht-input"
              />
            </Field>
            <Field label="获奖名次">
              <input
                value={form.placement}
                onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value }))}
                placeholder="1st / finalist"
                className="ht-input"
              />
            </Field>
          </div>
          <Field label="Demo / Repo 链接">
            <input
              value={form.demoUrl}
              onChange={(e) => setForm((f) => ({ ...f, demoUrl: e.target.value }))}
              placeholder="https://..."
              className="ht-input"
            />
          </Field>
        </Section>

        {/* 配置卡字段 */}
        <Section title="开发者配置卡" subtitle="你的装备和打法，服务找队友 / 找联合创始人">
          <Field label="AI 工具">
            <ChipSelector
              options={DEV_CONFIG_PRESETS.aiTools as readonly string[]}
              selected={form.config.aiTools}
              onToggle={(v) => toggleChip('aiTools', v)}
              accent="#4de1ff"
              allowCustom
              onAddCustom={(v) => patchConfig({ aiTools: [...form.config.aiTools, v] })}
            />
          </Field>
          <Field label="工具链">
            <ChipSelector
              options={DEV_CONFIG_PRESETS.tools as readonly string[]}
              selected={form.config.tools}
              onToggle={(v) => toggleChip('tools', v)}
              accent="#c759ff"
              allowCustom
              onAddCustom={(v) => patchConfig({ tools: [...form.config.tools, v] })}
            />
          </Field>
          <Field label="擅长方向">
            <ChipSelector
              options={DEV_CONFIG_PRESETS.strengths as readonly string[]}
              selected={form.config.strengths}
              onToggle={(v) => toggleChip('strengths', v)}
              accent="#34d399"
            />
          </Field>
          <Field label="打法风格">
            <div className="flex flex-wrap gap-2">
              {PLAY_OPTIONS.map((p) => {
                const active = form.config.playStyle === p;
                const m = PLAY_STYLE_META[p];
                return (
                  <button
                    key={p}
                    onClick={() => patchConfig({ playStyle: p })}
                    className="rounded-xl px-3.5 py-2 text-sm transition-all"
                    style={{
                      color: active ? '#05060a' : 'rgba(237,237,237,0.7)',
                      background: active ? 'linear-gradient(90deg,#7c5dff,#4de1ff)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                      fontWeight: active ? 700 : 400,
                    }}
                  >
                    {m.emoji} {m.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="组队状态">
            <div className="flex flex-wrap gap-2">
              {LOOKING_OPTIONS.map((l) => {
                const active = form.config.lookingFor === l;
                const m = LOOKING_FOR_META[l];
                return (
                  <button
                    key={l}
                    onClick={() => patchConfig({ lookingFor: l })}
                    className={`rounded-xl px-3.5 py-2 text-sm transition-all ${active && m.active ? 'glow' : ''}`}
                    style={{
                      color: active ? '#05060a' : 'rgba(237,237,237,0.7)',
                      background: active ? 'linear-gradient(90deg,#c759ff,#7c5dff)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                      fontWeight: active ? 700 : 400,
                    }}
                  >
                    {m.emoji} {m.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="开发环境（一句话）">
            <input
              value={form.config.env}
              onChange={(e) => patchConfig({ env: e.target.value })}
              placeholder="macOS + Neovim + tmux"
              className="ht-input font-mono"
            />
          </Field>
        </Section>

        {/* 保存 */}
        <button
          onClick={save}
          disabled={saving || !hasInput}
          className="flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
          style={{
            color: '#05060a',
            background: `linear-gradient(135deg, ${roleMeta.colorFrom}, ${roleMeta.colorTo})`,
            boxShadow: `0 8px 30px ${roleMeta.colorFrom}40`,
          }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
          {saving ? '保存中…' : saved ? '已保存 — 去分享 ↓' : '保存我的卡'}
        </button>
        {!hasInput && (
          <p className="-mt-3 text-center text-xs text-[#ededed]/35">
            填写项目名或选技术栈即可保存，无需登录
          </p>
        )}
      </div>

      {/* ───────────── 右栏：实时预览 ───────────── */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        {!hasInput && hydrated && (
          <div
            className="animate-fade-up rounded-2xl px-5 py-4 text-center text-sm text-[#ededed]/50"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}
          >
            👈 在左侧填写或「一键导入示例」，右侧实时生成你的身份卡
          </div>
        )}

        {/* 身份卡实时预览 */}
        <div className="animate-fade-up">
          <IdentityCardPreview data={identity} exportId="wizard-identity-card" />
        </div>

        {/* 角色切换器 */}
        <div className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#ededed]">
              我的角色：
              <span style={{ color: roleMeta.colorTo }} className="ml-1.5">
                {roleMeta.emoji} {roleMeta.name}
              </span>
            </span>
            {form.manualRole && (
              <button
                onClick={() => setForm((f) => ({ ...f, manualRole: null }))}
                className="flex items-center gap-1 text-xs text-[#ededed]/45 hover:text-[#ededed]/80"
              >
                <Lock size={11} /> 已锁定 · 恢复自动
              </button>
            )}
          </div>
          <p className="mb-3 text-xs text-[#ededed]/40">
            基于你的项目数据自动判定，也可手动选择（点击锁定）
          </p>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => {
              const active = identity.role.primary === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setForm((f) => ({ ...f, manualRole: r.key }))}
                  className="rounded-full px-3 py-1.5 text-xs transition-all"
                  style={{
                    color: active ? '#05060a' : 'rgba(237,237,237,0.65)',
                    background: active ? `linear-gradient(90deg, ${r.colorFrom}, ${r.colorTo})` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {r.emoji} {r.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 配置卡预览 */}
        <div className="animate-fade-up">
          <ConfigCard config={identity.config} roleKey={identity.role.primary} />
        </div>

        {/* 履历预览 */}
        {identity.career.length > 0 && (
          <div className="animate-fade-up">
            <CareerTimeline items={identity.career} stats={identity.stats} />
          </div>
        )}

        {/* 保存后：分享内容包 */}
        {saved && (
          <div id="share-dock" className="animate-fade-up flex flex-col gap-4">
            <ShareDock data={identity} />
            <Link
              href="/u/demo-builder"
              className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-[#ededed]/80 transition-colors hover:text-[#ededed]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Sparkles size={15} />
              看看示例个人主页长什么样
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>

      {/* 表单输入框样式（局部，复用 globals 变量风格） */}
      <style jsx global>{`
        .ht-input {
          width: 100%;
          border-radius: 0.875rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.7rem 0.9rem;
          color: #ededed;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        .ht-input::placeholder {
          color: rgba(237, 237, 237, 0.3);
        }
        .ht-input:focus {
          outline: none;
          border-color: rgba(124, 93, 255, 0.5);
          box-shadow: 0 0 0 3px rgba(124, 93, 255, 0.12);
        }
      `}</style>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 子组件
 * ------------------------------------------------------------------------- */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-bold text-[#ededed]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-[#ededed]/40">{subtitle}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-[#ededed]/45">{label}</span>
      {children}
    </div>
  );
}

function ChipSelector({
  options,
  selected,
  onToggle,
  accent,
  allowCustom,
  onAddCustom,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  accent: string;
  allowCustom?: boolean;
  onAddCustom?: (v: string) => void;
}) {
  const [custom, setCustom] = useState('');
  const isSel = (v: string) => selected.some((s) => s.toLowerCase() === v.toLowerCase());
  // 已选中的自定义项（不在预置里）
  const extras = selected.filter(
    (s) => !options.some((o) => o.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = isSel(o);
          return (
            <button
              key={o}
              onClick={() => onToggle(o)}
              className="rounded-xl px-3 py-1.5 text-sm transition-all"
              style={{
                color: active ? '#ededed' : 'rgba(237,237,237,0.55)',
                background: active ? `${accent}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? `${accent}77` : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {o}
            </button>
          );
        })}
        {extras.map((o) => (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm transition-all"
            style={{ color: '#ededed', background: `${accent}22`, border: `1px solid ${accent}77` }}
          >
            {o}
            <X size={12} className="opacity-60" />
          </button>
        ))}
      </div>
      {allowCustom && onAddCustom && (
        <div className="flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && custom.trim()) {
                onAddCustom(custom.trim());
                setCustom('');
              }
            }}
            placeholder="自定义添加，回车确认"
            className="ht-input flex-1 !py-1.5 text-sm"
          />
          <button
            onClick={() => {
              if (custom.trim()) {
                onAddCustom(custom.trim());
                setCustom('');
              }
            }}
            className="flex items-center gap-1 rounded-xl px-3 text-sm text-[#ededed]/70"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Plus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
