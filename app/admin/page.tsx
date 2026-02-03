'use client';

import { useState } from 'react';
import { URLScraper } from './components/URLScraper';
import { TextUploader } from './components/TextUploader';
import { DraftList } from './components/DraftList';
import { GoogleSearch } from './components/GoogleSearch';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'drafts' | 'google'>('url');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataAdded = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('drafts');
  };

  const handleDraftRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-sora text-2xl font-bold text-white">
                黑客松管理后台
              </h1>
              <p className="font-space-mono text-sm text-gray-400 mt-1">
                智能爬取和管理中国黑客松信息
              </p>
            </div>
            <a
              href="/"
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="font-space-mono text-sm text-gray-300">返回首页</span>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('url')}
            className={`px-6 py-3 rounded-xl font-space-mono text-sm font-medium transition-all ${
              activeTab === 'url'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            📝 URL 爬取
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-6 py-3 rounded-xl font-space-mono text-sm font-medium transition-all ${
              activeTab === 'text'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            📄 文本解析
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`px-6 py-3 rounded-xl font-space-mono text-sm font-medium transition-all ${
              activeTab === 'google'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            🔎 Google 检索
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-6 py-3 rounded-xl font-space-mono text-sm font-medium transition-all ${
              activeTab === 'drafts'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            📦 草稿箱
          </button>
        </div>

        {/* Content */}
        <div className="glass rounded-2xl p-8">
          {activeTab === 'url' && <URLScraper onSuccess={handleDataAdded} />}
          {activeTab === 'text' && <TextUploader onSuccess={handleDataAdded} />}
          {activeTab === 'google' && <GoogleSearch onSuccess={handleDraftRefresh} />}
          {activeTab === 'drafts' && <DraftList key={refreshKey} />}
        </div>
      </div>
    </div>
  );
}
