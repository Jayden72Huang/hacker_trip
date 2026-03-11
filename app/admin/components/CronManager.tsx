'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Loader2,
} from 'lucide-react';

type ScrapeTarget = {
  id: string;
  name: string;
  url: string;
  platform: string;
  enabled: boolean;
  schedule: string;
  lastScrapedAt: string | null;
  lastStatus: string | null;
  successCount: number;
  errorCount: number;
  createdAt: string;
};

const scheduleOptions = [
  { value: 'daily', label: '每日 (凌晨2点)', desc: '每天凌晨 2 点自动爬取' },
  { value: 'weekly', label: '每周 (周一9点)', desc: '每周一上午 9 点自动爬取' },
  { value: 'hourly', label: '每小时', desc: '每小时爬取一次' },
  { value: 'custom', label: '自定义', desc: '手动触发爬取' },
];

const platformOptions = ['DoraHacks', '牛客网', '活动行', '互动吧', '掘金', '其他'];

export function CronManager() {
  const [targets, setTargets] = useState<ScrapeTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<ScrapeTarget | null>(null);
  const [scrapingIds, setScrapingIds] = useState<Set<string>>(new Set());
  const [scrapeResults, setScrapeResults] = useState<Record<string, { status: 'success' | 'error'; message: string }>>({});
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    platform: 'DoraHacks',
    schedule: 'daily',
    enabled: true,
  });

  // 加载爬取目标
  const loadTargets = async () => {
    try {
      const response = await fetch('/api/admin/scrape-targets');
      const data = await response.json();
      if (data.success) {
        setTargets(data.data);
      }
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTargets();
  }, []);

  // 创建目标
  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/scrape-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setTargets([data.data, ...targets]);
        setShowAddModal(false);
        resetForm();
        alert('创建成功！');
      } else {
        alert(data.error || '创建失败');
      }
    } catch (error) {
      console.error('创建失败:', error);
      alert('创建失败');
    }
  };

  // 更新目标
  const handleUpdate = async () => {
    if (!editingTarget) return;

    try {
      const response = await fetch(`/api/admin/scrape-targets/${editingTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setTargets(targets.map((t) => (t.id === editingTarget.id ? data.data : t)));
        setEditingTarget(null);
        resetForm();
        alert('更新成功！');
      } else {
        alert(data.error || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败');
    }
  };

  // 删除目标
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个爬取目标吗？')) return;

    try {
      const response = await fetch(`/api/admin/scrape-targets/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setTargets(targets.filter((t) => t.id !== id));
        alert('删除成功！');
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 手动触发爬取
  const handleManualScrape = async (targetId: string) => {
    if (scrapingIds.has(targetId)) return;

    // 清除之前的结果
    setScrapeResults((prev) => { const next = { ...prev }; delete next[targetId]; return next; });
    setScrapingIds((prev) => new Set(prev).add(targetId));

    try {
      const response = await fetch('/api/cron/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });

      const data = await response.json();
      if (data.success) {
        setScrapeResults((prev) => ({ ...prev, [targetId]: { status: 'success', message: `置信度 ${((data.result?.confidence || 0) * 100).toFixed(0)}% · ${(data.result?.duration / 1000).toFixed(1)}s` } }));
        loadTargets();
      } else {
        setScrapeResults((prev) => ({ ...prev, [targetId]: { status: 'error', message: data.message || '爬取失败' } }));
      }
    } catch (error) {
      setScrapeResults((prev) => ({ ...prev, [targetId]: { status: 'error', message: '网络错误' } }));
    } finally {
      setScrapingIds((prev) => { const next = new Set(prev); next.delete(targetId); return next; });
      // 5 秒后自动清除结果提示
      setTimeout(() => {
        setScrapeResults((prev) => { const next = { ...prev }; delete next[targetId]; return next; });
      }, 5000);
    }
  };

  // 切换启用状态
  const handleToggleEnabled = async (target: ScrapeTarget) => {
    try {
      const response = await fetch(`/api/admin/scrape-targets/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !target.enabled }),
      });

      const data = await response.json();
      if (data.success) {
        setTargets(targets.map((t) => (t.id === target.id ? data.data : t)));
      }
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      platform: 'DoraHacks',
      schedule: 'daily',
      enabled: true,
    });
  };

  const openEditModal = (target: ScrapeTarget) => {
    setEditingTarget(target);
    setFormData({
      name: target.name,
      url: target.url,
      platform: target.platform,
      schedule: target.schedule,
      enabled: target.enabled,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin" size={24} />
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">定时爬取管理</h2>
          <p className="text-sm text-gray-400 mt-1">
            配置自动爬取黑客松信息的定时任务
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          添加目标
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="text-sm text-gray-400">总目标数</div>
          <div className="text-2xl font-bold mt-1">{targets.length}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-sm text-gray-400">已启用</div>
          <div className="text-2xl font-bold mt-1 text-green-400">
            {targets.filter((t) => t.enabled).length}
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-sm text-gray-400">总成功次数</div>
          <div className="text-2xl font-bold mt-1 text-blue-400">
            {targets.reduce((sum, t) => sum + t.successCount, 0)}
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-sm text-gray-400">总失败次数</div>
          <div className="text-2xl font-bold mt-1 text-red-400">
            {targets.reduce((sum, t) => sum + t.errorCount, 0)}
          </div>
        </div>
      </div>

      {/* Targets List */}
      <div className="space-y-4">
        {targets.map((target) => {
          const isScraping = scrapingIds.has(target.id);
          const result = scrapeResults[target.id];

          return (
            <div
              key={target.id}
              className={`glass rounded-xl p-6 relative overflow-hidden transition-all duration-300 ${
                isScraping ? 'ring-1 ring-indigo-500/50' : ''
              }`}
            >
              {/* 爬取进度条动画 */}
              {isScraping && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 animate-[shimmer-bar_1.5s_ease-in-out_infinite]"
                    style={{ width: '40%', animation: 'shimmer-bar 1.5s ease-in-out infinite' }} />
                </div>
              )}

              {/* 结果提示 */}
              {result && (
                <div className={`mb-4 px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm ${
                  result.status === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {result.status === 'success'
                    ? <CheckCircle2 size={16} />
                    : <XCircle size={16} />}
                  {result.status === 'success' ? '爬取成功' : '爬取失败'} · {result.message}
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{target.name}</h3>
                    {isScraping && (
                      <span className="px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-400 flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" />
                        爬取中...
                      </span>
                    )}
                    {!isScraping && (
                      <>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            target.enabled
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {target.enabled ? '已启用' : '已禁用'}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                          {scheduleOptions.find((s) => s.value === target.schedule)?.label ||
                            target.schedule}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-2 text-sm text-gray-400 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <ExternalLink size={14} />
                      {target.platform}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {target.lastScrapedAt
                        ? new Date(target.lastScrapedAt).toLocaleString('zh-CN')
                        : '从未执行'}
                    </span>
                    {target.lastStatus && !isScraping && (
                      <span className="flex items-center gap-1">
                        {target.lastStatus === 'success' ? (
                          <CheckCircle2 size={14} className="text-green-400" />
                        ) : (
                          <XCircle size={14} className="text-red-400" />
                        )}
                        {target.lastStatus === 'success' ? '成功' : '失败'}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-sm text-gray-500">
                    <a
                      href={target.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-indigo-400 transition-colors"
                    >
                      {target.url}
                    </a>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="text-green-400">成功: {target.successCount}</span>
                    <span className="text-red-400">失败: {target.errorCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleEnabled(target)}
                    disabled={isScraping}
                    className={`p-2 rounded-lg transition-colors ${
                      isScraping ? 'opacity-40 cursor-not-allowed' :
                      target.enabled
                        ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                    }`}
                    title={target.enabled ? '禁用' : '启用'}
                  >
                    {target.enabled ? <Pause size={18} /> : <Play size={18} />}
                  </button>

                  <button
                    onClick={() => handleManualScrape(target.id)}
                    disabled={isScraping}
                    className={`p-2 rounded-lg transition-colors ${
                      isScraping
                        ? 'bg-indigo-500/30 text-indigo-300 cursor-not-allowed'
                        : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400'
                    }`}
                    title="立即执行"
                  >
                    {isScraping
                      ? <Loader2 size={18} className="animate-spin" />
                      : <RefreshCw size={18} />}
                  </button>

                  <button
                    onClick={() => openEditModal(target)}
                    disabled={isScraping}
                    className={`p-2 rounded-lg transition-colors ${
                      isScraping ? 'opacity-40 cursor-not-allowed' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                    }`}
                    title="编辑"
                  >
                    <Edit2 size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(target.id)}
                    disabled={isScraping}
                    className={`p-2 rounded-lg transition-colors ${
                      isScraping ? 'opacity-40 cursor-not-allowed' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                    }`}
                    title="删除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {targets.length === 0 && (
          <div className="text-center py-12 glass rounded-xl">
            <AlertCircle size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">还没有配置爬取目标</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              添加第一个目标
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingTarget) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-xl p-6 max-w-md w-full glass border border-white/10">
            <h3 className="text-xl font-bold mb-4">
              {editingTarget ? '编辑爬取目标' : '添加爬取目标'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
                  placeholder="DoraHacks 中国"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
                  placeholder="https://dorahacks.io/zh/hackathon"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">平台</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  {platformOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">调度频率</label>
                <select
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  {scheduleOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label} - {s.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm text-gray-400">创建后立即启用</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTarget(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={editingTarget ? handleUpdate : handleCreate}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                {editingTarget ? '更新' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
