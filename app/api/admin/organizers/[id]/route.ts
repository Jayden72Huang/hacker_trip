/**
 * API: 管理员 - 组织者审核操作
 * PATCH /api/admin/organizers/[id] - 审核组织者申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { db } from '@/lib/db';
import { organizerProfiles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkAdmin } from '@/lib/auth-helpers';

const resend = new Resend(process.env.AUTH_RESEND_KEY);
const FROM = process.env.EMAIL_FROM || 'HackerTrip <noreply@hackertrip.space>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackertrip.space';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAdmin();
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: '无效的操作' },
        { status: 400 }
      );
    }

    // 检查申请是否存在
    const profile = await db.query.organizerProfiles.findFirst({
      where: eq(organizerProfiles.id, id),
    });

    if (!profile) {
      return NextResponse.json(
        { error: '申请不存在' },
        { status: 404 }
      );
    }

    // 执行审核操作
    if (action === 'approve') {
      await db
        .update(organizerProfiles)
        .set({
          status: 'approved',
          approvedAt: new Date(),
          rejectedAt: null,
          rejectionReason: null,
        })
        .where(eq(organizerProfiles.id, id));
    } else {
      await db
        .update(organizerProfiles)
        .set({
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: rejectionReason || '申请信息不符合要求',
          approvedAt: null,
        })
        .where(eq(organizerProfiles.id, id));
    }

    // 获取更新后的数据
    const updatedProfile = await db.query.organizerProfiles.findFirst({
      where: eq(organizerProfiles.id, id),
    });

    // 发送邮件通知组织者
    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, profile.userId))
      .limit(1);

    if (user?.email) {
      const isApproved = action === 'approve';

      try {
        await resend.emails.send({
          from: FROM,
          to: user.email,
          subject: isApproved
            ? '你的组织者申请已通过 - HackerTrip'
            : '关于你的组织者申请 - HackerTrip',
          html: isApproved
            ? buildApprovedHtml()
            : buildRejectedHtml(rejectionReason || '申请信息不符合要求'),
        });
      } catch (e) {
        console.error('[OrganizerNotify] 邮件发送失败:', e);
      }
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Review organizer error:', error);
    return NextResponse.json(
      { error: '审核操作失败' },
      { status: 500 }
    );
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );
}

function emailHeader() {
  return `
    <div style="text-align:center;margin-bottom:24px;">
      <img src="${BASE_URL}/logo.png" alt="HackerTrip" width="48" height="48" style="display:inline-block;vertical-align:middle;border-radius:10px;" />
      <span style="display:inline-block;vertical-align:middle;margin-left:12px;font-size:22px;font-weight:700;color:#7c5dff;">HackerTrip</span>
    </div>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 24px;" />`;
}

function emailFooter() {
  return `
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0 16px;" />
    <p style="font-size:12px;color:rgba(255,255,255,0.3);text-align:center;">
      此邮件由 <a href="${BASE_URL}" style="color:#7c5dff;text-decoration:none;">HackerTrip</a> 自动发送，如有疑问请联系 support@hackertrip.space
    </p>`;
}

function featureItem(emoji: string, title: string, desc: string, href: string) {
  return `
    <tr>
      <td style="padding:8px 12px 8px 0;vertical-align:top;font-size:20px;width:36px;">${emoji}</td>
      <td style="padding:8px 0;">
        <a href="${BASE_URL}${href}" style="color:#4de1ff;font-size:15px;font-weight:600;text-decoration:none;">${escapeHtml(title)}</a>
        <p style="margin:2px 0 0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.4;">${escapeHtml(desc)}</p>
      </td>
    </tr>`;
}

function buildApprovedHtml() {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ededed;padding:40px 32px;border-radius:12px;">
      ${emailHeader()}

      <p style="font-size:20px;font-weight:600;line-height:1.4;margin-bottom:12px;color:#4de1ff;">
        恭喜，你的组织者申请已通过！
      </p>
      <p style="font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7);margin-bottom:24px;">
        你现在已成为 HackerTrip 认证组织者，可以使用以下功能：
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        ${featureItem('🚀', '发起黑客松', '创建并发布你的黑客松活动，自定义赛道、奖金和时间', '/organize/create')}
        ${featureItem('📊', '活动管理面板', '查看报名数据、管理参赛者、跟踪活动进度', '/organize/events')}
        ${featureItem('🔍', '发现黑客松', '浏览平台上的所有黑客松活动', '/explore')}
        ${featureItem('💬', '消息中心', '与参赛者沟通，接收组队邀请和协商', '/messages')}
      </table>

      <div style="text-align:center;margin:28px 0;">
        <a href="${BASE_URL}/organize/create" style="display:inline-block;background:linear-gradient(135deg,#7c5dff,#c759ff);color:white;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">
          发起黑客松
        </a>
      </div>

      ${emailFooter()}
    </div>`;
}

function buildRejectedHtml(reason: string) {
  const safeReason = escapeHtml(reason);

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ededed;padding:40px 32px;border-radius:12px;">
      ${emailHeader()}

      <p style="font-size:20px;font-weight:600;line-height:1.4;margin-bottom:12px;color:#4de1ff;">
        你的组织者申请未通过
      </p>
      <p style="font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7);margin-bottom:16px;">
        很遗憾，你的申请未通过。原因如下：
      </p>
      <div style="background:rgba(255,255,255,0.04);border-left:3px solid #c759ff;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
        <p style="font-size:14px;color:rgba(255,255,255,0.6);margin:0;">${safeReason}</p>
      </div>
      <p style="font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7);margin-bottom:24px;">
        你可以修改资料后重新提交申请，我们期待再次收到你的申请！
      </p>

      <div style="text-align:center;margin:28px 0;">
        <a href="${BASE_URL}/organize" style="display:inline-block;background:linear-gradient(135deg,#7c5dff,#c759ff);color:white;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">
          重新申请
        </a>
      </div>

      ${emailFooter()}
    </div>`;
}
