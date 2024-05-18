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
        price: asset.price,
        basePrice: asset.basePrice,
        change: asset.change || 0,
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

    // Update base price if provided, otherwise keep existing
    if (quoteData.previousClose != null) {
      tile.basePrice = quoteData.previousClose;
    }

    // Update price
    tile.price = newPrice;

    // Calculate or use provided change percentage
    if (quoteData.changePercent != null) {
      tile.change = quoteData.changePercent;
    } else if (tile.basePrice > 0) {
      tile.change = ((newPrice - tile.basePrice) / tile.basePrice) * 100;
    }

    // Mark as having info now
    tile.hasInfo = true;
    tile.lastTradeTs = quoteData.timestamp || Date.now();

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
   */
  resetAllTiles() {
    this.state.tiles.forEach((tile, ticker) => {
      tile.hasInfo = false;
      tile.lastTradeTs = 0;
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
          hasInfo: tileData.hasInfo,
          lastTradeTs: tileData.lastTradeTs
        });
      }
    });

    this.emit('state:restored', { snapshot });
  }
}
