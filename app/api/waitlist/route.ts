import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resendApiKey = process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY;
const fromEmail = 'Jayden <Jayden@hackertrip.space>';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const isValidEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

const buildWelcomeHtml = (email: string) => `
  <div style="background:#0b0b12;padding:28px 24px;font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e7eb;">
    <div style="max-width:560px;margin:0 auto;background:#111118;border:1px solid #1f2233;border-radius:16px;padding:28px;">
      <p style="margin:0 0 12px;font-size:14px;color:#9ca3af;">Hi ${email},</p>
      <h2 style="margin:0 0 14px;font-size:20px;color:#f5f3ff;">欢迎加入 HackerTrip 等候名单</h2>
      <p style="margin:0 0 12px;line-height:1.6;color:#c7d2fe;">
        感谢你的信任！在正式上线前，我们会优先邀请你参与内测体验，帮助我们把「48 小时的黑客松」做得更好。
      </p>
      <p style="margin:0 0 18px;line-height:1.6;color:#e5e7eb;">
        近期我们会陆续发送产品进展、早鸟邀请和专属福利到你的邮箱，请留意来自 <strong>HackerTrip</strong> 的邮件。
      </p>
      <div style="display:inline-block;padding:12px 18px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border-radius:999px;text-decoration:none;font-weight:600;">
        我们很快见！
      </div>
      <p style="margin:18px 0 0;font-size:12px;color:#6b7280;">如果这不是你本人的操作，可以忽略此邮件。</p>
    </div>
  </div>
`;

export async function POST(request: Request) {
  if (!resend) {
    return NextResponse.json(
      { error: 'Resend API key is missing' },
      { status: 500 }
    );
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: '请输入有效的邮箱' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: normalizedEmail,
      subject: '欢迎加入 HackerTrip 等候名单',
      text: '感谢加入 HackerTrip 等候名单，产品上线前我们会优先邀请你参与内测。',
      html: buildWelcomeHtml(normalizedEmail),
    });

    if (error) {
      console.error('Resend send error:', error);
      return NextResponse.json(
        { error: '邮件发送失败，请稍后重试' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Waitlist signup error:', error);
    return NextResponse.json(
      { error: '提交失败，请稍后再试' },
      { status: 500 }
    );
  }
}
