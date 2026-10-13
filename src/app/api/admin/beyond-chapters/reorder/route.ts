export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { reorderBeyondChapters } from '@/lib/db';
import { getAdminSession, getSessionFromRequest } from '@/lib/auth';
import { revalidateContent } from '@/lib/revalidate';

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req) || (await getAdminSession(req));
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { orderedIds } = await req.json();
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'orderedIds array required' }, { status: 400 });
    }

    await reorderBeyondChapters(orderedIds);
    revalidateContent('beyondChapters');
    return NextResponse.json({ success: true, message: 'Reordered chapters' });
  } catch (error: any) {
    if (error?.name === 'MongoUnavailableError') {
      return NextResponse.json({ error: 'Database unavailable. Change was not saved.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to reorder chapters' }, { status: 500 });
  }
}
