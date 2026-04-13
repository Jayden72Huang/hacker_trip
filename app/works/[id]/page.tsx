import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { projects, workTeamMembers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  CheckCircle, Github, Globe, Video, Trophy, ExternalLink, ArrowLeft, Users as UsersIcon,
} from 'lucide-react';
import Link from 'next/link';
import { getPublicUrl } from '@/lib/r2';

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project] = await db
    .select({
      project: projects,
      authorName: users.name,
      authorImage: users.image,
      authorUsername: users.username,
    })
    .from(projects)
    .leftJoin(users, eq(projects.userId, users.id))
    .where(and(eq(projects.id, id), eq(projects.verificationStatus, 'approved')))
    .limit(1);

  if (!project) notFound();

  const teamMembers = await db
    .select()
    .from(workTeamMembers)
    .where(eq(workTeamMembers.projectId, id));

  const p = project.project;
  const screenshotUrls = (p.screenshots as string[] || []).map((key) => getPublicUrl(key) || key);

  return (
    <div className="relative min-h-screen bg-[#05060a]">
      <div className="fixed inset-0 -z-10 opacity-[0.15]">
        <div className="absolute inset-0 grid-bg" />
      </div>
      <Navbar />

      <main className="relative pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/works"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={18} /> 返回作品列表
          </Link>

          {/* Title section */}
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-3">
              <h1 className="text-4xl font-bold text-white flex-1">{p.name}</h1>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 shrink-0">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-xs text-green-400 font-medium">已验证作品</span>
              </div>
            </div>
            {p.tagline && (
              <p className="text-xl text-gray-400 font-light">{p.tagline}</p>
            )}
          </div>

          {/* Meta: hackathon, awards */}
          <div className="flex flex-wrap gap-3 mb-8">
            {p.hackathonName && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-300 text-sm border border-purple-500/20">
                {p.hackathonName}
                {p.externalHackathonUrl && (
                  <a href={p.externalHackathonUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={12} />
                  </a>
                )}
              </span>
            )}
            {(p.awards as { name: string }[] || []).map((a, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-300 text-sm border border-yellow-500/20">
                <Trophy size={14} /> {a.name}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mb-10">
            {p.repoUrl && (
              <a
                href={p.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
              >
                <Github size={18} /> 查看代码
              </a>
            )}
            {p.demoUrl && (
              <a
                href={p.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                <Globe size={18} /> 访问 Demo
              </a>
            )}
            {p.videoUrl && (
              <a
                href={p.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
              >
                <Video size={18} /> 演示视频
              </a>
            )}
          </div>

          {/* Screenshots */}
          {screenshotUrls.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-4">截图</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {screenshotUrls.map((url, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-white/10">
                    <img src={url} alt={`${p.name} screenshot ${i + 1}`} className="w-full" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {p.description && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-4">项目介绍</h2>
              <div className="prose prose-invert prose-gray max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                {p.description}
              </div>
            </div>
          )}

          {/* Tech stack */}
          {(p.techStack as string[])?.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-4">技术栈</h2>
              <div className="flex flex-wrap gap-2">
                {(p.techStack as string[]).map((t, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 text-sm border border-cyan-500/20">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Team */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-white mb-4">
              <UsersIcon size={18} className="inline mr-2" />团队
            </h2>
            <div className="flex flex-wrap gap-3">
              {/* Author */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10">
                {project.authorImage && (
                  <img src={project.authorImage} alt="" className="w-8 h-8 rounded-full" />
                )}
                <div>
                  <div className="text-white text-sm font-medium">
                    {project.authorName || '匿名'}
                    <span className="ml-1.5 text-purple-400 text-xs">提交者</span>
                  </div>
                  {p.roleInProject && (
                    <div className="text-gray-500 text-xs">{p.roleInProject}</div>
                  )}
                </div>
              </div>
              {/* Team members */}
              {teamMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 text-sm">
                    {m.name[0]}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{m.name}</div>
                    {m.role && <div className="text-gray-500 text-xs">{m.role}</div>}
                  </div>
                  {m.github && (
                    <a href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white">
                      <Github size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
