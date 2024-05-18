/**
 * AppController - Bridge between transport layer and UI
 * Manages application lifecycle and UI updates
 */

import { FinnhubTransport } from '../transport/FinnhubTransport.js';
import { StateManager } from '../core/StateManager.js';
import { CONFIG } from '../config.js';
import { logger } from '../utils/Logger.js';

const log = logger.child('App');

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
    
    // Wire up event handlers
    this._setupEventHandlers();
    this._setupDOMCache();
    
    log.info('AppController initialized');
  }

  /**
   * Initialize the application (call after DOM ready)
   */
  init() {
    log.info('Initializing application...');
    
    // Start in simulation mode by default
    this.setMode('simulation');
    
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
    
    if (oldMode === mode) {
      log.debug(`Already in ${mode} mode`);
      return;
    }

    log.info(`Switching to ${mode} mode...`);

    // Update state
    this.state.setMode(mode);

    if (mode === 'real') {
      // Stop simulation
      this._stopSimulation();
      
      // Reset all tiles to NO INFO state
      this.state.resetAllTiles();
      
      // Start transport
      const tickers = this.assets.map(a => a.ticker);
      this.transport.start(tickers);
      
      // Update UI
      this._updateModeIndicators();
      this._renderAllDots();
      
      // Show toast
      this._showToast('🛰️ Real data mode activated');
      
    } else {
      // Stop transport
      this.transport.stop();
      
      // Reset all tiles to NO INFO state
      this.state.resetAllTiles();
      
      // Start simulation
      this._startSimulation();
      
      // Update UI
      this._updateModeIndicators();
      this._renderAllDots();
      
      // Show toast
      this._showToast('🧪 Simulation mode activated');
    }
  }

  /**
   * Update a single tile's visual representation
   * @param {string} ticker
   */
  paintTile(ticker) {
    const tile = this.state.getTile(ticker);
    if (!tile) return;

    const index = this.assets.findIndex(a => a.ticker === ticker);
    if (index === -1) return;

    const cached = this.tileCache.get(index);
    if (!cached) return;

    // Update price and change text
    if (tile.price != null) {
      cached.price.textContent = `$${tile.price.toFixed(2)}`;
    }
    
    if (tile.change != null) {
      cached.change.textContent = `${tile.change > 0 ? '+' : ''}${tile.change.toFixed(2)}%`;
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
    this.state.on('tile:updated', ({ ticker }) => {
      this.paintTile(ticker);
      
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

    this.state.on('tiles:reset', () => {
      this._renderAllDots();
    });

    this.state.on('market:status', () => {
      // Market status changed - update all dots
      this._renderAllDots();
    });

    // Transport events
    this.transport.on('ws:connected', () => {
      this._updateLiveIndicator('live');
    });

    this.transport.on('ws:disconnected', () => {
      this._updateLiveIndicator('paused');
    });

    this.transport.on('quote', ({ ticker }) => {
      // Quote handled by state manager, just update last API time
      this._updateLastApiTime();
    });

    this.transport.on('rest:rate_limited', (data) => {
      const seconds = Math.ceil(data.backoffDelay / 1000);
      this._showToast(`⚠️ Rate limited - cooling down for ${seconds}s`);
      this._updateLiveIndicator('paused');
    });

    this.transport.on('error', (error) => {
      log.error('Transport error:', error);
      
      if (error.code === 'NO_API_KEY') {
        this._showToast('❌ API key required - check settings');
      }
    });
  }

  /**
   * Setup DOM element cache
   * @private
   */
  _setupDOMCache() {
    const tiles = document.querySelectorAll('.asset-tile');
    
    tiles.forEach((tile, index) => {
      this.tileCache.set(index, {
        element: tile,
        price: tile.querySelector('.price'),
        change: tile.querySelector('.change'),
        canvas: tile.querySelector('.sparkline-canvas')
      });
      
      // Initialize price history
      const asset = this.assets[index];
      if (asset) {
        this.priceHistory.set(asset.ticker, [asset.price]);
      }
    });
  }

  /**
   * Setup UI event listeners
   * @private
   */
  _setupUIListeners() {
    // Mode toggle
    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
      modeToggle.addEventListener('change', (e) => {
        this.setMode(e.target.checked ? 'real' : 'simulation');
      });
    }

    // API key save
    const saveBtn = document.getElementById('api-key-save');
    const input = document.getElementById('api-key-input');
    if (saveBtn && input) {
      saveBtn.addEventListener('click', () => {
        const key = input.value.trim();
        if (!key) {
          this._showToast('⚠️ Invalid API key');
          return;
        }

        this._saveApiKey(key);
        this.transport.setApiKey(key);
        this._showToast('✅ API key saved');
        
        // Clear input
        input.value = '';
        
        // Update masked display
        this._updateApiKeyDisplay(key);
      });
    }
  }

  /**
   * Update tile classes based on change percentage
   * @private
   */
  _updateTileClasses(element, change) {
    const thresholds = CONFIG.UI.THRESHOLDS;
    
    // Remove all state classes
    element.classList.remove('gaining', 'gaining-strong', 'losing', 'losing-strong', 'neutral');
    
    // Add appropriate class
    if (change > thresholds.STRONG_GAIN) {
      element.classList.add('gaining-strong');
    } else if (change > thresholds.MILD_GAIN) {
      element.classList.add('gaining');
    } else if (change < thresholds.STRONG_LOSS) {
      element.classList.add('losing-strong');
    } else if (change < thresholds.MILD_LOSS) {
      element.classList.add('losing');
    } else {
      element.classList.add('neutral');
    }
  }

  /**
   * Update dot state for a tile
   * @private
   */
  _updateDotState(element, ticker) {
    const dot = element.querySelector('.status-dot');
    if (!dot) return;

    // Get deterministic dot state from transport
    const state = this.transport.computeDotState(ticker);

    // Remove all state classes
    dot.classList.remove('standby', 'open', 'closed', 'pulsing');

    // Add state class
    dot.classList.add(state);

    // Add pulsing for open markets
    if (state === 'open') {
      dot.classList.add('pulsing');
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

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const trend = history[history.length - 1] - history[0];

    ctx.strokeStyle = trend > 0 ? '#10b981' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    history.forEach((price, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((price - min) / range) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }

  /**
   * Start simulation mode
   * @private
   */
  _startSimulation() {
    if (this.simulationInterval) return;

    log.info('Starting simulation...');

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
      log.info('Simulation stopped');
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

      // Simulate realistic price movements
      const momentum = Math.sin(Date.now() / 10000 + index) * 0.3;
      const randomFactor = (Math.random() - 0.5) * 2;
      const volatility = (CONFIG.UI.VOLATILITY.BASE + 
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
    const label = document.getElementById('mode-toggle-label');
    const toggle = document.getElementById('mode-toggle');

    if (label) {
      label.textContent = mode === 'real' ? 'Real Data' : 'Simulation';
    }

    if (toggle) {
      toggle.checked = mode === 'real';
    }

    document.body.classList.toggle('real-mode', mode === 'real');
  }

  /**
   * Update live indicator
   * @private
   */
  _updateLiveIndicator(state) {
    const el = document.querySelector('.live-indicator');
    if (!el) return;

    el.classList.remove('paused', 'closed', 'standby');

    switch (state) {
      case 'live':
        el.textContent = 'Live';
        break;
      case 'paused':
        el.classList.add('paused');
        el.textContent = 'Paused';
        break;
      case 'closed':
        el.classList.add('closed');
        el.textContent = 'Closed';
        break;
      case 'standby':
        el.classList.add('standby');
        el.textContent = 'Standby';
        break;
    }
  }

  /**
   * Update last API time display
   * @private
   */
  _updateLastApiTime() {
    const el = document.getElementById('last-api');
    if (el) {
      const now = new Date();
      el.textContent = `Last Update (API): ${now.toLocaleTimeString()}`;
    }
  }

  /**
   * Show toast notification
   * @private
   */
  _showToast(message, duration = 2500) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  /**
   * Load API key from localStorage
   * @private
   */
  _loadApiKey() {
    try {
      return localStorage.getItem(CONFIG.STORAGE.API_KEY) || '';
    } catch (e) {
      log.warn('Failed to load API key from localStorage');
      return '';
    }
  }

  /**
   * Save API key to localStorage
   * @private
   */
  _saveApiKey(key) {
    try {
      localStorage.setItem(CONFIG.STORAGE.API_KEY, key);
    } catch (e) {
      log.error('Failed to save API key to localStorage');
    }
  }

  /**
   * Update API key display (masked)
   * @private
   */
  _updateApiKeyDisplay(key) {
    const display = document.getElementById('api-key-display');
    if (!display) return;

    const masked = this._maskKey(key);
    display.value = masked;
    display.dataset.actual = key;
  }

  /**
   * Mask API key for display
   * @private
   */
  _maskKey(key) {
    if (!key) return '';
    if (key.length <= 6) return '•'.repeat(Math.max(0, key.length));
    return key.slice(0, 3) + '•'.repeat(Math.max(0, key.length - 6)) + key.slice(-3);
  }

  /**
   * Get transport status
   * @returns {Object}
   */
  getStatus() {
    return {
      mode: this.state.getMode(),
      transport: this.transport.getStatus(),
      tiles: this.state.getAllTiles().size
    };
  }
}
