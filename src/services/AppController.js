import { FinnhubTransport } from "../transport/FinnhubTransport.js";
import { StateManager } from "../core/StateManager.js";
import { CONFIG, SIMULATION_ASSETS, REAL_DATA_ASSETS, shouldUseProxy, isLocalDevelopment } from "../config.js";
import { logger } from "../utils/Logger.js";
import { perfStart, perfEnd } from "../utils/perfHelpers.js";
import { TileRegistry } from "../registry/TileRegistry.js";
import { TileController } from "../controllers/TileController.js";
import { SimulationController } from "../controllers/SimulationController.js";

const log = logger.child("App");

export class AppController {
  constructor(assets) {
    this.assets = assets;
    this.heatmapView = null;
    this.modalView = null;
    this.tileRegistry = new TileRegistry(this.assets);

    this.state = new StateManager(assets);

    const savedApiKey = this._loadApiKey();

    this.transport = new FinnhubTransport(savedApiKey, this.state);

    this.fetchingTotal = 0;
    this.fetchingCompleted = 0;
    this.fetchingJustCompleted = false;

    this.rateLimitInterval = null;

    this._setupEventHandlers();
    this.tileRegistry.initializeDOMCache();

    this.tileController = new TileController({
      state: this.state,
      transport: this.transport,
      registry: this.tileRegistry,
      historyLength: CONFIG.UI.HISTORY_LENGTH,
    });
    this.tileController.resetPriceHistory("simulation");

    this.simulation = new SimulationController({
      state: this.state,
      transport: this.transport,
      tileController: this.tileController,
      assets: this.assets,
    });

    this.assetsResolver = null;
    this.cachedRealTiles = new Map();

    log.info("AppController initialized");
  }

  setViews(views) {
    if (views.heatmapView) this.heatmapView = views.heatmapView;
    if (views.modalView) this.modalView = views.modalView;
  }

  switchAssets(newAssets, mode) {
    log.info(`Switching to ${newAssets.length} assets for ${mode} mode`);

    this.assets = newAssets;

    this.state.reinitializeTiles(newAssets);

    this.tileRegistry.setAssets(newAssets);
    this._syncRendererWithRegistry();

    if (this.modalView) {
      this.modalView.updateAssets(newAssets);
    }

    if (this.heatmapView) {
      this.heatmapView.updateAssets(newAssets);

      setTimeout(() => {
        this.tileRegistry.initializeDOMCache();
        this.tileController.resetPriceHistory(mode);
        this._syncRendererWithRegistry();

        this.paintAll();
      }, 50);
    }

    this.simulation.assets = newAssets;
  }

  init() {
    log.info("Initializing application...");

    this._updateStatusIndicator("live", "Live");

    const currentKey = this.transport.getApiKey();
    if (currentKey) {
      this._updateApiKeyDisplay(currentKey);
    }

    this.setMode("simulation");

    this._setupUIListeners();

    this._renderAll();
  }

  setMode(mode) {
    const oldMode = this.state.getMode();

    const isInitialSetup =
      oldMode === mode && !this.simulation.isRunning() && !this.transport.isRunning;

    if (oldMode === mode && !isInitialSetup) {
      log.debug(`Already in ${mode} mode`);
      return;
    }

    log.info(`Switching to ${mode} mode...`);

    const isSwitchingAssets = oldMode !== mode;

    if (oldMode === "real" && mode !== "real") {
      this._snapshotRealTiles();
    }

    if (isSwitchingAssets) {
      const newAssets = this._resolveAssetsForMode(mode);
      this.switchAssets(newAssets, mode);

      if (mode === "real") {
        this._restoreCachedRealTiles();
      }
    }

    this.state.setMode(mode);

    if (mode === "real") {
      this.simulation.stop();

      if (!isSwitchingAssets) {
        this.state.resetAllTiles(true);
        this.tileController.resetPriceHistory("real");
      }

      this.fetchingTotal = this.assets.length;
      this.fetchingCompleted = this._countTilesWithData();
      this.fetchingJustCompleted =
        this.fetchingCompleted >= this.fetchingTotal && this.fetchingTotal > 0;

      const tickers = this.assets.map((a) => a.ticker);
      this.simulation.stopTransport();
      this.simulation.startTransport(tickers);

      this._updateModeIndicators();
      this._renderAllDots();
      this.paintAll();
      this._updateFetchingProgress();

      this._showToast("Real data mode activated");
    } else {
      this.simulation.stopTransport();

      if (!isSwitchingAssets) {
        this.state.resetAllTiles(false);
        this.tileController.resetPriceHistory("simulation");
      }

      this.fetchingTotal = 0;
      this.fetchingCompleted = 0;
      this.fetchingJustCompleted = false;

      this.simulation.start();

      this._updateModeIndicators();
      this._renderAllDots();
      this.paintAll();
      this._updateStatusIndicator("live", "Live");

      this._showToast("Simulation mode activated");
    }
  }

  paintTile(ticker, indexHint = undefined) {
    this.tileController.renderImmediate(ticker, indexHint);
  }

  paintAll() {
    this.tileController.renderAll();
  }

  get priceHistory() {
    return this.tileRegistry.priceHistory;
  }

  _setupEventHandlers() {
    this.state.on("tile:updated", (payload = {}) => {
      const { ticker } = payload;
      if (!ticker) return;
      const perfId = perfStart("state:tileUpdated");

      try {
        this.tileController.handleTileUpdated(payload);

        const mode = this.state.getMode();
        if (mode === "real") {
          this._updateFetchingProgress();
        }
      } finally {
        perfEnd(perfId);
      }
    });

    this.state.on("tiles:batch_updated", (payload = {}) => {
      const perfId = perfStart("state:batchUpdated");

      try {
        this.tileController.handleTilesBatchUpdated(payload);
      } finally {
        perfEnd(perfId);
      }
    });

    this.state.on("tiles:reset", () => {
      this._renderAllDots();
    });

    this.state.on("market:status", () => {
      this._renderAllDots();
    });

    this.state.on("state:restored", () => {
      this.paintAll();
    });

    this.transport.on("started", ({ tickers }) => {
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
      const mode = this.state.getMode();
      if (mode === "real" && !this.fetchingJustCompleted) {
        this._updateFetchingProgress();
      }

      this._clearApiKeyInvalidState();
    });

    this.transport.on("rest:rate_limited", (data) => {
      const seconds = Math.ceil(data.backoffDelay / 1000);
      this._showToast(`Rate limited - cooling down for ${seconds}s`);

      this._updateFetchingProgress();

      this._startRateLimitCountdown();
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
        const proxyHint = shouldUseProxy()
          ? "Proxy could not fetch data - verify FINNHUB_API_KEY on the proxy service."
          : "Invalid API key - check settings";
        this._showToast(proxyHint);
        this._markApiKeyAsInvalid();
      } else if (error.code === "FORBIDDEN_ORIGIN") {
        this._showToast(
          "Proxy blocked this domain. Redeploy the Worker with the correct ALLOWED_ORIGINS.",
        );
      }
    });
  }

  _setupUIListeners() {
    const modeToggle = document.getElementById("mode-toggle");
    if (modeToggle) {
      modeToggle.addEventListener("change", (e) => {
        this.setMode(e.target.checked ? "real" : "simulation");
      });
    }

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

        input.value = "";

        this._updateApiKeyDisplay(key);
        this._clearApiKeyInvalidState();

        if (this.state.getMode() === "real") {
          log.info("Restarting transport with new API key...");
          const tickers = this.assets.map((a) => a.ticker);
          this.simulation.stopTransport();

          setTimeout(() => {
            this.simulation.startTransport(tickers);
            this._showToast("Data fetching restarted");
          }, 500);
        }
      });
    }

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

    const pauseFetchBtn = document.getElementById("pause-fetch-btn");
    if (pauseFetchBtn) {
      pauseFetchBtn.addEventListener("click", () => {
        const isPaused = pauseFetchBtn.classList.contains("paused");

        if (isPaused) {
          const resumed = this.resumeFetching();
          if (resumed) {
            pauseFetchBtn.classList.remove("paused");
            pauseFetchBtn.setAttribute("aria-label", "Pause fetching");
            pauseFetchBtn.setAttribute("title", "Pause fetching");
          }
        } else {
          const paused = this.pauseFetching();
          if (paused) {
            pauseFetchBtn.classList.add("paused");
            pauseFetchBtn.setAttribute("aria-label", "Resume fetching");
            pauseFetchBtn.setAttribute("title", "Resume fetching");
            this._updateStatusIndicator("paused");
          }
        }
      });
    }
  }

  _renderAllDots() {
    this.tileController.refreshDots();
  }

  _reconcilePriceHistory(assets, mode) {
    if (!this.tileRegistry?.priceHistory) return;

    const desired = new Set(assets.map((a) => a.ticker));
    const history = this.tileRegistry.priceHistory;

    history.forEach((_, ticker) => {
      if (!desired.has(ticker)) {
        history.delete(ticker);
      }
    });

    assets.forEach((asset) => {
      if (!history.has(asset.ticker)) {
        history.set(asset.ticker, mode === "simulation" ? [asset.price] : []);
      }
    });
  }

  _syncRendererWithRegistry() {
    if (!this.tileController?.renderer || !this.tileRegistry) return;
    const renderer = this.tileController.renderer;
    renderer.assets = this.tileRegistry.assets;
    renderer.assetIndexLookup = this.tileRegistry.assetIndexLookup;
    renderer.tileCache = this.tileRegistry.tileCache;
    renderer.priceHistory = this.tileRegistry.priceHistory;
  }

  _countTilesWithData() {
    let withData = 0;
    this.state.getAllTiles().forEach((tile) => {
      if (tile?.hasInfo && tile.price != null && tile.change != null) {
        withData++;
      }
    });
    return withData;
  }

  _snapshotRealTiles() {
    if (this.state.getMode() !== "real") return;
    this.cachedRealTiles = new Map();
    this.state.getAllTiles().forEach((tile, ticker) => {
      if (!tile) return;
      this.cachedRealTiles.set(ticker, { ...tile });
    });
    log.debug(`Snapshot ${this.cachedRealTiles.size} real tiles`);
  }

  _restoreCachedRealTiles() {
    if (!this.cachedRealTiles || this.cachedRealTiles.size === 0) return;

    this.cachedRealTiles.forEach((cached, ticker) => {
      const tile = this.state.getTile(ticker);
      if (!tile) return;

      Object.assign(tile, cached, { dirty: true, hasInfo: cached.hasInfo });

      if (this.tileRegistry?.priceHistory) {
        const history = cached.price != null ? [cached.price] : [];
        this.tileRegistry.priceHistory.set(ticker, history);
      }
    });

    log.debug(`Restored ${this.cachedRealTiles.size} cached real tiles`);
  }

  setSimulationFrequency(ms) {
    const parsed = Number.parseInt(ms, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return;
    }

    const clamped = Math.max(100, parsed);
    CONFIG.UI.UPDATE_FREQUENCY = clamped;

    if (this.state.getMode() === "simulation") {
      this.simulation.setFrequency(clamped);
      log.info(`Simulation update frequency set to ${clamped}ms`);
    }
  }

  pauseSimulation() {
    if (this.state.getMode() !== "simulation") {
      log.debug("Cannot pause - not in simulation mode");
      return false;
    }

    if (!this.simulation.isRunning()) {
      log.debug("Simulation already paused");
      return false;
    }

    this.simulation.stop();
    log.info("Simulation paused");
    return true;
  }

  resumeSimulation() {
    if (this.state.getMode() !== "simulation") {
      log.debug("Cannot resume - not in simulation mode");
      return false;
    }

    if (this.simulation.isRunning()) {
      log.debug("Simulation already running");
      return false;
    }

    this.simulation.start();
    log.info("Simulation resumed");
    return true;
  }

  isSimulationRunning() {
    return this.state.getMode() === "simulation" && this.simulation.isRunning();
  }

  pauseFetching() {
    if (this.state.getMode() !== "real") {
      log.debug("Cannot pause - not in real mode");
      return false;
    }

    if (!this.transport.isRunning) {
      log.debug("Fetching already paused");
      return false;
    }

    this.transport.stop();
    log.info("Data fetching paused");
    return true;
  }

  resumeFetching() {
    if (this.state.getMode() !== "real") {
      log.debug("Cannot resume - not in real mode");
      return false;
    }

    if (this.transport.isRunning) {
      log.debug("Fetching already running");
      return false;
    }

    const tickers = this.assets.map((a) => a.ticker);
    this.transport.start(tickers);
    log.info("Data fetching resumed");
    return true;
  }

  isFetchingRunning() {
    return this.state.getMode() === "real" && this.transport.isRunning;
  }


  _renderAll() {
    this.paintAll();
  }

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

  _updateStatusIndicator(mode = "live", message = null) {
    const el = document.getElementById("status-indicator");
    if (!el) return;

    const dotEl = el.querySelector(".status-dot");
    const textEl = el.querySelector(".status-text");
    if (!dotEl || !textEl) return;

    el.classList.remove("fetching", "paused");

    switch (mode) {
      case "fetching":
        el.classList.add("fetching");
        textEl.textContent = message || "Fetching...";
        break;
      case "paused":
        el.classList.add("paused");
        textEl.textContent = message || "Paused";
        break;
      case "live":
        textEl.textContent = message || "Live";
        break;
    }
  }

  _formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    if (days === 1) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
    }

    if (days === 2) {
      return `2 days ago`;
    }

    if (days === 3) {
      return `3 days ago`;
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  _updateFetchingProgress() {
    const perfId = perfStart("updateFetchingProgress");
    const mode = this.state.getMode();
    if (mode !== "real") {
      perfEnd(perfId);
      return;
    }

    if (!this.transport.isRunning) {
      perfEnd(perfId);
      return;
    }

    if (this.transport.rest) {
      const backoffStatus = this.transport.rest.getBackoffStatus();
      if (backoffStatus.inBackoff) {
        const remainingSeconds = Math.ceil(backoffStatus.remainingMs / 1000);
        this._updateStatusIndicator(
          "fetching",
          `Rate Limited (cooldown: ${remainingSeconds}s)`,
        );
        perfEnd(perfId);
        return;
      }
    }

    let tilesWithData = 0;
    this.state.getAllTiles().forEach((tile) => {
      if (tile.hasInfo && tile.price != null && tile.change != null) {
        tilesWithData++;
      }
    });

    this.fetchingCompleted = tilesWithData;

    if (this.fetchingCompleted >= this.fetchingTotal) {
      const now = new Date();
      const timeStr = this._formatRelativeTime(now);
      this._updateStatusIndicator("live", `Live | Last Update: ${timeStr}`);

      this.fetchingJustCompleted = true;
    } else {
      this._updateStatusIndicator(
        "fetching",
        `Fetching (${this.fetchingCompleted}/${this.fetchingTotal})`,
      );
      this.fetchingJustCompleted = false;
    }
    perfEnd(perfId);
  }

  _startRateLimitCountdown() {
    if (this.rateLimitInterval) {
      clearInterval(this.rateLimitInterval);
      this.rateLimitInterval = null;
    }

    this.rateLimitInterval = setInterval(() => {
      if (!this.transport.rest) {
        clearInterval(this.rateLimitInterval);
        this.rateLimitInterval = null;
        return;
      }

      const backoffStatus = this.transport.rest.getBackoffStatus();
      if (!backoffStatus.inBackoff) {
        clearInterval(this.rateLimitInterval);
        this.rateLimitInterval = null;
        this._updateFetchingProgress();
      } else {
        this._updateFetchingProgress();
      }
    }, 1000);
  }

  _showToast(message, duration = 6500) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  }

  _loadApiKey() {
    const useProxy = shouldUseProxy();
    const isLocal = isLocalDevelopment();

    if (useProxy) {
      log.info(`PROXY MODE: api key server-side (${isLocal ? 'local' : 'prod'})`);
      try {
        this._updateApiKeyDisplay("");
      } catch {}
      return "";
    }

    log.info("LOCAL MODE: direct api key");

    try {
      const savedKey = localStorage.getItem(CONFIG.API_KEY.STORAGE_KEY);

      if (savedKey && savedKey.trim()) {
        log.info("Loaded API key from localStorage");
        return savedKey;
      }

      if (CONFIG.API_KEY.LOCAL_DEV_KEY) {
        log.info("Using LOCAL_DEV_KEY for development");
        return CONFIG.API_KEY.LOCAL_DEV_KEY;
      }

      log.warn("No API key available");
      return "";
    } catch (e) {
      log.warn("Failed to load API key, using local dev key");
      return CONFIG.API_KEY.LOCAL_DEV_KEY || "";
    }
  }

  _saveApiKey(key) {
    try {
      localStorage.setItem(CONFIG.API_KEY.STORAGE_KEY, key);
      log.info("API key saved to localStorage");
    } catch (e) {
      log.error("Failed to save API key to localStorage");
    }
  }

  _updateApiKeyDisplay(key) {
    const display = document.getElementById("api-key-display");
    if (!display) return;

    const useProxy = shouldUseProxy();

    if (useProxy) {
      display.value = "Managed by proxy";
      display.dataset.actual = "";
      display.dataset.visibility = "masked";
      display.disabled = true;
      this._syncApiKeyControls("");
      return;
    }

    const actualKey = key || "";
    display.dataset.actual = actualKey;
    display.disabled = false;
    if (!display.dataset.visibility) {
      display.dataset.visibility = "masked";
    }

    const isVisible = display.dataset.visibility === "visible";
    display.value = isVisible ? actualKey : this._maskKey(actualKey);

    this._syncApiKeyControls(actualKey);
  }

  _maskKey(key) {
    if (!key) return "";
    if (key.length <= 10) return "•".repeat(Math.max(0, key.length));
    const visible = key.slice(-10);
    const hiddenCount = Math.max(0, key.length - visible.length);
    return "•".repeat(hiddenCount) + visible;
  }

  _setApiKeyVisibility(shouldShow) {
    const display = document.getElementById("api-key-display");
    if (!display) return;

    const key = display.dataset.actual || "";
    display.dataset.visibility = shouldShow ? "visible" : "masked";
    display.value = shouldShow ? key : this._maskKey(key);

    this._syncApiKeyControls(key);
  }

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

  _markApiKeyAsInvalid() {
    const displayInput = document.getElementById("api-key-display");
    if (displayInput) {
      displayInput.classList.add("invalid");
    }
  }

  _clearApiKeyInvalidState() {
    const displayInput = document.getElementById("api-key-display");
    if (displayInput) {
      displayInput.classList.remove("invalid");
    }
  }

  getStatus() {
    return {
      mode: this.state.getMode(),
      transport: this.transport.getStatus(),
      tiles: this.state.getAllTiles().size,
    };
  }

  setAssetsResolver(resolver) {
    if (typeof resolver === "function") {
      this.assetsResolver = resolver;
    }
  }

  applyExternalAssets(nextAssets, options = {}) {
    const mode = options.mode || this.state.getMode();
    const resolvedAssets = Array.isArray(nextAssets)
      ? nextAssets
      : this._resolveAssetsForMode(mode);

    const previousAssets = this.assets;
    const newTickers = resolvedAssets.map((a) => a.ticker);
    const previousTickers = previousAssets.map((a) => a.ticker);

    const addedTickers = newTickers.filter((t) => !previousTickers.includes(t));
    const removedTickers = previousTickers.filter((t) => !newTickers.includes(t));
    const preserveExistingData = mode === "real";
    const transportRunning = mode === "real" && this.transport.isRunning;
    const fetchedBefore = new Set();
    if (mode === "real") {
      this.state.getAllTiles().forEach((tile, ticker) => {
        if (tile?.hasInfo && tile.price != null && tile.change != null) {
          fetchedBefore.add(ticker);
        }
      });
    }

    this.assets = resolvedAssets;
    this.simulation.assets = resolvedAssets;
    this.state.reconcileTiles(resolvedAssets, {
      preserveExistingData,
      mode,
    });

    this._reconcilePriceHistory(resolvedAssets, mode);

    if (this.modalView) this.modalView.updateAssets(resolvedAssets);
    if (this.heatmapView) this.heatmapView.updateAssets(resolvedAssets);

    this.tileRegistry.setAssets(resolvedAssets);
    this.tileRegistry.initializeDOMCache();
    this._syncRendererWithRegistry();
    this.tileController.markAllDirty();
    this._renderAllDots();
    this.paintAll();

    if (mode === "real") {
      const tilesWithData = this._countTilesWithData();
      const baselineFetched = newTickers.reduce(
        (count, ticker) => count + (fetchedBefore.has(ticker) ? 1 : 0),
        0,
      );
      this.fetchingTotal = newTickers.length;
      this.fetchingCompleted = Math.min(
        Math.max(tilesWithData, baselineFetched),
        this.fetchingTotal,
      );
      this.fetchingJustCompleted = this.fetchingCompleted >= this.fetchingTotal;
      this._updateFetchingProgress();

      if (transportRunning) {
        this.transport.subscribedTickers = new Set(newTickers);

        if (addedTickers.length > 0 && this.transport.ws) {
          this.transport.ws.subscribe(addedTickers);
          log.info(`Subscribed to ${addedTickers.length} new ticker(s): ${addedTickers.join(", ")}`);

          this.transport.warmupTickers(addedTickers).catch((error) => {
            log.warn("Warmup fetch failed:", error?.message || error);
          });
        }

        if (removedTickers.length > 0 && this.transport.ws) {
          this.transport.ws.unsubscribe(removedTickers);
          log.info(`Unsubscribed from ${removedTickers.length} ticker(s): ${removedTickers.join(", ")}`);
        }
      } else {
        this.transport.setDesiredTickers?.(newTickers);
        if (!this.transport.setDesiredTickers) {
          this.transport.subscribedTickers = new Set(newTickers);
        }
        this.fetchingJustCompleted = this.fetchingCompleted >= this.fetchingTotal;
      }
    } else if (!this.simulation.isRunning()) {
      this.simulation.start();
    }

    if (!options.silent) {
      this._showToast(options.toastMessage || "Heatmap updated");
    }
  }

  _resolveAssetsForMode(mode) {
    if (typeof this.assetsResolver === "function") {
      return this.assetsResolver(mode);
    }
    return mode === "simulation" ? SIMULATION_ASSETS : REAL_DATA_ASSETS;
  }

  async searchSymbols(query, options = {}) {
    return this.transport.searchSymbols(query, options);
  }

  notify(message, duration) {
    this._showToast(message, duration);
  }

  async fetchQuoteDirect(ticker) {
    return this.transport.fetchQuoteDirect(ticker);
  }
}
