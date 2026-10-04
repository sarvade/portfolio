const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

/** Formats a date as "October 2, 2026" (UTC, so build machines agree). */
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** ISO date string (YYYY-MM-DD) for <time datetime>. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Rough reading time, assuming 230 words per minute.
 * In MDX posts, import lines and self-closing component tags (diagram props)
 * are not prose, so they are left out of the count. Code fences are kept as is.
 */
export function readingTime(markdown: string | undefined): string {
  const prose = (markdown ?? '')
    .split(/(```[\s\S]*?```)/)
    .map((part, i) =>
      i % 2 === 1 ? part : part.replace(/^import\s.+$/gm, '').replace(/<[A-Z][\w.]*\b[\s\S]*?\/>/g, ''),
    )
    .join(' ');
  const words = prose.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 230));
  return `${minutes} min read`;
}
