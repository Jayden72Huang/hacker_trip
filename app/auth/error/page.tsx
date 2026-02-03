import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass rounded-2xl p-8 text-center max-w-md border border-white/10">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="font-sora text-2xl font-bold text-white mb-4">
          登录失败
        </h1>
        <p className="font-space-mono text-sm text-gray-400 mb-6">
          认证过程中出现错误，请重试。
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-space-mono text-sm hover:from-indigo-600 hover:to-purple-700 transition-all"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
