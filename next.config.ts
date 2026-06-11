import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // CSS 内联进 HTML，消除渲染阻塞的 CSS 请求（移动端慢网约省 400-600ms FCP/LCP）
    inlineCss: true,
  },
  async redirects() {
    return [
      {
        source: '/hacker-bot/:path*',
        destination: '/haki/:path*',
        permanent: true,
      },
      {
        source: '/hacker-bot',
        destination: '/haki',
        permanent: true,
      },
      {
        source: '/install',
        destination: 'https://raw.githubusercontent.com/Jayden72Huang/hacker_trip/main/packages/skills/ht-scan-project/install.sh',
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
