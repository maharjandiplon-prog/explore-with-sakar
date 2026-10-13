/**
 * Serializes data to a JSON string safe for inclusion in <script type="application/ld+json">.
 * Replaces '<' with unicode escape '\u003c' to prevent script closing tag injection (XSS).
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
