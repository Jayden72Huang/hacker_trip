import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// 需要保护的路由
const protectedRoutes = ['/admin', '/organizer', '/organize/create', '/dashboard', '/settings', '/haki', '/works/submit', '/works/my', '/community/write', '/messages'];

const CANONICAL_HOST = 'hackertrip.space';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // 生产环境统一跳转到主域名：Google OAuth 只登记了 hackertrip.space 的回调，
  // 在 hackertrip.vercel.app 等别名域名上登录会报 redirect_uri_mismatch。
  // preview 部署（VERCEL_ENV=preview）不跳转，保留分支预览可用性。
  const host = req.headers.get('host') || '';
  if (process.env.VERCEL_ENV === 'production' && host !== CANONICAL_HOST) {
    const url = req.nextUrl.clone();
    url.protocol = 'https';
    url.host = CANONICAL_HOST;
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  // /@username → /u/[username] rewrite（身份卡个人主页友好链接）
  // 仅命中 /@ 前缀，零误伤已有顶层路由与静态资源。
  if (pathname.startsWith('/@')) {
    const handle = pathname.slice(2); // 去掉 '/@'
    if (handle && !handle.includes('/')) {
      const url = req.nextUrl.clone();
      url.pathname = `/u/${handle}`;
      return NextResponse.rewrite(url);
    }
  }

  // 检查是否是受保护的路由
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 未登录访问受保护路由
  if (isProtectedRoute && !isLoggedIn) {
    // API 路由返回 401，不重定向
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // 页面路由重定向到首页
    const redirectUrl = new URL('/', req.url);
    redirectUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * 匹配所有路由除了:
     * - api/auth (NextAuth 路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - 公开资源文件
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
