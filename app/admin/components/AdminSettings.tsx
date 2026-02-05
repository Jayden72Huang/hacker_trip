'use client';

import { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Users,
  Crown,
  UserCog,
  Building2,
  User,
  ChevronRight,
  X,
} from 'lucide-react';

type ApiConfig = {
  googleCseApiKey: string;
  googleCseCx: string;
  openaiApiKey: string;
};

type UserRole = 'super_admin' | 'admin' | 'organizer' | 'user';

type RolePermission = {
  role: UserRole;
  label: string;
  icon: React.ElementType;
  color: string;
  permissions: string[];
};

const roleConfig: RolePermission[] = [
  {
    role: 'super_admin',
    label: '超级管理员',
    icon: Crown,
    color: 'text-yellow-400',
    permissions: [
      '所有管理功能',
      '系统配置',
      'API 密钥管理',
      '用户角色管理',
      '数据库管理',
    ],
  },
  {
    role: 'admin',
    label: '管理员',
    icon: UserCog,
    color: 'text-blue-400',
    permissions: [
      '内容管理',
      '组织者审核',
      '草稿管理',
      '爬虫功能',
      '查看统计',
    ],
  },
  {
    role: 'organizer',
    label: '组织者',
    icon: Building2,
    color: 'text-purple-400',
    permissions: [
      '创建活动',
      '编辑自己的活动',
      '查看报名数据',
      '发布公告',
    ],
  },
  {
    role: 'user',
    label: '普通用户',
    icon: User,
    color: 'text-gray-400',
    permissions: [
      '浏览活动',
      '报名参加',
      '个人资料',
      '收藏活动',
    ],
  },
];

type AdminSettingsProps = {
  onClose: () => void;
};

export function AdminSettings({ onClose }: AdminSettingsProps) {
  const [activeSection, setActiveSection] = useState<'api' | 'roles'>('api');
  const [config, setConfig] = useState<ApiConfig>({
    googleCseApiKey: '',
    googleCseCx: '',
    openaiApiKey: '',
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 从 localStorage 加载配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('admin_api_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch {
        // ignore
      }
    }
  }, []);

  const toggleShowKey = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);

    // 保存到 localStorage
    localStorage.setItem('admin_api_config', JSON.stringify(config));

    // 模拟保存延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Key size={20} className="text-indigo-400" />
            </div>
            系统设置
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-white/10 p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveSection('api')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeSection === 'api'
                    ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Key size={16} />
                API 配置
              </button>
              <button
                onClick={() => setActiveSection('roles')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeSection === 'roles'
                    ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield size={16} />
                权限管理
              </button>
            </nav>
          </div>

          {/* Main */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">API 密钥配置</h3>
                  <p className="text-sm text-gray-500">配置第三方服务的 API 密钥</p>
                </div>

                <div className="space-y-4">
                  {/* Google CSE API Key */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Google Custom Search API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showKeys.googleCseApiKey ? 'text' : 'password'}
                        value={config.googleCseApiKey}
                        onChange={(e) =>
                          setConfig({ ...config, googleCseApiKey: e.target.value })
                        }
                        placeholder="AIzaSy..."
                        className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50"
                      />
                      <button
                        onClick={() => toggleShowKey('googleCseApiKey')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showKeys.googleCseApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Google CSE CX */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Google Custom Search Engine ID (CX)
                    </label>
                    <div className="relative">
                      <input
                        type={showKeys.googleCseCx ? 'text' : 'password'}
                        value={config.googleCseCx}
                        onChange={(e) =>
                          setConfig({ ...config, googleCseCx: e.target.value })
                        }
                        placeholder="a1b2c3d4..."
                        className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50"
                      />
                      <button
                        onClick={() => toggleShowKey('googleCseCx')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showKeys.googleCseCx ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* OpenAI API Key */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      OpenAI API Key (可选)
                    </label>
                    <div className="relative">
                      <input
                        type={showKeys.openaiApiKey ? 'text' : 'password'}
                        value={config.openaiApiKey}
                        onChange={(e) =>
                          setConfig({ ...config, openaiApiKey: e.target.value })
                        }
                        placeholder="sk-..."
                        className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50"
                      />
                      <button
                        onClick={() => toggleShowKey('openaiApiKey')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showKeys.openaiApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-sm font-medium text-white mb-3">配置状态</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Google Search API</span>
                      {config.googleCseApiKey && config.googleCseCx ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle2 size={14} />
                          已配置
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-400 text-xs">
                          <AlertCircle size={14} />
                          未配置
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">OpenAI API</span>
                      {config.openaiApiKey ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle2 size={14} />
                          已配置
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500 text-xs">
                          <AlertCircle size={14} />
                          未配置
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      保存中...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle2 size={16} />
                      已保存
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      保存配置
                    </>
                  )}
                </button>
              </div>
            )}

            {activeSection === 'roles' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">权限管理</h3>
                  <p className="text-sm text-gray-500">查看和管理用户角色权限</p>
                </div>

                <div className="space-y-4">
                  {roleConfig.map((role) => {
                    const Icon = role.icon;
                    return (
                      <div
                        key={role.role}
                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${role.color}`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{role.label}</h4>
                            <p className="text-xs text-gray-500">{role.role}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="px-2.5 py-1 rounded-md bg-white/5 text-xs text-gray-400"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-400">
                    权限系统基于角色控制，用户角色在"用户与权限"菜单中管理。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
