/**
 * FinnhubTransport - Main transport facade
 * Orchestrates WebSocket, REST, and Market Status services
 * Single entry point for all Finnhub data operations
 */

import { EventEmitter } from '../core/EventEmitter.js';
import { WebSocketClient } from './WebSocketClient.js';
import { RESTClient } from './RESTClient.js';
import { MarketStatusService } from '../services/MarketStatusService.js';
import { CONFIG, getExchangeForTicker, shouldUseProxy } from '../config.js';
import { logger } from '../utils/Logger.js';

const log = logger.child('Transport');

/**
 * Transport strategy preferences
 */
const Strategy = {
  WS_PREFERRED: 'ws_preferred',      // Try WS first, fallback to REST
  WS_ONLY: 'ws_only',                // Only use WebSocket
  REST_ONLY: 'rest_only'             // Only use REST
};

export class FinnhubTransport extends EventEmitter {
  constructor(apiKey, stateManager) {
    super();

    const useProxy = shouldUseProxy();
    if (!apiKey && !useProxy) {
      log.warn('No API key provided at initialization');
    }

    this.stateManager = stateManager;
    this.apiKey = apiKey;
    
    // Initialize transport clients
    this.ws = new WebSocketClient(apiKey);
    this.rest = new RESTClient(apiKey);
    this.marketStatus = new MarketStatusService(this.rest, stateManager);
    
    // Operating state
    this.isRunning = false;
    this.strategy = Strategy.WS_PREFERRED;
    this.subscribedTickers = new Set();

    // REST fallback scheduler (if WS fails)
    this.restFallbackInterval = null;
    this.restFallbackIntervalMs = 30000; // 30 seconds

    // Sequential fetching state
    this.sequentialFetchInProgress = false;
    this.sequentialFetchQueue = [];

    // Wire up event handlers
    this._setupEventHandlers();
  }

  /**
   * Set or update API key for all clients
   * @param {string} apiKey
   */
  setApiKey(apiKey) {
    if (this.apiKey !== apiKey) {
      this.apiKey = apiKey;
      this.ws.setApiKey(apiKey);
      this.rest.setApiKey(apiKey);
      
      log.info('API key updated across all clients');
      
      // Reconnect if running
      if (this.isRunning) {
        log.info('Reconnecting with new API key...');
        this.restart();
      }
    }
  }

  /**
   * Get current API key
   * @returns {string}
   */
  getApiKey() {
    return this.apiKey;
  }

  /**
   * Start transport services
   * @param {string[]} tickers - Array of tickers to subscribe to
   */
  start(tickers = []) {
    if (this.isRunning) {
      log.warn('Transport already running');
      return;
    }

    const useProxy = shouldUseProxy();
    if (!this.apiKey && !useProxy) {
      log.error('Cannot start: no API key set');
      this.emit('error', { code: 'NO_API_KEY', message: 'API key required' });
      return;
    }

    log.info('Starting transport services...');
    this.isRunning = true;

    // Store tickers for subscription
    this.subscribedTickers = new Set(tickers);

    // Start sequential initial fetch (REST) to populate data
    // Priority: tickers without data first
    if (this.rest.isAvailable() && this.strategy !== Strategy.REST_ONLY) {
      this._startSequentialFetch(Array.from(this.subscribedTickers));
    }

    // Start WebSocket (primary data source) - will run alongside REST fetch
    if (this.strategy !== Strategy.REST_ONLY) {
      this._startWebSocket();
    }

    // Start market status polling (if REST available)
    if (this.rest.isAvailable() && this.strategy !== Strategy.WS_ONLY) {
      this.marketStatus.start(Array.from(this.subscribedTickers));
    }

    this.emit('started', { tickers: Array.from(this.subscribedTickers) });
  }

  /**
   * Stop all transport services
   */
  stop() {
    if (!this.isRunning) {
      log.warn('Transport not running');
      return;
    }

    log.info('Stopping transport services...');
    this.isRunning = false;

    // Stop WebSocket
    this.ws.stop();

    // Stop market status polling
    this.marketStatus.stop();

    // Stop REST fallback
    this._stopRestFallback();

    // Stop sequential fetch
    this.sequentialFetchInProgress = false;
    this.sequentialFetchQueue = [];

    // Abort any in-flight REST requests
    this.rest.abortAll();

    this.emit('stopped', {});
  }

  /**
   * Restart transport (useful after API key change)
   */
  restart() {
    const tickers = Array.from(this.subscribedTickers);
    this.stop();
    setTimeout(() => this.start(tickers), 500);
  }

  /**
   * Subscribe to additional ticker(s)
   * @param {string | string[]} tickers
   */
  subscribe(tickers) {
    const tickerArray = Array.isArray(tickers) ? tickers : [tickers];
    
    tickerArray.forEach(ticker => {
      this.subscribedTickers.add(ticker);
    });

    // Subscribe via WebSocket if connected
    if (this.ws.isConnected()) {
      this.ws.subscribe(tickerArray);
    }

    log.info(`Subscribed to: ${tickerArray.join(', ')}`);
  }

  /**
   * Unsubscribe from ticker(s)
   * @param {string | string[]} tickers
   */
  unsubscribe(tickers) {
    const tickerArray = Array.isArray(tickers) ? tickers : [tickers];
    
    tickerArray.forEach(ticker => {
      this.subscribedTickers.delete(ticker);
    });

    // Unsubscribe via WebSocket if connected
    if (this.ws.isConnected()) {
      this.ws.unsubscribe(tickerArray);
    }

    log.info(`Unsubscribed from: ${tickerArray.join(', ')}`);
  }

  /**
   * Search Finnhub symbols via REST client
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchSymbols(query) {
    if (!this.rest) return [];
    return this.rest.searchSymbols(query);
  }

  /**
   * Replace desired ticker subscriptions without restarting
   * @param {string[]} tickers
   */
  setDesiredTickers(tickers = []) {
    this.subscribedTickers = new Set(tickers);
  }

  /**
   * Fetch a single quote via REST (strict mode)
   * @param {string} ticker
   * @returns {Promise<Object|null>}
   */
  async fetchQuoteDirect(ticker) {
    return this.rest.fetchQuote(ticker, undefined, { strict: true });
  }

  /**
   * Check if market is open for a ticker (deterministic logic)
   * Returns: true if open, false if closed, null if unknown
   * @param {string} ticker
   * @returns {boolean | null}
   */
  isMarketOpen(ticker) {
    const exchange = getExchangeForTicker(ticker);
    let isOpen = this.stateManager.getMarketStatus(exchange);

    // If we don't have market status from REST, use heuristic
    if (isOpen === null) {
      return this._heuristicMarketOpen(ticker);
    }

    return isOpen;
  }

  /**
   * Heuristic for market status when REST unavailable
   * Checks if recent trade activity suggests market is open
   * @private
   */
  _heuristicMarketOpen(ticker) {
    const tile = this.stateManager.getTile(ticker);
    
    if (!tile || !tile.hasInfo) {
      return null; // Unknown
    }

    // If we received a trade recently (< 5 min), likely open
    const isRecent = !this.stateManager.isTradeStale(
      ticker, 
      CONFIG.FINNHUB.TRADE_STALENESS_MS
    );

    return isRecent ? true : null;
  }

  /**
   * Compute dot state for a ticker (for UI)
   * @param {string} ticker
   * @returns {'standby' | 'open' | 'closed'}
   */
  computeDotState(ticker) {
    const tile = this.stateManager.getTile(ticker);
    const mode = this.stateManager.getMode();

    // In simulation, all dots are "open" (pulsing)
    if (mode === 'simulation') {
      return 'standby'; // Actually should be styled as open in sim mode
    }

    // In real mode: check if we have info
    if (!tile || !tile.hasInfo) {
      return 'standby'; // Orange: no info yet
    }

    // We have info: check market status
    const marketOpen = this.isMarketOpen(ticker);

    if (marketOpen === null) {
      // Unknown market status - use standby
      return 'standby';
    }

    return marketOpen ? 'open' : 'closed';
  }

  /**
   * Start WebSocket connection
   * @private
   */
  _startWebSocket() {
    log.info('Starting WebSocket...');
    
    // Connect
    this.ws.connect();

    // Wait for connection, then subscribe
    this.ws.once('connected', () => {
      const tickers = Array.from(this.subscribedTickers);
      if (tickers.length > 0) {
        log.info(`Subscribing to ${tickers.length} ticker(s)...`);
        this.ws.subscribe(tickers);
      }
    });
  }

  /**
   * Start REST fallback polling (when WS unavailable)
   * @private
   */
  _startRestFallback() {
    if (this.restFallbackInterval) return;
    if (!this.rest.isAvailable()) {
      log.warn('Cannot start REST fallback: REST unavailable (likely file:// origin)');
      return;
    }

    log.warn('Starting REST fallback polling (WebSocket unavailable)');

    const poll = async () => {
      if (!this.isRunning) return;

      const controller = this.rest.createAbortController();
      const tickers = Array.from(this.subscribedTickers);

      try {
        const quotes = await this.rest.fetchQuoteBatch(tickers, controller.signal);
        
        // Process quotes
        quotes.forEach(quote => {
          this._handleQuote(quote, 'rest');
        });

      } catch (error) {
        log.error('REST fallback poll failed:', error.message);
      }
    };

    // Poll immediately, then at intervals
    poll();
    this.restFallbackInterval = setInterval(poll, this.restFallbackIntervalMs);
  }

  /**
   * Stop REST fallback polling
   * @private
   */
  _stopRestFallback() {
    if (this.restFallbackInterval) {
      clearInterval(this.restFallbackInterval);
      this.restFallbackInterval = null;
      log.info('REST fallback polling stopped');
    }
  }

  /**
   * Start sequential REST fetch for initial data population
   * Uses batch processing for better performance
   * @private
   */
  _startSequentialFetch(tickers) {
    if (this.sequentialFetchInProgress) {
      log.warn('Sequential fetch already in progress');
      return;
    }

    // Sort tickers by priority: those without data first
    const sortedTickers = tickers.sort((a, b) => {
      const tileA = this.stateManager.getTile(a);
      const tileB = this.stateManager.getTile(b);

      // Priority 1: Tickers without any data
      const hasDataA = tileA && tileA.hasInfo;
      const hasDataB = tileB && tileB.hasInfo;

      if (!hasDataA && hasDataB) return -1; // A before B
      if (hasDataA && !hasDataB) return 1;  // B before A

      // Priority 2: Alphabetical
      return a.localeCompare(b);
    });

    this.sequentialFetchQueue = [...sortedTickers];
    this.sequentialFetchInProgress = true;

    log.info(`Starting batch fetch for ${sortedTickers.length} tickers (${Math.ceil(sortedTickers.length / 5)} batches)`);

    // Start processing queue with batch optimization
    this._processBatchFetchQueue();
  }

  /**
   * Process fetch queue in batches for better performance
   * Fetches 5 tickers in parallel, then waits 1.1s before next batch
   * @private
   */
  async _processBatchFetchQueue() {
    const BATCH_SIZE = 5;
    const BATCH_DELAY_MS = 1100; // 1.1s between batches

    while (this.isRunning && this.sequentialFetchQueue.length > 0) {
      // Get next batch of tickers
      const batch = [];
      for (let i = 0; i < BATCH_SIZE && this.sequentialFetchQueue.length > 0; i++) {
        const ticker = this.sequentialFetchQueue.shift();

        // Skip if already has data
        const tile = this.stateManager.getTile(ticker);
        if (tile && tile.hasInfo) {
          log.debug(`Skipping ${ticker} - already has data`);
          continue;
        }

        batch.push(ticker);
      }

      if (batch.length === 0) continue;

      log.debug(`Fetching batch of ${batch.length} tickers...`);

      // Fetch batch in parallel
      const results = await Promise.allSettled(
        batch.map(ticker => this.rest.fetchQuote(ticker))
      );

      // Process results
      results.forEach((result, index) => {
        const ticker = batch[index];
        if (result.status === 'fulfilled' && result.value) {
          this._handleQuote(result.value, 'rest-batch');
        } else {
          log.warn(`Failed to fetch ${ticker}:`, result.reason?.message || 'Unknown error');
        }
      });

      // Wait before next batch (only if more items to process)
      if (this.sequentialFetchQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    this.sequentialFetchInProgress = false;
    log.info('Batch fetch completed');
  }

  /**
   * Setup event handlers for child services
   * @private
   */
  _setupEventHandlers() {
    // === WebSocket Events ===
    
    this.ws.on('connected', () => {
      log.info('WebSocket connected');
      this.emit('ws:connected', {});
      
      // Stop REST fallback if it was running
      this._stopRestFallback();
    });

    this.ws.on('disconnected', (data) => {
      log.warn('WebSocket disconnected:', data.reason);
      this.emit('ws:disconnected', data);
      
      // Start REST fallback if WS stays down
      setTimeout(() => {
        if (!this.ws.isConnected() && this.isRunning) {
          this._startRestFallback();
        }
      }, 5000); // Wait 5s before falling back to REST
    });

    this.ws.on('trade', (trade) => {
      this._handleQuote(trade, 'ws');
    });

    this.ws.on('error', (error) => {
      log.error('WebSocket error:', error.message);
      this.emit('error', { source: 'ws', ...error });
    });

    // === REST Events ===

    this.rest.on('rate_limited', (data) => {
      log.warn(`REST rate limited: backoff until ${new Date(data.backoffUntil).toISOString()}`);
      this.emit('rest:rate_limited', data);
    });

    this.rest.on('error', (error) => {
      log.error('REST error:', error.message);
      this.emit('error', { source: 'rest', ...error });
    });

    // === Market Status Events ===
    
    this.marketStatus.on('status', (data) => {
      // Market status changed - emit for UI updates
      this.emit('market:status', data);
    });
  }

  /**
   * Handle incoming quote data (from WS or REST)
   * @private
   */
  _handleQuote(quoteData, source) {
    const { ticker, price, previousClose, changePercent, timestamp } = quoteData;

    if (!ticker || price == null) {
      log.debug('Invalid quote data received');
      return;
    }

    // Update state manager
    this.stateManager.updateTile(ticker, {
      price,
      previousClose,
      changePercent,
      high: quoteData.high,
      low: quoteData.low,
      open: quoteData.open,
      volume: quoteData.volume,
      timestamp
    });

    // Emit quote event for UI
    this.emit('quote', {
      ticker,
      price,
      change: changePercent,
      source,
      timestamp
    });
  }

  /**
   * Get connection status summary
   * @returns {Object}
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      websocket: {
        connected: this.ws.isConnected(),
        state: this.ws.getState()
      },
      rest: {
        available: this.rest.isAvailable(),
        backoff: this.rest.getBackoffStatus()
      },
      subscribedCount: this.subscribedTickers.size,
      strategy: this.strategy
    };
  }

  /**
   * Set transport strategy
   * @param {'ws_preferred' | 'ws_only' | 'rest_only'} strategy
   */
  setStrategy(strategy) {
    if (!Object.values(Strategy).includes(strategy)) {
      log.warn(`Invalid strategy: ${strategy}`);
      return;
    }

    this.strategy = strategy;
    log.info(`Transport strategy set to: ${strategy}`);

    // Restart if running to apply new strategy
    if (this.isRunning) {
      this.restart();
    }
  }
}

// Export Strategy enum
export { Strategy };
