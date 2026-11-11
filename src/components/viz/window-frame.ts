/*
  Logic for <WindowFrame />: which rows does a SQL window function see for the
  current row, and what does it return?

  The rules are the ones documented by PostgreSQL 18, DuckDB 2.0 and SQLite,
  and applied by Spark 4.3.0 (WindowResolution.resolveFrame):
  - With ORDER BY and no frame clause, the frame is
    RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, and in RANGE mode
    "current row" means the current row and all its peers (rows with the same
    ORDER BY value).
  - ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW stops at the current row
    itself, so tied rows get different results depending on the order the
    engine happens to put them in.

  The rows are the post's running example. Within a group of tied rows the
  widget uses order_id order, which is what DuckDB, SQLite and Spark produced
  for the post's insert order, and it flags every result that changes when
  tied rows arrive in a different order. Those flags are computed by trying
  every order of every peer group, not hard-coded.
*/

export interface Order {
  customer: string;
  orderId: number;
  date: string; // ISO date, the ORDER BY column
  amount: number;
}

export const ORDERS: readonly Order[] = [
  { customer: 'ana', orderId: 101, date: '2026-11-03', amount: 12 },
  { customer: 'ana', orderId: 102, date: '2026-11-05', amount: 30 },
  { customer: 'ana', orderId: 103, date: '2026-11-05', amount: 8 },
  { customer: 'ana', orderId: 104, date: '2026-11-09', amount: 20 },
  { customer: 'ana', orderId: 105, date: '2026-11-12', amount: 15 },
  { customer: 'ben', orderId: 106, date: '2026-11-04', amount: 50 },
  { customer: 'ben', orderId: 107, date: '2026-11-10', amount: 25 },
  { customer: 'ben', orderId: 108, date: '2026-11-10', amount: 5 },
];

export const MODES = ['default', 'rows', 'full'] as const;
export type Mode = (typeof MODES)[number];

export const FUNCS = ['sum', 'last_value'] as const;
export type Func = (typeof FUNCS)[number];

export const MODE_LABEL: Record<Mode, string> = {
  default: 'No frame clause (the default)',
  rows: 'ROWS ... CURRENT ROW',
  full: 'ROWS ... UNBOUNDED FOLLOWING',
};

export const FRAME_SQL: Record<Mode, string> = {
  default: '',
  rows: ' ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW',
  full: ' ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING',
};

export const FUNC_LABEL: Record<Func, string> = { sum: 'SUM(amount)', last_value: 'LAST_VALUE(amount)' };

export function sql(func: Func, mode: Mode): string {
  return `${FUNC_LABEL[func]} OVER (PARTITION BY customer_id ORDER BY order_date${FRAME_SQL[mode]})`;
}

/** Row indexes (into `rows`) of the current row's partition, in the given order. */
function partitionOf(rows: readonly Order[], i: number): number[] {
  const c = rows[i].customer;
  return rows.map((r, k) => (r.customer === c ? k : -1)).filter((k) => k >= 0);
}

/**
 * Indexes of the rows in the current row's frame. `rows` must already be
 * sorted by (customer, date); ties keep their order in the array, which plays
 * the part of the engine's arbitrary order among peers.
 */
export function frameOf(rows: readonly Order[], i: number, mode: Mode): number[] {
  const part = partitionOf(rows, i);
  if (mode === 'full') return part;
  const pos = part.indexOf(i);
  if (mode === 'rows') return part.slice(0, pos + 1);
  // RANGE: everything up to and including the current row's last peer.
  const date = rows[i].date;
  let end = pos;
  while (end + 1 < part.length && rows[part[end + 1]].date === date) end += 1;
  return part.slice(0, end + 1);
}

export function evaluate(rows: readonly Order[], i: number, mode: Mode, func: Func): number {
  const frame = frameOf(rows, i, mode);
  if (func === 'sum') return frame.reduce((s, k) => s + rows[k].amount, 0);
  return rows[frame[frame.length - 1]].amount;
}

/** Every order of the rows that keeps (customer, date) sorted: all permutations within each peer group. */
export function peerOrders(rows: readonly Order[] = ORDERS): Order[][] {
  const groups: Order[][] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    if (last && last[0].customer === r.customer && last[0].date === r.date) last.push(r);
    else groups.push([r]);
  }
  const perms = (xs: Order[]): Order[][] =>
    xs.length <= 1 ? [xs] : xs.flatMap((x, k) => perms([...xs.slice(0, k), ...xs.slice(k + 1)]).map((p) => [x, ...p]));
  return groups.reduce<Order[][]>(
    (acc, g) => acc.flatMap((prefix) => perms(g).map((p) => [...prefix, ...p])),
    [[]],
  );
}

export interface RowResult {
  orderId: number;
  value: number;
  /** All values this row can get, over every order of tied rows. */
  possible: number[];
  orderDependent: boolean;
}

export function results(mode: Mode, func: Func): RowResult[] {
  const orders = peerOrders(ORDERS);
  return ORDERS.map((r, i) => {
    const seen = new Set<number>();
    for (const o of orders) {
      const k = o.findIndex((x) => x.orderId === r.orderId);
      seen.add(evaluate(o, k, mode, func));
    }
    const possible = [...seen].sort((a, b) => a - b);
    return { orderId: r.orderId, value: evaluate(ORDERS, i, mode, func), possible, orderDependent: possible.length > 1 };
  });
}

export interface State {
  mode: Mode;
  func: Func;
  current: number; // index into ORDERS
}

export const DEFAULT_STATE: State = { mode: 'default', func: 'sum', current: 1 };

export interface View {
  frame: number[];
  value: number;
  sql: string;
  summary: string;
  rows: RowResult[];
}

const money = (n: number) => `$${n}`;

export function view(s: State): View {
  const frame = frameOf(ORDERS, s.current, s.mode);
  const rows = results(s.mode, s.func);
  const cur = ORDERS[s.current];
  const res = rows[s.current];
  const peers = ORDERS.filter((r) => r.customer === cur.customer && r.date === cur.date && r.orderId !== cur.orderId);
  const what = s.func === 'sum' ? 'over the frame is' : 'takes the last row:';
  let summary = `Order ${cur.orderId}: the frame has ${frame.length} row${frame.length === 1 ? '' : 's'}. ${FUNC_LABEL[s.func]} ${what} ${money(res.value)}.`;
  if (s.mode === 'default' && peers.length > 0) {
    summary += ` Order ${peers.map((p) => p.orderId).join(', ')} has the same date, so it is a peer and is in the frame too.`;
  }
  if (res.orderDependent) {
    summary += ` Not stable: if the tied rows arrive in another order, this row gets ${res.possible.map(money).join(' or ')}.`;
  }
  return { frame, value: res.value, sql: sql(s.func, s.mode), summary, rows };
}
