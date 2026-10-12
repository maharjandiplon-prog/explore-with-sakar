import { NextRequest, NextResponse } from 'next/server';
import { createInquiry, getAllEvents } from '@/lib/db';

function sanitize(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Honeypot: real users never fill this hidden field
    if (body.website) {
      return NextResponse.json({
        success: true,
        message: 'Namaste! Your inquiry has been received. Sakar will contact you personally soon.',
      }); // silently drop bots
    }

    const clip = (v: unknown, max: number) =>
      String(v ?? '')
        .replace(/<[^>]*>?/gm, '')
        .trim()
        .slice(0, max);

    const fullName = clip(body.fullName, 100);
    const email = clip(body.email, 150);
    const phone = clip(body.phone || body.whatsapp, 30);
    const country = clip(body.country, 60);
    const travelDates = clip(body.travelDates, 100);
    const approximateDuration = clip(body.approximateDuration, 50);
    const travelersCount = clip(body.travelersCount, 50);
    const travelStyle = clip(body.travelStyle, 100);
    const homestayInterest = clip(body.homestayInterest, 100);
    let message = clip(body.message, 2000);

    // If message is omitted or too short, construct a helpful default summary if dates/details provided
    if (!message && (travelDates || approximateDuration || travelersCount)) {
      message = `Custom journey inquiry from ${fullName}.${travelDates ? ` Dates: ${travelDates}.` : ''}${
        approximateDuration ? ` Duration: ${approximateDuration}.` : ''
      }${travelersCount ? ` Party: ${travelersCount}.` : ''}`;
    }

    // Validation
    if (!fullName || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const preferredInterests: string[] = Array.isArray(body.preferredInterests)
      ? body.preferredInterests
          .map((item: unknown) => clip(item, 80))
          .filter(Boolean)
          .slice(0, 20)
      : [];

    let interestedEvent: { id: string; title: string } | undefined = undefined;
    const reqEventId = typeof body.interestedEventId === 'string'
      ? clip(body.interestedEventId, 50)
      : (body.interestedEvent && typeof body.interestedEvent.id === 'string'
          ? clip(body.interestedEvent.id, 50)
          : '');

    if (reqEventId) {
      try {
        const events = await getAllEvents(false);
        const matched = (events || []).find((e) => e.id === reqEventId && e.isVisible !== false);
        if (matched) {
          interestedEvent = {
            id: matched.id,
            title: matched.title,
          };
        }
      } catch (err) {
        console.warn('Could not validate event for inquiry:', err);
      }
    }

    const newInquiry = await createInquiry({
      fullName,
      email,
      whatsapp: phone || undefined,
      country: country || undefined,
      travelDates: travelDates || undefined,
      approximateDuration: approximateDuration || undefined,
      travelersCount: travelersCount || undefined,
      travelStyle: travelStyle || undefined,
      preferredInterests,
      homestayInterest: homestayInterest || undefined,
      message,
      interestedEvent,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Namaste! Your inquiry has been received. Sakar will contact you personally soon.',
        inquiryId: newInquiry.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'MongoUnavailableError') {
      return NextResponse.json(
        { error: 'Database unavailable. Change was not saved.' },
        { status: 503 }
      );
    }
    console.error('Inquiry submission error:', error);
    return NextResponse.json(
      { error: 'Something went wrong submitting your inquiry. Please try again or message Sakar directly on WhatsApp.' },
      { status: 500 }
    );
  }
}
