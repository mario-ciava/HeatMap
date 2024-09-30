import { EventEmitter } from '../core/EventEmitter.js';
import { CONFIG, getApiEndpoints } from '../config.js';
import { logger } from '../utils/Logger.js';

const log = logger.child('REST');

export class RESTClient extends EventEmitter {
  constructor(apiKey) {
    super();

    this.apiKey = apiKey;

    const endpoints = getApiEndpoints();
    this.baseUrl = endpoints.restBase;
    this.useProxy = endpoints.useProxy;
    
    this.requestCount = 0;
    this.requestWindow = Date.now();
    this.maxRequestsPerMinute = CONFIG.FINNHUB.RATE_LIMIT.MAX_CALLS_PER_MINUTE;
    
    this.backoffUntil = 0;
    this.backoffDelay = 0;
    
    this.activeRequests = 0;
    this.maxConcurrent = 5;
    this.requestQueue = [];
    
    this.abortController = null;
    
    this.isHttpOrigin = /^https?:$/i.test(location.protocol);
    
    if (!this.isHttpOrigin) {
      log.warn('Running from file:// - REST endpoints disabled to avoid CORS');
    }
  }

  setApiKey(apiKey) {
    if (this.apiKey !== apiKey) {
      this.apiKey = apiKey;
      log.info('API key updated');
    }
  }

  isAvailable() {
    if (!this.isHttpOrigin) return false;
    if (this.backoffUntil > Date.now()) return false;
    return true;
  }

  async fetchQuote(ticker, signal, options = {}) {
    if (!this.isAvailable()) {
      log.debug(`REST unavailable for ${ticker}`);
      return null;
    }

    const endpoint = `/quote?symbol=${encodeURIComponent(ticker)}`;

    try {
      const data = await this._request(endpoint, signal, options);

      if (!data || typeof data.c !== 'number') {
        return null;
      }

      let changePercent = data.dp;
      let basePrice = data.pc;

      if (changePercent == null) {
        if (data.pc != null && data.pc > 0) {
          changePercent = ((data.c - data.pc) / data.pc) * 100;
          basePrice = data.pc;
        }
        else if (data.o != null && data.o > 0) {
          changePercent = ((data.c - data.o) / data.o) * 100;
          basePrice = data.o;
        }
        else {
          changePercent = 0;
          basePrice = data.c;
        }
      }

      const rawTs = Number(data.t ?? data.timestamp ?? data.T ?? 0);
      const timestamp =
        Number.isFinite(rawTs) && rawTs > 0
          ? (rawTs < 2_000_000_000 ? rawTs * 1000 : rawTs)
          : Date.now();

      return {
        ticker,
        price: data.c,
        previousClose: basePrice,
        changePercent,
        high: data.h,
        low: data.l,
        open: data.o,
        timestamp
      };

    } catch (error) {
      if (options.strict) {
        throw error;
      }
      if (error.name !== 'AbortError') {
        log.warn(`Failed to fetch quote for ${ticker}:`, error.message);
      }
      return null;
    }
  }

  async searchSymbols(query, options = {}) {
    const { signal } = options;
    if (!this.isAvailable()) {
      throw new Error('REST unavailable for search');
    }

    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 2) {
      return [];
    }

    const endpoint = `/search?q=${encodeURIComponent(trimmed)}`;
    const data = await this._request(endpoint, signal, options);
    return Array.isArray(data?.result) ? data.result : [];
  }

  async fetchMarketStatus(exchange, signal, options = {}) {
    if (!this.isAvailable()) {
      log.debug(`REST unavailable for market status ${exchange}`);
      return null;
    }

    const endpoint = `/stock/market-status?exchange=${encodeURIComponent(exchange)}`;
    
    try {
      const data = await this._request(endpoint, signal, options);
      
      if (!data) return null;

      const isOpen = 
        data.isOpen === true || 
        data.market === 'open' || 
        data.session === 'open';

      return {
        exchange,
        isOpen,
        session: data.market || data.session || 'unknown',
        timezone: data.timezone,
        raw: data,
        timestamp: Date.now()
      };

    } catch (error) {
      if (error.name !== 'AbortError') {
        log.warn(`Failed to fetch market status for ${exchange}:`, error.message);
      }
      return null;
    }
  }

  async fetchQuoteBatch(tickers, signal) {
    if (!this.isAvailable()) {
      log.debug('REST unavailable for batch fetch');
      return [];
    }

    log.info(`Fetching batch of ${tickers.length} quotes...`);

    const results = [];
    let processed = 0;

    const processTicker = async (ticker) => {
      const quote = await this.fetchQuote(ticker, signal);
      processed++;
      
      if (quote) {
        results.push(quote);
      }

      if (processed % 10 === 0 || processed === tickers.length) {
        log.debug(`Batch progress: ${processed}/${tickers.length}`);
      }
    };

    const chunks = [];
    for (let i = 0; i < tickers.length; i += this.maxConcurrent) {
      chunks.push(tickers.slice(i, i + this.maxConcurrent));
    }

    for (const chunk of chunks) {
      if (signal?.aborted) break;
      await Promise.all(chunk.map(processTicker));
    }

    log.info(`Batch fetch complete: ${results.length}/${tickers.length} successful`);
    return results;
  }

  async _request(endpoint, signal, requestOptions = {}) {
    const { suppressAuthErrors = false } = requestOptions;
    await this._checkRateLimit();

    if (this.backoffUntil > Date.now()) {
      const waitMs = this.backoffUntil - Date.now();
      throw new Error(`In backoff cooldown (${Math.ceil(waitMs / 1000)}s remaining)`);
    }

    const url = this.useProxy
      ? `${this.baseUrl}${endpoint}`
      : `${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}token=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        signal,
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.status === 429) {
        this._handleRateLimit();
        throw new Error('Rate limited (429)');
      }

      if (response.status === 403 && this.useProxy) {
        let payload = null;
        try {
          payload = await response.clone().json();
        } catch {
        }

        if (payload?.error === 'Forbidden origin') {
          const originError = new Error('Origin not allowed by proxy');
          originError.code = 'FORBIDDEN_ORIGIN';
          this.emit('error', originError);
          throw originError;
        }
      }

      if (response.status === 401 || response.status === 403) {
        const error = new Error(`Authentication failed (${response.status})`);
        error.code = 'AUTH_FAILED';
        if (!suppressAuthErrors) {
          this.emit('error', error);
          throw error;
        }
        log.warn(`Auth failure suppressed for request ${endpoint}`);
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this._incrementRequestCount();

      return await response.json();

    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }

      log.debug('Request failed:', error.message);
      throw error;
    }
  }

  async _checkRateLimit() {
    const now = Date.now();
    const windowDuration = 60000;

    if (now - this.requestWindow >= windowDuration) {
      this.requestCount = 0;
      this.requestWindow = now;
    }

    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitMs = windowDuration - (now - this.requestWindow);
      log.warn(`Rate limit reached, waiting ${Math.ceil(waitMs / 1000)}s...`);
      await this._sleep(waitMs);
      
      this.requestCount = 0;
      this.requestWindow = Date.now();
    }
  }

  _incrementRequestCount() {
    this.requestCount++;
    this.emit('request', { count: this.requestCount });
  }

  _handleRateLimit() {
    const initial = CONFIG.FINNHUB.RATE_LIMIT.BACKOFF_429;
    const increment = 30000;
    const maxDelay = 120000;

    this.backoffDelay = this.backoffDelay === 0
      ? initial
      : Math.min(this.backoffDelay + increment, maxDelay);

    this.backoffUntil = Date.now() + this.backoffDelay;

    log.warn(`HTTP 429 Rate Limited - backing off for ${this.backoffDelay / 1000}s`);
    
    this.emit('rate_limited', { 
      backoffUntil: this.backoffUntil,
      backoffDelay: this.backoffDelay 
    });
  }

  resetBackoff() {
    if (this.backoffUntil > 0 && Date.now() > this.backoffUntil) {
      log.info('Backoff period ended, resuming normal operation');
      this.backoffUntil = 0;
      this.backoffDelay = 0;
    }
  }

  createAbortController() {
    this.abortController = new AbortController();
    return this.abortController;
  }

  abortAll() {
    if (this.abortController) {
      log.info('Aborting all in-flight requests');
      this.abortController.abort();
      this.abortController = null;
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getBackoffStatus() {
    const inBackoff = this.backoffUntil > Date.now();
    return {
      inBackoff,
      remainingMs: inBackoff ? this.backoffUntil - Date.now() : 0,
      backoffDelay: this.backoffDelay
    };
  }
}
