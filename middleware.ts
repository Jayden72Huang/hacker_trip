import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// 需要保护的路由
const protectedRoutes = ['/admin', '/organize/create', '/dashboard', '/settings', '/haki', '/works/submit', '/works/my', '/community/write'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // 检查是否是受保护的路由
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 未登录访问受保护路由 -> 重定向到首页
  if (isProtectedRoute && !isLoggedIn) {
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
