import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createInquiry, getAllEvents } from '@/lib/db';
import { checkRateLimit, recordFailedAttempt, getClientIp } from '@/lib/rate-limit';

const MAX_BODY_SIZE_BYTES = 51200; // 50 KB hard cap

const InquirySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .transform((val) => val.replace(/<[^>]*>?/gm, '')),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(150, 'Email is too long'),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone is too long')
    .optional()
    .transform((val) => (val ? val.replace(/<[^>]*>?/gm, '') : undefined)),
  whatsapp: z
    .string()
    .trim()
    .max(30, 'WhatsApp is too long')
    .optional()
    .transform((val) => (val ? val.replace(/<[^>]*>?/gm, '') : undefined)),
  country: z
    .string()
    .trim()
    .max(60, 'Country is too long')
    .optional()
    .transform((val) => (val ? val.replace(/<[^>]*>?/gm, '') : undefined)),
  travelDates: z
    .string()
    .trim()
    .max(100, 'Travel dates field is too long')
    .optional()
    .transform((val) => (val ? val.replace(/<[^>]*>?/gm, '') : undefined)),
  approximateDuration: z
    .string()
    .trim()
    .max(50, 'Duration is too long')
    .optional()
    .transform((val) => (val ? val.replace(/<[^>]*>?/gm, '') : undefined)),
  travelersCount: z
    .string()
    .trim()
    .max(50, 'Party size is too long')
    .optional()
    .transform((val) => (val ? val.replace(/<[^>]*>?/gm, '') : undefined)),
  travelStyle: z
    .string()
    .trim()
    .max(100, 'Travel style is too long')
    .optional()
    .transform((val) => (val ? val.replace(/<[^>]*>?/gm, '') : undefined)),
  homestayInterest: z
    .string()
    .trim()
    .max(100, 'Homestay interest is too long')
    .optional()
    .transform((val) => (val ? val.replace(/<[^>]*>?/gm, '') : undefined)),
  preferredInterests: z
    .array(z.string().trim().max(80).transform((val) => val.replace(/<[^>]*>?/gm, '')))
    .max(20)
    .optional()
    .default([]),
  message: z
    .string()
    .trim()
    .max(2000, 'Message cannot exceed 2000 characters')
    .optional()
    .default('')
    .transform((val) => val.replace(/<[^>]*>?/gm, '')),
  interestedEventId: z
    .string()
    .trim()
    .max(50)
    .optional(),
  interestedEvent: z
    .object({
      id: z.string().trim().max(50).optional(),
      title: z.string().trim().max(100).optional(),
    })
    .optional(),
  // Honeypot field: real users never fill this
  website: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce strict request body size limit
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    // 2. Serverless Rate Limiting (5 inquiries per hour per IP)
    const ip = getClientIp(req.headers);
    const rateLimitKey = `inquiry_${ip.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;

    const rateCheck = await checkRateLimit(rateLimitKey, 5, 3600);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many inquiries submitted from this connection. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfterSeconds),
          },
        }
      );
    }

    // 3. Preview Safety Check
    if (process.env.VERCEL_ENV === 'preview' && process.env.ALLOW_PREVIEW_WRITES !== 'true') {
      return NextResponse.json(
        { error: 'Forbidden: Inquiry submissions are disabled in Vercel Preview environment' },
        { status: 403 }
      );
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    // 3. Honeypot check: silently succeed and drop bot submissions
    if (rawBody.website) {
      return NextResponse.json({
        success: true,
        message: 'Namaste! Your inquiry has been received. Sakar will contact you personally soon.',
      });
    }

    // 4. Strict Zod Schema Validation
    const parsed = InquirySchema.safeParse(rawBody);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message || 'Invalid form input' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    let finalMessage = data.message;
    if (!finalMessage && (data.travelDates || data.approximateDuration || data.travelersCount)) {
      finalMessage = `Custom journey inquiry from ${data.fullName}.${
        data.travelDates ? ` Dates: ${data.travelDates}.` : ''
      }${data.approximateDuration ? ` Duration: ${data.approximateDuration}.` : ''}${
        data.travelersCount ? ` Party: ${data.travelersCount}.` : ''
      }`;
    }

    if (!finalMessage || finalMessage.length < 5) {
      return NextResponse.json(
        { error: 'Please include a message describing your travel plans.' },
        { status: 400 }
      );
    }

    // 5. Validate interested event if provided
    let interestedEvent: { id: string; title: string } | undefined = undefined;
    const eventId = data.interestedEventId || data.interestedEvent?.id;
    if (eventId) {
      try {
        const events = await getAllEvents(false);
        const matched = (events || []).find((e) => e.id === eventId && e.isVisible !== false);
        if (matched) {
          interestedEvent = { id: matched.id, title: matched.title };
        }
      } catch (err) {
        console.warn('Could not validate event for inquiry:', err);
      }
    }

    // 6. Persist to isolated cms_inquiries collection
    const newInquiry = await createInquiry({
      fullName: data.fullName,
      email: data.email,
      whatsapp: data.whatsapp || data.phone || undefined,
      country: data.country || undefined,
      travelDates: data.travelDates || undefined,
      approximateDuration: data.approximateDuration || undefined,
      travelersCount: data.travelersCount || undefined,
      travelStyle: data.travelStyle || undefined,
      preferredInterests: data.preferredInterests,
      homestayInterest: data.homestayInterest || undefined,
      message: finalMessage,
      interestedEvent,
    });

    // Count against rate limit on valid submission
    await recordFailedAttempt(rateLimitKey, 3600);

    return NextResponse.json(
      {
        success: true,
        message: 'Namaste! Your inquiry has been received. Sakar will contact you personally soon.',
        inquiryId: newInquiry.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Inquiry submission error:', error?.message || error);
    // Generic error returned to client - no internal stack or database details leaked
    return NextResponse.json(
      { error: 'Something went wrong submitting your inquiry. Please try again or message Sakar directly on WhatsApp.' },
      { status: 500 }
    );
  }
}
