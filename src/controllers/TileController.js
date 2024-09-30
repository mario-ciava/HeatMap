import { UpdateScheduler } from "../core/UpdateScheduler.js";
import { TileRenderer } from "../render/TileRenderer.js";
import { perfStart, perfEnd } from "../utils/perfHelpers.js";

export class TileController {
  constructor({ state, transport, registry, historyLength }) {
    this.state = state;
    this.transport = transport;
    this.registry = registry;
    this.historyLength = historyLength;

    this.renderer = new TileRenderer({
      state,
      transport,
      assets: registry.assets,
      assetIndexLookup: registry.assetIndexLookup,
      tileCache: registry.tileCache,
      priceHistory: registry.priceHistory,
    });

    this.scheduler = new UpdateScheduler(
      (batch) => this.renderer.renderBatch(batch),
      { perfLabel: "tileBatchFlush" },
    );
  }

  initializeDOMCache() {
    this.registry.initializeDOMCache();
  }

  resetPriceHistory(mode) {
    this.registry.resetPriceHistoryForMode(mode);
    this.markAllDirty();
  }

  markTileDirty(ticker) {
    const tile = this.state.getTile(ticker);
    if (tile) {
      tile.dirty = true;
    }
  }

  markAllDirty() {
    this.state.getAllTiles().forEach((tile) => {
      if (tile) {
        tile.dirty = true;
      }
    });
  }

  scheduleTileUpdate(ticker, index) {
    if (ticker) {
      this.scheduler.request(ticker, index);
    }
  }

  cancelScheduledUpdate(ticker) {
    if (ticker) {
      this.scheduler.cancel(ticker);
    }
  }

  flushScheduledUpdates() {
    this.scheduler.clear();
  }

  renderImmediate(ticker, index) {
    this.markTileDirty(ticker);
    this.cancelScheduledUpdate(ticker);
    this.renderer.renderTile(ticker, index);
  }

  renderAll() {
    const perfId = perfStart("paintAll");
    this.flushScheduledUpdates();
    this.markAllDirty();
    this.renderer.renderAll();
    perfEnd(perfId, this.registry.assets.length);
  }

  refreshDots() {
    this.renderer.refreshDots();
  }

  handleTileUpdated({ ticker, index }) {
    if (!ticker) return;
    const tile = this.state.getTile(ticker);
    if (tile) {
      tile.dirty = true;
    }

    let historyLength = 0;
    if (tile && tile.price != null) {
      historyLength = this.registry.appendPrice(
        ticker,
        tile.price,
        this.historyLength,
      );
    }

    const cacheIndex =
      typeof index === "number" ? index : this.registry.getAssetIndex(ticker);
    const cached =
      cacheIndex >= 0 ? this.registry.getCacheByIndex(cacheIndex) : undefined;

    if (cached) {
      if (
        cached.needsSparklineUpdate == null ||
        historyLength === 0 ||
        cached.lastHistoryLength !== historyLength
      ) {
        cached.needsSparklineUpdate = true;
      }
      if (historyLength > 0) {
        cached.lastHistoryLength = historyLength;
      }
    }

    this.scheduler.request(ticker, cacheIndex);
  }

  handleTilesBatchUpdated({ tickers }) {
    if (!tickers || !Array.isArray(tickers)) return;

    const perfId = perfStart("handleTilesBatch");

    tickers.forEach(({ ticker, index }) => {
      if (!ticker) return;

      const tile = this.state.getTile(ticker);
      if (tile) {
        tile.dirty = true;
      }

      let historyLength = 0;
      if (tile && tile.price != null) {
        historyLength = this.registry.appendPrice(
          ticker,
          tile.price,
          this.historyLength,
        );
      }

      const cacheIndex =
        typeof index === "number" ? index : this.registry.getAssetIndex(ticker);
      const cached =
        cacheIndex >= 0 ? this.registry.getCacheByIndex(cacheIndex) : undefined;

      if (cached) {
        if (
          cached.needsSparklineUpdate == null ||
          historyLength === 0 ||
          cached.lastHistoryLength !== historyLength
        ) {
          cached.needsSparklineUpdate = true;
        }
        if (historyLength > 0) {
          cached.lastHistoryLength = historyLength;
        }
      }

      this.scheduler.request(ticker, cacheIndex);
    });

    perfEnd(perfId, tickers.length);
  }
}
