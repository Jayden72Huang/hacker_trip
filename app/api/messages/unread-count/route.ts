import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUnreadCount } from '@/lib/messaging';
import { handleRouteError } from '@/lib/api/route-helpers';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await getUnreadCount(session.user.id);
    return NextResponse.json({ count });
  } catch (error) {
    return handleRouteError(error, 'Get unread count failed');
  }
}
