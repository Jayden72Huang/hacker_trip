/**
 * Set Reminder Tool - Stores reminders in DB for team notifications.
 */

import type { ToolResult, ToolContext } from './types';
import { db } from '@/lib/db';
import { agentReminders } from '@/lib/db/schema';

interface ReminderInput {
  title: string;
  remind_at: string;
  type?: 'deadline' | 'milestone' | 'checkin' | 'custom';
  message?: string;
}

export async function setReminder(
  input: ReminderInput,
  context: ToolContext
): Promise<ToolResult> {
  const { title, remind_at, type = 'custom', message } = input;

  // Validate datetime
  const remindDate = new Date(remind_at);
  if (isNaN(remindDate.getTime())) {
    return {
      success: false,
      content: '',
      error: `Invalid datetime format: "${remind_at}". Please use ISO 8601 format.`,
    };
  }

  // Allow past reminders (they'll trigger immediately on next poll)
  try {
    const [reminder] = await db
      .insert(agentReminders)
      .values({
        teamId: context.teamId,
        sessionId: context.sessionId,
        title,
        message: message || null,
        type,
        remindAt: remindDate,
        status: 'pending',
      })
      .returning();

    const formattedTime = remindDate.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const typeLabels: Record<string, string> = {
      deadline: '截止日期',
      milestone: '里程碑',
      checkin: '签到',
      custom: '提醒',
    };

    const content = `${typeLabels[type] || '提醒'}已设置: "${title}" — ${formattedTime}${message ? `\n备注: ${message}` : ''}`;

    return {
      success: true,
      content,
      metadata: { reminderId: reminder.id, remindAt: remind_at },
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Database error';
    return {
      success: false,
      content: '',
      error: `Failed to save reminder: ${errorMessage}`,
    };
  }
}
