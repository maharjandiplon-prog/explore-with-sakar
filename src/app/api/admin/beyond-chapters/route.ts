export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAllBeyondChapters, createBeyondChapter } from '@/lib/db';
import { getAdminSession, getSessionFromRequest } from '@/lib/auth';
import { revalidateContent } from '@/lib/revalidate';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req) || (await getAdminSession(req));
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const chapters = await getAllBeyondChapters(true);
    return NextResponse.json({ success: true, chapters });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch beyondChapters' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req) || (await getAdminSession(req));
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const chapter = await createBeyondChapter(body);
    revalidateContent('beyondChapters');
    return NextResponse.json({ success: true, chapter }, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'MongoUnavailableError') {
      return NextResponse.json({ error: 'Database unavailable. Change was not saved.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 });
  }
}
