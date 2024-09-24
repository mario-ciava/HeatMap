import { perfStart, perfEnd } from "../utils/perfHelpers.js";

const raf =
  typeof window !== "undefined" && window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : (cb) => setTimeout(cb, 16);

export class UpdateScheduler {
  constructor(flushCallback, options = {}) {
    this.flushCallback = flushCallback;
    this.pending = new Map();
    this.frameScheduled = false;
    this.perfLabel = options.perfLabel || "updateScheduler";
  }

  request(ticker, index) {
    if (!ticker) return;
    if (index !== undefined) {
      this.pending.set(ticker, index);
    } else if (!this.pending.has(ticker)) {
      this.pending.set(ticker, undefined);
    }

    if (!this.frameScheduled) {
      this.frameScheduled = true;
      raf(() => this._flush());
    }
  }

  cancel(ticker) {
    if (!ticker) return;
    this.pending.delete(ticker);
  }

  clear() {
    this.pending.clear();
    this.frameScheduled = false;
  }

  flushImmediate() {
    if (!this.pending.size) {
      // Ensure callers still receive a callback so they can drain expectations
      this.flushCallback([], true);
      this.frameScheduled = false;
      return;
    }
    this._flush(true);
  }

  _flush(immediate = false) {
    if (!this.pending.size) {
      this.frameScheduled = false;
      return;
    }

    this.frameScheduled = false;
    const perfId = perfStart(this.perfLabel);
    try {
      const batch = Array.from(this.pending.entries()).map(([ticker, index]) => ({
        ticker,
        index,
      }));
      this.pending.clear();
      this.flushCallback(batch, immediate);
      perfEnd(perfId, batch.length);
    } catch (error) {
      perfEnd(perfId);
      throw error;
    }
  }
}
