/*
  Logic for <SkewCheck />: does Spark's adaptive skew join flag a shuffle
  partition as skewed, and how many pieces does it cut it into?

  Ported from Apache Spark v4.3.0:
  - OptimizeSkewedJoin.getSkewThreshold and targetSize
  - ShufflePartitionsUtil.splitSizeListByTargetSize (SMALL_PARTITION_FACTOR 0.2,
    MERGED_PARTITION_FACTOR 1.2)
  - Utils.median (even count: mean of the 2 middle values, at least 1)
  - MapStatus.compressSize / decompressSize: with 2,000 partitions or fewer
    each map task reports every block size rounded up to a power of 1.1, so
    Spark decides on estimates that can be up to 10% high

  The partition sizes are the shuffle read sizes measured in the post's
  experiment (8 partitions, PySpark 4.3.0 local mode). Simplification: these
  are per-task reads of both join sides together, while Spark checks each side
  on its own; the customers side is small, and the results still match the
  measured runs to within 0.1 MB. The hot partition's bytes
  are assumed to be spread evenly across the map tasks, which is how the
  experiment's input was built (spark.range splits evenly).
*/

export const MB = 1024 * 1024;

/**
 * Measured shuffle read per join task, in MB, sorted (AQE off run). Almost all of it
 * is the orders side; the customers side adds a small amount per task.
 */
export const PARTITION_MB = [10.6, 10.6, 10.7, 10.7, 10.7, 10.8, 10.9, 73.7] as const;
export const HOT_INDEX = 7;

export const FACTOR = 5;
export const SMALL_PARTITION_FACTOR = 0.2;
export const MERGED_PARTITION_FACTOR = 1.2;

export const THRESHOLD_OPTIONS = [16, 64, 256] as const;
export const ADVISORY_OPTIONS = [8, 64] as const;
export const MAP_TASK_OPTIONS = [1, 4, 16] as const;

export type ThresholdMb = (typeof THRESHOLD_OPTIONS)[number];
export type AdvisoryMb = (typeof ADVISORY_OPTIONS)[number];
export type MapTasks = (typeof MAP_TASK_OPTIONS)[number];

export interface Inputs {
  thresholdMb: ThresholdMb;
  advisoryMb: AdvisoryMb;
  mapTasks: MapTasks;
}

export const DEFAULT_INPUTS: Inputs = { thresholdMb: 256, advisoryMb: 64, mapTasks: 4 };

/** MapStatus round trip: the block size the driver sees for a real size. */
export function estimateBlock(size: number): number {
  if (size === 0) return 0;
  if (size <= 1) return 1;
  const code = Math.min(255, Math.ceil(Math.log(size) / Math.log(1.1)));
  return Math.floor(Math.pow(1.1, code));
}

/** Split a partition's bytes evenly across map tasks, the way the experiment's input was spread. */
export function evenSplit(total: number, parts: number): number[] {
  const each = Math.floor(total / parts);
  return Array.from({ length: parts }, (_, k) => (k === parts - 1 ? total - each * (parts - 1) : each));
}

/** Spark's Utils.median on a copy of the sizes. */
export function median(sizes: readonly number[]): number {
  const s = [...sizes].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return 1;
  const m = n % 2 === 0 ? Math.floor((s[n / 2] + s[n / 2 - 1]) / 2) : s[Math.floor(n / 2)];
  return Math.max(m, 1);
}

/** OptimizeSkewedJoin.getSkewThreshold: the larger of the fixed threshold and factor x median. */
export function skewThreshold(medianBytes: number, thresholdBytes: number, factor = FACTOR): number {
  return Math.max(thresholdBytes, Math.floor(medianBytes * factor));
}

/** OptimizeSkewedJoin.targetSize: the advisory size, or the mean non-skewed size if that is bigger. */
export function targetSize(sizes: readonly number[], threshold: number, advisoryBytes: number): number {
  const nonSkew = sizes.filter((s) => s <= threshold);
  if (nonSkew.length === 0) return advisoryBytes;
  const mean = Math.floor(nonSkew.reduce((a, b) => a + b, 0) / nonSkew.length);
  return Math.max(advisoryBytes, mean);
}

/** ShufflePartitionsUtil.splitSizeListByTargetSize: start indices of each piece. */
export function splitSizeListByTargetSize(
  sizes: readonly number[],
  target: number,
  smallFactor = SMALL_PARTITION_FACTOR,
): number[] {
  const starts = [0];
  let i = 0;
  let current = 0;
  let last = -1;

  const tryMerge = () => {
    const shouldMerge =
      last > -1 &&
      (current + last < target * MERGED_PARTITION_FACTOR || current < target * smallFactor || last < target * smallFactor);
    if (shouldMerge) {
      starts.pop();
      last += current;
    } else {
      last = current;
    }
  };

  while (i < sizes.length) {
    if (i > 0 && current + sizes[i] > target) {
      tryMerge();
      starts.push(i);
      current = sizes[i];
    } else {
      current += sizes[i];
    }
    i += 1;
  }
  tryMerge();
  return starts;
}

/**
 * Piece sizes for one reducer partition. Spark cuts along the estimated per-map
 * sizes; the pieces returned are the real bytes each piece reads. Empty when
 * Spark would not split.
 */
export function splitPieces(mapSizes: readonly number[], target: number, estimated = mapSizes): number[] {
  const starts = splitSizeListByTargetSize(estimated, target);
  if (starts.length <= 1) return [];
  return starts.map((start, k) => {
    const end = k === starts.length - 1 ? mapSizes.length : starts[k + 1];
    return mapSizes.slice(start, end).reduce((a, b) => a + b, 0);
  });
}

export type Verdict = 'not-skewed' | 'skewed-no-split' | 'split';

export interface Result {
  /** Median of the driver's estimated partition sizes. */
  medianMb: number;
  thresholdMb: number;
  /** Which rule set the threshold: the fixed setting or factor x median. */
  thresholdFrom: 'setting' | 'median';
  targetMb: number;
  hotMb: number;
  /** The hot partition as the driver sees it (rounded-up map output sizes). */
  hotEstMb: number;
  verdict: Verdict;
  /** Piece sizes in MB, empty unless verdict is 'split'. */
  piecesMb: number[];
  summary: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const fmt = (n: number) => `${round1(n).toFixed(1)} MB`;

export function check(inputs: Inputs, partitionMb: readonly number[] = PARTITION_MB, hot = HOT_INDEX): Result {
  const real = partitionMb.map((m) => Math.round(m * MB));
  const perMapReal = real.map((b) => evenSplit(b, inputs.mapTasks));
  const perMapEst = perMapReal.map((maps) => maps.map(estimateBlock));
  // What the driver sees: the sum of each partition's estimated map outputs.
  const sizes = perMapEst.map((maps) => maps.reduce((a, b) => a + b, 0));
  const med = median(sizes);
  const thresholdBytes = inputs.thresholdMb * MB;
  const thr = skewThreshold(med, thresholdBytes);
  const target = targetSize(sizes, thr, inputs.advisoryMb * MB);
  const hotBytes = real[hot];
  const isSkewed = sizes[hot] > thr;

  let piecesMb: number[] = [];
  let verdict: Verdict = 'not-skewed';
  if (isSkewed) {
    const pieces = splitPieces(perMapReal[hot], target, perMapEst[hot]);
    if (pieces.length > 1) {
      verdict = 'split';
      piecesMb = pieces.map((p) => round1(p / MB));
    } else {
      verdict = 'skewed-no-split';
    }
  }

  const result: Result = {
    medianMb: round1(med / MB),
    thresholdMb: round1(thr / MB),
    thresholdFrom: thresholdBytes >= Math.floor(med * FACTOR) ? 'setting' : 'median',
    targetMb: round1(target / MB),
    hotMb: round1(hotBytes / MB),
    hotEstMb: round1(sizes[hot] / MB),
    verdict,
    piecesMb,
    summary: '',
  };
  result.summary = summarize(result, inputs);
  return result;
}

function pieceList(pieces: number[]): string {
  const same = pieces.every((p) => Math.abs(p - pieces[0]) < 0.5);
  if (same) return `${pieces.length} pieces of about ${fmt(pieces[0])}`;
  return `${pieces.length} pieces (${pieces.map(fmt).join(', ')})`;
}

function summarize(r: Result, inputs: Inputs): string {
  const rule =
    r.thresholdFrom === 'setting'
      ? `the ${inputs.thresholdMb} MB setting`
      : `${FACTOR} x the ${fmt(r.medianMb)} median`;
  const sees = `Spark estimates the hot partition at ${fmt(r.hotEstMb)}`;
  if (r.verdict === 'not-skewed') {
    return `Not skewed. ${sees}, below the skew threshold of ${fmt(r.thresholdMb)} (${rule}). One task still reads all ${fmt(r.hotMb)}.`;
  }
  if (r.verdict === 'skewed-no-split') {
    const why =
      inputs.mapTasks === 1
        ? 'it came from a single map task, and Spark can only cut along map outputs'
        : `its ${inputs.mapTasks} map outputs do not divide into pieces worth splitting at a ${fmt(r.targetMb)} target`;
    return `Skewed: ${sees}, above ${fmt(r.thresholdMb)} (${rule}). But not split: ${why}. One task still reads all ${fmt(r.hotMb)}.`;
  }
  return `Skewed and split. ${sees}, above ${fmt(r.thresholdMb)} (${rule}). Spark cuts it along map outputs into ${pieceList(r.piecesMb)}, aiming for ${fmt(r.targetMb)} each. Each piece is its own task, joined against a copy of the matching customers partition.`;
}
