/**
 * PerfMonitor - lightweight performance tracker for runtime cost analysis.
 *
 * Features:
 * - start/end markers to time arbitrary sections
 * - measure helpers for sync/async functions
 * - counters for operations processed (weight)
 * - impact scoring (1-10) based on time-per-call and time-per-second budgets
 * - tabular report for quick inspection or console output
 *
 * Usage example:
 *
 *   import { perfMonitor, measureAsync } from "./PerfMonitor.js";
 *
 *   const marker = perfMonitor.start("updateSimulation");
 *   // ... do work ...
 *   perfMonitor.end(marker, processedItems.length);
 *
 *   await measureAsync("fetchQuote", () => fetchQuote(ticker));
 *
 *   console.table(perfMonitor.report({ toConsole: true, sortBy: "score" }));
 */

const hasPerformance =
  typeof performance === "object" && typeof performance.now === "function";

const now = () => (hasPerformance ? performance.now() : Date.now());

const DEFAULT_THRESHOLDS = {
  /**
   * Thresholds for time spent per second (ms). Each boundary raises the impact score.
   * Below 1ms → low cost, above 12ms → critical (dominates frame budget).
   */
  perSecond: [1, 3, 6, 12],
  /**
   * Thresholds for time per call (ms). Helps spot expensive single invocations.
   */
  perCall: [2, 5, 15, 30],
  /**
   * Total accumulated time within the sampling window (ms).
   * Useful when a task runs infrequently but is still heavy overall.
   */
  total: [30, 120, 300, 600],
};

const DEFAULT_OPTIONS = {
  thresholds: DEFAULT_THRESHOLDS,
  attachGlobal: true,
};

function formatNumber(value, precision = 3) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(precision));
}

function impactScoreFor(value, thresholds) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const [t1, t2, t3, t4] = thresholds;
  if (value < t1) return 2;
  if (value < t2) return 4;
  if (value < t3) return 6;
  if (value < t4) return 8;
  return 10;
}

class PerfMonitor {
  constructor(options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const thresholds = config.thresholds || DEFAULT_THRESHOLDS;

    this.thresholds = {
      perSecond: thresholds.perSecond || DEFAULT_THRESHOLDS.perSecond,
      perCall: thresholds.perCall || DEFAULT_THRESHOLDS.perCall,
      total: thresholds.total || DEFAULT_THRESHOLDS.total,
    };

    this.metrics = new Map();
    this.activeMarks = new Map();
    this._nextId = 1;
  }

  /**
   * Begin timing a labeled section.
   * @param {string} label
   * @param {{weight?: number}} [meta]
   * @returns {number} marker id
   */
  start(label, meta = {}) {
    if (!label) throw new Error("PerfMonitor.start: label is required");
    const id = this._nextId++;
    this.activeMarks.set(id, {
      label,
      startTime: now(),
      weight: Number.isFinite(meta.weight) ? meta.weight : 1,
    });
    return id;
  }

  /**
   * Finish timing for a marker.
   * @param {number} id - Marker id returned by start()
   * @param {number} [weight] - Units processed during the interval (defaults to meta.weight or 1)
   * @returns {number|null} duration in ms
   */
  end(id, weight) {
    const marker = this.activeMarks.get(id);
    if (!marker) return null;
    this.activeMarks.delete(id);

    const endTime = now();
    const duration = Math.max(0, endTime - marker.startTime);
    const appliedWeight =
      Number.isFinite(weight) && weight > 0 ? weight : marker.weight || 1;

    this._record(marker.label, {
      duration,
      weight: appliedWeight,
      startTime: marker.startTime,
      endTime,
    });

    return duration;
  }

  /**
   * Record a manual measurement.
   * @param {string} label
   * @param {number} durationMs
   * @param {{weight?: number, startTime?: number, endTime?: number}} [meta]
   */
  record(label, durationMs, meta = {}) {
    const startTime =
      Number.isFinite(meta.startTime) && meta.startTime >= 0
        ? meta.startTime
        : now() - durationMs;
    const endTime =
      Number.isFinite(meta.endTime) && meta.endTime >= startTime
        ? meta.endTime
        : startTime + durationMs;
    this._record(label, {
      duration: Math.max(0, durationMs),
      weight: Number.isFinite(meta.weight) && meta.weight > 0 ? meta.weight : 1,
      startTime,
      endTime,
    });
  }

  /**
   * Convenience wrapper for synchronous functions.
   * @template T
   * @param {string} label
   * @param {Function} fn
   * @param {{weight?: number}} [meta]
   * @returns {T}
   */
  measure(label, fn, meta = {}) {
    const id = this.start(label, meta);
    try {
      const result = fn();
      // If fn returns a promise, delegate to measureAsync for consistent handling.
      if (result && typeof result.then === "function") {
        return result.finally(() => {
          this.end(id, meta.weight);
        });
      }
      this.end(id, meta.weight);
      return result;
    } catch (error) {
      this.end(id, meta.weight);
      throw error;
    }
  }

  /**
   * Convenience wrapper for async functions returning a promise.
   * @template T
   * @param {string} label
   * @param {Function} fn - async function returning a Promise
   * @param {{weight?: number}} [meta]
   * @returns {Promise<T>}
   */
  async measureAsync(label, fn, meta = {}) {
    const id = this.start(label, meta);
    try {
      const result = await fn();
      this.end(id, meta.weight);
      return result;
    } catch (error) {
      this.end(id, meta.weight);
      throw error;
    }
  }

  /**
   * Wrap a function so each invocation is automatically measured.
   * @param {string} label
   * @param {Function} fn
   * @param {{weightResolver?: (...args: any[]) => number}} [options]
   * @returns {Function}
   */
  wrap(label, fn, options = {}) {
    const weightResolver =
      typeof options.weightResolver === "function"
        ? options.weightResolver
        : null;

    return (...args) => {
      const weight = weightResolver ? weightResolver(...args) : undefined;
      const id = this.start(label, { weight });
      try {
        const result = fn(...args);
        if (result && typeof result.then === "function") {
          return result.finally(() => {
            this.end(id, weight);
          });
        }
        this.end(id, weight);
        return result;
      } catch (error) {
        this.end(id, weight);
        throw error;
      }
    };
  }

  /**
   * Increment a simple counter (no duration).
   * @param {string} label
   * @param {number} [weight=1]
   */
  increment(label, weight = 1) {
    this._record(label, {
      duration: 0,
      weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
      startTime: now(),
      endTime: now(),
    });
  }

  /**
   * Produce an array of metrics with derived stats and impact scores.
   * @param {{
   *   minCount?: number,
   *   sortBy?: "score" | "totalTime" | "perSecondTime" | "perCallTime",
   *   limit?: number,
   *   reset?: boolean,
   *   toConsole?: boolean
   * }} [options]
   * @returns {Array<object>}
   */
  report(options = {}) {
    const {
      minCount = 1,
      sortBy = "score",
      limit,
      reset = false,
      toConsole = false,
    } = options;

    const metrics = Array.from(this.metrics.values())
      .map((entry) => this._decorate(entry))
      .filter((metric) => metric.count >= minCount);

    const sortKey = {
      score: "score",
      totalTime: "totalTime",
      perSecondTime: "perSecondTime",
      perCallTime: "averageTime",
    }[sortBy] || "score";

    metrics.sort((a, b) => b[sortKey] - a[sortKey]);

    const limited =
      Number.isInteger(limit) && limit > 0 ? metrics.slice(0, limit) : metrics;

    if (toConsole && typeof console !== "undefined") {
      const table = limited.map(
        ({
          label,
          score,
          count,
          totalTime,
          averageTime,
          perSecondTime,
          perSecondCalls,
          totalWeight,
          weightPerSecond,
          minTime,
          maxTime,
        }) => ({
          label,
          score,
          calls: count,
          "total ms": formatNumber(totalTime),
          "avg ms": formatNumber(averageTime),
          "min ms": formatNumber(minTime),
          "max ms": formatNumber(maxTime),
          "ms / sec": formatNumber(perSecondTime),
          "calls / sec": formatNumber(perSecondCalls),
          weight: formatNumber(totalWeight, 2),
          "weight / sec": formatNumber(weightPerSecond),
        }),
      );
      console.table(table);
    }

    if (reset) {
      this.reset();
    }

    return limited;
  }

  /**
   * Clear all collected metrics.
   */
  reset() {
    this.metrics.clear();
    this.activeMarks.clear();
    this._nextId = 1;
  }

  _record(label, sample) {
    if (!label) return;

    const duration = Number.isFinite(sample.duration) ? sample.duration : 0;
    const weight = Number.isFinite(sample.weight) ? sample.weight : 1;
    const startTime = sample.startTime ?? now() - duration;
    const endTime =
      sample.endTime ??
      (Number.isFinite(startTime) ? startTime + duration : now());

    const existing = this.metrics.get(label);
    if (!existing) {
      this.metrics.set(label, {
        label,
        count: 1,
        totalTime: duration,
        minTime: duration,
        maxTime: duration,
        totalWeight: weight,
        firstStart: startTime,
        lastEnd: endTime,
      });
      return;
    }

    existing.count += 1;
    existing.totalTime += duration;
    existing.totalWeight += weight;
    existing.minTime =
      existing.minTime === null
        ? duration
        : Math.min(existing.minTime, duration);
    existing.maxTime =
      existing.maxTime === null
        ? duration
        : Math.max(existing.maxTime, duration);
    existing.firstStart =
      existing.firstStart == null
        ? startTime
        : Math.min(existing.firstStart, startTime);
    existing.lastEnd =
      existing.lastEnd == null
        ? endTime
        : Math.max(existing.lastEnd, endTime);
  }

  _decorate(entry) {
    const windowMs = Math.max(
      1,
      (entry.lastEnd ?? entry.firstStart ?? now()) -
        (entry.firstStart ?? entry.lastEnd ?? now()),
    );
    const windowSeconds = windowMs / 1000;
    const count = entry.count || 0;
    const totalTime = entry.totalTime || 0;
    const averageTime = count > 0 ? totalTime / count : totalTime;
    const perSecondTime =
      windowSeconds > 0 ? totalTime / windowSeconds : totalTime;
    const perSecondCalls =
      windowSeconds > 0 ? count / windowSeconds : count || 0;
    const totalWeight = entry.totalWeight || 0;
    const weightPerSecond =
      windowSeconds > 0 ? totalWeight / windowSeconds : totalWeight;

    const perSecondScore = impactScoreFor(
      perSecondTime,
      this.thresholds.perSecond,
    );
    const perCallScore = impactScoreFor(averageTime, this.thresholds.perCall);
    const totalScore = impactScoreFor(totalTime, this.thresholds.total);
    const score = Math.max(perSecondScore, perCallScore, totalScore);

    return {
      label: entry.label,
      count,
      totalTime,
      averageTime,
      minTime: entry.minTime ?? 0,
      maxTime: entry.maxTime ?? 0,
      perSecondTime,
      perSecondCalls,
      totalWeight,
      weightPerSecond,
      windowMs,
      score,
    };
  }
}

const defaultMonitor = new PerfMonitor();

if (
  typeof window !== "undefined" &&
  DEFAULT_OPTIONS.attachGlobal &&
  !window.__heatmapPerf
) {
  window.__heatmapPerf = defaultMonitor;
}

export { PerfMonitor };

export const perfMonitor = defaultMonitor;

export const measure = (label, fn, meta) =>
  defaultMonitor.measure(label, fn, meta);

export const measureAsync = (label, fn, meta) =>
  defaultMonitor.measureAsync(label, fn, meta);

export const perfReport = (options) => defaultMonitor.report(options);

