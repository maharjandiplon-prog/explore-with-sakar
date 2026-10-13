export const revalidate = 300;

import { NextResponse } from 'next/server';
import { getAllBrandPartners } from '@/lib/db';

export async function GET() {
  try {
    const partners = await getAllBrandPartners(false);
    return NextResponse.json(
      { partners: partners || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch public brand partners:', error);
    return NextResponse.json({ partners: [] });
  }
}
