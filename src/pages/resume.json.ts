/*
  The résumé as data, in the JSON Resume format (https://jsonresume.org/schema).
  Generated from src/data/profile.ts at build time, so it never drifts from the site.
  Served at /portfolio/resume.json. Contains no phone number and no email address (anti-scraping).
*/
import type { APIContext } from 'astro';
import { about, education, experience, site, skills } from '../data/profile';
import { absoluteUrl } from '../lib/url';

const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

/** "May 2025" -> "2025-05"; "Present" -> undefined */
function isoMonth(value: string): string | undefined {
  const [month, year] = value.split(' ');
  const mm = month ? MONTHS[month.slice(0, 3)] : undefined;
  if (!mm || !year) return undefined;
  return `${year}-${mm}`;
}

export function GET(context: APIContext) {
  const resume = {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: site.name,
      label: site.role,
      url: absoluteUrl('', context.site),
      summary: about.paragraphs[0],
      location: { city: 'San Jose', region: 'CA', countryCode: 'US' },
      profiles: [
        { network: 'LinkedIn', url: site.links.linkedin },
        { network: 'GitHub', username: 'sarvade', url: site.links.github },
      ],
    },
    work: experience.map((job) => ({
      name: job.company,
      position: job.role,
      location: job.location,
      startDate: isoMonth(job.start),
      endDate: isoMonth(job.end),
      summary: job.context,
      highlights: job.highlights.map((h) => h.text),
    })),
    education: education.map((item) => {
      const [studyType, area] = item.degree.split(', ');
      const [startDate, endDate] = item.years.split(' to ');
      return { institution: item.school, studyType, area, startDate, endDate };
    }),
    skills: skills.map((group) => ({ name: group.group, keywords: group.items.map((s) => s.name) })),
    meta: {
      canonical: absoluteUrl('resume.json', context.site),
      version: 'v1.0.0',
      lastModified: new Date().toISOString().slice(0, 10),
    },
  };

  return new Response(JSON.stringify(resume, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
