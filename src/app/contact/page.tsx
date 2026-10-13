import React from 'react';
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { getPageContent, getPublicEvents } from '@/lib/content';
import ContactClient from '@/components/contact/ContactClient';
import { SITE_ORIGIN } from '@/lib/config';

const FALLBACK_METADATA: Metadata = {
  title: 'Contact Sakar | Start Planning Your Nepal Journey',
  description:
    'Direct contact with Sakar Aryal via WhatsApp, email, or inquiry form to plan your custom Nepal journey.',
  alternates: { canonical: `${SITE_ORIGIN}/contact` },
};

export async function generateMetadata(): Promise<Metadata> {
  return await buildPageMetadata('contact', FALLBACK_METADATA);
}

export default async function ContactPage() {
  const [pageContent, events] = await Promise.all([
    getPageContent('contact'),
    getPublicEvents(),
  ]);
  const availableEvents = events.map((evt) => ({
    id: evt.id,
    title: evt.title,
    date: evt.date,
  }));
  return <ContactClient pageContent={pageContent} availableEvents={availableEvents} />;
}
