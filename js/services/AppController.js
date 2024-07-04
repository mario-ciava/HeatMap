/**
 * AppController - Bridge between transport layer and UI
 * Manages application lifecycle and UI updates
 */

import { FinnhubTransport } from "../transport/FinnhubTransport.js";
import { StateManager } from "../core/StateManager.js";
import { CONFIG } from "../config.js";
import { logger } from "../utils/Logger.js";

const log = logger.child("App");

export class AppController {
  constructor(assets) {
    this.assets = assets;

    // Initialize state manager with assets
    this.state = new StateManager(assets);

    // Get API key from localStorage
    const savedApiKey = this._loadApiKey();

    // Initialize transport
    this.transport = new FinnhubTransport(savedApiKey, this.state);

    // UI state
    this.simulationInterval = null;
    this.tileCache = new Map(); // Cache of DOM elements
    this.priceHistory = new Map(); // Price history for sparklines

    // Fetching progress tracking
    this.fetchingTotal = 0;
    this.fetchingCompleted = 0;
    this.fetchingJustCompleted = false;

    // Wire up event handlers
    this._setupEventHandlers();
    this._setupDOMCache();

    log.info("AppController initialized");
  }

  /**
   * Initialize the application (call after DOM ready)
   */
  init() {
    log.info("Initializing application...");

    // Initialize status indicator
    this._updateStatusIndicator("live", "Live");

    // Display current API key if exists
    const currentKey = this.transport.getApiKey();
    if (currentKey) {
      this._updateApiKeyDisplay(currentKey);
    }

    // Start in simulation mode by default
    this.setMode("simulation");

    // Setup UI event listeners
    this._setupUIListeners();

    // Initial render
    this._renderAll();
  }

  /**
   * Set operating mode
   * @param {'simulation' | 'real'} mode
   */
  setMode(mode) {
    const oldMode = this.state.getMode();

    // Allow initial setup even if mode is the same
    const isInitialSetup =
      oldMode === mode && !this.simulationInterval && !this.transport.isRunning;

    if (oldMode === mode && !isInitialSetup) {
      log.debug(`Already in ${mode} mode`);
      return;
    }

    log.info(`Switching to ${mode} mode...`);

    // Update state
    this.state.setMode(mode);

    if (mode === "real") {
      // Stop simulation
      this._stopSimulation();

      // Reset tiles but preserve any previously fetched real data
      this.state.resetAllTiles(true);
      this._resetPriceHistoryForMode("real");

      // Initialize fetching progress counter
      this.fetchingTotal = this.assets.length;
      this.fetchingCompleted = 0;

      // Start transport
      const tickers = this.assets.map((a) => a.ticker);
      this.transport.start(tickers);

      // Update UI
      this._updateModeIndicators();
      this._renderAllDots();
      this.paintAll(); // Repaint tiles with preserved data or "---" placeholders
      this._updateFetchingProgress(); // Show initial fetching status

      // Show toast
      this._showToast("Real data mode activated");
    } else {
      // Stop transport
      this.transport.stop();

      // Reset tiles to simulation mode (saves real data for later)
      this._resetPriceHistoryForMode("simulation");
      this.state.resetAllTiles(false);

      // Start simulation
      this._startSimulation();

      // Update UI
      this._updateModeIndicators();
      this._renderAllDots();
      this.paintAll(); // Repaint tiles with placeholder values

      // Show toast
      this._showToast("Simulation mode activated");
    }
  }

  /**
   * Update a single tile's visual representation
   * @param {string} ticker
   */
  paintTile(ticker) {
    const tile = this.state.getTile(ticker);
    if (!tile) return;

    const index = this.assets.findIndex((a) => a.ticker === ticker);
    if (index === -1) return;

    const cached = this.tileCache.get(index);
    if (!cached) return;

    const mode = this.state.getMode();

    // Update price and change text
    if (tile.price != null) {
      cached.price.textContent = `$${tile.price.toFixed(2)}`;
    } else {
      // No data yet - show placeholder based on mode
      cached.price.textContent = mode === "real" ? "---" : "$0.00";
    }

    if (tile.change != null) {
      const changeText = `${tile.change > 0 ? "+" : ""}${tile.change.toFixed(2)}%`;
      cached.change.textContent = changeText;
    } else {
      // No data yet - show placeholder based on mode
      cached.change.textContent = mode === "real" ? "---" : "0.00%";
    }

    // Update tile classes based on change
    this._updateTileClasses(cached.element, tile.change);

    // Update dot state
    this._updateDotState(cached.element, ticker);

    // Update sparkline
    this._updateSparkline(cached.canvas, ticker);
  }

  /**
   * Paint all tiles
   */
  paintAll() {
    this.state.getAllTiles().forEach((tile, ticker) => {
      this.paintTile(ticker);
    });
  }

  /**
   * Setup event handlers for state and transport
   * @private
   */
  _setupEventHandlers() {
    // State events
    this.state.on("tile:updated", ({ ticker }) => {
      this.paintTile(ticker);

      // Track fetching progress in real mode
      const mode = this.state.getMode();
      if (mode === "real") {
        this._updateFetchingProgress();
      }

      // Update price history for sparkline
      const tile = this.state.getTile(ticker);
      if (tile && tile.price != null) {
        let history = this.priceHistory.get(ticker) || [];
        history.push(tile.price);

        // Keep only last N points
        if (history.length > CONFIG.UI.HISTORY_LENGTH) {
          history = history.slice(-CONFIG.UI.HISTORY_LENGTH);
        }

        this.priceHistory.set(ticker, history);
      }
    });

    this.state.on("tiles:reset", () => {
      this._renderAllDots();
    });

    this.state.on("market:status", () => {
      // Market status changed - update all dots
      this._renderAllDots();
    });

    // Transport events
    this.transport.on("started", ({ tickers }) => {
      // Initialize fetching progress counter
      this.fetchingTotal = tickers.length;
      this.fetchingCompleted = 0;
      this._updateFetchingProgress();
    });

    this.transport.on("ws:connected", () => {
      log.debug("WebSocket connected");
    });

    this.transport.on("ws:disconnected", () => {
      log.debug("WebSocket disconnected");
    });

    this.transport.on("quote", ({ ticker }) => {
      // Quote handled by state manager
      // Update progress if in real mode and still fetching
      const mode = this.state.getMode();
      if (mode === "real" && !this.fetchingJustCompleted) {
        this._updateFetchingProgress();
      }

      // Clear invalid API key state on successful data
      this._clearApiKeyInvalidState();
    });

    this.transport.on("rest:rate_limited", (data) => {
      const seconds = Math.ceil(data.backoffDelay / 1000);
      this._showToast(`Rate limited - cooling down for ${seconds}s`);
    });

    this.transport.on("error", (error) => {
      log.error("Transport error:", error);

      if (error.code === "NO_API_KEY") {
        this._showToast("API key required - check settings");
        this._markApiKeyAsInvalid();
      } else if (
        error.code === "AUTH_FAILED" ||
        error.code === "INVALID_API_KEY"
      ) {
        this._showToast("Invalid API key - check settings");
        this._markApiKeyAsInvalid();
      }
    });
  }

  /**
   * Setup DOM element cache
   * @private
   */
  _setupDOMCache() {
    const tiles = document.querySelectorAll(".asset-tile");

    tiles.forEach((tile, index) => {
      this.tileCache.set(index, {
        element: tile,
        price: tile.querySelector(".price"),
        change: tile.querySelector(".change"),
        canvas: tile.querySelector(".sparkline-canvas"),
      });
    });

    // Seed initial history for simulation placeholders
    this._resetPriceHistoryForMode("simulation");
  }

  /**
   * Reset price history buffer according to mode
   * @private
   * @param {'simulation' | 'real'} mode
   */
  _resetPriceHistoryForMode(mode) {
    this.priceHistory.clear();

    if (mode === "simulation") {
      this.assets.forEach((asset) => {
        this.priceHistory.set(asset.ticker, [asset.price]);
      });
    } else {
      this.assets.forEach((asset) => {
        this.priceHistory.set(asset.ticker, []);
      });
    }
  }

  /**
   * Setup UI event listeners
   * @private
   */
  _setupUIListeners() {
    // Mode toggle
    const modeToggle = document.getElementById("mode-toggle");
    if (modeToggle) {
      modeToggle.addEventListener("change", (e) => {
        this.setMode(e.target.checked ? "real" : "simulation");
      });
    }

    // API key save
    const saveBtn = document.getElementById("api-key-save");
    const input = document.getElementById("api-key-input");
    if (saveBtn && input) {
      saveBtn.addEventListener("click", () => {
        const key = input.value.trim();
        if (!key) {
          this._showToast("Invalid API key");
          return;
        }

        this._saveApiKey(key);
        this.transport.setApiKey(key);
        this._showToast("API key saved");

        // Clear input
        input.value = "";

        // Update masked display and clear invalid state
        this._updateApiKeyDisplay(key);
        this._clearApiKeyInvalidState();

        // If in real mode, restart transport to start fetching with new key
        if (this.state.getMode() === "real") {
          log.info("Restarting transport with new API key...");
          const tickers = this.assets.map((a) => a.ticker);
          this.transport.stop();

          // Small delay before restarting
          setTimeout(() => {
            this.transport.start(tickers);
            this._showToast("Data fetching restarted");
          }, 500);
        }
      });
    }

    // API key visibility toggle
    const visibilityBtn = document.getElementById("api-key-visibility");
    const copyBtn = document.getElementById("api-key-copy");
    const displayInput = document.getElementById("api-key-display");
    if (visibilityBtn && displayInput) {
      visibilityBtn.addEventListener("click", () => {
        const isVisible = displayInput.dataset.visibility === "visible";
        this._setApiKeyVisibility(!isVisible);
      });
    }

    if (copyBtn && displayInput) {
      copyBtn.addEventListener("click", async () => {
        const key = displayInput.dataset.actual || "";
        if (!key) {
          this._showToast("No API key to copy");
          return;
        }

        const copied = await this._copyApiKey(key);
        this._showToast(copied ? "API key copied" : "Unable to copy API key");
      });
    }
  }

  /**
   * Update tile classes based on change percentage
   * @private
   */
  _updateTileClasses(element, change) {
    const thresholds = CONFIG.UI.THRESHOLDS;
    const previousState = element.dataset.state || "neutral";

    // Remove all state classes
    element.classList.remove(
      "gaining",
      "gaining-strong",
      "losing",
      "losing-strong",
      "neutral",
    );

    // If no data yet (change is null), keep neutral
    let nextState = "neutral";

    // Add appropriate class based on change
    if (change == null) {
      nextState = "neutral";
    } else if (change > thresholds.STRONG_GAIN) {
      nextState = "gaining-strong";
    } else if (change > thresholds.MILD_GAIN) {
      nextState = "gaining";
    } else if (change < thresholds.STRONG_LOSS) {
      nextState = "losing-strong";
    } else if (change < thresholds.MILD_LOSS) {
      nextState = "losing";
    }

    element.classList.add(nextState);
    element.dataset.state = nextState;

    if (nextState !== previousState) {
      this._animateTileStateChange(element);
    }
  }

  /**
   * Add a subtle flare when a tile changes state to ensure consistent feedback
   * @private
   */
  _animateTileStateChange(element) {
    if (!element) return;

    if (element._stateChangeTimeout) {
      clearTimeout(element._stateChangeTimeout);
    }

    element.classList.remove("tile-state-change");
    // Force reflow so animation can retrigger
    void element.offsetWidth;
    element.classList.add("tile-state-change");

    element._stateChangeTimeout = setTimeout(() => {
      element.classList.remove("tile-state-change");
      element._stateChangeTimeout = null;
    }, 450);
  }

  /**
   * Update dot state for a tile
   * @private
   */
  _updateDotState(element, ticker) {
    const dot = element.querySelector(".status-dot");
    if (!dot) return;

    // Get deterministic dot state from transport
    const state = this.transport.computeDotState(ticker);

    // Remove all state classes
    dot.classList.remove("standby", "open", "closed", "pulsing");

    // Add state class
    dot.classList.add(state);

    // Add pulsing for open markets
    if (state === "open") {
      dot.classList.add("pulsing");
    }
  }

  /**
   * Render all dots
   * @private
   */
  _renderAllDots() {
    this.tileCache.forEach((cached, index) => {
      const asset = this.assets[index];
      if (asset) {
        this._updateDotState(cached.element, asset.ticker);
      }
    });
  }

  /**
   * Update sparkline canvas
   * @private
   */
  _updateSparkline(canvas, ticker) {
    const history = this.priceHistory.get(ticker) || [];
    if (history.length < 2) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth =
      canvas.clientWidth || canvas.offsetWidth || canvas.width;
    const logicalHeight =
      canvas.clientHeight || canvas.offsetHeight || canvas.height;
    const scaledWidth = Math.round(logicalWidth * dpr);
    const scaledHeight = Math.round(logicalHeight * dpr);

    if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;

    // Use the tile's change percentage for color, not local trend
    const tile = this.state.getTile(ticker);
    const change = tile && tile.change != null ? tile.change : 0;
    const isPositive = change >= 0;
    const strokeColor = isPositive ? "#1cc16b" : "#ef4444";

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = strokeColor;
    ctx.shadowColor = isPositive
      ? "rgba(28, 193, 107, 0.35)"
      : "rgba(239, 68, 68, 0.3)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.beginPath();

    history.forEach((price, i) => {
      const x = (i / (history.length - 1)) * logicalWidth;
      const y = logicalHeight - ((price - min) / range) * logicalHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Reset shadow for subsequent draws
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  }

  /**
   * Adjust simulation update frequency and restart loop if needed
   * @param {number} ms
   */
  setSimulationFrequency(ms) {
    const parsed = Number.parseInt(ms, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return;
    }

    const clamped = Math.max(100, parsed);
    CONFIG.UI.UPDATE_FREQUENCY = clamped;

    if (this.state.getMode() !== "simulation") {
      return;
    }

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    this._startSimulation();
    log.info(`Simulation update frequency set to ${clamped}ms`);
  }

  /**
   * Start simulation mode
   * @private
   */
  _startSimulation() {
    if (this.simulationInterval) return;

    log.info("Starting simulation...");

    this.simulationInterval = setInterval(() => {
      this._updateSimulation();
    }, CONFIG.UI.UPDATE_FREQUENCY);
  }

  /**
   * Stop simulation mode
   * @private
   */
  _stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      log.info("Simulation stopped");
    }
  }

  /**
   * Update simulation (random price movements)
   * @private
   */
  _updateSimulation() {
    this.assets.forEach((asset, index) => {
      const tile = this.state.getTile(asset.ticker);
      if (!tile) return;

      // Ensure we have base values for simulation (use placeholders)
      if (tile.basePrice == null) {
        tile.basePrice = tile._placeholderBasePrice;
      }
      if (tile.change == null) {
        tile.change = 0;
      }

      // Simulate realistic price movements
      const momentum = Math.sin(Date.now() / 10000 + index) * 0.3;
      const randomFactor = (Math.random() - 0.5) * 2;
      const volatility =
        (CONFIG.UI.VOLATILITY.BASE +
          Math.sin(Date.now() / 5000) * CONFIG.UI.VOLATILITY.AMPLITUDE) *
        CONFIG.UI.VOLATILITY.USER_MULTIPLIER;

      const changeAmount = (momentum + randomFactor) * volatility;
      tile.change += changeAmount;

      // Mean reversion
      tile.change *= 0.98;

      // Clamp
      tile.change = Math.max(-10, Math.min(10, tile.change));

      // Calculate price from base
      tile.price = tile.basePrice * (1 + tile.change / 100);

      if (tile.open == null) {
        tile.open = tile._placeholderPrice;
      }
      if (tile.previousClose == null) {
        tile.previousClose = tile._placeholderBasePrice;
      }

      tile.high =
        tile.high != null ? Math.max(tile.high, tile.price) : tile.price;
      tile.low = tile.low != null ? Math.min(tile.low, tile.price) : tile.price;
      tile.volume = (tile.volume || 0) + Math.abs(changeAmount) * 850;
      tile.volume = Math.min(tile.volume, 5000000);
      tile.lastTradeTs = Date.now();

      // Update price history
      let history = this.priceHistory.get(asset.ticker) || [];
      history.push(tile.price);
      if (history.length > CONFIG.UI.HISTORY_LENGTH) {
        history = history.slice(-CONFIG.UI.HISTORY_LENGTH);
      }
      this.priceHistory.set(asset.ticker, history);

      // Mark as having info in simulation
      tile.hasInfo = true;

      // Paint tile
      this.paintTile(asset.ticker);

      // Emit tile updated event for stats
      this.state.emit("tile:updated", { ticker: asset.ticker });
    });
  }

  /**
   * Render all tiles
   * @private
   */
  _renderAll() {
    this.paintAll();
  }

  /**
   * Update mode indicators in UI
   * @private
   */
  _updateModeIndicators() {
    const mode = this.state.getMode();
    const label = document.getElementById("mode-toggle-label");
    const toggle = document.getElementById("mode-toggle");
    const caption = document.getElementById("mode-toggle-caption");

    if (label) {
      label.textContent = mode === "real" ? "Real Data" : "Simulation";
    }

    if (caption) {
      caption.textContent =
        mode === "real" ? "Live market stream enabled" : "Simulation Active";
    }

    if (toggle) {
      toggle.checked = mode === "real";
    }

    document.body.classList.toggle("real-mode", mode === "real");
  }

  /**
   * Update status indicator (unified Live/Fetching display)
   * @private
   */
  _updateStatusIndicator(mode = "live", message = null) {
    const el = document.getElementById("status-indicator");
    if (!el) return;

    const dotEl = el.querySelector(".status-dot");
    const textEl = el.querySelector(".status-text");
    if (!dotEl || !textEl) return;

    el.classList.remove("fetching");

    switch (mode) {
      case "fetching":
        el.classList.add("fetching");
        textEl.textContent = message || "Fetching...";
        break;
      case "live":
        textEl.textContent = message || "Live";
        break;
    }
  }

  /**
   * Format relative time for last update
   * @private
   */
  _formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // If less than 1 minute, show time
    if (minutes < 1) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If same day, show time
    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If yesterday
    if (days === 1) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    // If 2-3 days ago
    if (days === 2) {
      return `2 days ago`;
    }

    if (days === 3) {
      return `3 days ago`;
    }

    // If older, show compact date
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  /**
   * Update fetching progress display
   * @private
   */
  _updateFetchingProgress() {
    const mode = this.state.getMode();
    if (mode !== "real") return;

    // Count tiles with COMPLETE data (price AND change)
    let tilesWithData = 0;
    this.state.getAllTiles().forEach((tile) => {
      if (tile.hasInfo && tile.price != null && tile.change != null) {
        tilesWithData++;
      }
    });

    this.fetchingCompleted = tilesWithData;

    if (this.fetchingCompleted >= this.fetchingTotal) {
      // All data fetched - show Live with timestamp
      const now = new Date();
      const timeStr = this._formatRelativeTime(now);
      this._updateStatusIndicator("live", `Live | Last Update: ${timeStr}`);

      // Mark fetching as complete
      this.fetchingJustCompleted = true;
    } else {
      // Still fetching - show progress with spinner
      this._updateStatusIndicator(
        "fetching",
        `Fetching (${this.fetchingCompleted}/${this.fetchingTotal})`,
      );
      this.fetchingJustCompleted = false;
    }
  }

  /**
   * Show toast notification
   * @private
   */
  _showToast(message, duration = 6500) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  }

  /**
   * Load API key from localStorage with fallback to config
   * @private
   */
  _loadApiKey() {
    try {
      // Try to load from localStorage first
      const savedKey = localStorage.getItem(CONFIG.API_KEY.STORAGE_KEY);

      if (savedKey && savedKey.trim()) {
        log.info("Loaded API key from localStorage");
        return savedKey;
      }

      // Fallback to default key from config
      if (CONFIG.API_KEY.DEFAULT) {
        log.info("Using default API key from config.js");
        return CONFIG.API_KEY.DEFAULT;
      }

      log.warn("No API key available (neither in storage nor in config)");
      return "";
    } catch (e) {
      log.warn(
        "Failed to load API key from localStorage, using config fallback",
      );
      return CONFIG.API_KEY.DEFAULT || "";
    }
  }

  /**
   * Save API key to localStorage
   * @private
   */
  _saveApiKey(key) {
    try {
      localStorage.setItem(CONFIG.API_KEY.STORAGE_KEY, key);
      log.info("API key saved to localStorage");
    } catch (e) {
      log.error("Failed to save API key to localStorage");
    }
  }

  /**
   * Update API key display (masked)
   * @private
   */
  _updateApiKeyDisplay(key) {
    const display = document.getElementById("api-key-display");
    if (!display) return;

    const actualKey = key || "";
    display.dataset.actual = actualKey;
    if (!display.dataset.visibility) {
      display.dataset.visibility = "masked";
    }

    const isVisible = display.dataset.visibility === "visible";
    display.value = isVisible ? actualKey : this._maskKey(actualKey);

    this._syncApiKeyControls(actualKey);
  }

  /**
   * Mask API key for display
   * @private
   */
  _maskKey(key) {
    if (!key) return "";
    if (key.length <= 10) return "•".repeat(Math.max(0, key.length));
    const visible = key.slice(-10);
    const hiddenCount = Math.max(0, key.length - visible.length);
    return "•".repeat(hiddenCount) + visible;
  }

  /**
   * Toggle API key visibility in UI
   * @private
   * @param {boolean} shouldShow
   */
  _setApiKeyVisibility(shouldShow) {
    const display = document.getElementById("api-key-display");
    if (!display) return;

    const key = display.dataset.actual || "";
    display.dataset.visibility = shouldShow ? "visible" : "masked";
    display.value = shouldShow ? key : this._maskKey(key);

    this._syncApiKeyControls(key);
  }

  /**
   * Enable/disable API key action buttons and sync labels
   * @private
   * @param {string} key
   */
  _syncApiKeyControls(key) {
    const hasKey = Boolean(key);
    const visibilityBtn = document.getElementById("api-key-visibility");
    const copyBtn = document.getElementById("api-key-copy");
    const display = document.getElementById("api-key-display");
    const isVisible = display?.dataset.visibility === "visible";

    if (visibilityBtn) {
      visibilityBtn.disabled = !hasKey;
      visibilityBtn.textContent = isVisible ? "Hide" : "Show";
      visibilityBtn.setAttribute("aria-pressed", isVisible ? "true" : "false");
    }

    if (copyBtn) {
      copyBtn.disabled = !hasKey;
    }
  }

  /**
   * Copy API key to clipboard
   * @private
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async _copyApiKey(key) {
    if (!key) return false;

    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(key);
        return true;
      }

      const textarea = document.createElement("textarea");
      textarea.value = key;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);

      const selection = document.getSelection();
      const selectedRange =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (selectedRange && selection) {
        selection.removeAllRanges();
        selection.addRange(selectedRange);
      }

      if (!success) {
        throw new Error("execCommand copy failed");
      }

      return true;
    } catch (err) {
      log.warn("Failed to copy API key", err);
      return false;
    }
  }

  /**
   * Mark API key display as invalid (visual feedback)
   * @private
   */
  _markApiKeyAsInvalid() {
    const displayInput = document.getElementById("api-key-display");
    if (displayInput) {
      displayInput.classList.add("invalid");
    }
  }

  /**
   * Clear invalid state from API key display
   * @private
   */
  _clearApiKeyInvalidState() {
    const displayInput = document.getElementById("api-key-display");
    if (displayInput) {
      displayInput.classList.remove("invalid");
    }
  }

  /**
   * Get transport status
   * @returns {Object}
   */
  getStatus() {
    return {
      mode: this.state.getMode(),
      transport: this.transport.getStatus(),
      tiles: this.state.getAllTiles().size,
    };
  }
}
