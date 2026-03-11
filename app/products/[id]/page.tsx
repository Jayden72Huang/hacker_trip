'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { projects } from '@/data/projects';
import {
  ArrowLeft,
  Trophy,
  Heart,
  Eye,
  ExternalLink,
  Github,
  Play,
  Share2,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const project = projects.find((p) => p.id === params.id);

  useEffect(() => {
    if (!project) {
      router.push('/products');
    }
  }, [project, router]);

  if (!project) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="fixed inset-0 -z-10 grid-bg opacity-50" aria-hidden />
        <div className="text-center">
          <p className="text-gray-500 mb-4">作品不存在</p>
          <Link href="/products" className="text-indigo-400 hover:text-indigo-300">
            返回榜单
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-12">
      {/* 背景 */}
      <div className="fixed inset-0 -z-10 grid-bg opacity-50" aria-hidden />
      <div className="fixed inset-0 z-[-5] overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-20 left-1/5 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[150px]" />
        <div className="absolute top-40 right-1/5 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[150px]" />
      </div>

      <Navbar />

      <main className="pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* 返回按钮 */}
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            返回榜单
          </Link>

          {/* 主卡片 */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            {/* 封面区域 */}
            <div className="h-48 sm:h-64 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 relative">
              {project.coverImage && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-60"
                  style={{ backgroundImage: `url(${project.coverImage})` }}
                />
              )}
              {/* 获奖徽章 */}
              {project.awards && project.awards.length > 0 && (
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  {project.awards.map((award, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm"
                    >
                      <Trophy size={14} className="text-amber-400" />
                      <span className="text-sm font-medium text-white">{award.title}</span>
                      {award.prize && (
                        <span className="text-xs text-amber-300 ml-1">{award.prize}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 内容区 */}
            <div className="p-6 sm:p-8">
              {/* 头部信息 */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {project.name}
                  </h1>
                  <p className="text-base text-gray-400">{project.tagline}</p>
                </div>

                {/* 统计数据 */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Heart size={16} />
                    {project.likes}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye size={16} />
                    {project.views}
                  </span>
                  <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              {/* 作者信息 */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                <img
                  src={project.user.avatar || '/avatars/default.png'}
                  alt={project.user.name}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
                <div>
                  <p className="font-medium text-white">{project.user.name}</p>
                  <p className="text-sm text-gray-500">{project.user.title || 'Builder'}</p>
                </div>
              </div>

              {/* 标签区 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">来源</h3>
                <Link
                  href={`/hackathon/${project.hackathonSlug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition-colors"
                >
                  {project.hackathonName}
                  <ExternalLink size={14} />
                </Link>
              </div>

              {/* 赛道和技术栈 */}
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">赛道</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tracks.map((track) => (
                      <span
                        key={track}
                        className="px-3 py-1.5 rounded-full text-sm bg-white/5 text-gray-300 border border-white/10"
                      >
                        {track}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">技术栈</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 rounded-full text-sm bg-purple-500/15 text-purple-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-white/10">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 transition-colors"
                  >
                    <ExternalLink size={16} />
                    查看 Demo
                  </a>
                )}
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    <Github size={16} />
                    源代码
                  </a>
                )}
                {project.videoUrl && (
                  <a
                    href={project.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    <Play size={16} />
                    演示视频
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 相关作品推荐 */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-white mb-4">同场黑客松作品</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects
                .filter((p) => p.hackathonId === project.hackathonId && p.id !== project.id)
                .slice(0, 3)
                .map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="group rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all p-4"
                  >
                    <h3 className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.tagline}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <img
                        src={p.user.avatar || '/avatars/default.png'}
                        alt={p.user.name}
                        className="w-5 h-5 rounded-full border border-white/10"
                      />
                      <span className="text-xs text-gray-500">{p.user.name}</span>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
