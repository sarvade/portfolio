/*
  Which code does an Airflow 3.3 rerun use? Pure logic, shared by the server
  render and the in-browser widget (RerunResolver.astro).

  Rules, from the DAG bundles docs and the 3.3.2 source:
  - Non-Git bundles (Local, S3, GCS) and disable_bundle_versioning: always latest.
  - Otherwise the setting resolves: request > DAG > [core] config > call-site
    default (False for clear/rerun, True for backfills).
  - A run with no version of its own (from Airflow 2, or removed by
    `airflow db clean`) uses the latest even when the setting says original.
*/

export type Tri = 'unset' | 'true' | 'false';

export interface Inputs {
  action: 'clear' | 'backfill';
  bundle: 'on' | 'off';
  request: Tri;
  dag: Tri;
  config: Tri;
  history: 'has' | 'none';
}

export type RowId = 'bundle' | 'request' | 'dag' | 'config' | 'default' | 'history';
export type RowState = 'pass' | 'decides' | 'skip' | 'override';

export interface Resolution {
  outcome: 'original' | 'latest';
  rows: Record<RowId, { state: RowState; text: string }>;
  summary: string;
}

export const DEFAULT_INPUTS: Inputs = {
  action: 'clear',
  bundle: 'on',
  request: 'unset',
  dag: 'unset',
  config: 'unset',
  history: 'has',
};

const SOURCE_NAMES: Record<'request' | 'dag' | 'config', string> = {
  request: 'the request',
  dag: 'the DAG parameter',
  config: 'the [core] config',
};

const word = (latest: boolean) => (latest ? 'latest' : 'original');

export function resolve(i: Inputs): Resolution {
  const skip = { state: 'skip' as const, text: 'Not consulted' };

  if (i.bundle === 'off') {
    return {
      outcome: 'latest',
      rows: {
        bundle: { state: 'decides', text: 'Decides: latest' },
        request: skip,
        dag: skip,
        config: skip,
        default: skip,
        history: skip,
      },
      summary: 'Latest code. Without bundle versioning, tasks always run the code that is deployed now.',
    };
  }

  const rows = { bundle: { state: 'pass', text: 'On, keep going' } } as Resolution['rows'];
  let resolved: boolean | null = null;
  let source = '';

  for (const key of ['request', 'dag', 'config'] as const) {
    if (resolved !== null) {
      rows[key] = skip;
      continue;
    }
    const value = i[key];
    if (value === 'unset') {
      rows[key] = { state: 'pass', text: 'Not set, fall through' };
    } else {
      resolved = value === 'true';
      source = SOURCE_NAMES[key];
      rows[key] = { state: 'decides', text: `Resolves to ${word(resolved)}` };
    }
  }

  if (resolved === null) {
    resolved = i.action === 'backfill';
    source = i.action === 'backfill' ? 'the default for backfills' : 'the default for clears and reruns';
    rows.default = { state: 'decides', text: `Resolves to ${word(resolved)}` };
  } else {
    rows.default = skip;
  }

  if (resolved) {
    rows.history = { state: 'skip', text: 'Not needed' };
    return {
      outcome: 'latest',
      rows,
      summary: `Latest code: the current parsed version of the DAG. Decided by ${source}.`,
    };
  }

  if (i.history === 'none') {
    rows.history = { state: 'override', text: 'Overrides: latest' };
    return {
      outcome: 'latest',
      rows,
      summary: 'Latest code. The setting resolves to the original, but this run has no version of its own to go back to.',
    };
  }

  rows.history = { state: 'pass', text: 'Version found' };
  return {
    outcome: 'original',
    rows,
    summary: `Original code: the commit this run was created with. Decided by ${source}.`,
  };
}
