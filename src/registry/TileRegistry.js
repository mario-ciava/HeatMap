export class TileRegistry {
  constructor(assets = []) {
    this.setAssets(assets);
    this.tileCache = new Map();
    this.priceHistory = new Map();
  }

  setAssets(assets = []) {
    this.assets = assets;
    this.assetIndexLookup = new Map();
    assets.forEach((asset, index) => {
      this.assetIndexLookup.set(asset.ticker, index);
    });
  }

  initializeDOMCache() {
    const tiles = document.querySelectorAll(".asset-tile");
    this.tileCache.clear();
    tiles.forEach((tile, index) => {
      const priceEl = tile.querySelector(".price");
      const changeEl = tile.querySelector(".change");
      const canvas = tile.querySelector(".sparkline-canvas");
      const ctx = canvas ? canvas.getContext("2d") : null;
      const dotEl = tile.querySelector(".status-dot");
      if (canvas && !canvas.__ctx) {
        canvas.__ctx = ctx;
      }

      this.tileCache.set(index, {
        element: tile,
        price: priceEl,
        change: changeEl,
        canvas,
        ctx,
        dot: dotEl,
        lastPriceText: priceEl ? priceEl.textContent : null,
        lastChangeText: changeEl ? changeEl.textContent : null,
        lastPriceValue: null,
        lastChangeValue: null,
        needsSparklineUpdate: true,
        lastHistoryLength: 0,
        lastTileState: tile.dataset.state || "neutral",
        lastDotState: dotEl ? dotEl.dataset.state || "" : "",
      });
    });
  }

  getAssetIndex(ticker) {
    return this.assetIndexLookup.get(ticker) ?? -1;
  }

  getCacheByIndex(index) {
    return this.tileCache.get(index);
  }

  getCacheByTicker(ticker) {
    const index = this.getAssetIndex(ticker);
    return index >= 0 ? this.tileCache.get(index) : undefined;
  }

  resetPriceHistoryForMode(mode) {
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
    this.tileCache.forEach((cached) => {
      cached.needsSparklineUpdate = true;
      cached.lastHistoryLength = 0;
    });
  }

  appendPrice(ticker, price, maxLength) {
    if (price == null) return 0;
    let history = this.priceHistory.get(ticker);
    if (!history) {
      history = [];
      this.priceHistory.set(ticker, history);
    }
    history.push(price);
    if (history.length > maxLength) {
      history.splice(0, history.length - maxLength);
    }
    return history.length;
  }

  setHistory(ticker, values) {
    this.priceHistory.set(ticker, values);
  }

  getHistory(ticker) {
    return this.priceHistory.get(ticker) || [];
  }

  markSparklineDirtyAll() {
    this.tileCache.forEach((cached) => {
      cached.needsSparklineUpdate = true;
      cached.lastHistoryLength = 0;
    });
  }
}
