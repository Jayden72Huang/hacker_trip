/**
 * Cloudflare Workers Scheduled Event Handler
 * 处理 Cron Triggers 触发的定时任务
 */

export async function handleScheduled(event: ScheduledEvent) {
  const cronTime = new Date(event.scheduledTime).toISOString();
  console.log(`[Cron] Scheduled event triggered at ${cronTime}`);

  try {
    // 判断是 daily 还是 weekly 任务
    const hour = new Date(event.scheduledTime).getUTCHours();
    const dayOfWeek = new Date(event.scheduledTime).getUTCDay();

    let scheduleType = 'daily';

    // 每周一上午 9 点 (UTC) 执行 weekly
    if (dayOfWeek === 1 && hour === 9) {
      scheduleType = 'weekly';
    }

    // 调用 Cron API
    const apiUrl = `${process.env.AUTH_URL || 'https://hackertrip.space'}/api/cron/scrape?schedule=${scheduleType}`;
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'User-Agent': 'Cloudflare-Cron/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    console.log(`[Cron] Execution completed:`, result);

    return result;
  } catch (error) {
    console.error('[Cron] Execution failed:', error);
    throw error;
  }
}

// Cloudflare Workers 类型定义
interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}
