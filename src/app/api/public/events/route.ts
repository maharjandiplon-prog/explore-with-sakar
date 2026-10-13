export const revalidate = 300;

import { NextResponse } from 'next/server';
import { getPublicEvents } from '@/lib/content';

export async function GET() {
  try {
    const events = await getPublicEvents();
    // Return only active events with id, title, and dates
    const publicList = (events || [])
      .filter((evt) => evt.isVisible !== false)
      .map((evt) => ({
        id: evt.id,
        title: evt.title,
        date: evt.date,
        location: evt.location,
      }));

    return NextResponse.json(
      { events: publicList },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch public events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
