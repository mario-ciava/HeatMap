/**
 * StateManager - Centralized reactive state store
 * Single source of truth for all tile states
 */

import { EventEmitter } from './EventEmitter.js';

/**
 * @typedef {Object} TileState
 * @property {string} ticker - Stock ticker symbol
 * @property {number} [price] - Current price
 * @property {number} [basePrice] - Base price for % calculation
 * @property {number} [change] - Percentage change
 * @property {boolean} hasInfo - Whether we've received at least one data point
 * @property {number} [lastTradeTs] - Timestamp of last trade received (for staleness check)
 * @property {string} name - Company name
 * @property {string} sector - Business sector
 */

/**
 * @typedef {Object} AppState
 * @property {'simulation' | 'real'} mode - Current operating mode
 * @property {Map<string, TileState>} tiles - Map of ticker → state
 * @property {Map<string, boolean>} marketStatus - Map of exchange → isOpen
 */

export class StateManager extends EventEmitter {
  constructor(initialAssets = []) {
    super();
    
    /** @type {AppState} */
    this.state = {
      mode: 'simulation',
      tiles: new Map(),
      marketStatus: new Map()
    };

    // Initialize tiles from assets array
    initialAssets.forEach(asset => {
      this.state.tiles.set(asset.ticker, {
        ticker: asset.ticker,
        name: asset.name,
        sector: asset.sector,
        // Store placeholder values for simulation mode reference
        _placeholderPrice: asset.price,
        _placeholderBasePrice: asset.basePrice,
        // Actual values start as null/undefined in real mode
        price: null,
        basePrice: null,
        change: null,
        previousClose: null,
        open: null,
        high: null,
        low: null,
        volume: null,
        hasInfo: false, // Start with NO INFO
        lastTradeTs: 0
      });
    });
  }

  /**
   * Get current mode
   * @returns {'simulation' | 'real'}
   */
  getMode() {
    return this.state.mode;
  }

  /**
   * Set operating mode
   * @param {'simulation' | 'real'} mode
   */
  setMode(mode) {
    const oldMode = this.state.mode;
    this.state.mode = mode;
    
    if (oldMode !== mode) {
      this.emit('mode:changed', { mode, oldMode });
    }
  }

  /**
   * Get state for a specific ticker
   * @param {string} ticker
   * @returns {TileState | undefined}
   */
  getTile(ticker) {
    return this.state.tiles.get(ticker);
  }

  /**
   * Get all tiles
   * @returns {Map<string, TileState>}
   */
  getAllTiles() {
    return this.state.tiles;
  }

  /**
   * Update tile with new quote data
   * @param {string} ticker
   * @param {Object} quoteData
   * @param {number} quoteData.price - Current price
   * @param {number} [quoteData.previousClose] - Previous close price
   * @param {number} [quoteData.changePercent] - Pre-calculated change %
   * @param {number} [quoteData.timestamp] - Trade timestamp
   */
  updateTile(ticker, quoteData) {
    const tile = this.state.tiles.get(ticker);
    if (!tile) {
      console.warn(`Tile not found for ticker: ${ticker}`);
      return;
    }

    const oldPrice = tile.price;
    const newPrice = quoteData.price;

    // Update base price if provided
    if (quoteData.previousClose != null && quoteData.previousClose > 0) {
      tile.basePrice = quoteData.previousClose;
      tile.previousClose = quoteData.previousClose;
    }

    if (quoteData.open != null && quoteData.open > 0) {
      tile.open = quoteData.open;
    }

    if (quoteData.high != null && quoteData.high > 0) {
      tile.high = quoteData.high;
    }

    if (quoteData.low != null && quoteData.low > 0) {
      tile.low = quoteData.low;
    }

    // Update price
    tile.price = newPrice;

    if (tile.open == null) {
      tile.open = newPrice;
    }

    if (tile.high == null || newPrice > tile.high) {
      tile.high = newPrice;
    }

    if (tile.low == null || newPrice < tile.low) {
      tile.low = newPrice;
    }

    // Update change percentage
    if (quoteData.changePercent != null) {
      tile.change = quoteData.changePercent;
    } else if (tile.basePrice != null && tile.basePrice > 0) {
      // Calculate from basePrice if not provided
      tile.change = ((newPrice - tile.basePrice) / tile.basePrice) * 100;
    } else {
      tile.change = null;
    }

    // Mark as having info now
    tile.hasInfo = true;
    tile.lastTradeTs = quoteData.timestamp || Date.now();

    if (quoteData.volume != null) {
      tile.volume = (tile.volume || 0) + quoteData.volume;
    }

    // Emit change event
    this.emit('tile:updated', {
      ticker,
      oldPrice,
      newPrice,
      tile: { ...tile } // Shallow copy for immutability
    });
  }

  /**
   * Reset tile to NO INFO state (for mode switching)
   * @param {string} ticker
   */
  resetTileInfo(ticker) {
    const tile = this.state.tiles.get(ticker);
    if (!tile) return;

    tile.hasInfo = false;
    tile.lastTradeTs = 0;

    this.emit('tile:reset', { ticker });
  }

  /**
   * Reset all tiles to NO INFO state
   * In real mode: clears all data (null) - but preserves cached real data
   * In simulation mode: restores placeholder values
   * @param {boolean} preserveRealData - If true, keeps previously fetched real data
   */
  resetAllTiles(preserveRealData = false) {
    const isSimulation = this.state.mode === 'simulation';

    this.state.tiles.forEach((tile, ticker) => {
      if (isSimulation) {
        // Save current real data if it exists
        if (tile.hasInfo && tile.price != null) {
          tile._savedRealPrice = tile.price;
          tile._savedRealBasePrice = tile.basePrice;
          tile._savedRealChange = tile.change;
          tile._savedRealTradeTs = tile.lastTradeTs;
          tile._savedRealPreviousClose = tile.previousClose;
          tile._savedRealOpen = tile.open;
          tile._savedRealHigh = tile.high;
          tile._savedRealLow = tile.low;
          tile._savedRealVolume = tile.volume;
        }

        // Restore placeholder values for simulation
        tile.price = tile._placeholderPrice;
        tile.basePrice = tile._placeholderBasePrice;
        tile.change = 0;
        tile.previousClose = tile._placeholderBasePrice;
        tile.open = tile._placeholderPrice;
        tile.high = tile._placeholderPrice;
        tile.low = tile._placeholderPrice;
        tile.volume = 0;
        tile.hasInfo = false;
        tile.lastTradeTs = 0;
      } else {
        // Real mode: restore previously saved data if available and requested
        if (preserveRealData && tile._savedRealPrice != null) {
          tile.price = tile._savedRealPrice;
          tile.basePrice = tile._savedRealBasePrice;
          tile.change = tile._savedRealChange;
          tile.lastTradeTs = tile._savedRealTradeTs;
          tile.previousClose = tile._savedRealPreviousClose;
          tile.open = tile._savedRealOpen;
          tile.high = tile._savedRealHigh;
          tile.low = tile._savedRealLow;
          tile.volume = tile._savedRealVolume;
          tile.hasInfo = true;
        } else {
          // Clear data for real mode (waiting for API)
          tile.price = null;
          tile.basePrice = null;
          tile.change = null;
          tile.previousClose = null;
          tile.open = null;
          tile.high = null;
          tile.low = null;
          tile.volume = 0;
          tile.hasInfo = false;
          tile.lastTradeTs = 0;
        }
      }
    });

    this.emit('tiles:reset', {});
  }

  /**
   * Update market status for an exchange
   * @param {string} exchange - Exchange code (e.g., 'US', 'L', 'GER')
   * @param {boolean} isOpen - Whether the market is open
   */
  setMarketStatus(exchange, isOpen) {
    const oldStatus = this.state.marketStatus.get(exchange);
    this.state.marketStatus.set(exchange, isOpen);

    if (oldStatus !== isOpen) {
      this.emit('market:status', { exchange, isOpen, oldStatus });
    }
  }

  /**
   * Get market status for an exchange
   * @param {string} exchange
   * @returns {boolean | null} null if unknown
   */
  getMarketStatus(exchange) {
    return this.state.marketStatus.has(exchange) 
      ? this.state.marketStatus.get(exchange) 
      : null;
  }

  /**
   * Check if a ticker's last trade is stale (for heuristic market status)
   * @param {string} ticker
   * @param {number} [staleThresholdMs=300000] - Default 5 minutes
   * @returns {boolean}
   */
  isTradeStale(ticker, staleThresholdMs = 300000) {
    const tile = this.state.tiles.get(ticker);
    if (!tile || !tile.lastTradeTs) return true;
    
    return (Date.now() - tile.lastTradeTs) > staleThresholdMs;
  }

  /**
   * Get serializable state snapshot (for persistence)
   * @returns {Object}
   */
  serialize() {
    return {
      mode: this.state.mode,
      tiles: Array.from(this.state.tiles.entries()).map(([ticker, tile]) => ({
        ticker,
        price: tile.price,
        basePrice: tile.basePrice,
        change: tile.change,
        previousClose: tile.previousClose,
        open: tile.open,
        high: tile.high,
        low: tile.low,
        volume: tile.volume,
        hasInfo: tile.hasInfo,
        lastTradeTs: tile.lastTradeTs
      })),
      timestamp: Date.now()
    };
  }

  /**
   * Restore state from serialized snapshot
   * @param {Object} snapshot
   */
  deserialize(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.tiles)) return;

    snapshot.tiles.forEach(tileData => {
      const tile = this.state.tiles.get(tileData.ticker);
      if (tile) {
        Object.assign(tile, {
          price: tileData.price,
          basePrice: tileData.basePrice,
          change: tileData.change,
          previousClose: tileData.previousClose,
          open: tileData.open,
          high: tileData.high,
          low: tileData.low,
          volume: tileData.volume,
          hasInfo: tileData.hasInfo,
          lastTradeTs: tileData.lastTradeTs
        });
      }
    });

    this.emit('state:restored', { snapshot });
  }
}
