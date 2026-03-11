'use client';

import { X } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'announce' | 'warning' | 'reminder';
  content: string;
  reminderId?: string;
}

interface NotificationBarProps {
  notifications: Notification[];
  onDismiss: (id: string, reminderId?: string) => void;
}

export function NotificationBar({ notifications, onDismiss }: NotificationBarProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 border-b border-white/5 bg-white/[0.015] overflow-x-auto">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="flex items-center gap-1.5 flex-shrink-0"
        >
          <span className="text-xs">
            {n.type === 'announce' ? '📢' : n.type === 'reminder' ? '🔔' : '⚠️'}
          </span>
          <span className="font-space-mono text-[11px] text-gray-400">
            {n.content}
          </span>
          <button
            onClick={() => onDismiss(n.id, n.reminderId)}
            className="p-0.5 rounded hover:bg-white/5 text-gray-600 hover:text-gray-400 transition-colors"
          >
            <X size={10} />
          </button>
          {notifications.indexOf(n) < notifications.length - 1 && (
            <div className="w-px h-3 bg-white/10 ml-2" />
          )}
        </div>
      ))}
    </div>
  );
}
