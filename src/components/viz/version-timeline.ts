/*
  Logic for VersionTimeline: lay out the versions of one key (an SCD Type 2
  history) on a date axis, flag the shapes that break point-in-time joins, and
  answer "which versions match this date?" under two join predicates.

  Dates are ISO 'YYYY-MM-DD' strings, handled as whole UTC days so no time zone
  can shift them. A version with no `to` (or the 9999-12-31 sentinel) is open.
*/

export type Mode = 'between' | 'halfopen';

export interface Version {
  /** What the row says, e.g. a city. Rendered as text. */
  label: string;
  /** valid_from, ISO date. */
  from: string;
  /** valid_to, ISO date. Leave out (or use 9999-12-31) for an open version. */
  to?: string | null;
  /** The row's is_current flag. */
  current?: boolean;
}

export interface Lane {
  name: string;
  note?: string;
  versions: Version[];
}

export type Flag = 'overlap' | 'negative' | 'empty' | 'extra-current';

export interface PlacedVersion extends Version {
  /** Bar start and width as percentages of the axis, clamped to [0, 100]. */
  left: number;
  width: number;
  open: boolean;
  /** The bar is drawn from `to` to `from` because the row ends before it starts. */
  backwards: boolean;
  flags: Flag[];
}

export interface Tick {
  iso: string;
  label: string;
  left: number;
}

export const OPEN_END = '9999-12-31';
const DAY_MS = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const FLAG_TEXT: Record<Flag, string> = {
  overlap: 'overlaps another version',
  negative: 'ends before it starts',
  empty: 'zero-length',
  'extra-current': 'one of 2+ current rows',
};

export const MODE_SQL: Record<Mode, string> = {
  between: 'order_date BETWEEN valid_from AND valid_to',
  halfopen: 'order_date >= valid_from AND order_date < valid_to',
};

/** Whole days since 1970-01-01 for an ISO date. Throws on anything else. */
export function dayNumber(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Not an ISO date: ${iso}`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(y, mo - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    throw new Error(`Not a real date: ${iso}`);
  }
  return Math.round(ms / DAY_MS);
}

export function isoFromDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function isOpen(v: Version): boolean {
  return v.to == null || v.to === OPEN_END;
}

/** 'Mar 1', or 'open' for the sentinel. */
export function shortDate(iso: string | null | undefined): string {
  if (iso == null || iso === OPEN_END) return 'open';
  const d = new Date(dayNumber(iso) * DAY_MS);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Interval end used for comparisons: open versions run forever. */
function endDay(v: Version): number {
  return isOpen(v) ? Number.POSITIVE_INFINITY : dayNumber(v.to as string);
}

/**
 * Do two versions share at least one day under half-open semantics?
 * Backwards or empty versions cover no days, so they overlap nothing.
 */
export function overlaps(a: Version, b: Version): boolean {
  const [af, at, bf, bt] = [dayNumber(a.from), endDay(a), dayNumber(b.from), endDay(b)];
  if (at <= af || bt <= bf) return false;
  return Math.max(af, bf) < Math.min(at, bt);
}

export function flagsFor(versions: Version[]): Flag[][] {
  const currentCount = versions.filter((v) => v.current).length;
  return versions.map((v, i) => {
    const flags: Flag[] = [];
    const from = dayNumber(v.from);
    const to = endDay(v);
    if (to < from) flags.push('negative');
    else if (to === from) flags.push('empty');
    if (versions.some((other, j) => j !== i && overlaps(v, other))) flags.push('overlap');
    if (v.current && currentCount > 1) flags.push('extra-current');
    return flags;
  });
}

export function placeLane(lane: Lane, start: string, end: string): PlacedVersion[] {
  const s = dayNumber(start);
  const e = dayNumber(end);
  if (e <= s) throw new Error('Axis end must be after its start');
  const span = e - s;
  const pct = (day: number) => clamp(((day - s) / span) * 100);
  const flags = flagsFor(lane.versions);
  return lane.versions.map((v, i) => {
    const from = dayNumber(v.from);
    const open = isOpen(v);
    const to = open ? e : dayNumber(v.to as string);
    const backwards = !open && to < from;
    const lo = pct(Math.min(from, to));
    const hi = pct(Math.max(from, to));
    return {
      ...v,
      left: round2(lo),
      width: round2(Math.max(hi - lo, 0.8)),
      open,
      backwards,
      flags: flags[i],
    };
  });
}

/** Does the row match an event on `date` under the given predicate? */
export function matchesDate(v: Version, date: string, mode: Mode): boolean {
  const d = dayNumber(date);
  const from = dayNumber(v.from);
  const to = endDay(v);
  if (d < from) return false;
  return mode === 'between' ? d <= to : d < to;
}

export function matching(lane: Lane, date: string, mode: Mode): number[] {
  return lane.versions.flatMap((v, i) => (matchesDate(v, date, mode) ? [i] : []));
}

function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

/** One sentence about what a point-in-time join returns for this lane. */
export function describe(lane: Lane, date: string, mode: Mode): string {
  const hits = matching(lane, date, mode).map((i) => lane.versions[i].label);
  const when = shortDate(date);
  if (hits.length === 0) return `${lane.name}: an event on ${when} matches no row. It drops out of an inner join.`;
  if (hits.length === 1) return `${lane.name}: an event on ${when} matches 1 row, ${hits[0]}.`;
  return `${lane.name}: an event on ${when} matches ${hits.length} rows, ${joinLabels(hits)}. It is counted ${hits.length} times.`;
}

/** First-of-month ticks inside [start, end]. */
export function monthTicks(start: string, end: string): Tick[] {
  const s = dayNumber(start);
  const e = dayNumber(end);
  const first = new Date(s * DAY_MS);
  let y = first.getUTCFullYear();
  let m = first.getUTCMonth();
  if (first.getUTCDate() !== 1) m += 1;
  const ticks: Tick[] = [];
  for (;;) {
    const day = Math.round(Date.UTC(y + Math.floor(m / 12), m % 12, 1) / DAY_MS);
    if (day > e) break;
    const iso = isoFromDay(day);
    ticks.push({ iso, label: MONTHS[m % 12], left: round2(((day - s) / (e - s)) * 100) });
    m += 1;
  }
  return ticks;
}

/** Text for one version, for the list that screen readers and no-CSS readers get. */
export function versionText(v: PlacedVersion): string {
  const range = `${v.label}: valid_from ${shortDate(v.from)}, valid_to ${shortDate(v.to)}`;
  const current = v.current ? ', current' : '';
  const flags = v.flags.length ? ` (${v.flags.map((f) => FLAG_TEXT[f]).join(', ')})` : '';
  return `${range}${current}${flags}`;
}
