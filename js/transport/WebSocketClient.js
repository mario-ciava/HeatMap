/**
 * WebSocketClient - Robust WebSocket connection manager
 * Handles reconnection, heartbeat, and subscription persistence
 */

import { EventEmitter } from '../core/EventEmitter.js';
import { CONFIG } from '../config.js';
import { logger } from '../utils/Logger.js';

const log = logger.child('WS');

/**
 * Connection states
 */
const States = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  STOPPED: 'stopped'
};

export class WebSocketClient extends EventEmitter {
  constructor(apiKey) {
    super();
    
    this.apiKey = apiKey;
    this.ws = null;
    this.state = States.DISCONNECTED;
    
    // Reconnection management
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.maxReconnectAttempts = CONFIG.FINNHUB.RECONNECT.MAX_RETRIES;
    
    // Subscription persistence
    this.subscribedSymbols = new Set();
    this.pendingSubscriptions = new Set();
    
    // Heartbeat/ping management
    this.heartbeatInterval = null;
    this.lastPongTime = 0;
    this.heartbeatIntervalMs = 30000; // 30 seconds
  }

  /**
   * Set or update API key
   * @param {string} apiKey
   */
  setApiKey(apiKey) {
    if (this.apiKey !== apiKey) {
      this.apiKey = apiKey;
      log.info('API key updated');
      
      // Reconnect if currently connected
      if (this.state === States.CONNECTED) {
        this.reconnect();
      }
    }
  }

  /**
   * Connect to Finnhub WebSocket
   */
  connect() {
    if (this.state === States.CONNECTED || this.state === States.CONNECTING) {
      log.warn('Already connected or connecting');
      return;
    }

    if (!this.apiKey) {
      log.error('Cannot connect: API key not set');
      this.emit('error', { code: 'NO_API_KEY', message: 'API key required' });
      return;
    }

    this._setState(States.CONNECTING);
    log.info('Connecting to Finnhub WebSocket...');

    const url = `${CONFIG.FINNHUB.WS_URL}?token=${this.apiKey}`;

    try {
      this.ws = new WebSocket(url);
      this._attachHandlers();
    } catch (error) {
      log.error('WebSocket creation failed:', error.message);
      this._scheduleReconnect();
    }
  }

  /**
   * Attach WebSocket event handlers
   * @private
   */
  _attachHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => this._onOpen();
    this.ws.onmessage = (event) => this._onMessage(event);
    this.ws.onerror = (error) => this._onError(error);
    this.ws.onclose = (event) => this._onClose(event);
  }

  /**
   * Handle WebSocket open event
   * @private
   */
  _onOpen() {
    log.info('WebSocket connected');
    this._setState(States.CONNECTED);
    this.reconnectAttempts = 0;
    this.lastPongTime = Date.now();

    // Start heartbeat
    this._startHeartbeat();

    // Re-subscribe to all symbols
    this._resubscribeAll();

    this.emit('connected', {});
  }

  /**
   * Handle WebSocket message event
   * @private
   */
  _onMessage(event) {
    try {
      const data = JSON.parse(event.data);

      // Handle ping/pong for connection health
      if (data.type === 'ping') {
        this._send({ type: 'pong' });
        this.lastPongTime = Date.now();
        return;
      }

      // Handle trade data
      if (data.type === 'trade') {
        this._handleTradeData(data);
        return;
      }

      // Log other message types for debugging
      log.debug('Received message:', data);

    } catch (error) {
      log.error('Failed to parse WebSocket message:', error.message);
    }
  }

  /**
   * Handle trade data from WebSocket
   * @private
   */
  _handleTradeData(data) {
    if (!Array.isArray(data.data)) return;

    data.data.forEach(trade => {
      const { s: symbol, p: price, t: timestamp, v: volume } = trade;
      
      if (!symbol || price == null) return;

      // Emit trade event for each ticker
      this.emit('trade', {
        ticker: symbol,
        price: parseFloat(price),
        timestamp: timestamp || Date.now(),
        volume: volume || 0
      });
    });
  }

  /**
   * Handle WebSocket error event
   * @private
   */
  _onError(error) {
    log.error('WebSocket error:', error);
    this.emit('error', { 
      code: 'WS_ERROR', 
      message: 'WebSocket connection error',
      originalError: error 
    });
  }

  /**
   * Handle WebSocket close event
   * @private
   */
  _onClose(event) {
    const { code, reason, wasClean } = event;
    log.warn(`WebSocket closed [${code}]: ${reason || 'No reason'} (clean: ${wasClean})`);

    this._stopHeartbeat();
    this._setState(States.DISCONNECTED);

    this.emit('disconnected', { code, reason, wasClean });

    // Auto-reconnect unless explicitly stopped
    if (this.state !== States.STOPPED) {
      this._scheduleReconnect();
    }
  }

  /**
   * Subscribe to symbol(s)
   * @param {string | string[]} symbols - Single symbol or array of symbols
   */
  subscribe(symbols) {
    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
    
    symbolArray.forEach(symbol => {
      if (!symbol) return;
      
      this.subscribedSymbols.add(symbol);
      
      if (this.state === States.CONNECTED) {
        this._sendSubscribe(symbol);
      } else {
        this.pendingSubscriptions.add(symbol);
        log.debug(`Queued subscription for ${symbol} (not connected)`);
      }
    });
  }

  /**
   * Unsubscribe from symbol(s)
   * @param {string | string[]} symbols - Single symbol or array of symbols
   */
  unsubscribe(symbols) {
    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
    
    symbolArray.forEach(symbol => {
      this.subscribedSymbols.delete(symbol);
      this.pendingSubscriptions.delete(symbol);
      
      if (this.state === States.CONNECTED) {
        this._sendUnsubscribe(symbol);
      }
    });
  }

  /**
   * Send subscribe message
   * @private
   */
  _sendSubscribe(symbol) {
    this._send({ type: 'subscribe', symbol });
    log.debug(`Subscribed to ${symbol}`);
  }

  /**
   * Send unsubscribe message
   * @private
   */
  _sendUnsubscribe(symbol) {
    this._send({ type: 'unsubscribe', symbol });
    log.debug(`Unsubscribed from ${symbol}`);
  }

  /**
   * Re-subscribe to all symbols after reconnection
   * @private
   */
  _resubscribeAll() {
    const allSymbols = new Set([
      ...this.subscribedSymbols,
      ...this.pendingSubscriptions
    ]);

    if (allSymbols.size === 0) return;

    log.info(`Re-subscribing to ${allSymbols.size} symbols...`);
    
    allSymbols.forEach(symbol => {
      this._sendSubscribe(symbol);
    });

    this.pendingSubscriptions.clear();
  }

  /**
   * Send data through WebSocket
   * @private
   */
  _send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      log.warn('Cannot send: WebSocket not open');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      log.error('Failed to send message:', error.message);
      return false;
    }
  }

  /**
   * Start heartbeat interval
   * @private
   */
  _startHeartbeat() {
    this._stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      // Check if we haven't received pong in a while
      const timeSinceLastPong = Date.now() - this.lastPongTime;
      
      if (timeSinceLastPong > this.heartbeatIntervalMs * 2) {
        log.warn('Heartbeat timeout - connection may be dead');
        this.reconnect();
      }
    }, this.heartbeatIntervalMs);
  }

  /**
   * Stop heartbeat interval
   * @private
   */
  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   * @private
   */
  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.state === States.STOPPED) return;

    this._setState(States.RECONNECTING);

    const delay = Math.min(
      CONFIG.FINNHUB.RECONNECT.INITIAL_DELAY * 
        Math.pow(CONFIG.FINNHUB.RECONNECT.BACKOFF_MULTIPLIER, this.reconnectAttempts),
      CONFIG.FINNHUB.RECONNECT.MAX_DELAY
    );

    this.reconnectAttempts++;

    log.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Force reconnection
   */
  reconnect() {
    log.info('Forcing reconnect...');
    this.disconnect();
    setTimeout(() => this.connect(), 100);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    this._stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.close(1000, 'Client disconnect');
      } catch (error) {
        log.error('Error during disconnect:', error.message);
      }
      this.ws = null;
    }

    this._setState(States.DISCONNECTED);
  }

  /**
   * Stop WebSocket (no auto-reconnect)
   */
  stop() {
    log.info('Stopping WebSocket...');
    this._setState(States.STOPPED);
    this.disconnect();
    this.subscribedSymbols.clear();
    this.pendingSubscriptions.clear();
  }

  /**
   * Set connection state
   * @private
   */
  _setState(state) {
    if (this.state !== state) {
      const oldState = this.state;
      this.state = state;
      log.debug(`State: ${oldState} → ${state}`);
      this.emit('state', { state, oldState });
    }
  }

  /**
   * Get current connection state
   * @returns {string}
   */
  getState() {
    return this.state;
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.state === States.CONNECTED;
  }
}
