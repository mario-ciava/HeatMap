/**
 * Main Entry Point
 * Initializes the application and maintains backward compatibility with existing UI code
 */

import { AppController } from "../services/AppController.js";
import { CONFIG } from "../config.js";
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

// Set log level from config
logger.setLevel(CONFIG.LOG_LEVEL);

// ============================================================================
// Asset Data (same as original)
// ============================================================================

const assets = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 182.52,
    basePrice: 182.52,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    price: 378.85,
    basePrice: 378.85,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "GOOGL",
    name: "Alphabet",
    price: 138.21,
    basePrice: 138.21,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "AMZN",
    name: "Amazon",
    price: 127.74,
    basePrice: 127.74,
    change: 0,
    sector: "Consumer",
  },
  {
    ticker: "TSLA",
    name: "Tesla",
    price: 256.24,
    basePrice: 256.24,
    change: 0,
    sector: "Automotive",
  },
  {
    ticker: "META",
    name: "Meta",
    price: 311.71,
    basePrice: 311.71,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "NVDA",
    name: "NVIDIA",
    price: 521.88,
    basePrice: 521.88,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "JPM",
    name: "JP Morgan",
    price: 147.35,
    basePrice: 147.35,
    change: 0,
    sector: "Financial",
  },
  {
    ticker: "V",
    name: "Visa",
    price: 247.12,
    basePrice: 247.12,
    change: 0,
    sector: "Financial",
  },
  {
    ticker: "JNJ",
    name: "Johnson & J",
    price: 158.19,
    basePrice: 158.19,
    change: 0,
    sector: "Healthcare",
  },
  {
    ticker: "WMT",
    name: "Walmart",
    price: 163.42,
    basePrice: 163.42,
    change: 0,
    sector: "Retail",
  },
  {
    ticker: "PG",
    name: "Procter & G",
    price: 152.38,
    basePrice: 152.38,
    change: 0,
    sector: "Consumer",
  },
  {
    ticker: "MA",
    name: "Mastercard",
    price: 401.22,
    basePrice: 401.22,
    change: 0,
    sector: "Financial",
  },
  {
    ticker: "UNH",
    name: "UnitedHealth",
    price: 521.13,
    basePrice: 521.13,
    change: 0,
    sector: "Healthcare",
  },
  {
    ticker: "DIS",
    name: "Disney",
    price: 91.8,
    basePrice: 91.8,
    change: 0,
    sector: "Entertainment",
  },
  {
    ticker: "NFLX",
    name: "Netflix",
    price: 481.73,
    basePrice: 481.73,
    change: 0,
    sector: "Entertainment",
  },
  {
    ticker: "ADBE",
    name: "Adobe",
    price: 589.27,
    basePrice: 589.27,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "CRM",
    name: "Salesforce",
    price: 221.49,
    basePrice: 221.49,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "PFE",
    name: "Pfizer",
    price: 28.92,
    basePrice: 28.92,
    change: 0,
    sector: "Healthcare",
  },
  {
    ticker: "TMO",
    name: "Thermo Fisher",
    price: 547.38,
    basePrice: 547.38,
    change: 0,
    sector: "Healthcare",
  },
  {
    ticker: "CSCO",
    name: "Cisco",
    price: 49.67,
    basePrice: 49.67,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "ORCL",
    name: "Oracle",
    price: 106.84,
    basePrice: 106.84,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "INTC",
    name: "Intel",
    price: 43.65,
    basePrice: 43.65,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "IBM",
    name: "IBM",
    price: 140.28,
    basePrice: 140.28,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "BAC",
    name: "Bank of America",
    price: 31.82,
    basePrice: 31.82,
    change: 0,
    sector: "Financial",
  },
  {
    ticker: "C",
    name: "Citigroup",
    price: 45.33,
    basePrice: 45.33,
    change: 0,
    sector: "Financial",
  },
  {
    ticker: "GS",
    name: "Goldman Sachs",
    price: 394.11,
    basePrice: 394.11,
    change: 0,
    sector: "Financial",
  },
  {
    ticker: "MS",
    name: "Morgan Stanley",
    price: 85.27,
    basePrice: 85.27,
    change: 0,
    sector: "Financial",
  },
  {
    ticker: "HD",
    name: "Home Depot",
    price: 328.4,
    basePrice: 328.4,
    change: 0,
    sector: "Retail",
  },
  {
    ticker: "LOW",
    name: "Lowe's",
    price: 205.55,
    basePrice: 205.55,
    change: 0,
    sector: "Retail",
  },
  {
    ticker: "KO",
    name: "Coca-Cola",
    price: 58.73,
    basePrice: 58.73,
    change: 0,
    sector: "Consumer",
  },
  {
    ticker: "PEP",
    name: "PepsiCo",
    price: 172.66,
    basePrice: 172.66,
    change: 0,
    sector: "Consumer",
  },
  {
    ticker: "NKE",
    name: "Nike",
    price: 97.42,
    basePrice: 97.42,
    change: 0,
    sector: "Consumer",
  },
  {
    ticker: "MCD",
    name: "McDonald's",
    price: 257.88,
    basePrice: 257.88,
    change: 0,
    sector: "Consumer",
  },
  {
    ticker: "SBUX",
    name: "Starbucks",
    price: 88.11,
    basePrice: 88.11,
    change: 0,
    sector: "Consumer",
  },
  {
    ticker: "COST",
    name: "Costco",
    price: 684.92,
    basePrice: 684.92,
    change: 0,
    sector: "Retail",
  },
  {
    ticker: "T",
    name: "AT&T",
    price: 16.24,
    basePrice: 16.24,
    change: 0,
    sector: "Telecom",
  },
  {
    ticker: "VZ",
    name: "Verizon",
    price: 39.77,
    basePrice: 39.77,
    change: 0,
    sector: "Telecom",
  },
  {
    ticker: "XOM",
    name: "Exxon Mobil",
    price: 115.6,
    basePrice: 115.6,
    change: 0,
    sector: "Energy",
  },
  {
    ticker: "CVX",
    name: "Chevron",
    price: 158.95,
    basePrice: 158.95,
    change: 0,
    sector: "Energy",
  },
  {
    ticker: "SHEL",
    name: "Shell plc",
    price: 66.12,
    basePrice: 66.12,
    change: 0,
    sector: "Energy",
  },
  {
    ticker: "AMD",
    name: "Advanced Micro Devices",
    price: 117.53,
    basePrice: 117.53,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "AVGO",
    name: "Broadcom",
    price: 1289.4,
    basePrice: 1289.4,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "QCOM",
    name: "Qualcomm",
    price: 134.22,
    basePrice: 134.22,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "TXN",
    name: "Texas Instruments",
    price: 168.37,
    basePrice: 168.37,
    change: 0,
    sector: "Technology",
  },
  {
    ticker: "BMY",
    name: "Bristol-Myers Squibb",
    price: 45.91,
    basePrice: 45.91,
    change: 0,
    sector: "Healthcare",
  },
  {
    ticker: "ABBV",
    name: "AbbVie",
    price: 165.74,
    basePrice: 165.74,
    change: 0,
    sector: "Healthcare",
  },
  {
    ticker: "MRK",
    name: "Merck & Co.",
    price: 122.18,
    basePrice: 122.18,
    change: 0,
    sector: "Healthcare",
  },
  {
    ticker: "BA",
    name: "Boeing",
    price: 196.44,
    basePrice: 196.44,
    change: 0,
    sector: "Industrial",
  },
  {
    ticker: "GE",
    name: "GE Aerospace",
    price: 164.3,
    basePrice: 164.3,
    change: 0,
    sector: "Industrial",
  },
];

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
    const query = addTickerInput?.value.trim();
    if (!query) {
      if (addTickerResults)
        addTickerResults.textContent =
          "Please type a query to search for symbols.";
      return;
    }
    if (addTickerResults) {
      addTickerResults.textContent = `Ready to search Finnhub for "${query}" (Symbol Lookup).`;
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && addTickerModal?.classList.contains("active")) {
    closeAddTickerModal();
  }
});

// ============================================================================
// Global App Instance
// ============================================================================

let app = null;
let controlPanelView = null;
let heatmapView = null;
let modalView = null;

// ============================================================================
// Initialization
// ============================================================================

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
  });
  modalView.init();

  heatmapView = new HeatmapView(null, assets, modalView, {
    openAddTickerModal,
  });
  heatmapView.buildHeatmap(heatmapContainer);

  app = new AppController(assets);
  app.init();

  modalView.setApp(app);
  heatmapView.setApp(app);

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

  app.state.on("tile:updated", () => {
    controlPanelView.scheduleStatsUpdate();
    modalView.updateModalIfOpen();
  });

  log.info("Heatmap initialized successfully");
  showToast("Heatmap loaded");
}

// ============================================================================
// UI Features (from original script)
// ============================================================================

function setupFiltersAndSearch() {
  // handled by ControlPanelView
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
  // handled by ControlPanelView
}
function setupThemes() {
  // handled by ControlPanelView
}
function setupButtons() {
  // handled by ControlPanelView
}
function setupKeyboardShortcuts() {
  // handled by ControlPanelView
}
// ============================================================================
// Modal Functions
// ============================================================================

function showAssetDetails(index) {
  modalView?.showAssetDetails(index);
}

function closeModal() {
  modalView?.closeModal();
}

function updateModalIfOpen() {
  modalView?.updateModalIfOpen();
}
// ============================================================================
// Control Functions
// ============================================================================

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
  assets.forEach((asset) => {
    const tile = app.state.getTile(asset.ticker);
    if (tile) {
      // Ensure we have a base price (use placeholder for simulation)
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
  assets.forEach((asset) => {
    const tile = app.state.getTile(asset.ticker);
    if (tile) {
      // Ensure we have a base price (use placeholder for simulation)
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
  assets.forEach((asset) => {
    const tile = app.state.getTile(asset.ticker);
    if (tile) {
      // Ensure we have a base price (use placeholder for simulation)
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
  const rows = assets.map((a) => {
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

// Theme cycling
const THEMES = ["thermal", "matrix", "ocean", "sunset", "monochrome"];
const THEME_NAMES = {
  thermal: "Thermal",
  matrix: "Matrix",
  ocean: "Ocean",
  sunset: "Sunset",
  monochrome: "Monochrome",
};

let currentTheme = localStorage.getItem("heatmap-theme") || "thermal";

// Apply saved theme on load
document.body.setAttribute("data-theme", currentTheme);

function cycleTheme() {
  const currentIndex = THEMES.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  currentTheme = THEMES[nextIndex];

  // Apply theme
  document.body.setAttribute("data-theme", currentTheme);

  // Save preference
  try {
    localStorage.setItem("heatmap-theme", currentTheme);
  } catch (e) {
    log.warn("Failed to save theme preference");
  }

  showToast(`Theme: ${THEME_NAMES[currentTheme]}`);
}

// ============================================================================
// Utility Functions
// ============================================================================

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

// ============================================================================
// Initialization on DOM Ready
// ============================================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeatmap);
} else {
  initHeatmap();
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (app) {
    app.transport.stop();
  }
});

// Pause when tab hidden
document.addEventListener("visibilitychange", () => {
  if (!app) return;

  if (document.hidden) {
    // Tab hidden - could pause updates here if needed
  } else {
    // Tab visible again
    updateStats();
  }
});
