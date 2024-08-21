/**
 * Main Entry Point
 * Initializes the application and maintains backward compatibility with existing UI code
 */

import { AppController } from "../services/AppController.js";
import { CONFIG, SIMULATION_ASSETS, REAL_DATA_ASSETS } from "../config.js";
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
// Asset Data
// ============================================================================

// Start with simulation assets as default
let assets = [...SIMULATION_ASSETS];

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

  // Pass view references to AppController for dynamic asset switching
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

  // Handle single tile updates (Real Data mode)
  app.state.on("tile:updated", () => {
    controlPanelView.scheduleStatsUpdate();
    modalView.updateModalIfOpen();
  });

  // Handle batch tile updates (Simulation mode - optimized)
  app.state.on("tiles:batch_updated", () => {
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
