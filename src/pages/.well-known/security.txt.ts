import type { APIRoute } from 'astro';
import { SITE } from '../../config';

export const GET: APIRoute = ({ site }) => {
  const body = [
    `Contact: mailto:${SITE.email}`,
    'Expires: 2027-10-30T00:00:00.000Z',
    'Preferred-Languages: en',
    `Canonical: ${new URL('.well-known/security.txt', site).href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
