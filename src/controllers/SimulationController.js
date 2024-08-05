import { CONFIG } from "../config.js";
import { perfStart, perfEnd } from "../utils/perfHelpers.js";

export class SimulationController {
  constructor({ state, transport, tileController, assets }) {
    this.state = state;
    this.transport = transport;
    this.tileController = tileController;
    this.assets = assets;

    this.simulationInterval = null;
  }

  start(simulationFrequency = CONFIG.UI.UPDATE_FREQUENCY) {
    if (this.simulationInterval) return;

    const perfId = perfStart("simulation:start");
    this.simulationInterval = setInterval(() => {
      this._tick();
    }, simulationFrequency);
    perfEnd(perfId);
  }

  stop() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  isRunning() {
    return this.simulationInterval !== null;
  }

  setFrequency(ms) {
    if (Number.isNaN(ms) || ms <= 0) return;
    const clamped = Math.max(100, ms);
    if (this.isRunning()) {
      this.stop();
      this.start(clamped);
    }
    return clamped;
  }

  startTransport(tickers) {
    this.transport.start(tickers);
  }

  stopTransport() {
    this.transport.stop();
  }

  _tick() {
    const perfId = perfStart("updateSimulation");
    const now = Date.now();
    const momentumBase = now / 10000;
    const volatilityOscillation = Math.sin(now / 5000) * CONFIG.UI.VOLATILITY.AMPLITUDE;
    const baseVolatility =
      (CONFIG.UI.VOLATILITY.BASE + volatilityOscillation) * CONFIG.UI.VOLATILITY.USER_MULTIPLIER;

    let processed = 0;

    this.assets.forEach((asset, index) => {
      const tile = this.state.getTile(asset.ticker);
      if (!tile) return;

      // Ensure base values
      if (tile.basePrice == null) {
        tile.basePrice = tile._placeholderBasePrice;
      }
      if (tile.change == null) {
        tile.change = 0;
      }

      const momentum = Math.sin(momentumBase + index) * 0.3;
      const randomFactor = (Math.random() - 0.5) * 2;
      const changeAmount = (momentum + randomFactor) * baseVolatility;
      tile.change += changeAmount;
      tile.change *= 0.98; // mean reversion
      tile.change = Math.max(-10, Math.min(10, tile.change));

      tile.price = tile.basePrice * (1 + tile.change / 100);

      if (tile.open == null) {
        tile.open = tile._placeholderPrice;
      }
      if (tile.previousClose == null) {
        tile.previousClose = tile._placeholderBasePrice;
      }

      tile.high = tile.high != null ? Math.max(tile.high, tile.price) : tile.price;
      tile.low = tile.low != null ? Math.min(tile.low, tile.price) : tile.price;
      tile.volume = Math.min((tile.volume || 0) + Math.abs(changeAmount) * 850, 5_000_000);
      tile.lastTradeTs = now;
      tile.hasInfo = true;
      tile.dirty = true;

      this.state.emit("tile:updated", { ticker: asset.ticker, index });
      processed++;
    });

    perfEnd(perfId, processed);
  }
}
