import { perfMonitor } from "./PerfMonitor.js";

const isPerfEnabled = () =>
  typeof window === "undefined" || window.__heatmapPerfEnabled !== false;

const perfStart = (label) => (isPerfEnabled() ? perfMonitor.start(label) : null);

const perfEnd = (id, weight) => {
  if (id != null) {
    perfMonitor.end(id, weight);
  }
};

export { isPerfEnabled, perfStart, perfEnd };
