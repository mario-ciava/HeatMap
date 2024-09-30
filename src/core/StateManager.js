import { EventEmitter } from './EventEmitter.js';

export class StateManager extends EventEmitter {
  constructor(initialAssets = []) {
    super();
    
    this.state = {
      mode: 'simulation',
      tiles: new Map(),
      marketStatus: new Map()
    };

    initialAssets.forEach(asset => {
      this.state.tiles.set(asset.ticker, {
        ticker: asset.ticker,
        name: asset.name,
        sector: asset.sector,
        _placeholderPrice: asset.price,
        _placeholderBasePrice: asset.basePrice,
        price: null,
        basePrice: null,
        change: null,
        previousClose: null,
        open: null,
        high: null,
        low: null,
        volume: null,
        hasInfo: false,
        lastTradeTs: 0,
        dirty: true
      });
    });
  }

  reinitializeTiles(assets) {
    this.state.tiles.clear();

    assets.forEach(asset => {
      this.state.tiles.set(asset.ticker, {
        ticker: asset.ticker,
        name: asset.name,
        sector: asset.sector,
        _placeholderPrice: asset.price,
        _placeholderBasePrice: asset.basePrice,
        price: null,
        basePrice: null,
        change: null,
        previousClose: null,
        open: null,
        high: null,
        low: null,
        volume: null,
        hasInfo: false,
        lastTradeTs: 0,
        dirty: true
      });
    });

    this.emit('tiles:reinitialized', { count: assets.length });
  }

  reconcileTiles(assets, options = {}) {
    const { preserveExistingData = false, mode } = options;
    const targetMode = mode || this.state.mode || 'simulation';

    const existing = new Map(this.state.tiles);
    this.state.tiles.clear();

    assets.forEach((asset) => {
      if (!asset || !asset.ticker) return;

      const ticker = asset.ticker;
      const placeholderPrice =
        asset.price ?? asset.basePrice ?? asset._placeholderPrice ?? 0;
      const placeholderBase =
        asset.basePrice ?? asset.price ?? asset._placeholderBasePrice ?? null;

      const existingTile = existing.get(ticker);
      if (existingTile && preserveExistingData) {
        const merged = {
          ...existingTile,
          ticker,
          name: asset.name,
          sector: asset.sector,
          _placeholderPrice: placeholderPrice,
          _placeholderBasePrice: placeholderBase,
          dirty: true,
        };
        this.state.tiles.set(ticker, merged);
        return;
      }

      const isSimulation = targetMode === 'simulation';
      const basePrice = placeholderBase;
      const initialPrice = isSimulation ? placeholderPrice : null;
      const initialBase = isSimulation ? basePrice : null;
      const initialChange =
        isSimulation && asset.change != null ? asset.change : isSimulation ? 0 : null;

      this.state.tiles.set(ticker, {
        ticker,
        name: asset.name,
        sector: asset.sector,
        _placeholderPrice: placeholderPrice,
        _placeholderBasePrice: basePrice,
        price: initialPrice,
        basePrice: initialBase,
        change: initialChange,
        previousClose: isSimulation ? basePrice : null,
        open: isSimulation ? placeholderPrice : null,
        high: isSimulation ? placeholderPrice : null,
        low: isSimulation ? placeholderPrice : null,
        volume: isSimulation ? 0 : null,
        hasInfo: isSimulation && initialPrice != null,
        lastTradeTs: 0,
        dirty: true
      });
    });

    this.emit('tiles:reinitialized', { count: this.state.tiles.size });
  }

  getMode() {
    return this.state.mode;
  }

  setMode(mode) {
    const oldMode = this.state.mode;
    this.state.mode = mode;
    
    if (oldMode !== mode) {
      this.emit('mode:changed', { mode, oldMode });
    }
  }

  getTile(ticker) {
    return this.state.tiles.get(ticker);
  }

  getAllTiles() {
    return this.state.tiles;
  }

  updateTile(ticker, quoteData) {
    const tile = this.state.tiles.get(ticker);
    if (!tile) {
      console.warn(`Tile not found for ticker: ${ticker}`);
      return;
    }

    const oldPrice = tile.price;
    const newPrice = quoteData.price;

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

    if (quoteData.changePercent != null) {
      tile.change = quoteData.changePercent;
    } else if (tile.basePrice != null && tile.basePrice > 0) {
      tile.change = ((newPrice - tile.basePrice) / tile.basePrice) * 100;
    } else {
      tile.change = null;
    }

    tile.hasInfo = true;
    tile.lastTradeTs = quoteData.timestamp || Date.now();
    tile.dirty = true;

    if (quoteData.volume != null) {
      tile.volume = (tile.volume || 0) + quoteData.volume;
    }

    this.emit('tile:updated', {
      ticker,
      oldPrice,
      newPrice,
      tile: { ...tile }
    });
  }

  resetTileInfo(ticker) {
    const tile = this.state.tiles.get(ticker);
    if (!tile) return;

    tile.hasInfo = false;
    tile.lastTradeTs = 0;
    tile.dirty = true;

    this.emit('tile:reset', { ticker });
  }

  resetAllTiles(preserveRealData = false) {
    const isSimulation = this.state.mode === 'simulation';

    this.state.tiles.forEach((tile, ticker) => {
      if (isSimulation) {
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
        tile.dirty = true;
      } else {
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
          tile.dirty = true;
        } else {
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
          tile.dirty = true;
        }
      }
    });

    this.emit('tiles:reset', {});
  }

  setMarketStatus(exchange, isOpen) {
    const oldStatus = this.state.marketStatus.get(exchange);
    this.state.marketStatus.set(exchange, isOpen);

    if (oldStatus !== isOpen) {
      this.emit('market:status', { exchange, isOpen, oldStatus });
    }
  }

  getMarketStatus(exchange) {
    return this.state.marketStatus.has(exchange) 
      ? this.state.marketStatus.get(exchange) 
      : null;
  }

  isTradeStale(ticker, staleThresholdMs = 300000) {
    const tile = this.state.tiles.get(ticker);
    if (!tile || !tile.lastTradeTs) return true;
    
    return (Date.now() - tile.lastTradeTs) > staleThresholdMs;
  }

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
          lastTradeTs: tileData.lastTradeTs,
          dirty: true
        });
      }
    });

    this.emit('state:restored', { snapshot });
  }
}
