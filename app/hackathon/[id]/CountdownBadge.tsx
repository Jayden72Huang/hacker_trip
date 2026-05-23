'use client';

import { useEffect, useState } from 'react';

interface CountdownBadgeProps {
  registrationDeadline: string | null;
  startDate: string;
  endDate: string;
}

function getCountdown(target: Date) {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}天${hours}时`;
  if (hours > 0) return `${hours}时${minutes}分`;
  return `${minutes}分`;
}

export function CountdownBadge({ registrationDeadline, startDate, endDate }: CountdownBadgeProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now > end) {
    return (
      <div className="px-3 py-1.5 rounded-full border text-xs font-semibold bg-gray-500/15 text-gray-300 border-gray-500/30">
        已结束
      </div>
    );
  }

  if (now >= start && now <= end) {
    return (
      <div className="px-3 py-1.5 rounded-full border text-xs font-semibold bg-green-500/15 text-green-200 border-green-500/30 animate-pulse">
        进行中
      </div>
    );
  }

  if (registrationDeadline) {
    const deadline = new Date(registrationDeadline);
    if (now < deadline) {
      const countdown = getCountdown(deadline);
      return (
        <div className="px-3 py-1.5 rounded-full border text-xs font-semibold bg-amber-500/15 text-amber-100 border-amber-500/30">
          报名截止倒计时 {countdown}
        </div>
      );
    }
    return (
      <div className="px-3 py-1.5 rounded-full border text-xs font-semibold bg-red-500/15 text-red-200 border-red-500/30">
        报名已截止
      </div>
    );
  }

  const countdown = getCountdown(start);
  if (countdown) {
    return (
      <div className="px-3 py-1.5 rounded-full border text-xs font-semibold bg-indigo-500/15 text-indigo-200 border-indigo-500/30">
        距开赛 {countdown}
      </div>
    );
  }

  return (
    <div className="px-3 py-1.5 rounded-full border text-xs font-semibold bg-indigo-500/15 text-indigo-200 border-indigo-500/30">
      即将开始
    </div>
  );
}
