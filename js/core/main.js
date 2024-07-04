/**
 * Main Entry Point
 * Initializes the application and maintains backward compatibility with existing UI code
 */

import { AppController } from "../services/AppController.js";
import { CONFIG } from "../config.js";
import { logger } from "../utils/Logger.js";

const log = logger.child("Main");

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

const enhancedSelectWrappers = new Set();
let openCustomSelect = null;

function closeAllCustomSelects(except) {
  enhancedSelectWrappers.forEach((wrapper) => {
    if (wrapper !== except && wrapper.classList.contains("open")) {
      wrapper._close?.({ focusTrigger: false });
    }
  });
}

function enhanceDropdown(select) {
  if (!select || select.dataset.enhanced === "true") return;

  const parent = select.parentElement;
  if (!parent) return;

  const wrapper = document.createElement("div");
  wrapper.className = "custom-select";

  const dropdownId = `${select.id || `select-${Math.random().toString(36).slice(2)}`}-menu`;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", dropdownId);

  const dropdown = document.createElement("div");
  dropdown.className = "select-dropdown";
  dropdown.id = dropdownId;
  dropdown.setAttribute("role", "listbox");

  const optionButtons = [];

  const buildOptionButton = (option, index) => {
    const optionBtn = document.createElement("button");
    optionBtn.type = "button";
    optionBtn.className = "select-option";
    optionBtn.dataset.value = option.value;
    optionBtn.setAttribute("role", "option");
    optionBtn.textContent = option.textContent;
    optionBtn.tabIndex = -1;
    optionBtn.setAttribute("aria-selected", option.selected ? "true" : "false");

    optionBtn.addEventListener("click", () => {
      if (select.value !== option.value) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        updateSelection();
      }
      closeDropdown();
    });

    optionBtn.addEventListener("keydown", (event) => {
      const currentIndex = optionButtons.indexOf(optionBtn);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % optionButtons.length;
        optionButtons[nextIndex].focus();
        scrollOptionIntoView(optionButtons[nextIndex]);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const prevIndex =
          (currentIndex - 1 + optionButtons.length) % optionButtons.length;
        optionButtons[prevIndex].focus();
        scrollOptionIntoView(optionButtons[prevIndex]);
      } else if (event.key === "Home") {
        event.preventDefault();
        optionButtons[0].focus();
        scrollOptionIntoView(optionButtons[0]);
      } else if (event.key === "End") {
        event.preventDefault();
        const last = optionButtons[optionButtons.length - 1];
        last.focus();
        scrollOptionIntoView(last);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        optionBtn.click();
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeDropdown();
      } else if (event.key === "Tab") {
        closeDropdown({ focusTrigger: false });
      }
    });

    dropdown.appendChild(optionBtn);
    optionButtons.push(optionBtn);
  };

  Array.from(select.options).forEach(buildOptionButton);

  parent.insertBefore(wrapper, select);
  wrapper.appendChild(trigger);
  wrapper.appendChild(dropdown);
  wrapper.appendChild(select);

  select.classList.add("select-native");
  select.dataset.enhanced = "true";
  select.setAttribute("aria-hidden", "true");

  const updateSelection = () => {
    const selectedOption = select.options[select.selectedIndex];
    trigger.textContent = selectedOption
      ? selectedOption.textContent
      : "Select";

    optionButtons.forEach((button) => {
      const isSelected = button.dataset.value === select.value;
      button.classList.toggle("selected", isSelected);
      button.setAttribute("aria-selected", isSelected ? "true" : "false");
    });
  };

  const scrollOptionIntoView = (button) => {
    const buttonTop = button.offsetTop;
    const buttonHeight = button.offsetHeight;
    const viewTop = dropdown.scrollTop;
    const viewBottom = viewTop + dropdown.clientHeight;

    if (buttonTop < viewTop) {
      dropdown.scrollTop = buttonTop;
    } else if (buttonTop + buttonHeight > viewBottom) {
      dropdown.scrollTop = buttonTop - dropdown.clientHeight + buttonHeight;
    }
  };

  const closeDropdown = ({ focusTrigger = true } = {}) => {
    if (!wrapper.classList.contains("open")) return;
    wrapper.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
    optionButtons.forEach((button) => (button.tabIndex = -1));
    if (focusTrigger) {
      trigger.focus({ preventScroll: true });
    }
    if (openCustomSelect === wrapper) {
      openCustomSelect = null;
    }
  };

  const openDropdown = () => {
    if (wrapper.classList.contains("open")) return;
    closeAllCustomSelects(wrapper);
    wrapper.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
    optionButtons.forEach((button) => (button.tabIndex = 0));
    const selectedBtn =
      optionButtons.find((btn) => btn.dataset.value === select.value) ||
      optionButtons[0];
    if (selectedBtn) {
      selectedBtn.focus();
      scrollOptionIntoView(selectedBtn);
    }
    openCustomSelect = wrapper;
  };

  wrapper._close = closeDropdown;

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    if (wrapper.classList.contains("open")) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  trigger.addEventListener("keydown", (event) => {
    if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      openDropdown();
    }
  });

  wrapper.addEventListener("focusout", (event) => {
    if (!wrapper.contains(event.relatedTarget)) {
      closeDropdown({ focusTrigger: false });
    }
  });

  select.addEventListener("change", updateSelection);
  select.addEventListener("focus", () => {
    trigger.focus({ preventScroll: true });
    openDropdown();
  });

  const associatedLabel = parent.querySelector(`label[for="${select.id}"]`);
  if (associatedLabel) {
    associatedLabel.addEventListener("click", (event) => {
      event.preventDefault();
      trigger.focus({ preventScroll: true });
      openDropdown();
    });
  }

  updateSelection();
  enhancedSelectWrappers.add(wrapper);
}

document.addEventListener("pointerdown", (event) => {
  if (openCustomSelect && !openCustomSelect.contains(event.target)) {
    openCustomSelect._close?.({ focusTrigger: false });
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && openCustomSelect) {
    openCustomSelect._close?.();
  }
});

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
  closeAllCustomSelects();
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

  // Clear existing content
  heatmapContainer.innerHTML = "";

  // Create tiles
  assets.forEach((asset, index) => {
    const tile = document.createElement("div");
    tile.className = "asset-tile neutral tile-enter";
    tile.dataset.index = index;
    tile.dataset.state = "neutral";
    tile.style.animationDelay = `${index * 0.03}s`;

    const canvas = document.createElement("canvas");
    canvas.className = "sparkline-canvas";
    canvas.width = 120;
    canvas.height = 25;

    tile.innerHTML = `
      <div class="ticker">${asset.ticker}</div>
      <div class="price">$${asset.price.toFixed(2)}</div>
      <div class="change">${asset.change.toFixed(2)}%</div>
      <span class="status-dot standby" aria-hidden="true"></span>
    `;

    tile.insertBefore(canvas, tile.firstChild);

    tile.addEventListener("animationend", (event) => {
      if (event.animationName === "tileEntry") {
        tile.classList.remove("tile-enter");
      }
    });

    // Add click handler for modal
    tile.addEventListener("click", () => showAssetDetails(index));

    heatmapContainer.appendChild(tile);
  });

  // Create add tile button
  const addTile = document.createElement("div");
  addTile.className = "asset-tile add-tile tile-enter";
  addTile.style.animationDelay = `${assets.length * 0.03}s`;
  addTile.innerHTML = `
    <div class="add-tile-icon">+</div>
    <div class="add-tile-text">
      <span class="add-tile-title">Add</span>
      <span class="add-tile-subtitle">ticker</span>
    </div>
  `;
  addTile.addEventListener("click", () => {
    openAddTickerModal();
  });
  addTile.addEventListener("animationend", (event) => {
    if (event.animationName === "tileEntry") {
      addTile.classList.remove("tile-enter");
    }
  });
  heatmapContainer.appendChild(addTile);

  // Initialize app controller
  app = new AppController(assets);
  app.init();

  // Listen for tile updates to refresh statistics
  app.state.on("tile:updated", () => {
    updateStats();
  });

  // Setup remaining UI features
  setupFiltersAndSearch();
  setupSliders();
  setupThemes();
  setupKeyboardShortcuts();
  setupButtons();

  // Initial stats update
  updateStats();

  log.info("Heatmap initialized successfully");
  showToast("Heatmap loaded");
}

// ============================================================================
// UI Features (from original script)
// ============================================================================

function setupFiltersAndSearch() {
  const search = document.getElementById("asset-search");
  const filterSelect = document.getElementById("filter-select");
  const sortSelect = document.getElementById("sort-select");

  enhanceDropdown(filterSelect);
  enhanceDropdown(sortSelect);

  if (search) {
    search.addEventListener("input", debounce(applyFilters, 300));
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", applyFilters);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", applyFilters);
  }
}

function applyFilters() {
  const searchTerm =
    document.getElementById("asset-search")?.value.toLowerCase() || "";
  const filter = document.getElementById("filter-select")?.value || "all";
  const sort = document.getElementById("sort-select")?.value || "default";

  const tiles = Array.from(
    document.querySelectorAll(".asset-tile:not(.add-tile)"),
  );

  tiles.forEach((tile) => {
    const index = parseInt(tile.dataset.index);
    if (isNaN(index)) return; // Skip tiles without valid index

    const asset = assets[index];
    if (!asset) return; // Skip if asset not found

    const tileState = app.state.getTile(asset.ticker);

    let show = true;

    // Search filter
    if (searchTerm) {
      show =
        asset.ticker.toLowerCase().includes(searchTerm) ||
        asset.name.toLowerCase().includes(searchTerm) ||
        asset.sector.toLowerCase().includes(searchTerm);
    }

    // Category filter
    if (show) {
      const change = tileState?.change || 0;
      switch (filter) {
        case "gaining":
          show = change > CONFIG.UI.THRESHOLDS.MILD_GAIN;
          break;
        case "losing":
          show = change < CONFIG.UI.THRESHOLDS.MILD_LOSS;
          break;
        case "neutral":
          show =
            change >= CONFIG.UI.THRESHOLDS.MILD_LOSS &&
            change <= CONFIG.UI.THRESHOLDS.MILD_GAIN;
          break;
      }
    }

    tile.classList.toggle("hidden", !show);
  });

  // Apply sorting
  applySorting(sort);

  // Update stats
  updateStats();
}

function applySorting(sortType) {
  const container = document.getElementById("heatmap");
  const allTiles = Array.from(container.children);

  // Separate add-tile from regular tiles
  const addTile = allTiles.find((t) => t.classList.contains("add-tile"));
  const tiles = allTiles.filter((t) => !t.classList.contains("add-tile"));

  tiles.sort((a, b) => {
    const indexA = parseInt(a.dataset.index);
    const indexB = parseInt(b.dataset.index);

    // Handle invalid indices
    if (isNaN(indexA) || isNaN(indexB)) return 0;

    const assetA = assets[indexA];
    const assetB = assets[indexB];

    // Handle missing assets
    if (!assetA || !assetB) return 0;

    const tileA = app.state.getTile(assetA.ticker);
    const tileB = app.state.getTile(assetB.ticker);

    switch (sortType) {
      case "change-desc":
        return (tileB?.change || 0) - (tileA?.change || 0);
      case "change-asc":
        return (tileA?.change || 0) - (tileB?.change || 0);
      case "price-desc":
        return (tileB?.price || 0) - (tileA?.price || 0);
      case "price-asc":
        return (tileA?.price || 0) - (tileB?.price || 0);
      case "ticker":
        return assetA.ticker.localeCompare(assetB.ticker);
      default:
        return indexA - indexB;
    }
  });

  // Re-append tiles in sorted order
  tiles.forEach((tile) => container.appendChild(tile));

  // Always append add-tile at the end
  if (addTile) {
    container.appendChild(addTile);
  }
}

function updateStats() {
  const tiles = document.querySelectorAll(
    ".asset-tile:not(.hidden):not(.add-tile)",
  );
  let gaining = 0;
  let losing = 0;
  let totalChange = 0;
  const changes = [];

  tiles.forEach((tile) => {
    const index = parseInt(tile.dataset.index);
    if (isNaN(index)) return; // Skip tiles without valid index

    const asset = assets[index];
    if (!asset) return; // Skip if asset not found

    const tileState = app.state.getTile(asset.ticker);
    const change = tileState?.change || 0;

    if (change > CONFIG.UI.THRESHOLDS.MILD_GAIN) gaining++;
    else if (change < CONFIG.UI.THRESHOLDS.MILD_LOSS) losing++;

    totalChange += change;
    changes.push(Math.abs(change));
  });

  const count = tiles.length || 1;

  document.getElementById("gaining").textContent = gaining;
  document.getElementById("losing").textContent = losing;
  document.getElementById("totalAssets").textContent = count;

  const marketTemp = (((gaining - losing) / count) * 50).toFixed(1);
  const tempEl = document.getElementById("marketTemp");
  tempEl.textContent = `${marketTemp}°C`;
  tempEl.className = `stat-value ${marketTemp > 10 ? "positive" : marketTemp < -10 ? "negative" : "neutral"}`;

  // Volatility: average of absolute changes (represents actual market movement)
  const volatility = (
    changes.reduce((sum, val) => sum + val, 0) / count
  ).toFixed(2);
  document.getElementById("volatility").textContent = `${volatility}%`;

  // Average Change: net average (can be positive or negative)
  const avgChange = (totalChange / count).toFixed(2);
  const avgEl = document.getElementById("avgChange");
  avgEl.textContent = `${avgChange > 0 ? "+" : ""}${avgChange}%`;
  avgEl.className = `stat-value ${avgChange > 0 ? "positive" : avgChange < 0 ? "negative" : "neutral"}`;
}

function setupSliders() {
  // Volatility slider (simulation mode only)
  const volatilitySlider = document.getElementById("volatility-slider");
  const volatilityValue = document.getElementById("volatility-value");

  if (volatilitySlider && volatilityValue) {
    const updateVolatilitySlider = (slider) => {
      const value = parseFloat(slider.value);
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      const progress = ((value - min) / (max - min)) * 100;
      slider.style.setProperty("--slider-progress", `${progress}%`);
    };

    // Initialize on load
    updateVolatilitySlider(volatilitySlider);

    volatilitySlider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      CONFIG.UI.VOLATILITY.USER_MULTIPLIER = value;
      volatilityValue.textContent = `${value.toFixed(2)}x`;

      updateVolatilitySlider(e.target);

      showToast(`Volatility: ${value.toFixed(2)}x`);
    });
  }

  // Speed slider (simulation mode only)
  const speedSlider = document.getElementById("speed-slider");
  const speedValue = document.getElementById("speed-value");

  if (speedSlider && speedValue) {
    const updateSpeedSlider = (slider) => {
      const value = parseInt(slider.value);
      const min = parseInt(slider.min);
      const max = parseInt(slider.max);
      const progress = ((value - min) / (max - min)) * 100;
      slider.style.setProperty("--slider-progress", `${progress}%`);
    };

    // Initialize on load
    updateSpeedSlider(speedSlider);

    speedSlider.addEventListener("input", (e) => {
      const value = parseInt(e.target.value);
      if (app && typeof app.setSimulationFrequency === "function") {
        app.setSimulationFrequency(value);
      } else {
        CONFIG.UI.UPDATE_FREQUENCY = value;
      }
      speedValue.textContent = `${value}ms`;

      updateSpeedSlider(e.target);

      showToast(`Update delay: ${value}ms`);
    });
  }
}

function setupThemes() {
  const themeBtn = document.getElementById("theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", cycleTheme);
  }
}

function setupButtons() {
  const btnToggle = document.getElementById("btn-toggle-animation");
  const btnCrash = document.getElementById("btn-market-crash");
  const btnBull = document.getElementById("btn-bull-run");
  const btnReset = document.getElementById("btn-reset");
  const btnExport = document.getElementById("btn-export");
  const btnModalClose = document.getElementById("modal-close-btn");

  if (btnToggle) btnToggle.addEventListener("click", toggleAnimation);
  if (btnCrash) btnCrash.addEventListener("click", simulateMarketCrash);
  if (btnBull) btnBull.addEventListener("click", simulateBullRun);
  if (btnReset) btnReset.addEventListener("click", resetMarket);
  if (btnExport) btnExport.addEventListener("click", exportToCSV);
  if (btnModalClose) btnModalClose.addEventListener("click", closeModal);
}

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    const modal = document.getElementById("modal");
    if (modal && modal.classList.contains("active")) return;

    switch (e.key.toLowerCase()) {
      case " ":
        e.preventDefault();
        toggleAnimation();
        break;
      case "c":
        simulateMarketCrash();
        break;
      case "b":
        simulateBullRun();
        break;
      case "r":
        resetMarket();
        break;
      case "e":
        exportToCSV();
        break;
      case "t":
        cycleTheme();
        break;
      case "escape":
        closeModal();
        break;
    }
  });
}

// ============================================================================
// Modal Functions
// ============================================================================

function showAssetDetails(index) {
  const asset = assets[index];
  const tileState = app.state.getTile(asset.ticker);
  const history = app.priceHistory.get(asset.ticker) || [];
  const mode = app.state.getMode();

  document.getElementById("modal-ticker").textContent = asset.ticker;
  document.getElementById("modal-name").textContent = asset.name;

  const currentPrice =
    tileState?.price ?? (mode === "simulation" ? asset.price : null);
  const currentChange =
    tileState?.change ?? (mode === "simulation" ? asset.change : null);

  const detailRows = [];
  const addRow = (label, value, options = {}) => {
    const safeValue = value ?? "---";
    const styleAttr = options.color ? ` style="color: ${options.color}"` : "";
    detailRows.push(`
      <div class="detail-row">
        <span class="detail-label">${label}</span>
        <span class="detail-value"${styleAttr}>${safeValue}</span>
      </div>
    `);
  };

  addRow("Current Price", formatPrice(currentPrice));

  const changeColor =
    currentChange > 0 ? "#10b981" : currentChange < 0 ? "#ef4444" : null;
  const changeDisplay =
    currentChange != null ? formatPercent(currentChange) : "---";
  addRow(
    "Change",
    changeDisplay,
    changeColor ? { color: changeColor } : undefined,
  );

  if (mode === "simulation") {
    const firstPrice = history.length ? history[0] : asset.basePrice;
    let sessionChange = null;
    if (currentPrice != null && firstPrice != null && firstPrice !== 0) {
      sessionChange = ((currentPrice - firstPrice) / firstPrice) * 100;
    }
    const sessionColor =
      sessionChange > 0 ? "#10b981" : sessionChange < 0 ? "#ef4444" : null;
    addRow(
      "Session Total",
      formatPercent(sessionChange),
      sessionColor ? { color: sessionColor } : undefined,
    );
  }

  addRow("Sector", asset.sector);

  const chartHistory = history.length
    ? [...history]
    : currentPrice != null
      ? [currentPrice]
      : [];

  const openValue =
    mode === "real"
      ? tileState?.open
      : (chartHistory[0] ?? tileState?._placeholderPrice ?? asset.price);

  const previousCloseValue =
    mode === "real"
      ? (tileState?.previousClose ?? tileState?.basePrice)
      : (tileState?.previousClose ??
        tileState?._placeholderBasePrice ??
        asset.basePrice);

  const highValue =
    mode === "real"
      ? tileState?.high
      : chartHistory.length
        ? Math.max(...chartHistory)
        : openValue;

  const lowValue =
    mode === "real"
      ? tileState?.low
      : chartHistory.length
        ? Math.min(...chartHistory)
        : openValue;

  const volumeValue = tileState?.volume;
  const lastTradeLabel =
    mode === "real"
      ? formatRelativeTime(tileState?.lastTradeTs)
      : "Simulated feed";

  addRow("Open", formatPrice(openValue));
  addRow("Previous Close", formatPrice(previousCloseValue));
  addRow("Day High", formatPrice(highValue));
  addRow("Day Low", formatPrice(lowValue));
  addRow("Volume", formatVolume(volumeValue));
  addRow("Last Trade", lastTradeLabel);

  document.getElementById("modal-details").innerHTML = detailRows.join("");

  const chartRange = document.getElementById("chart-time-range");
  if (chartRange) {
    chartRange.textContent =
      mode === "real" ? "Live Stream" : "Simulation Session";
  }

  const modal = document.getElementById("modal");
  modal.classList.add("active");
  document.documentElement.style.overflow = "hidden";

  resetChartOverlays();
  setTimeout(() => drawModalChart(chartHistory), 150);
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove("active");
  document.documentElement.style.overflow = "";
  resetChartOverlays();
}

function drawModalChart(history) {
  const canvas = document.getElementById("modal-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const series = Array.isArray(history) ? history.slice() : [];
  if (series.length === 1) {
    series.push(series[0]);
  }

  const yAxisContainer = document.getElementById("chart-y-axis");

  if (series.length < 2) {
    if (yAxisContainer) {
      yAxisContainer.innerHTML = "";
    }
    canvas.__chartData = null;
    resetChartOverlays();
    return;
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const trend = series[series.length - 1] - series[0];

  if (yAxisContainer) {
    yAxisContainer.innerHTML = `
      <div>${formatPrice(max)}</div>
      <div>${formatPrice((max + min) / 2)}</div>
      <div>${formatPrice(min)}</div>
    `;
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const points = series.map((price, index) => {
    const x = (index / (series.length - 1)) * width;
    const y = height - ((price - min) / range) * height * 0.82 - height * 0.09;
    return { x, y, value: price };
  });

  const lineColor = trend >= 0 ? "#10b981" : "#ef4444";

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  if (trend >= 0) {
    gradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
    gradient.addColorStop(1, "rgba(16, 185, 129, 0.02)");
  } else {
    gradient.addColorStop(0, "rgba(239, 68, 68, 0.2)");
    gradient.addColorStop(1, "rgba(239, 68, 68, 0.02)");
  }

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(points[0].x, height);
  points.forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.lineTo(points[points.length - 1].x, height);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor =
    trend >= 0 ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;

  canvas.__chartData = { points, width, height, color: lineColor };
  attachModalChartInteractions(canvas);
}

function resetChartOverlays() {
  const tooltip = document.getElementById("chart-tooltip");
  const cursor = document.getElementById("chart-cursor");
  const pointer = document.getElementById("chart-pointer");

  if (tooltip) {
    tooltip.classList.remove("visible");
    tooltip.style.left = "-9999px";
    tooltip.style.top = "-9999px";
  }

  if (cursor) {
    cursor.classList.remove("visible");
  }

  if (pointer) {
    pointer.classList.remove("visible");
    pointer.style.left = "-9999px";
    pointer.style.top = "-9999px";
  }
}

function attachModalChartInteractions(canvas) {
  if (canvas.__chartInteractionsAttached) return;

  const tooltip = document.getElementById("chart-tooltip");
  const cursor = document.getElementById("chart-cursor");
  const pointer = document.getElementById("chart-pointer");
  if (!tooltip || !cursor || !pointer) return;

  const wrapper = canvas.parentElement;

  const handleMove = (event) => {
    const data = canvas.__chartData;
    if (!data || !data.points || data.points.length === 0) {
      resetChartOverlays();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(rect.width, relativeX));
    const index = Math.round(
      (clampedX / rect.width) * (data.points.length - 1),
    );
    const point = data.points[index];

    if (!point) {
      resetChartOverlays();
      return;
    }

    const offsetLeft = canvas.offsetLeft;
    const offsetTop = canvas.offsetTop;
    const wrapperWidth = wrapper.offsetWidth;
    const pointerSize = pointer.offsetWidth || 12;
    const accentColor = data.color || "#3b82f6";

    cursor.style.left = `${offsetLeft + point.x}px`;
    cursor.classList.add("visible");

    pointer.style.left = `${offsetLeft + point.x - pointerSize / 2}px`;
    pointer.style.top = `${offsetTop + point.y - pointerSize / 2}px`;
    pointer.style.background = accentColor;
    pointer.style.boxShadow = `0 0 12px ${accentColor}55`;
    pointer.classList.add("visible");

    tooltip.textContent = formatPrice(point.value);
    tooltip.style.borderColor = `${accentColor}66`;
    let tooltipLeft = offsetLeft + point.x + 12;
    const tooltipWidth = tooltip.offsetWidth || 96;
    if (tooltipLeft + tooltipWidth > wrapperWidth) {
      tooltipLeft = offsetLeft + point.x - tooltipWidth - 12;
    }
    tooltip.style.left = `${tooltipLeft}px`;
    tooltip.style.top = `${Math.max(8, offsetTop + point.y - 32)}px`;
    tooltip.classList.add("visible");
  };

  const handleLeave = () => {
    resetChartOverlays();
  };

  canvas.addEventListener("mousemove", handleMove);
  canvas.addEventListener("mouseleave", handleLeave);
  canvas.__chartInteractionsAttached = true;
}

// ============================================================================
// Control Functions
// ============================================================================

function toggleAnimation() {
  showToast("Use mode toggle to switch between simulation and real data");
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
