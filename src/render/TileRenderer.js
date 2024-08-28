import { CONFIG } from "../config.js";
import { perfStart, perfEnd } from "../utils/perfHelpers.js";

export class TileRenderer {
  constructor({ state, transport, assets, assetIndexLookup, tileCache, priceHistory }) {
    this.state = state;
    this.transport = transport;
    this.assets = assets;
    this.assetIndexLookup = assetIndexLookup;
    this.tileCache = tileCache;
    this.priceHistory = priceHistory;
  }

  setTransport(transport) {
    this.transport = transport;
  }

  renderBatch(items = []) {
    items.forEach(({ ticker, index }) => {
      this.renderTile(ticker, index);
    });
  }

  renderAll() {
    this.assets.forEach((asset, index) => {
      this.renderTile(asset.ticker, index);
    });
  }

  refreshDots() {
    const perfId = perfStart("renderAllDots");
    let count = 0;
    this.tileCache.forEach((cached, index) => {
      const asset = this.assets[index];
      if (asset) {
        this._updateDotState(cached, asset.ticker);
      }
      count++;
    });
    perfEnd(perfId, count);
  }

  renderTile(ticker, indexHint = undefined) {
    if (!ticker) return;
    const tile = this.state.getTile(ticker);
    if (!tile) return;

    const index =
      typeof indexHint === "number"
        ? indexHint
        : this.assetIndexLookup?.get(ticker) ?? -1;
    if (index === -1) return;

    const cached = this.tileCache.get(index);
    if (!cached) return;

    if (tile.dirty === false && cached.lastTileState === cached.element.dataset.state) {
      return;
    }

    const perfId = perfStart("paintTile");
    const mode = this.state.getMode();

    try {
      let priceChanged = false;

      if (cached.price) {
        if (tile.price != null) {
          const priceValue = tile.price;
          const priceText = `$${priceValue.toFixed(2)}`;
          if (cached.lastPriceValue !== priceValue) {
            priceChanged = true;
          }
          if (cached.lastPriceText !== priceText) {
            cached.price.textContent = priceText;
            cached.lastPriceText = priceText;
          }
          cached.lastPriceValue = priceValue;
        } else {
          if (cached.lastPriceValue != null) {
            priceChanged = true;
          }
          const placeholder = mode === "real" ? "---" : "$0.00";
          if (cached.lastPriceText !== placeholder) {
            cached.price.textContent = placeholder;
            cached.lastPriceText = placeholder;
          }
          cached.lastPriceValue = null;
        }
      } else {
        cached.lastPriceValue = tile.price ?? null;
      }

      if (cached.change) {
        if (tile.change != null) {
          const changeValue = tile.change;
          const changeText = `${changeValue > 0 ? "+" : ""}${changeValue.toFixed(2)}%`;
          if (cached.lastChangeText !== changeText) {
            cached.change.textContent = changeText;
            cached.lastChangeText = changeText;
          }
          // Apply positive/negative classes for arrow display
          if (changeValue > 0) {
            cached.change.classList.remove("negative");
            cached.change.classList.add("positive");
          } else if (changeValue < 0) {
            cached.change.classList.remove("positive");
            cached.change.classList.add("negative");
          } else {
            cached.change.classList.remove("positive", "negative");
          }
          cached.lastChangeValue = changeValue;
        } else {
          const placeholder = mode === "real" ? "---" : "0.00%";
          if (cached.lastChangeText !== placeholder) {
            cached.change.textContent = placeholder;
            cached.lastChangeText = placeholder;
          }
          cached.change.classList.remove("positive", "negative");
          cached.lastChangeValue = null;
        }
      } else {
        cached.lastChangeValue = tile.change ?? null;
      }

      const derivedState = this._deriveTileState(tile.change);
      if (derivedState !== cached.lastTileState) {
        this._updateTileClasses(cached.element, derivedState);
        cached.lastTileState = derivedState;
      }

      this._updateDotState(cached, ticker);

      if (priceChanged) {
        cached.needsSparklineUpdate = true;
      }
      if (cached.canvas && (cached.needsSparklineUpdate || cached.needsSparklineUpdate == null)) {
        this._updateSparkline(cached.canvas, ticker);
        cached.needsSparklineUpdate = false;
        const history = this.priceHistory.get(ticker);
        if (history) {
          cached.lastHistoryLength = history.length;
        }
      }
    } finally {
      tile.dirty = false;
      perfEnd(perfId);
    }
  }

  _updateTileClasses(element, nextState) {
    const perfId = perfStart("updateTileClasses");
    const current = element.dataset.state || "neutral";

    // CRITICAL: Don't touch classes if state hasn't changed - preserves CSS animations!
    if (current === nextState) {
      perfEnd(perfId);
      return;
    }

    element.classList.remove(
      "gaining",
      "gaining-strong",
      "losing",
      "losing-strong",
      "neutral",
    );

    element.classList.add(nextState);
    element.dataset.state = nextState;

    this._animateTileStateChange(element);
    perfEnd(perfId);
  }

  _deriveTileState(change) {
    const thresholds = CONFIG.UI.THRESHOLDS;
    if (change == null) return "neutral";
    if (change > thresholds.STRONG_GAIN) return "gaining-strong";
    if (change > thresholds.MILD_GAIN) return "gaining";
    if (change < thresholds.STRONG_LOSS) return "losing-strong";
    if (change < thresholds.MILD_LOSS) return "losing";
    return "neutral";
  }

  _animateTileStateChange(element) {
    if (!element) return;

    if (element._stateChangeTimeout) {
      clearTimeout(element._stateChangeTimeout);
    }

    element.classList.remove("tile-state-change");
    void element.offsetWidth;
    element.classList.add("tile-state-change");

    element._stateChangeTimeout = setTimeout(() => {
      element.classList.remove("tile-state-change");
      element._stateChangeTimeout = null;
    }, 450);
  }

  _updateDotState(cached, ticker) {
    const dot = cached.dot || cached.element.querySelector(".status-dot");
    if (!dot) return;

    let state = this.transport ? this.transport.computeDotState(ticker) : null;
    if (!state && this.state) {
      state = this.state.getMode() === "simulation" ? "standby" : null;
    }
    if (!state) return;

    const previous = cached.lastDotState || dot.dataset.state || "";

    if (state !== previous) {
      dot.classList.remove("standby", "open", "closed", "pulsing");
      dot.classList.add(state);
      dot.dataset.state = state;
      cached.lastDotState = state;
    }

    if (state === "open") {
      dot.classList.add("pulsing");
    } else if (previous === "open") {
      dot.classList.remove("pulsing");
    }
  }

  _updateSparkline(canvas, ticker) {
    const perfId = perfStart("updateSparkline");
    const history = this.priceHistory.get(ticker) || [];
    const length = history.length;
    if (length < 2) {
      perfEnd(perfId);
      return;
    }

    let ctx = canvas.__ctx;
    if (!ctx) {
      ctx = canvas.getContext("2d");
      canvas.__ctx = ctx;
    }
    if (!ctx) {
      perfEnd(perfId);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = canvas.clientWidth || canvas.offsetWidth || canvas.width;
    const logicalHeight = canvas.clientHeight || canvas.offsetHeight || canvas.height;
    if (!logicalWidth || !logicalHeight) {
      perfEnd(perfId);
      return;
    }
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

    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < length; i++) {
      const value = history[i];
      if (value < min) min = value;
      if (value > max) max = value;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      perfEnd(perfId);
      return;
    }

    const range = max - min || 1;
    const invSpan = length > 1 ? 1 / (length - 1) : 0;

    const tile = this.state.getTile(ticker);
    const tileElement = canvas.closest(".asset-tile");
    const tileState = tileElement?.dataset.state || "";
    let change = tile && tile.change != null ? tile.change : null;
    if (change != null && typeof change !== "number") {
      const parsed = Number.parseFloat(change);
      change = Number.isNaN(parsed) ? null : parsed;
    }

    let trend = null;
    if (tileState === "gaining" || tileState === "gaining-strong") {
      trend = "up";
    } else if (tileState === "losing" || tileState === "losing-strong") {
      trend = "down";
    } else if (change != null) {
      if (change > 0.0001) trend = "up";
      else if (change < -0.0001) trend = "down";
    }

    let strokeColor = "#1cc16b";
    if (trend === "down") {
      strokeColor = "#ef4444";
    } else if (trend === null) {
      strokeColor = "rgba(226, 232, 240, 0.85)";
    }

    const lineThickness = Math.max(2, logicalHeight / 14);
    ctx.lineWidth = lineThickness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = strokeColor;
    let shadowColor = "rgba(28, 193, 107, 0.35)";
    if (trend === "down") {
      shadowColor = "rgba(239, 68, 68, 0.3)";
    } else if (trend === null) {
      shadowColor = "rgba(148, 163, 184, 0.35)";
    }
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = Math.min(8, lineThickness * 2.2);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.beginPath();

    const heightScale = logicalHeight / range;
    for (let i = 0; i < length; i++) {
      const ratio = i * invSpan;
      const price = history[i];
      const x = ratio * logicalWidth;
      const y = logicalHeight - (price - min) * heightScale;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    perfEnd(perfId, length);
  }
}
