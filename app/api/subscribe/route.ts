import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { db } from '@/lib/db';
import { subscribers, hackathons } from '@/lib/db/schema';
import { eq, gte, asc } from 'drizzle-orm';

const resendApiKey = process.env.AUTH_RESEND_KEY;
const fromEmail = process.env.EMAIL_FROM || 'HackerTrip <noreply@hackertrip.space>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackertrip.space';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const isValidEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c)
  );
}

function formatDate(d: Date) {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

interface UpcomingHackathon {
  name: string;
  slug: string;
  startDate: Date;
  endDate: Date;
  location: string | null;
  mode: string | null;
}

function buildHackathonCard(h: UpcomingHackathon) {
  const name = escapeHtml(h.name);
  const dateRange = `${formatDate(h.startDate)} - ${formatDate(h.endDate)}`;
  const loc = h.location ? escapeHtml(h.location) : (h.mode === 'online' ? '线上' : '待定');
  const url = escapeHtml(`${BASE_URL}/hackathon/${h.slug}`);
  return `
    <a href="${url}" style="display:block;text-decoration:none;background:rgba(124,93,255,0.08);border:1px solid rgba(124,93,255,0.2);border-radius:10px;padding:14px 16px;margin-bottom:10px;">
      <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#e5e7eb;">${name}</p>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">📅 ${dateRange} &nbsp;·&nbsp; 📍 ${loc}</p>
    </a>`;
}

function buildWelcomeHtml(email: string, upcoming: UpcomingHackathon[]) {
  const logoUrl = `${BASE_URL}/logo.png`;
  const hackathonSection = upcoming.length > 0 ? `
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:28px 0 20px;" />
      <p style="margin:0 0 14px;font-size:16px;font-weight:600;color:#4de1ff;">🔥 即将到来的黑客松</p>
      ${upcoming.map(buildHackathonCard).join('')}
  ` : '';

  return `
  <div style="background:#0b0b12;padding:28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e7eb;">
    <div style="max-width:560px;margin:0 auto;background:#111118;border:1px solid #1f2233;border-radius:16px;padding:28px;">
      <div style="margin:0 0 16px;display:flex;align-items:center;">
        <img src="${logoUrl}" alt="HackerTrip" width="32" height="32" style="display:inline-block;vertical-align:middle;border-radius:6px;" />
        <span style="margin-left:10px;font-size:20px;font-weight:700;color:#7c5dff;vertical-align:middle;">HackerTrip</span>
      </div>
      <hr style="border:none;border-top:1px solid #1f2233;margin:0 0 20px;" />
      <p style="margin:0 0 12px;font-size:14px;color:#9ca3af;">Hi ${escapeHtml(email)},</p>
      <h2 style="margin:0 0 14px;font-size:20px;color:#f5f3ff;">欢迎订阅 HackerTrip 黑客松资讯</h2>
      <p style="margin:0 0 12px;line-height:1.6;color:#c7d2fe;">
        感谢你的订阅！我们每周会为你精选最新的黑客松活动、参赛技巧和独家资讯。
      </p>
      <p style="margin:0 0 18px;line-height:1.6;color:#e5e7eb;">
        如果有即将开始的热门黑客松，我们也会第一时间通知你。
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${BASE_URL}/explore" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7c5dff,#c759ff);color:#fff;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px;">
          开始探索黑客松
        </a>
      </div>
      ${hackathonSection}
      <hr style="border:none;border-top:1px solid #1f2233;margin:24px 0 14px;" />
      <p style="margin:0;font-size:12px;color:#6b7280;">如果这不是你本人的操作，可以忽略此邮件。</p>
    </div>
  </div>`;
}

async function getUpcomingHackathons(): Promise<UpcomingHackathon[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows = await db
    .select({
      name: hackathons.name,
      slug: hackathons.slug,
      startDate: hackathons.startDate,
      endDate: hackathons.endDate,
      location: hackathons.location,
      mode: hackathons.mode,
    })
    .from(hackathons)
    .where(gte(hackathons.endDate, today))
    .orderBy(asc(hackathons.startDate))
    .limit(3);
  return rows;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: '请输入有效的邮箱' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    const existing = await db
      .select({ id: subscribers.id })
      .from(subscribers)
      .where(eq(subscribers.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ success: true });
    }

    await db.insert(subscribers).values({
      email: normalizedEmail,
      source: 'homepage',
    });

    if (resend) {
      const upcoming = await getUpcomingHackathons();
      await resend.emails.send({
        from: fromEmail,
        to: normalizedEmail,
        subject: '欢迎订阅 HackerTrip 黑客松资讯',
        text: '感谢订阅 HackerTrip，我们每周会为你精选最新黑客松活动。',
        html: buildWelcomeHtml(normalizedEmail, upcoming),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: '订阅失败，请稍后再试' },
      { status: 500 }
    );
  }
}
