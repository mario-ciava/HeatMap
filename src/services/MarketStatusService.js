import { EventEmitter } from '../core/EventEmitter.js';
import { CONFIG, getActiveExchanges } from '../config.js';
import { logger } from '../utils/Logger.js';

const log = logger.child('MarketStatus');

export class MarketStatusService extends EventEmitter {
  constructor(restClient, stateManager) {
    super();
    
    this.restClient = restClient;
    this.stateManager = stateManager;
    
    this.pollInterval = null;
    this.pollIntervalMs = CONFIG.FINNHUB.RATE_LIMIT.MARKET_STATUS_INTERVAL;
    this.isPolling = false;
    
    this.lastCheckTimes = new Map();
    
    this.activeExchanges = new Set();
  }

  start(tickers) {
    if (this.isPolling) {
      log.warn('Already polling market status');
      return;
    }

    this.activeExchanges = new Set(getActiveExchanges(tickers));
    
    log.info(`Starting market status polling for exchanges: ${Array.from(this.activeExchanges).join(', ')}`);

    this.isPolling = true;
    
    this._pollAll();
    
    this.pollInterval = setInterval(() => {
      this._pollAll();
    }, this.pollIntervalMs);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.isPolling = false;
    log.info('Market status polling stopped');
  }

  async _pollAll() {
    if (!this.restClient.isAvailable()) {
      log.debug('REST client unavailable, skipping market status poll');
      return;
    }

    log.debug(`Polling ${this.activeExchanges.size} exchange(s)...`);

    const promises = Array.from(this.activeExchanges).map(exchange => 
      this._pollExchange(exchange)
    );

    const results = await Promise.allSettled(promises);

    const successes = results.filter(r => r.status === 'fulfilled' && r.value).length;
    log.debug(`Market status poll complete: ${successes}/${results.length} successful`);
  }

  async _pollExchange(exchange) {
    try {
      const status = await this.restClient.fetchMarketStatus(exchange);

      if (!status) {
        log.debug(`No status data for ${exchange}`);
        return false;
      }

      this.stateManager.setMarketStatus(exchange, status.isOpen);
      
      this.lastCheckTimes.set(exchange, Date.now());

      this.emit('status', {
        exchange,
        isOpen: status.isOpen,
        session: status.session,
        timestamp: status.timestamp
      });

      log.debug(`${exchange}: ${status.isOpen ? 'OPEN' : 'CLOSED'} (${status.session})`);

      return true;

    } catch (error) {
      log.warn(`Failed to poll ${exchange}:`, error.message);
      return false;
    }
  }

  getStatus(exchange) {
    return this.stateManager.getMarketStatus(exchange);
  }

  async pollExchange(exchange) {
    return this._pollExchange(exchange);
  }

  getTimeSinceLastCheck(exchange) {
    const lastCheck = this.lastCheckTimes.get(exchange);
    return lastCheck ? Date.now() - lastCheck : Infinity;
  }

  isStatusStale(exchange, staleThresholdMs = 300000) {
    return this.getTimeSinceLastCheck(exchange) > staleThresholdMs;
  }
}
