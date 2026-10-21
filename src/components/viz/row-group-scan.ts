/*
  Which parts of a Parquet file does a query read? Pure logic, shared by the
  server render and the in-browser widget (RowGroupScan.astro).

  The rule, from the Parquet format spec and the DuckDB Parquet docs:
  - Projection pushdown: only the column chunks of columns the query uses are
    read (Parquet stores each column of each row group contiguously).
  - Filter pushdown: a row group is skipped when its min/max statistics for
    the filtered column prove no row can match. Otherwise its chunks are read.

  The data is real: every row group, its order_date min/max and every column
  chunk's compressed size come from parquet_metadata() on the two files built
  by the experiment in the "How Parquet skips data" post (DuckDB 1.5.6,
  12,000,000 rows, ROW_GROUP_SIZE 1000000). The measured bytes and times come
  from the same run. Nothing here is illustrative.
*/

export type FileKey = 'sorted' | 'shuffled';
export type QueryKey = 'all' | 'sum' | 'day' | 'edge';

export interface Inputs {
  file: FileKey;
  query: QueryKey;
}

export const DEFAULT_INPUTS: Inputs = { file: 'sorted', query: 'day' };

export const COLUMNS = ['order_id', 'order_date', 'customer_id', 'amount', 'status', 'sku'] as const;
export type Column = (typeof COLUMNS)[number];

/** Short labels for the grid header, so six columns fit on a 320px screen. */
export const COLUMN_SHORT: Record<Column, string> = {
  order_id: 'id',
  order_date: 'date',
  customer_id: 'cust',
  amount: 'amt',
  status: 'stat',
  sku: 'sku',
};

export interface RowGroup {
  rows: number;
  /** order_date statistics, ISO dates. */
  min: string;
  max: string;
  /** Compressed bytes per column chunk, in COLUMNS order. */
  bytes: number[];
}

const rg = (rows: number, min: string, max: string, bytes: number[]): RowGroup => ({ rows, min, max, bytes });

export const FILES: Record<FileKey, { label: string; rowGroups: RowGroup[] }> = {
  sorted: {
    label: 'Sorted by order_date',
    rowGroups: [
      rg(1001472, '2025-01-01', '2025-01-31', [4008694, 300, 4873517, 1962782, 379613, 2709348]),
      rg(1001472, '2025-01-31', '2025-03-02', [4007980, 300, 4873095, 1962769, 379625, 2709732]),
      rg(1001472, '2025-03-02', '2025-04-02', [4008497, 308, 4872733, 1962799, 379619, 2709678]),
      rg(1001472, '2025-04-02', '2025-05-02', [4008017, 300, 4873109, 1962716, 379619, 2709938]),
      rg(1001472, '2025-05-02', '2025-06-02', [4008449, 308, 4873801, 1962760, 379688, 2709732]),
      rg(1001472, '2025-06-02', '2025-07-02', [4007971, 300, 4873127, 1962777, 379601, 2709788]),
      rg(1001472, '2025-07-02', '2025-08-02', [4007995, 307, 4873205, 1962802, 379637, 2710025]),
      rg(1001472, '2025-08-02', '2025-09-01', [4008500, 300, 4872449, 1962799, 379688, 2709594]),
      rg(1001472, '2025-09-01', '2025-10-02', [4007928, 308, 4873735, 1962765, 379686, 2709772]),
      rg(1001472, '2025-10-02', '2025-11-01', [4008514, 300, 4873078, 1962788, 379696, 2709392]),
      rg(1001472, '2025-11-01', '2025-12-02', [4007968, 308, 4873775, 1962799, 379660, 2709541]),
      rg(983808, '2025-12-02', '2025-12-31', [3937797, 292, 4787741, 1929572, 373001, 2672145]),
    ],
  },
  shuffled: {
    label: 'Shuffled',
    rowGroups: [
      rg(1001472, '2025-01-01', '2025-12-31', [5272992, 1132140, 4873101, 1962754, 379692, 2709465]),
      rg(1001472, '2025-01-01', '2025-12-31', [5273949, 1132139, 4872980, 1962756, 379609, 2710079]),
      rg(1001472, '2025-01-01', '2025-12-31', [5273916, 1132141, 4873444, 1962783, 379631, 2709738]),
      rg(1001472, '2025-01-01', '2025-12-31', [5273766, 1132141, 4872959, 1962812, 379603, 2709497]),
      rg(1001472, '2025-01-01', '2025-12-31', [5273505, 1132141, 4873440, 1962761, 379635, 2709639]),
      rg(1001472, '2025-01-01', '2025-12-31', [5273606, 1132140, 4873030, 1962743, 379603, 2709569]),
      rg(1001472, '2025-01-01', '2025-12-31', [5273629, 1132140, 4873231, 1962782, 379696, 2709900]),
      rg(1001472, '2025-01-01', '2025-12-31', [5273813, 1132140, 4873444, 1962800, 379672, 2709401]),
      rg(1001472, '2025-01-01', '2025-12-31', [5273108, 1132141, 4873815, 1962776, 379682, 2709811]),
      rg(1001472, '2025-01-01', '2025-12-31', [5273025, 1132140, 4873227, 1962809, 379619, 2709869]),
      rg(1001472, '2025-01-01', '2025-12-31', [5273969, 1132140, 4872750, 1962783, 379623, 2709530]),
      rg(983808, '2025-01-01', '2025-12-31', [5180504, 1112197, 4787854, 1929586, 372906, 2671989]),
    ],
  },
};

export interface Query {
  label: string;
  sql: string;
  columns: Column[];
  /** Equality filter on order_date, ISO date. */
  date?: string;
}

export const QUERIES: Record<QueryKey, Query> = {
  all: { label: 'Every column', sql: 'SELECT <every column>', columns: [...COLUMNS] },
  sum: { label: 'sum(amount)', sql: 'SELECT sum(amount)', columns: ['amount'] },
  day: {
    label: 'One day',
    sql: "SELECT sum(amount) WHERE order_date = '2025-03-14'",
    columns: ['order_date', 'amount'],
    date: '2025-03-14',
  },
  edge: {
    label: 'A boundary day',
    sql: "SELECT sum(amount) WHERE order_date = '2025-03-02'",
    columns: ['order_date', 'amount'],
    date: '2025-03-02',
  },
};

/** Measured in the experiment: bytes DuckDB read (MB) and median time of 5 runs (ms). */
export const MEASURED: Record<FileKey, Record<QueryKey, { mb: number; ms: number }>> = {
  sorted: {
    all: { mb: 167.2, ms: 429 },
    sum: { mb: 23.8, ms: 38 },
    day: { mb: 2.2, ms: 5 },
    edge: { mb: 4.2, ms: 6 },
  },
  shuffled: {
    all: { mb: 196.0, ms: 409 },
    sum: { mb: 23.8, ms: 38 },
    day: { mb: 37.3, ms: 35 },
    edge: { mb: 37.3, ms: 35 },
  },
};

/** Can this row group contain the date? ISO dates compare correctly as strings. */
export function mayContain(group: RowGroup, date: string): boolean {
  return group.min <= date && date <= group.max;
}

export interface Plan {
  /** cells[rowGroup][column]: is this column chunk read? */
  cells: boolean[][];
  /** Per row group: kept after the min/max check? */
  kept: boolean[];
  rowGroupsRead: number;
  rowGroupsTotal: number;
  chunksRead: number;
  chunksTotal: number;
  /** Sum of compressed sizes of the chunks read, in bytes. */
  chunkBytes: number;
  /** Sum of all chunks in the file, in bytes. */
  fileBytes: number;
  /** Share of each column in the file's bytes, in COLUMNS order (0 to 1). */
  columnShare: number[];
  measured: { mb: number; ms: number };
  summary: string;
}

export const formatMB = (bytes: number): string => `${(bytes / 1e6).toFixed(1)} MB`;

export function plan(inputs: Inputs): Plan {
  const file = FILES[inputs.file];
  const query = QUERIES[inputs.query];
  const wanted = COLUMNS.map((c) => query.columns.includes(c));

  const kept = file.rowGroups.map((g) => (query.date ? mayContain(g, query.date) : true));
  const cells = file.rowGroups.map((_, r) => wanted.map((w) => w && kept[r]));

  let chunkBytes = 0;
  let fileBytes = 0;
  const columnBytes = COLUMNS.map(() => 0);
  file.rowGroups.forEach((g, r) => {
    g.bytes.forEach((b, c) => {
      fileBytes += b;
      columnBytes[c] += b;
      if (cells[r][c]) chunkBytes += b;
    });
  });

  const rowGroupsRead = kept.filter(Boolean).length;
  const chunksRead = cells.flat().filter(Boolean).length;
  const rowGroupsTotal = file.rowGroups.length;
  const chunksTotal = rowGroupsTotal * COLUMNS.length;
  const measured = MEASURED[inputs.file][inputs.query];

  const skipped = rowGroupsTotal - rowGroupsRead;
  const groups =
    skipped === 0
      ? `all ${rowGroupsTotal} row groups`
      : `${rowGroupsRead} of ${rowGroupsTotal} row groups (min/max rules out the other ${skipped})`;
  const summary =
    `Reads ${groups} and ${chunksRead} of ${chunksTotal} column chunks. ` +
    `Measured: ${measured.mb.toFixed(1)} MB read, ${measured.ms} ms.`;

  return {
    cells,
    kept,
    rowGroupsRead,
    rowGroupsTotal,
    chunksRead,
    chunksTotal,
    chunkBytes,
    fileBytes,
    columnShare: columnBytes.map((b) => b / fileBytes),
    measured,
    summary,
  };
}

/** "2025-03-02" -> "Mar 02". */
export function shortDate(iso: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [, m, d] = iso.split('-');
  return `${months[Number(m) - 1]} ${d}`;
}
