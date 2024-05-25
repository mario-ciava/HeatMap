/**
 * RESTClient - HTTP client for Finnhub REST API
 * Handles rate limiting, 429 backoff, and CORS-safe requests
 */

import { EventEmitter } from '../core/EventEmitter.js';
import { CONFIG } from '../config.js';
import { logger } from '../utils/Logger.js';

const log = logger.child('REST');

export class RESTClient extends EventEmitter {
  constructor(apiKey) {
    super();
    
    this.apiKey = apiKey;
    this.baseUrl = CONFIG.FINNHUB.REST_BASE;
    
    // Rate limiting state
    this.requestCount = 0;
    this.requestWindow = Date.now();
    this.maxRequestsPerMinute = CONFIG.FINNHUB.RATE_LIMIT.MAX_CALLS_PER_MINUTE;
    
    // 429 backoff state
    this.backoffUntil = 0;
    this.backoffDelay = 0;
    
    // Request queue for concurrency control
    this.activeRequests = 0;
    this.maxConcurrent = 5;
    this.requestQueue = [];
    
    // AbortController for cancellation
    this.abortController = null;
    
    // Environment check
    this.isHttpOrigin = /^https?:$/i.test(location.protocol);
    
    if (!this.isHttpOrigin) {
      log.warn('Running from file:// - REST endpoints disabled to avoid CORS');
    }
  }

  /**
   * Set or update API key
   * @param {string} apiKey
   */
  setApiKey(apiKey) {
    if (this.apiKey !== apiKey) {
      this.apiKey = apiKey;
      log.info('API key updated');
    }
  }

  /**
   * Check if REST is available (not in backoff and HTTP origin)
   * @returns {boolean}
   */
  isAvailable() {
    if (!this.isHttpOrigin) return false;
    if (this.backoffUntil > Date.now()) return false;
    return true;
  }

  /**
   * Fetch quote for a single ticker
   * @param {string} ticker
   * @param {AbortSignal} [signal]
   * @returns {Promise<Object|null>}
   */
  async fetchQuote(ticker, signal) {
    if (!this.isAvailable()) {
      log.debug(`REST unavailable for ${ticker}`);
      return null;
    }

    const endpoint = `/quote?symbol=${encodeURIComponent(ticker)}`;

    try {
      const data = await this._request(endpoint, signal);

      if (!data || typeof data.c !== 'number') {
        return null;
      }

      // Calculate change percent with fallback chain
      let changePercent = data.dp;
      let basePrice = data.pc;

      if (changePercent == null) {
        // Try previousClose first
        if (data.pc != null && data.pc > 0) {
          changePercent = ((data.c - data.pc) / data.pc) * 100;
          basePrice = data.pc;
        }
        // Fallback to open price
        else if (data.o != null && data.o > 0) {
          changePercent = ((data.c - data.o) / data.o) * 100;
          basePrice = data.o;
        }
        // Final fallback: 0%
        else {
          changePercent = 0;
          basePrice = data.c;
        }
      }

      return {
        ticker,
        price: data.c,
        previousClose: basePrice,
        changePercent,
        high: data.h,
        low: data.l,
        open: data.o,
        timestamp: Date.now()
      };

    } catch (error) {
      if (error.name !== 'AbortError') {
        log.warn(`Failed to fetch quote for ${ticker}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Fetch market status for an exchange
   * @param {string} exchange - Exchange code (e.g., 'US', 'L', 'GER')
   * @param {AbortSignal} [signal]
   * @returns {Promise<Object|null>}
   */
  async fetchMarketStatus(exchange, signal) {
    if (!this.isAvailable()) {
      log.debug(`REST unavailable for market status ${exchange}`);
      return null;
    }

    const endpoint = `/stock/market-status?exchange=${encodeURIComponent(exchange)}`;
    
    try {
      const data = await this._request(endpoint, signal);
      
      if (!data) return null;

      // Normalize response (Finnhub returns various formats)
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

  /**
   * Batch fetch quotes for multiple tickers with concurrency control
   * @param {string[]} tickers
   * @param {AbortSignal} [signal]
   * @returns {Promise<Object[]>} Array of successful quote results
   */
  async fetchQuoteBatch(tickers, signal) {
    if (!this.isAvailable()) {
      log.debug('REST unavailable for batch fetch');
      return [];
    }

    log.info(`Fetching batch of ${tickers.length} quotes...`);

    const results = [];
    let processed = 0;

    // Process with concurrency limit
    const processTicker = async (ticker) => {
      const quote = await this.fetchQuote(ticker, signal);
      processed++;
      
      if (quote) {
        results.push(quote);
      }

      // Progress logging
      if (processed % 10 === 0 || processed === tickers.length) {
        log.debug(`Batch progress: ${processed}/${tickers.length}`);
      }
    };

    // Create chunks based on concurrency limit
    const chunks = [];
    for (let i = 0; i < tickers.length; i += this.maxConcurrent) {
      chunks.push(tickers.slice(i, i + this.maxConcurrent));
    }

    // Process chunks sequentially, items within chunk in parallel
    for (const chunk of chunks) {
      if (signal?.aborted) break;
      await Promise.all(chunk.map(processTicker));
    }

    log.info(`Batch fetch complete: ${results.length}/${tickers.length} successful`);
    return results;
  }

  /**
   * Make HTTP request with rate limiting and error handling
   * @private
   */
  async _request(endpoint, signal) {
    // Check rate limit
    await this._checkRateLimit();

    // Check backoff
    if (this.backoffUntil > Date.now()) {
      const waitMs = this.backoffUntil - Date.now();
      throw new Error(`In backoff cooldown (${Math.ceil(waitMs / 1000)}s remaining)`);
    }

    const url = `${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}token=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        signal,
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        }
      });

      // Handle rate limiting
      if (response.status === 429) {
        this._handleRateLimit();
        throw new Error('Rate limited (429)');
      }

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        const error = new Error(`Authentication failed (${response.status})`);
        error.code = 'AUTH_FAILED';
        this.emit('error', error);
        throw error;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Track successful request
      this._incrementRequestCount();

      return await response.json();

    } catch (error) {
      if (error.name === 'AbortError') {
        throw error; // Propagate abort
      }

      // Generic network error
      log.debug('Request failed:', error.message);
      throw error;
    }
  }

  /**
   * Check and enforce rate limit
   * @private
   */
  async _checkRateLimit() {
    const now = Date.now();
    const windowDuration = 60000; // 1 minute

    // Reset counter if window expired
    if (now - this.requestWindow >= windowDuration) {
      this.requestCount = 0;
      this.requestWindow = now;
    }

    // Wait if at limit
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitMs = windowDuration - (now - this.requestWindow);
      log.warn(`Rate limit reached, waiting ${Math.ceil(waitMs / 1000)}s...`);
      await this._sleep(waitMs);
      
      // Reset after wait
      this.requestCount = 0;
      this.requestWindow = Date.now();
    }
  }

  /**
   * Increment request counter
   * @private
   */
  _incrementRequestCount() {
    this.requestCount++;
    this.emit('request', { count: this.requestCount });
  }

  /**
   * Handle 429 rate limit response with exponential backoff
   * @private
   */
  _handleRateLimit() {
    // First 429: wait configured amount
    if (this.backoffDelay === 0) {
      this.backoffDelay = CONFIG.FINNHUB.RATE_LIMIT.BACKOFF_429;
    } else {
      // Double the backoff (exponential), max 5 minutes
      this.backoffDelay = Math.min(this.backoffDelay * 2, 300000);
    }

    this.backoffUntil = Date.now() + this.backoffDelay;

    log.warn(`HTTP 429 Rate Limited - backing off for ${this.backoffDelay / 1000}s`);
    
    this.emit('rate_limited', { 
      backoffUntil: this.backoffUntil,
      backoffDelay: this.backoffDelay 
    });
  }

  /**
   * Reset backoff (called after successful request post-backoff)
   */
  resetBackoff() {
    if (this.backoffUntil > 0 && Date.now() > this.backoffUntil) {
      log.info('Backoff period ended, resuming normal operation');
      this.backoffUntil = 0;
      this.backoffDelay = 0;
    }
  }

  /**
   * Create new abort controller for cancellation
   */
  createAbortController() {
    this.abortController = new AbortController();
    return this.abortController;
  }

  /**
   * Abort all in-flight requests
   */
  abortAll() {
    if (this.abortController) {
      log.info('Aborting all in-flight requests');
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Sleep utility
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get backoff status
   * @returns {Object}
   */
  getBackoffStatus() {
    const inBackoff = this.backoffUntil > Date.now();
    return {
      inBackoff,
      remainingMs: inBackoff ? this.backoffUntil - Date.now() : 0,
      backoffDelay: this.backoffDelay
    };
  }
}
