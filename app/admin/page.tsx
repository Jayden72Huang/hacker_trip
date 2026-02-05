'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  Link2,
  Search,
  Settings,
  ChevronRight,
  Home,
  UserCheck,
  Inbox,
  Globe,
} from 'lucide-react';
import { URLScraper } from './components/URLScraper';
import { TextUploader } from './components/TextUploader';
import { DraftList } from './components/DraftList';
import { GoogleSearch } from './components/GoogleSearch';
import { OrganizerReview } from './components/OrganizerReview';
import { ProductAwardsManager } from './components/ProductAwardsManager';
import { AdminSettings } from './components/AdminSettings';

type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: { id: string; label: string }[];
};

const menuItems: MenuItem[] = [
  {
    id: 'users',
    label: '用户与权限',
    icon: Users,
    children: [
      { id: 'organizer-review', label: '组织者审核' },
    ],
  },
  {
    id: 'content',
    label: '内容管理',
    icon: FileText,
    children: [
      { id: 'url-scraper', label: 'URL 爬取' },
      { id: 'text-parser', label: '文本解析' },
      { id: 'google-search', label: 'Google 检索' },
      { id: 'drafts', label: '草稿箱' },
      { id: 'product-awards', label: '作品 & 奖项' },
    ],
  },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('organizer-review');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['users', 'content']);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const handleDataAdded = () => {
    setRefreshKey((prev) => prev + 1);
    setActiveTab('drafts');
  };

  const handleDraftRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getActiveLabel = () => {
    for (const menu of menuItems) {
      if (menu.children) {
        const child = menu.children.find((c) => c.id === activeTab);
        if (child) return child.label;
      }
    }
    return '管理后台';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-black/20 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-sm">HT</span>
            </div>
            <div>
              <h1 className="font-sora text-lg font-bold text-white">HackerTrip</h1>
              <p className="text-[10px] text-gray-500 -mt-0.5">管理后台</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {/* Section: 系统 */}
          <div className="px-4 mb-2">
            <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">
              系统
            </span>
          </div>

          {menuItems.map((menu) => {
            const Icon = menu.icon;
            const isExpanded = expandedMenus.includes(menu.id);
            const hasActiveChild = menu.children?.some((c) => c.id === activeTab);

            return (
              <div key={menu.id} className="mb-1">
                <button
                  onClick={() => toggleMenu(menu.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    hasActiveChild
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={hasActiveChild ? 'text-indigo-400' : ''} />
                    <span>{menu.label}</span>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                {isExpanded && menu.children && (
                  <div className="mt-1 ml-4 border-l border-white/10">
                    {menu.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => setActiveTab(child.id)}
                        className={`w-full text-left px-6 py-2 text-sm transition-colors ${
                          activeTab === child.id
                            ? 'text-indigo-400 bg-indigo-500/10 border-l-2 border-indigo-500 -ml-px'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <Settings size={16} />
            系统设置
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <Home size={16} />
            返回首页
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-white/10 bg-black/20 backdrop-blur-sm flex items-center px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">管理后台</span>
            <ChevronRight size={14} className="text-gray-600" />
            <span className="text-white font-medium">{getActiveLabel()}</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl">
            {activeTab === 'organizer-review' && <OrganizerReview />}
            {activeTab === 'url-scraper' && <URLScraper onSuccess={handleDataAdded} />}
            {activeTab === 'text-parser' && <TextUploader onSuccess={handleDataAdded} />}
            {activeTab === 'google-search' && <GoogleSearch onSuccess={handleDraftRefresh} />}
            {activeTab === 'drafts' && <DraftList key={refreshKey} />}
            {activeTab === 'product-awards' && <ProductAwardsManager />}
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && <AdminSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
