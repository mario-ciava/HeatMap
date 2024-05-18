/**
 * MarketStatusService - Manages market status polling for exchanges
 * Polls Finnhub REST API periodically to determine if markets are open
 */

import { EventEmitter } from '../core/EventEmitter.js';
import { CONFIG, getActiveExchanges } from '../config.js';
import { logger } from '../utils/Logger.js';

const log = logger.child('MarketStatus');

export class MarketStatusService extends EventEmitter {
  constructor(restClient, stateManager) {
    super();
    
    this.restClient = restClient;
    this.stateManager = stateManager;
    
    // Polling state
    this.pollInterval = null;
    this.pollIntervalMs = CONFIG.FINNHUB.RATE_LIMIT.MARKET_STATUS_INTERVAL;
    this.isPolling = false;
    
    // Cache of last check times per exchange
    this.lastCheckTimes = new Map();
    
    // Exchanges to monitor
    this.activeExchanges = new Set();
  }

  /**
   * Start polling market status
   * @param {string[]} tickers - Array of tickers to determine which exchanges to monitor
   */
  start(tickers) {
    if (this.isPolling) {
      log.warn('Already polling market status');
      return;
    }

    // Determine which exchanges we need to monitor
    this.activeExchanges = new Set(getActiveExchanges(tickers));
    
    log.info(`Starting market status polling for exchanges: ${Array.from(this.activeExchanges).join(', ')}`);

    this.isPolling = true;
    
    // Poll immediately, then at intervals
    this._pollAll();
    
    this.pollInterval = setInterval(() => {
      this._pollAll();
    }, this.pollIntervalMs);
  }

  /**
   * Stop polling market status
   */
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.isPolling = false;
    log.info('Market status polling stopped');
  }

  /**
   * Poll all active exchanges
   * @private
   */
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

    // Count successes
    const successes = results.filter(r => r.status === 'fulfilled' && r.value).length;
    log.debug(`Market status poll complete: ${successes}/${results.length} successful`);
  }

  /**
   * Poll single exchange
   * @private
   */
  async _pollExchange(exchange) {
    try {
      const status = await this.restClient.fetchMarketStatus(exchange);

      if (!status) {
        log.debug(`No status data for ${exchange}`);
        return false;
      }

      // Update state manager
      this.stateManager.setMarketStatus(exchange, status.isOpen);
      
      // Update last check time
      this.lastCheckTimes.set(exchange, Date.now());

      // Emit event
      this.emit('status', {
        exchange,
        isOpen: status.isOpen,
        session: status.session,
        timestamp: status.timestamp
      });

      log.debug(`${exchange}: ${status.isOpen ? '🟢 OPEN' : '🔴 CLOSED'} (${status.session})`);

      return true;

    } catch (error) {
      log.warn(`Failed to poll ${exchange}:`, error.message);
      return false;
    }
  }

  /**
   * Get cached market status for an exchange
   * Falls back to heuristic if cache is stale/unavailable
   * @param {string} exchange
   * @returns {boolean | null}
   */
  getStatus(exchange) {
    return this.stateManager.getMarketStatus(exchange);
  }

  /**
   * Force immediate poll of specific exchange
   * @param {string} exchange
   * @returns {Promise<boolean>}
   */
  async pollExchange(exchange) {
    return this._pollExchange(exchange);
  }

  /**
   * Get time since last successful check for an exchange
   * @param {string} exchange
   * @returns {number} Milliseconds since last check, or Infinity if never checked
   */
  getTimeSinceLastCheck(exchange) {
    const lastCheck = this.lastCheckTimes.get(exchange);
    return lastCheck ? Date.now() - lastCheck : Infinity;
  }

  /**
   * Check if exchange status is stale and needs refresh
   * @param {string} exchange
   * @param {number} [staleThresholdMs=300000] - Default 5 minutes
   * @returns {boolean}
   */
  isStatusStale(exchange, staleThresholdMs = 300000) {
    return this.getTimeSinceLastCheck(exchange) > staleThresholdMs;
  }
}
