/**
 * 通知系统 - 事件驱动的邮件推送
 *
 * 触发场景：
 * 1. 新黑客松上线 → 通知所有开启订阅的用户
 * 2. 用户订阅的活动状态更新 → 通知该用户
 */

import { Resend } from 'resend';
import { db } from '@/lib/db';
import { notifications, users, participations, hackathons } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

const resend = new Resend(process.env.AUTH_RESEND_KEY);
const FROM = process.env.EMAIL_FROM || 'HackerTrip <noreply@hackertrip.space>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackertrip.space';

interface NotificationPrefs {
  emailNotifications?: boolean;
  hackathonAlerts?: boolean;
  registrationReminders?: boolean;
  [key: string]: boolean | undefined;
}

/**
 * 新黑客松上线 → 通知所有开启 hackathonAlerts 的用户
 */
export async function notifyNewHackathon(hackathonId: string, hackathonName: string) {
  // 查询所有开启了邮件订阅 + 黑客松提醒的用户
  const subscribedUsers = await db
    .select({ id: users.id, email: users.email, notificationPrefs: users.notificationPrefs })
    .from(users)
    .where(
      and(
        sql`${users.notificationPrefs}->>'emailNotifications' = 'true'`,
        sql`${users.notificationPrefs}->>'hackathonAlerts' != 'false'`,
      )
    );

  const linkUrl = `/hackathon/${hackathonId}`;
  let sent = 0;

  for (const user of subscribedUsers) {
    if (!user.email) continue;

    try {
      const [notif] = await db.insert(notifications).values({
        userId: user.id,
        type: 'hackathon_match',
        title: `新黑客松上线：${hackathonName}`,
        body: '快来查看详情，报名参赛吧！',
        linkUrl,
        relatedHackathonId: hackathonId,
        emailSent: false,
      }).returning({ id: notifications.id });

      await sendEmail({
        to: user.email,
        subject: `新黑客松上线：${hackathonName} - HackerTrip`,
        title: `新黑客松上线`,
        heading: hackathonName,
        body: '一个新的黑客松活动刚刚在 HackerTrip 上线，快来查看详情吧！',
        linkUrl,
        buttonText: '查看黑客松',
      });

      if (notif) {
        await db.update(notifications).set({ emailSent: true }).where(eq(notifications.id, notif.id));
      }
      sent++;
    } catch (error) {
      console.error(`[Notify] 发送失败 (user=${user.id}):`, error);
    }
  }

  console.log(`[Notify] 新黑客松通知: ${sent}/${subscribedUsers.length} 封邮件已发送`);
  return { total: subscribedUsers.length, sent };
}

/**
 * 活动状态更新 → 通知参与该活动的用户
 */
export async function notifyHackathonUpdate(
  hackathonId: string,
  updateTitle: string,
  updateBody: string,
) {
  // 查询该黑客松名称
  const [hackathon] = await db
    .select({ name: hackathons.name })
    .from(hackathons)
    .where(eq(hackathons.id, hackathonId))
    .limit(1);

  if (!hackathon) return { total: 0, sent: 0 };

  // 查询参与该活动且开启邮件订阅的用户
  const participants = await db
    .select({
      userId: participations.userId,
      email: users.email,
      notificationPrefs: users.notificationPrefs,
    })
    .from(participations)
    .innerJoin(users, eq(users.id, participations.userId))
    .where(eq(participations.hackathonId, hackathonId));

  const linkUrl = `/hackathon/${hackathonId}`;
  let sent = 0;

  for (const p of participants) {
    if (!p.email) continue;

    const prefs = (p.notificationPrefs || {}) as NotificationPrefs;
    if (!prefs.emailNotifications) continue;

    try {
      const [notif] = await db.insert(notifications).values({
        userId: p.userId,
        type: 'registration_deadline',
        title: updateTitle,
        body: updateBody,
        linkUrl,
        relatedHackathonId: hackathonId,
        emailSent: false,
      }).returning({ id: notifications.id });

      await sendEmail({
        to: p.email,
        subject: `${hackathon.name} - ${updateTitle} - HackerTrip`,
        title: updateTitle,
        heading: hackathon.name,
        body: updateBody,
        linkUrl,
        buttonText: '查看详情',
      });

      if (notif) {
        await db.update(notifications).set({ emailSent: true }).where(eq(notifications.id, notif.id));
      }
      sent++;
    } catch (error) {
      console.error(`[Notify] 发送失败 (user=${p.userId}):`, error);
    }
  }

  console.log(`[Notify] 活动更新通知: ${sent}/${participants.length} 封邮件已发送`);
  return { total: participants.length, sent };
}

/**
 * 项目推荐通知 → 通知项目作者有匹配的黑客松
 */
export async function notifyProjectRecommendation(
  userId: string,
  projectName: string,
  hackathonName: string,
  hackathonId: string,
  matchedTechStack: string[],
) {
  const [user] = await db
    .select({ email: users.email, notificationPrefs: users.notificationPrefs })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return;

  const prefs = (user.notificationPrefs || {}) as NotificationPrefs;
  const shouldSendEmail = Boolean(prefs.emailNotifications && user.email);
  const linkUrl = `/hackathon/${hackathonId}`;
  const matchText = matchedTechStack.length > 0
    ? `技术栈匹配：${matchedTechStack.join(', ')}`
    : '赛道和方向高度匹配';

  const [notif] = await db.insert(notifications).values({
    userId,
    type: 'project_recommendation',
    title: `你的项目「${projectName}」适合参加 ${hackathonName}`,
    body: matchText,
    linkUrl,
    relatedHackathonId: hackathonId,
    emailSent: false,
  }).returning({ id: notifications.id });

  if (shouldSendEmail) {
    await sendEmail({
      to: user.email!,
      subject: `你的项目「${projectName}」适合参加 ${hackathonName} - HackerTrip`,
      title: '项目推荐',
      heading: hackathonName,
      body: `基于「${projectName}」的${matchText}，我们推荐你参加这个比赛！`,
      linkUrl,
      buttonText: '查看比赛',
    });

    if (notif) {
      await db.update(notifications).set({ emailSent: true }).where(eq(notifications.id, notif.id));
    }
  }
}

/**
 * 新私信通知 → 通知收件人
 */
export async function notifyNewMessage(
  recipientId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string,
) {
  const [user] = await db
    .select({ email: users.email, notificationPrefs: users.notificationPrefs })
    .from(users)
    .where(eq(users.id, recipientId))
    .limit(1);

  if (!user) return;

  const prefs = (user.notificationPrefs || {}) as NotificationPrefs;
  const shouldSendEmail = Boolean(prefs.emailNotifications && user.email);
  const linkUrl = `/messages?conversation=${conversationId}`;

  await db.insert(notifications).values({
    userId: recipientId,
    type: 'direct_message',
    title: `${senderName} 给你发了一条消息`,
    body: messagePreview.slice(0, 100),
    linkUrl,
    emailSent: shouldSendEmail,
  });

  if (shouldSendEmail) {
    await sendEmail({
      to: user.email!,
      subject: `${senderName} 给你发了一条消息 - HackerTrip`,
      title: '新消息',
      heading: `来自 ${senderName}`,
      body: messagePreview.slice(0, 200),
      linkUrl,
      buttonText: '查看消息',
    });
  }
}

/**
 * A2A 协商通知 → 通知被协商方
 */
export async function notifyNegotiation(
  recipientId: string,
  initiatorName: string,
  hackathonName: string | null,
  negotiationId: string,
) {
  const linkUrl = `/messages?negotiation=${negotiationId}`;
  const title = hackathonName
    ? `${initiatorName} 邀请你一起参加 ${hackathonName}`
    : `${initiatorName} 想和你组队`;

  await db.insert(notifications).values({
    userId: recipientId,
    type: 'agent_negotiation',
    title,
    body: '查看详情并回复组队邀请',
    linkUrl,
  });
}

/**
 * 发送暗色主题 HTML 邮件
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  title: string;
  heading: string;
  body: string;
  linkUrl: string;
  buttonText: string;
}) {
  const { to, subject, title, heading, body, linkUrl, buttonText } = params;
  const actionUrl = linkUrl.startsWith('http') ? linkUrl : `${BASE_URL}${linkUrl}`;
  const safeTitle = escapeHtml(title);
  const safeHeading = escapeHtml(heading);
  const safeBody = escapeHtml(body);
  const safeButtonText = escapeHtml(buttonText);
  const safeActionUrl = escapeHtml(actionUrl);
  const safeBaseUrl = escapeHtml(BASE_URL);

  return resend.emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 40px 32px; border-radius: 12px;">
        <h1 style="color: #7c5dff; font-size: 24px; margin-bottom: 8px;">HackerTrip</h1>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 16px 0 24px;" />

        <p style="font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">${safeTitle}</p>
        <p style="font-size: 20px; font-weight: 600; line-height: 1.4; margin-bottom: 16px; color: #4de1ff;">
          ${safeHeading}
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.7);">
          ${safeBody}
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${safeActionUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c5dff, #c759ff); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
            ${safeButtonText}
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0 16px;" />
        <p style="font-size: 12px; color: rgba(255,255,255,0.3);">
          此邮件由 HackerTrip 自动发送，如需关闭邮件通知请前往
          <a href="${safeBaseUrl}/settings" style="color: #7c5dff;">个人设置</a>。
        </p>
      </div>
    `,
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}
