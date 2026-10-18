import Papa from 'papaparse';
import { RngConfig, RngResult, RngStats } from '../types';

/**
 * Fast 32-bit pseudorandom number generator with seed support (Mulberry32)
 */
function createPrng(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Box-Muller transform for generating standard normally distributed numbers
 */
function sampleGaussian(randomFn: () => number, mean: number, stdDev: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = randomFn();
  while (v === 0) v = randomFn();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

/**
 * Generates numbers according to the provided configuration
 */
export function generateRandomNumbers(config: RngConfig): RngResult {
  const randomFn = config.useSeed && config.seed.trim() ? createPrng(config.seed.trim()) : Math.random;

  const count = Math.max(1, Math.min(20000, Math.floor(config.count)));
  const min = Math.min(config.min, config.max);
  const max = Math.max(config.min, config.max);
  const rangeSpan = max - min + 1;

  let rawNumbers: number[] = [];

  if (config.type === 'integer') {
    if (config.unique) {
      if (rangeSpan < count) {
        throw new Error(
          `Cannot generate ${count} unique integers in range [${min}, ${max}] (only ${rangeSpan} possible values). Increase range or decrease count.`
        );
      }

      // If range is moderate, use reservoir/shuffle, otherwise use a Set
      if (rangeSpan <= 100000) {
        const pool: number[] = [];
        for (let i = min; i <= max; i++) {
          pool.push(i);
        }
        // Fisher-Yates partial shuffle
        for (let i = 0; i < count; i++) {
          const j = i + Math.floor(randomFn() * (pool.length - i));
          const temp = pool[i];
          pool[i] = pool[j];
          pool[j] = temp;
          rawNumbers.push(pool[i]);
        }
      } else {
        const set = new Set<number>();
        while (set.size < count) {
          const val = Math.floor(randomFn() * (max - min + 1)) + min;
          set.add(val);
        }
        rawNumbers = Array.from(set);
      }
    } else {
      for (let i = 0; i < count; i++) {
        const val = Math.floor(randomFn() * (max - min + 1)) + min;
        rawNumbers.push(val);
      }
    }
  } else if (config.type === 'float') {
    const factor = Math.pow(10, Math.max(0, Math.min(8, config.precision)));
    if (config.unique) {
      const set = new Set<number>();
      let attempts = 0;
      const maxAttempts = count * 20;
      while (set.size < count && attempts < maxAttempts) {
        attempts++;
        const val = +(min + randomFn() * (max - min)).toFixed(config.precision);
        set.add(val);
      }
      rawNumbers = Array.from(set);
      if (rawNumbers.length < count) {
        // fill remaining if precision collision
        while (rawNumbers.length < count) {
          rawNumbers.push(+(min + randomFn() * (max - min)).toFixed(config.precision));
        }
      }
    } else {
      for (let i = 0; i < count; i++) {
        const val = +(min + randomFn() * (max - min)).toFixed(config.precision);
        rawNumbers.push(val);
      }
    }
  } else if (config.type === 'gaussian') {
    const mean = config.gaussianMean ?? (min + max) / 2;
    const stdDev = config.gaussianStdDev ?? ((max - min) / 6 || 1);
    for (let i = 0; i < count; i++) {
      let g = sampleGaussian(randomFn, mean, stdDev);
      // Optional clamp if user set strict bounds
      if (g < min) g = min;
      if (g > max) g = max;
      rawNumbers.push(+g.toFixed(config.precision || 2));
    }
  }

  // Sorting
  if (config.sort === 'asc') {
    rawNumbers.sort((a, b) => a - b);
  } else if (config.sort === 'desc') {
    rawNumbers.sort((a, b) => b - a);
  }

  // Calculate descriptive statistics
  const stats = calculateStats(rawNumbers);

  return {
    numbers: rawNumbers,
    stats,
    config: { ...config },
    generatedAt: new Date().toLocaleTimeString(),
  };
}

/**
 * Computes descriptive statistics for a list of numbers
 */
export function calculateStats(numbers: number[]): RngStats {
  if (numbers.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, median: 0, stdDev: 0, uniqueCount: 0 };
  }

  let min = numbers[0];
  let max = numbers[0];
  let sum = 0;
  const uniqueSet = new Set<number>();

  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i];
    if (n < min) min = n;
    if (n > max) max = n;
    sum += n;
    uniqueSet.add(n);
  }

  const mean = +(sum / numbers.length).toFixed(3);

  // Median
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : +((sorted[mid - 1] + sorted[mid]) / 2).toFixed(3);

  // Standard Deviation
  const varianceSum = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const stdDev = +(Math.sqrt(varianceSum / numbers.length)).toFixed(3);

  return {
    count: numbers.length,
    min,
    max,
    mean,
    median,
    stdDev,
    uniqueCount: uniqueSet.size,
  };
}

/**
 * Formats numbers for CSV and downloads to disk
 */
export function exportRngToCSV(numbers: number[], filename = 'generated_random_numbers.csv') {
  const rows = numbers.map((n, idx) => ({
    Index: idx + 1,
    Value: n,
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Formats numbers for JSON and downloads
 */
export function exportRngToJSON(result: RngResult, filename = 'generated_random_numbers.json') {
  const jsonStr = JSON.stringify(
    {
      metadata: {
        generatedAt: result.generatedAt,
        config: result.config,
        stats: result.stats,
      },
      data: result.numbers,
    },
    null,
    2
  );

  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
