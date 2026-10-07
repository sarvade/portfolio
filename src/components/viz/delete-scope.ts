/*
  Which rows does an Iceberg reader return? Pure logic, shared by the server
  render and the in-browser widget (DeleteScope.astro).

  Rules, from the Iceberg table spec ("Scan Planning"):
  - An equality delete applies to a data file in the same partition (or any
    partition, if the delete is unpartitioned) whose data sequence number is
    strictly less than the delete's.
  - A deletion vector applies to the one data file it references, when that
    file's data sequence number is less than or equal to the DV's.
  - At most one DV per data file in a snapshot; a newer DV replaces the old one.

  The scenario is a small upsert table keyed by id, in one partition. In
  'equality' mode the writer's commits are read as written. In 'dv' mode the
  main branch holds the result of converting each staging commit into data
  files plus DVs (one main commit per staging commit). Simplified: main's
  sequence numbers are shown as 1 to 3; in a real table every branch commit
  takes the next table-wide number, so they interleave with staging's. The
  outcome is the same, because a DV's number is never below its file's.
*/

export type Mode = 'equality' | 'dv';
export type Rule = 'spec' | 'wrong';

export interface Inputs {
  asOf: 1 | 2 | 3;
  mode: Mode;
  rule: Rule;
}

export const DEFAULT_INPUTS: Inputs = { asOf: 3, mode: 'equality', rule: 'spec' };

export interface DataRow {
  pos: number;
  id: number;
  status: string;
}

export interface DataFile {
  name: string;
  seq: number;
  rows: DataRow[];
}

export interface EqDelete {
  name: string;
  seq: number;
  keys: number[];
}

export interface Dv {
  name: string;
  seq: number;
  file: string;
  positions: number[];
}

export interface Commit {
  seq: number;
  label: string;
  data: DataFile;
  eq?: EqDelete;
  /** DVs committed on main when this staging commit is converted. */
  dvs: Dv[];
}

export const COMMITS: Commit[] = [
  {
    seq: 1,
    label: 'Initial load: orders 7 and 8',
    data: {
      name: 'F1',
      seq: 1,
      rows: [
        { pos: 0, id: 7, status: 'placed' },
        { pos: 1, id: 8, status: 'placed' },
      ],
    },
    dvs: [],
  },
  {
    seq: 2,
    label: 'Upsert 7 (paid) and 9 (new order)',
    data: {
      name: 'F2',
      seq: 2,
      rows: [
        { pos: 0, id: 7, status: 'paid' },
        { pos: 1, id: 9, status: 'placed' },
      ],
    },
    eq: { name: 'E2', seq: 2, keys: [7, 9] },
    dvs: [{ name: 'DV(F1)', seq: 2, file: 'F1', positions: [0] }],
  },
  {
    seq: 3,
    label: 'Delete 8, upsert 7 (shipped)',
    data: { name: 'F3', seq: 3, rows: [{ pos: 0, id: 7, status: 'shipped' }] },
    eq: { name: 'E3', seq: 3, keys: [8, 7] },
    dvs: [
      { name: 'DV(F1)', seq: 3, file: 'F1', positions: [0, 1] },
      { name: 'DV(F2)', seq: 3, file: 'F2', positions: [0] },
    ],
  },
];

/** What the table should contain after each commit: last write per key wins. */
export function expected(asOf: number): Map<number, string> {
  const table = new Map<number, string>();
  const ops: [number, number, string | null][] = [
    [1, 7, 'placed'],
    [1, 8, 'placed'],
    [2, 7, 'paid'],
    [2, 9, 'placed'],
    [3, 8, null],
    [3, 7, 'shipped'],
  ];
  for (const [seq, id, status] of ops) {
    if (seq > asOf) continue;
    if (status === null) table.delete(id);
    else table.set(id, status);
  }
  return table;
}

export interface RowResult {
  file: string;
  fileSeq: number;
  pos: number;
  id: number;
  status: string;
  live: boolean;
  reason: string;
}

export interface Resolution {
  rows: RowResult[];
  /** Live rows, as id -> status, sorted by id. */
  live: [number, string][];
  /** Delete files a reader must apply, by name. */
  deleteFiles: string[];
  /** Equality keys a reader loads, summed over every data file they apply to. */
  keyChecks: number;
  /** Deleted positions a reader skips. */
  positions: number;
  correct: boolean;
  summary: string;
  /** Rows that should be live but were deleted, as 'id status'. */
  lost: string[];
}

export function resolve(inputs: Inputs): Resolution {
  const { asOf, mode, rule } = inputs;
  const commits = COMMITS.filter((c) => c.seq <= asOf);
  const files = commits.map((c) => c.data);
  const rows: RowResult[] = [];
  const used = new Set<string>();
  const probed: string[] = [];
  let keyChecks = 0;
  let positions = 0;

  if (mode === 'equality') {
    const deletes = commits.flatMap((c) => (c.eq ? [c.eq] : []));
    const applies = (d: EqDelete, f: DataFile) => (rule === 'spec' ? f.seq < d.seq : f.seq <= d.seq);
    for (const file of files) {
      const scoped = deletes.filter((d) => applies(d, file));
      for (const d of scoped) {
        used.add(d.name);
        keyChecks += d.keys.length;
      }
      if (scoped.length > 0) probed.push(`${file.name} against ${scoped.map((d) => d.name).join(' and ')}`);
      for (const row of file.rows) {
        const hit = scoped.find((d) => d.keys.includes(row.id));
        rows.push({
          file: file.name,
          fileSeq: file.seq,
          pos: row.pos,
          id: row.id,
          status: row.status,
          live: !hit,
          reason: hit
            ? `${hit.name} (seq ${hit.seq}) has id ${row.id}, and ${file.seq} ${rule === 'spec' ? '<' : '≤'} ${hit.seq}`
            : liveReason(file, deletes, row.id, rule),
        });
      }
    }
  } else {
    // The latest DV per data file wins; older ones were replaced.
    const current = new Map<string, Dv>();
    for (const c of commits) for (const dv of c.dvs) current.set(dv.file, dv);
    for (const file of files) {
      const dv = current.get(file.name);
      const applies = dv !== undefined && file.seq <= dv.seq;
      if (applies) {
        used.add(dv.name);
        positions += dv.positions.length;
      }
      for (const row of file.rows) {
        const hit = applies && dv.positions.includes(row.pos);
        rows.push({
          file: file.name,
          fileSeq: file.seq,
          pos: row.pos,
          id: row.id,
          status: row.status,
          live: !hit,
          reason: hit
            ? `${dv.name} (seq ${dv.seq}) marks position ${row.pos}`
            : applies
              ? `${dv.name} doesn’t mark position ${row.pos}`
              : 'No deletion vector for this file',
        });
      }
    }
  }

  const live = new Map<number, string>();
  for (const r of rows) if (r.live) live.set(r.id, r.status);
  const want = expected(asOf);
  const lost = [...want.entries()]
    .filter(([id, status]) => live.get(id) !== status)
    .map(([id, status]) => `${id} ${status}`);
  const correct = lost.length === 0 && live.size === want.size;
  const liveSorted = [...live.entries()].sort((a, b) => a[0] - b[0]);
  const deleteFiles = [...used].sort();
  const loadedKeys = COMMITS.flatMap((c) => (c.eq && used.has(c.eq.name) ? c.eq.keys : [])).length;

  const work =
    mode === 'equality'
      ? deleteFiles.length === 0
        ? 'No delete files apply.'
        : `The reader loads ${deleteFiles.join(' and ')} (${loadedKeys} keys) and checks ${probed.join('; ')}.`
      : positions === 0
        ? 'No deletion vectors apply.'
        : `The reader skips ${positions} marked position${positions === 1 ? '' : 's'}. No key lookups.`;
  const summary = correct
    ? `Correct: ${liveSorted.map(([id, s]) => `${id} ${s}`).join(', ')}. ${work}`
    : `Wrong: ${lost.join(', ')} ${lost.length === 1 ? 'is' : 'are'} missing. A delete hid the row written in its own commit.`;

  return { rows, live: liveSorted, deleteFiles, keyChecks, positions, correct, summary, lost };
}

function liveReason(file: DataFile, deletes: EqDelete[], id: number, rule: Rule): string {
  const sameCommit = deletes.find((d) => d.seq === file.seq && d.keys.includes(id));
  if (sameCommit && rule === 'spec') {
    return `${sameCommit.name} is from the same commit (seq ${file.seq}), so it doesn’t apply`;
  }
  return 'No applicable delete has this id';
}
