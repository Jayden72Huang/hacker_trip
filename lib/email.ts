/**
 * 邮件发送工具 - 基于 Resend
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.AUTH_RESEND_KEY);
const FROM = process.env.EMAIL_FROM || 'HackerTrip <noreply@hackertrip.space>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackertrip.space';

/**
 * 发送组织者审核通过通知邮件
 */
export async function sendOrganizerApprovedEmail(params: {
  to: string;
  organizerName: string;
  organizationName: string;
}) {
  const { to, organizerName, organizationName } = params;
  const createUrl = `${BASE_URL}/organize/create`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: '🎉 恭喜！您的组织者申请已通过 - HackerTrip',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 40px 32px; border-radius: 12px;">
        <h1 style="color: #7c5dff; font-size: 24px; margin-bottom: 8px;">HackerTrip</h1>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 16px 0 24px;" />

        <p style="font-size: 16px; line-height: 1.6;">Hi ${organizerName}，</p>

        <p style="font-size: 16px; line-height: 1.6;">
          恭喜！您代表 <strong style="color: #4de1ff;">${organizationName}</strong> 提交的组织者申请已通过审核。
        </p>

        <p style="font-size: 16px; line-height: 1.6;">
          您现在可以在 HackerTrip 上发起和管理黑客松活动了。点击下方按钮开始创建您的第一个活动：
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${createUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c5dff, #c759ff); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
            发起活动
          </a>
        </div>

        <p style="font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.6;">
          或复制链接到浏览器：<br />
          <a href="${createUrl}" style="color: #7c5dff;">${createUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0 16px;" />
        <p style="font-size: 12px; color: rgba(255,255,255,0.3);">
          此邮件由 HackerTrip 自动发送，如有疑问请回复此邮件。
        </p>
      </div>
    `,
  });
}

/**
 * 发送组织者审核拒绝通知邮件
 */
export async function sendOrganizerRejectedEmail(params: {
  to: string;
  organizerName: string;
  organizationName: string;
  reason?: string;
}) {
  const { to, organizerName, organizationName, reason } = params;

  return resend.emails.send({
    from: FROM,
    to,
    subject: '关于您的组织者申请 - HackerTrip',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 40px 32px; border-radius: 12px;">
        <h1 style="color: #7c5dff; font-size: 24px; margin-bottom: 8px;">HackerTrip</h1>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 16px 0 24px;" />

        <p style="font-size: 16px; line-height: 1.6;">Hi ${organizerName}，</p>

        <p style="font-size: 16px; line-height: 1.6;">
          感谢您代表 <strong>${organizationName}</strong> 提交的组织者申请。
          经审核，我们暂时无法通过此申请。
        </p>

        ${reason ? `
        <div style="background: rgba(255,255,255,0.04); border-left: 3px solid #c759ff; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
          <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin: 0;">
            <strong>审核意见：</strong>${reason}
          </p>
        </div>
        ` : ''}

        <p style="font-size: 16px; line-height: 1.6;">
          您可以补充信息后重新提交申请。如有疑问，请回复此邮件。
        </p>

        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0 16px;" />
        <p style="font-size: 12px; color: rgba(255,255,255,0.3);">
          此邮件由 HackerTrip 自动发送。
        </p>
      </div>
    `,
  });
}
