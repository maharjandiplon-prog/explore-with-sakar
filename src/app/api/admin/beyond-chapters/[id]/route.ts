export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getBeyondChapterById, updateBeyondChapter, deleteBeyondChapter } from '@/lib/db';
import { getAdminSession, getSessionFromRequest } from '@/lib/auth';
import { revalidateContent } from '@/lib/revalidate';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(req) || (await getAdminSession(req));
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const chapter = await getBeyondChapterById(params.id);
  if (!chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, chapter });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(req) || (await getAdminSession(req));
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await updateBeyondChapter(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    revalidateContent('beyondChapters');
    return NextResponse.json({ success: true, chapter: updated });
  } catch (error: any) {
    if (error?.name === 'MongoUnavailableError') {
      return NextResponse.json({ error: 'Database unavailable. Change was not saved.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to update chapter' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(req) || (await getAdminSession(req));
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deleted = await deleteBeyondChapter(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    revalidateContent('beyondChapters');
    return NextResponse.json({ success: true, message: 'Chapter deleted' });
  } catch (error: any) {
    if (error?.name === 'MongoUnavailableError') {
      return NextResponse.json({ error: 'Database unavailable. Change was not saved.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 });
  }
}
