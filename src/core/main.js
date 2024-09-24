import { AppController } from "../services/AppController.js";
import { CONFIG, SIMULATION_ASSETS, REAL_DATA_ASSETS, MAX_TOTAL_TICKERS } from "../config.js";
import { logger } from "../utils/Logger.js";
import { perfMonitor, perfReport } from "../utils/PerfMonitor.js";
import { ControlPanelView } from '../ui/views/ControlPanelView.js';
import { HeatmapView } from '../ui/views/HeatmapView.js';
import { ModalView } from '../ui/views/ModalView.js';

const log = logger.child("Main");
const isPerfEnabled = () =>
  typeof window === "undefined" || window.__heatmapPerfEnabled !== false;
const perfStart = (label) => (isPerfEnabled() ? perfMonitor.start(label) : null);
const perfEnd = (id, weight) => {
  if (id != null) {
    perfMonitor.end(id, weight);
  }
};

if (typeof window !== "undefined") {
  if (typeof window.__heatmapPerfEnabled === "undefined") {
    window.__heatmapPerfEnabled = true;
  }
  if (!window.showHeatmapPerf) {
    window.showHeatmapPerf = (options = {}) =>
      perfReport({
        toConsole: true,
        sortBy: "score",
        ...options,
      });
  }
}

logger.setLevel(CONFIG.LOG_LEVEL);

const CUSTOM_ASSET_STORAGE_KEY = "heatmap_custom_assets_v1";
const BLACKLIST_STORAGE_KEY = "heatmap_blacklist_tickers_v1";
const MIN_SEARCH_QUERY_LENGTH = 2;

function loadCustomAssetMetadata() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_ASSET_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ticker: item.ticker?.toUpperCase(),
        name: item.name,
        sector: item.sector,
        type: item.type,
        region: item.region,
        currency: item.currency,
        simulationPrice: item.simulationPrice,
        simulationBasePrice: item.simulationBasePrice,
        lastKnownPrice: item.lastKnownPrice,
        addedAt: item.addedAt,
      })).filter((item) => item.ticker);
    }
  } catch (error) {
    console.warn("Failed to parse custom asset storage", error);
  }
  return [];
}

let customAssetMetadata = loadCustomAssetMetadata();
let tickerBlacklist = loadBlacklist();

function loadBlacklist() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BLACKLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((t) => t.toUpperCase()) : [];
  } catch (error) {
    console.warn("Failed to parse blacklist", error);
  }
  return [];
}

function saveBlacklist(next) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.error("Failed to save blacklist", error);
  }
}

function unblacklistTicker(ticker) {
  if (!ticker) return;
  const normalized = ticker.toUpperCase();
  if (!tickerBlacklist.includes(normalized)) return;
  tickerBlacklist = tickerBlacklist.filter((t) => t !== normalized);
  saveBlacklist(tickerBlacklist);
}

function isCustomTicker(ticker) {
  if (!ticker) return false;
  const normalized = ticker.toUpperCase();
  return customAssetMetadata.some((meta) => meta.ticker === normalized);
}

function updateCustomAssetMeta(ticker, changesOrUpdater) {
  if (!ticker) return;
  const normalized = ticker.toUpperCase();
  const index = customAssetMetadata.findIndex((meta) => meta.ticker === normalized);
  if (index === -1) return;

  const draft = { ...customAssetMetadata[index] };
  const result =
    typeof changesOrUpdater === "function"
      ? changesOrUpdater(draft) || draft
      : Object.assign(draft, changesOrUpdater || {});

  customAssetMetadata[index] = result;
  persistCustomAssets();
}

function syncCustomAssetFromTile(ticker) {
  if (!ticker || !app) return;
  const tile = app.state.getTile(ticker);
  if (!tile || tile.price == null) return;

  updateCustomAssetMeta(ticker, (draft) => {
    draft.lastKnownPrice = tile.price;
    draft.simulationPrice = tile.price;
    draft.simulationBasePrice =
      tile.basePrice ??
      tile.previousClose ??
      tile._placeholderBasePrice ??
      tile.price ??
      draft.simulationBasePrice;
    draft.addedAt = Date.now();
    return draft;
  });
}

function persistCustomAssets() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CUSTOM_ASSET_STORAGE_KEY,
      JSON.stringify(customAssetMetadata),
    );
  } catch (error) {
    console.warn("Unable to persist custom assets", error);
  }
}

function generateSimulationPrice(seed = Date.now()) {
  const base = (seed % 200) + 50 + Math.random() * 25;
  return Number(base.toFixed(2));
}

function mapMetaToAsset(meta, mode) {
  const ticker = meta.ticker?.toUpperCase();
  if (!ticker) return null;
  const baseName = meta.name || ticker;
  const baseSector = meta.sector || meta.type || "Custom";

  if (mode === "simulation") {
    const simPrice =
      Number(meta.simulationPrice) || generateSimulationPrice(meta.addedAt);
    const simBase =
      Number(meta.simulationBasePrice ?? simPrice) || simPrice;

    return {
      ticker,
      name: baseName,
      sector: baseSector,
      price: simPrice,
      basePrice: simBase,
      change: 0,
    };
  }

  const lastKnown = Number(meta.lastKnownPrice) || 0;
  return {
    ticker,
    name: baseName,
    sector: baseSector,
    price: lastKnown,
    basePrice: lastKnown,
    change: 0,
  };
}

function mergeAssets(base, extras) {
  const seen = new Set();
  const merged = [];

  base.forEach((asset) => {
    const ticker = asset.ticker?.toUpperCase();
    if (!ticker || seen.has(ticker)) return;
    seen.add(ticker);
    merged.push({ ...asset, ticker });
  });

  extras.forEach((asset) => {
    const ticker = asset?.ticker?.toUpperCase();
    if (!ticker || seen.has(ticker)) return;
    seen.add(ticker);
    merged.push({ ...asset, ticker });
  });

  return merged;
}

function composeAssetsForMode(mode) {
  const base = mode === "real" ? REAL_DATA_ASSETS : SIMULATION_ASSETS;
  const customAssets = customAssetMetadata
    .map((meta) => mapMetaToAsset(meta, mode))
    .filter(Boolean);
  const merged = mergeAssets(base, customAssets);
  return merged.filter(
    (asset) => !tickerBlacklist.includes(asset.ticker.toUpperCase()),
  );
}

function syncAssetsSnapshot(mode) {
  const computed = composeAssetsForMode(mode);
  assets = computed;
  controlPanelView?.setAssets(computed);
  return computed;
}

let assets = composeAssetsForMode("simulation");

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const volumeFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

function formatPrice(value) {
  if (value == null || Number.isNaN(value)) return "---";
  return priceFormatter.format(value);
}

function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return "---";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatVolume(value) {
  if (value == null || Number.isNaN(value)) return "---";
  if (value === 0) return "0";
  return volumeFormatter.format(value);
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return "---";
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "---";

  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (days === 1) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  if (days === 2) return "2 days ago";
  if (days === 3) return "3 days ago";

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const addTickerModal = document.getElementById("add-ticker-modal");
const addTickerClose = document.getElementById("add-ticker-close");
const addTickerForm = document.getElementById("add-ticker-form");
const addTickerInput = document.getElementById("add-ticker-input");
const addTickerResults = document.getElementById("add-ticker-results");

let lastTickerResults = new Map();
let lastTickerQuery = "";
let tickerLookupAbortController = null;
let tickerLookupRequestId = 0;

function openAddTickerModal() {
  if (!addTickerModal) return;
  addTickerModal.classList.add("active");
  document.documentElement.style.overflow = "hidden";
  setTimeout(() => addTickerInput?.focus({ preventScroll: true }), 120);
  controlPanelView?.closeAllCustomSelects();
}

function closeAddTickerModal() {
  if (!addTickerModal) return;
  addTickerModal.classList.remove("active");
  document.documentElement.style.overflow = "";
}

if (addTickerClose) {
  addTickerClose.addEventListener("click", closeAddTickerModal);
}

if (addTickerModal) {
  addTickerModal.addEventListener("click", (event) => {
    if (event.target === addTickerModal) {
      closeAddTickerModal();
    }
  });
}

if (addTickerForm) {
  addTickerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = addTickerInput?.value.trim() || "";
    if (query.length < MIN_SEARCH_QUERY_LENGTH) {
      if (addTickerResults) {
        addTickerResults.textContent =
          "Type at least two characters to search for tickers.";
      }
      return;
    }
    performTickerLookup(query);
  });
}

if (addTickerResults) {
  addTickerResults.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ticker-action]");
    if (!button) return;
    const symbol = button.getAttribute("data-symbol");
    if (symbol) {
      handleAddTickerSelection(symbol);
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && addTickerModal?.classList.contains("active")) {
    closeAddTickerModal();
  }
});

function escapeHtml(value) {
  if (!value) return "";
  return value.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return match;
    }
  });
}

function tickerAlreadyExists(symbol) {
  const normalized = symbol?.toUpperCase();
  if (!normalized) return false;
  const currentAssets = app?.assets || assets || [];
  return currentAssets.some((asset) => asset.ticker === normalized);
}

function inferSectorFromResult(result) {
  const type = result?.type?.toLowerCase() || "";
  if (!type) return "Custom";
  if (type.includes("etf")) return "ETF";
  if (type.includes("fund")) return "Fund";
  if (type.includes("crypto")) return "Crypto";
  if (type.includes("forex") || type.includes("fx")) return "FX";
  if (type.includes("index")) return "Index";
  return "Equity";
}

function buildCustomMetaFromResult(result) {
  const ticker = result.symbol?.toUpperCase();
  const placeholderPrice = generateSimulationPrice(result.symbol?.length || Date.now());
  return {
    ticker,
    name: result.description?.trim() || result.displaySymbol || ticker,
    sector: inferSectorFromResult(result),
    type: result.type || "",
    region: result.region || "",
    currency: result.currency || "USD",
    simulationPrice: placeholderPrice,
    simulationBasePrice: placeholderPrice,
    lastKnownPrice: 0,
    addedAt: Date.now(),
  };
}

async function performTickerLookup(query) {
  if (!addTickerResults) return;
  if (!app) {
    addTickerResults.textContent = "Heatmap is still initializing. Please try again in a moment.";
    return;
  }

  const normalizedQuery = query?.trim() || "";
  if (normalizedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
    addTickerResults.textContent =
      "Type at least two characters to search for tickers.";
    return;
  }

  const requestId = ++tickerLookupRequestId;

  if (tickerLookupAbortController) {
    tickerLookupAbortController.abort();
  }
  const controller = new AbortController();
  tickerLookupAbortController = controller;
  const { signal } = controller;

  addTickerResults.innerHTML = `<p>Searching Finnhub for "<strong>${escapeHtml(normalizedQuery)}</strong>"...</p>`;

  try {
    const matches = await app.searchSymbols(normalizedQuery, {
      signal,
      suppressAuthErrors: true,
    });

    if (signal.aborted || requestId !== tickerLookupRequestId) {
      return;
    }

    const nextResults = new Map();
    matches
      .filter((item) => item?.symbol)
      .forEach((item) => {
        nextResults.set(item.symbol.toUpperCase(), item);
      });

    lastTickerResults = nextResults;
    lastTickerQuery = normalizedQuery;

    renderTickerSearchResults(matches, normalizedQuery);
  } catch (error) {
    if (signal.aborted || requestId !== tickerLookupRequestId) {
      return;
    }
    console.error("Ticker lookup failed", error);

    const manualResult = {
      symbol: normalizedQuery.toUpperCase(),
      description: "Manual entry (not validated)",
      type: "custom",
      region: "",
      currency: "USD",
    };
    lastTickerResults = new Map([[manualResult.symbol, manualResult]]);
    lastTickerQuery = normalizedQuery;
    renderTickerSearchResults([manualResult], normalizedQuery);
  } finally {
    if (tickerLookupAbortController === controller) {
      tickerLookupAbortController = null;
    }
  }
}

function renderTickerSearchResults(results, query) {
  if (!addTickerResults) return;
  if (!Array.isArray(results) || results.length === 0) {
    addTickerResults.innerHTML = `<p>No results for "<strong>${escapeHtml(query)}</strong>". Try a different symbol or company name.</p>`;
    return;
  }

  const limited = results.slice(0, 15);
  const rows = limited
    .map((result) => {
      const ticker = result.symbol?.toUpperCase() || "—";
      const description = result.description?.trim() || result.displaySymbol || "Unknown company";
      const metaParts = [
        result.type,
        result.region || result.currency,
        result.mic,
      ].filter(Boolean);
      const subtitle = metaParts.join(" • ");
      const alreadyAdded = tickerAlreadyExists(ticker);

      return `
        <li class="add-ticker-result">
          <div class="add-ticker-meta">
            <div class="add-ticker-result-title">${escapeHtml(ticker)}</div>
            <div class="add-ticker-result-subtitle">${escapeHtml(description)}</div>
            ${
              subtitle
                ? `<div class="add-ticker-result-tags">${escapeHtml(subtitle)}</div>`
                : ""
            }
          </div>
          <button
            type="button"
            class="add-ticker-result-action"
            data-ticker-action="add"
            data-symbol="${escapeHtml(ticker)}"
            ${alreadyAdded ? "disabled" : ""}
          >
            ${alreadyAdded ? "Added" : "Add"}
          </button>
        </li>
      `;
    })
    .join("");

  addTickerResults.innerHTML = `
    <p class="add-ticker-results-intro">
      Showing ${limited.length} result${limited.length === 1 ? "" : "s"} for "<strong>${escapeHtml(query)}</strong>"
    </p>
    <ul class="add-ticker-result-list">
      ${rows}
    </ul>
  `;
}

function handleAddTickerSelection(symbol) {
  const normalized = symbol?.toUpperCase();
  if (!normalized) return;

  if (!app) {
    showToast("Heatmap is still initializing. Please try again.");
    return;
  }

  if (tickerAlreadyExists(normalized)) {
    showToast(`${normalized} is already on the heatmap`);
    renderTickerSearchResults(Array.from(lastTickerResults.values()), lastTickerQuery);
    return;
  }

  const currentAssets = app?.assets || assets || [];
  if (currentAssets.length >= MAX_TOTAL_TICKERS) {
    showToast(`Maximum ${MAX_TOTAL_TICKERS} tickers allowed. Remove a ticker to add a new one.`);
    return;
  }

  const match = lastTickerResults.get(normalized);
  if (!match) {
    showToast("Unable to resolve ticker details. Search again.");
    return;
  }

  const meta = buildCustomMetaFromResult(match);
  unblacklistTicker(normalized);
  customAssetMetadata = customAssetMetadata.filter((item) => item.ticker !== normalized);
  customAssetMetadata.push(meta);
  persistCustomAssets();

  const mode = app?.state.getMode() || "simulation";
  const updatedAssets = syncAssetsSnapshot(mode);
  app?.applyExternalAssets(updatedAssets, {
    mode,
    toastMessage: `${normalized} added to the heatmap`,
  });
  controlPanelView?.scheduleStatsUpdate();

  renderTickerSearchResults(Array.from(lastTickerResults.values()), lastTickerQuery);
}

function removeTicker(ticker) {
  const normalized = ticker?.toUpperCase();
  if (!normalized) return;

  if (!app) {
    showToast("Heatmap is still initializing. Please try again.");
    return;
  }

  if (!tickerBlacklist.includes(normalized)) {
    tickerBlacklist.push(normalized);
    saveBlacklist(tickerBlacklist);
  }

  if (isCustomTicker(normalized)) {
    customAssetMetadata = customAssetMetadata.filter((item) => item.ticker !== normalized);
    persistCustomAssets();
  }

  const mode = app?.state.getMode() || "simulation";
  const updatedAssets = syncAssetsSnapshot(mode);
  app?.applyExternalAssets(updatedAssets, {
    mode,
    toastMessage: `${normalized} removed from the heatmap`,
  });
  controlPanelView?.scheduleStatsUpdate();
}

let app = null;
let controlPanelView = null;
let heatmapView = null;
let modalView = null;

function initHeatmap() {
  log.info("Initializing heatmap...");

  const heatmapContainer = document.getElementById("heatmap");
  if (!heatmapContainer) {
    log.error("Heatmap container not found");
    return;
  }

  heatmapContainer.innerHTML = "";

  modalView = new ModalView(assets, {
    formatPrice,
    formatPercent,
    formatVolume,
    formatRelativeTime,
    removeTicker,
  });
  modalView.init();

  heatmapView = new HeatmapView(null, assets, modalView, {
    openAddTickerModal,
  });
  heatmapView.buildHeatmap(heatmapContainer);

  app = new AppController(assets);
  app.setAssetsResolver((mode) => composeAssetsForMode(mode));
  app.init();

  modalView.setApp(app);
  heatmapView.setApp(app);

  app.setViews({ heatmapView, modalView });

  const controlHelpers = {
    debounce,
    showToast,
    toggleAnimation,
    simulateMarketCrash,
    simulateBullRun,
    resetMarket,
    exportToCSV,
    cycleTheme,
    closeModal: () => modalView.closeModal(),
  };

  controlPanelView = new ControlPanelView(app, assets, controlHelpers);
  controlPanelView.init();
  controlPanelView.updateStats();
  controlPanelView.setAssets(getRuntimeAssets());

  app.state.on("tile:updated", (payload = {}) => {
    controlPanelView.scheduleStatsUpdate();
    modalView.updateModalIfOpen();
    if (payload?.ticker && isCustomTicker(payload.ticker)) {
      syncCustomAssetFromTile(payload.ticker);
    }
  });

  app.state.on("tiles:batch_updated", () => {
    controlPanelView.scheduleStatsUpdate();
    modalView.updateModalIfOpen();
  });

  app.state.on("mode:changed", ({ mode }) => {
    syncAssetsSnapshot(mode);
  });

  log.info("Heatmap initialized successfully");
  showToast("Heatmap loaded");
}

function setupFiltersAndSearch() {
}

function applyFilters() {
  controlPanelView?.applyFilters();
}
function applySorting(sortType) {
  controlPanelView?.applySorting(sortType);
}

function scheduleStatsUpdate() {
  controlPanelView?.scheduleStatsUpdate();
}

function updateStats() {
  controlPanelView?.updateStats();
}

function setupSliders() {
}
function setupThemes() {
}
function setupButtons() {
}
function setupKeyboardShortcuts() {
}

function showAssetDetails(index) {
  modalView?.showAssetDetails(index);
}

function closeModal() {
  modalView?.closeModal();
}

function updateModalIfOpen() {
  modalView?.updateModalIfOpen();
}

function getRuntimeAssets() {
  return app?.assets || assets;
}

function toggleAnimation() {
  const mode = app.state.getMode();

  if (mode !== "simulation") {
    showToast("Animation controls only work in Simulation mode");
    return;
  }

  const isRunning = app.isSimulationRunning();

  if (isRunning) {
    app.pauseSimulation();
    showToast("⏸️ Animation paused");
  } else {
    app.resumeSimulation();
    showToast("▶️ Animation resumed");
  }
}

function simulateMarketCrash() {
  getRuntimeAssets().forEach((asset) => {
    const tile = app.state.getTile(asset.ticker);
    if (tile) {
      const basePrice = tile.basePrice || tile._placeholderBasePrice;
      tile.basePrice = basePrice;

      tile.change = -5 - Math.random() * 5;
      tile.price = basePrice * (1 + tile.change / 100);
      app.paintTile(asset.ticker);
    }
  });
  showToast("Market crash simulated");
  updateStats();
}

function simulateBullRun() {
  getRuntimeAssets().forEach((asset) => {
    const tile = app.state.getTile(asset.ticker);
    if (tile) {
      const basePrice = tile.basePrice || tile._placeholderBasePrice;
      tile.basePrice = basePrice;

      tile.change = 5 + Math.random() * 5;
      tile.price = basePrice * (1 + tile.change / 100);
      app.paintTile(asset.ticker);
    }
  });
  showToast("Bull run simulated");
  updateStats();
}

function resetMarket() {
  getRuntimeAssets().forEach((asset) => {
    const tile = app.state.getTile(asset.ticker);
    if (tile) {
      const basePrice = tile.basePrice || tile._placeholderBasePrice;
      tile.basePrice = basePrice;

      tile.change = 0;
      tile.price = basePrice;
      app.paintTile(asset.ticker);
    }
  });
  showToast("Market reset");
  updateStats();
}

function exportToCSV() {
  const headers = ["Ticker", "Name", "Sector", "Price", "Change %"];
  const rows = getRuntimeAssets().map((a) => {
    const tile = app.state.getTile(a.ticker);
    return [
      a.ticker,
      a.name,
      a.sector,
      tile?.price?.toFixed(2) || "0.00",
      tile?.change?.toFixed(2) || "0.00",
    ];
  });
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `heatmap-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Data exported successfully");
}

const THEMES = ["thermal", "matrix", "ocean", "sunset", "monochrome"];
const THEME_NAMES = {
  thermal: "Thermal",
  matrix: "Matrix",
  ocean: "Ocean",
  sunset: "Sunset",
  monochrome: "Monochrome",
};

let currentTheme = localStorage.getItem("heatmap-theme") || "thermal";

document.body.setAttribute("data-theme", currentTheme);
document.documentElement.setAttribute("data-theme", currentTheme);

function cycleTheme() {
  const currentIndex = THEMES.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  currentTheme = THEMES[nextIndex];

  document.body.setAttribute("data-theme", currentTheme);
  document.documentElement.setAttribute("data-theme", currentTheme);

  try {
    localStorage.setItem("heatmap-theme", currentTheme);
  } catch (e) {
    log.warn("Failed to save theme preference");
  }

  showToast(`Theme: ${THEME_NAMES[currentTheme]}`);
}

function showToast(message, duration = 6500) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeatmap);
} else {
  initHeatmap();
}

window.addEventListener("beforeunload", () => {
  if (app) {
    app.transport.stop();
  }
});

document.addEventListener("visibilitychange", () => {
  if (!app) return;

  if (document.hidden) {
  } else {
    updateStats();
  }
});
