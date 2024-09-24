import { EventEmitter } from '../core/EventEmitter.js';
import { WebSocketClient } from './WebSocketClient.js';
import { RESTClient } from './RESTClient.js';
import { MarketStatusService } from '../services/MarketStatusService.js';
import { CONFIG, getExchangeForTicker, shouldUseProxy } from '../config.js';
import { logger } from '../utils/Logger.js';

const log = logger.child('Transport');

const Strategy = {
  WS_PREFERRED: 'ws_preferred',
  WS_ONLY: 'ws_only',
  REST_ONLY: 'rest_only',
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
    
    this.ws = new WebSocketClient(apiKey);
    this.rest = new RESTClient(apiKey);
    this.marketStatus = new MarketStatusService(this.rest, stateManager);
    
    this.isRunning = false;
    this.strategy = Strategy.WS_PREFERRED;
    this.subscribedTickers = new Set();

    this.restFallbackInterval = null;
    this.restFallbackIntervalMs = 30000;

    this.sequentialFetchInProgress = false;
    this.sequentialFetchQueue = [];

    this._setupEventHandlers();
  }

  setApiKey(apiKey) {
    if (this.apiKey !== apiKey) {
      this.apiKey = apiKey;
      this.ws.setApiKey(apiKey);
      this.rest.setApiKey(apiKey);
      
      log.info('API key updated across all clients');
      
      if (this.isRunning) {
        log.info('Reconnecting with new API key...');
        this.restart();
      }
    }
  }

  getApiKey() {
    return this.apiKey;
  }

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

    this.subscribedTickers = new Set(tickers);

    if (this.rest.isAvailable() && this.strategy !== Strategy.REST_ONLY) {
      this._startSequentialFetch(Array.from(this.subscribedTickers));
    }

    if (this.strategy !== Strategy.REST_ONLY) {
      this._startWebSocket();
    }

    if (this.rest.isAvailable() && this.strategy !== Strategy.WS_ONLY) {
      this.marketStatus.start(Array.from(this.subscribedTickers));
    }

    this.emit('started', { tickers: Array.from(this.subscribedTickers) });
  }

  stop() {
    if (!this.isRunning) {
      log.warn('Transport not running');
      return;
    }

    log.info('Stopping transport services...');
    this.isRunning = false;

    this.ws.stop();

    this.marketStatus.stop();

    this._stopRestFallback();

    this.sequentialFetchInProgress = false;
    this.sequentialFetchQueue = [];

    this.rest.abortAll();

    this.emit('stopped', {});
  }

  restart() {
    const tickers = Array.from(this.subscribedTickers);
    this.stop();
    setTimeout(() => this.start(tickers), 500);
  }

  subscribe(tickers) {
    const tickerArray = Array.isArray(tickers) ? tickers : [tickers];
    
    tickerArray.forEach(ticker => {
      this.subscribedTickers.add(ticker);
    });

    if (this.ws.isConnected()) {
      this.ws.subscribe(tickerArray);
    }

    log.info(`Subscribed to: ${tickerArray.join(', ')}`);
  }

  unsubscribe(tickers) {
    const tickerArray = Array.isArray(tickers) ? tickers : [tickers];
    
    tickerArray.forEach(ticker => {
      this.subscribedTickers.delete(ticker);
    });

    if (this.ws.isConnected()) {
      this.ws.unsubscribe(tickerArray);
    }

    log.info(`Unsubscribed from: ${tickerArray.join(', ')}`);
  }

  async searchSymbols(query, options = {}) {
    if (!this.rest) return [];
    return this.rest.searchSymbols(query, options);
  }

  async warmupTickers(tickers = [], retryCount = 0) {
    if (!Array.isArray(tickers) || tickers.length === 0) return;
    if (!this.rest) return;

    if (!this.rest.isAvailable()) {
      const backoff = this.rest.getBackoffStatus();
      if (backoff.inBackoff) {
        const delay = Math.max(100, backoff.remainingMs + 100);
        log.debug(`Warmup deferred for ${tickers.length} ticker(s) due to backoff; retrying in ${delay}ms`);
        setTimeout(() => this.warmupTickers(tickers, retryCount), delay);
      }
      return;
    }

    const unique = Array.from(new Set(tickers.filter(Boolean)));
    const toFetch = unique.filter((ticker) => {
      const tile = this.stateManager.getTile(ticker);
      return tile && !tile.hasInfo;
    });

    if (toFetch.length === 0) return;

    log.info(`Warming up ${toFetch.length} ticker(s) via REST`);

    const results = await Promise.allSettled(
      toFetch.map((ticker) => this.rest.fetchQuote(ticker, undefined, { suppressAuthErrors: true })),
    );

    const failed = [];
    results.forEach((result, index) => {
      const ticker = toFetch[index];
      if (result.status === "fulfilled" && result.value) {
        this._handleQuote(result.value, "rest-warmup");
      } else {
        failed.push(ticker);
        const reason =
          result.status === "rejected"
            ? result.reason?.message || "Unknown error"
            : "No data";
        log.warn(`Warmup failed for ${ticker}: ${reason}`);
      }
    });

    if (failed.length > 0 && retryCount < 3) {
      const delay = 1000 * (retryCount + 1);
      log.debug(`Retrying warmup for ${failed.length} ticker(s) in ${delay}ms`);
      setTimeout(() => this.warmupTickers(failed, retryCount + 1), delay);
    }
  }

  setDesiredTickers(tickers = []) {
    this.subscribedTickers = new Set(tickers);
  }

  async fetchQuoteDirect(ticker) {
    return this.rest.fetchQuote(ticker, undefined, { strict: true });
  }

  isMarketOpen(ticker) {
    const exchange = getExchangeForTicker(ticker);
    let isOpen = this.stateManager.getMarketStatus(exchange);

    if (isOpen === null) {
      return this._heuristicMarketOpen(ticker);
    }

    return isOpen;
  }

  _heuristicMarketOpen(ticker) {
    const tile = this.stateManager.getTile(ticker);
    
    if (!tile || !tile.hasInfo) {
      return null;
    }

    const isRecent = !this.stateManager.isTradeStale(
      ticker, 
      CONFIG.FINNHUB.TRADE_STALENESS_MS
    );

    return isRecent ? true : null;
  }

  computeDotState(ticker) {
    const tile = this.stateManager.getTile(ticker);
    const mode = this.stateManager.getMode();

    if (mode === 'simulation') {
      return 'standby';
    }

    if (!tile || !tile.hasInfo) {
      return 'standby';
    }

    const marketOpen = this.isMarketOpen(ticker);

    if (marketOpen === null) {
      return 'standby';
    }

    return marketOpen ? 'open' : 'closed';
  }

  _startWebSocket() {
    log.info('Starting WebSocket...');
    
    this.ws.connect();

    this.ws.once('connected', () => {
      const tickers = Array.from(this.subscribedTickers);
      if (tickers.length > 0) {
        log.info(`Subscribing to ${tickers.length} ticker(s)...`);
        this.ws.subscribe(tickers);
      }
    });
  }

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
        
        quotes.forEach(quote => {
          this._handleQuote(quote, 'rest');
        });

      } catch (error) {
        log.error('REST fallback poll failed:', error.message);
      }
    };

    poll();
    this.restFallbackInterval = setInterval(poll, this.restFallbackIntervalMs);
  }

  _stopRestFallback() {
    if (this.restFallbackInterval) {
      clearInterval(this.restFallbackInterval);
      this.restFallbackInterval = null;
      log.info('REST fallback polling stopped');
    }
  }

  _startSequentialFetch(tickers) {
    if (this.sequentialFetchInProgress) {
      log.warn('Sequential fetch already in progress');
      return;
    }

    const sortedTickers = tickers.sort((a, b) => {
      const tileA = this.stateManager.getTile(a);
      const tileB = this.stateManager.getTile(b);

      const hasDataA = tileA && tileA.hasInfo;
      const hasDataB = tileB && tileB.hasInfo;

      if (!hasDataA && hasDataB) return -1;
      if (hasDataA && !hasDataB) return 1;

      return a.localeCompare(b);
    });

    this.sequentialFetchQueue = [...sortedTickers];
    this.sequentialFetchInProgress = true;

    log.info(`Starting batch fetch for ${sortedTickers.length} tickers (${Math.ceil(sortedTickers.length / 5)} batches)`);

    this._processBatchFetchQueue();
  }

  async _processBatchFetchQueue() {
    const BATCH_SIZE = 5;
    const BATCH_DELAY_MS = 1100;

    while (this.isRunning && this.sequentialFetchQueue.length > 0) {
      const backoff = this.rest.getBackoffStatus();
      if (backoff.inBackoff) {
        const waitMs = Math.max(50, backoff.remainingMs + 50);
        log.debug(`Batch fetch paused for backoff (${Math.ceil(waitMs / 1000)}s)`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      const batch = [];
      for (let i = 0; i < BATCH_SIZE && this.sequentialFetchQueue.length > 0; i++) {
        const ticker = this.sequentialFetchQueue.shift();

        const tile = this.stateManager.getTile(ticker);
        if (tile && tile.hasInfo) {
          log.debug(`Skipping ${ticker} - already has data`);
          continue;
        }

        batch.push(ticker);
      }

      if (batch.length === 0) continue;

      log.debug(`Fetching batch of ${batch.length} tickers...`);

      const results = await Promise.allSettled(
        batch.map(ticker => this.rest.fetchQuote(ticker))
      );

      const retryTickers = [];
      results.forEach((result, index) => {
        const ticker = batch[index];
        if (result.status === 'fulfilled' && result.value) {
          this._handleQuote(result.value, 'rest-batch');
        } else {
          const msg = result.reason?.message || 'Unknown error';
          log.warn(`Failed to fetch ${ticker}: ${msg}`);

          const backoffStatus = this.rest.getBackoffStatus();
          if (backoffStatus.inBackoff || !result.value) {
            retryTickers.push(ticker);
          }
        }
      });

      if (retryTickers.length > 0) {
        this.sequentialFetchQueue.push(...retryTickers);
      }

      if (this.sequentialFetchQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    this.sequentialFetchInProgress = false;
    log.info('Batch fetch completed');
  }

  _setupEventHandlers() {
    this.ws.on('connected', () => {
      log.info('WebSocket connected');
      this.emit('ws:connected', {});
      
      this._stopRestFallback();
    });

    this.ws.on('disconnected', (data) => {
      log.warn('WebSocket disconnected:', data.reason);
      this.emit('ws:disconnected', data);
      
      setTimeout(() => {
        if (!this.ws.isConnected() && this.isRunning) {
          this._startRestFallback();
        }
      }, 5000);
    });

    this.ws.on('trade', (trade) => {
      this._handleQuote(trade, 'ws');
    });

    this.ws.on('error', (error) => {
      log.error('WebSocket error:', error.message);
      this.emit('error', { source: 'ws', ...error });
    });

    this.rest.on('rate_limited', (data) => {
      log.warn(`REST rate limited: backoff until ${new Date(data.backoffUntil).toISOString()}`);
      this.emit('rest:rate_limited', data);
    });

    this.rest.on('error', (error) => {
      log.error('REST error:', error.message);
      this.emit('error', { source: 'rest', ...error });
    });

    this.marketStatus.on('status', (data) => {
      this.emit('market:status', data);
    });
  }

  _handleQuote(quoteData, source) {
    const { ticker, price, previousClose, changePercent, timestamp } = quoteData;

    if (!ticker || price == null) {
      log.debug('Invalid quote data received');
      return;
    }

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

    this.emit('quote', {
      ticker,
      price,
      change: changePercent,
      source,
      timestamp
    });
  }

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

  setStrategy(strategy) {
    if (!Object.values(Strategy).includes(strategy)) {
      log.warn(`Invalid strategy: ${strategy}`);
      return;
    }

    this.strategy = strategy;
    log.info(`Transport strategy set to: ${strategy}`);

    if (this.isRunning) {
      this.restart();
    }
  }
}

export { Strategy };
