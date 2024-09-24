import { EventEmitter } from '../core/EventEmitter.js';
import { CONFIG, getApiEndpoints, shouldUseProxy } from '../config.js';
import { logger } from '../utils/Logger.js';

const log = logger.child('WS');

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
    this.manualClose = false;
    
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.maxReconnectAttempts = CONFIG.FINNHUB.RECONNECT.MAX_RETRIES;
    
    this.subscribedSymbols = new Set();
    this.pendingSubscriptions = new Set();
    
    this.heartbeatInterval = null;
    this.lastPongTime = 0;
    this.heartbeatIntervalMs = 30000;
  }

  setApiKey(apiKey) {
    if (this.apiKey !== apiKey) {
      this.apiKey = apiKey;
      log.info('API key updated');
      
      if (this.state === States.CONNECTED) {
        this.reconnect();
      }
    }
  }

  connect() {
    if (this.state === States.CONNECTED || this.state === States.CONNECTING) {
      log.warn('Already connected or connecting');
      return;
    }

    const useProxy = shouldUseProxy();
    if (!this.apiKey && !useProxy) {
      log.error('Cannot connect: API key not set');
      this.emit('error', { code: 'NO_API_KEY', message: 'API key required' });
      return;
    }

    this._setState(States.CONNECTING);
    log.info('Connecting to Finnhub WebSocket...');

    const endpoints = getApiEndpoints();
    const url = endpoints.useProxy
      ? endpoints.wsUrl
      : `${endpoints.wsUrl}?token=${this.apiKey}`;

    try {
      this.manualClose = false;
      this.ws = new WebSocket(url);
      this._attachHandlers();
    } catch (error) {
      log.error('WebSocket creation failed:', error.message);
      this._scheduleReconnect();
    }
  }

  _attachHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => this._onOpen();
    this.ws.onmessage = (event) => this._onMessage(event);
    this.ws.onerror = (error) => this._onError(error);
    this.ws.onclose = (event) => this._onClose(event);
  }

  _onOpen() {
    log.info('WebSocket connected');
    this._setState(States.CONNECTED);
    this.reconnectAttempts = 0;
    this.lastPongTime = Date.now();

    this._startHeartbeat();

    this._resubscribeAll();

    this.emit('connected', {});
  }

  _onMessage(event) {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'ping') {
        this._send({ type: 'pong', timestamp: Date.now() });
        this.lastPongTime = Date.now();
        log.debug('Responded to ping with pong');
        return;
      }

      if (data.type === 'pong') {
        this.lastPongTime = Date.now();
        log.debug('Received pong from server');
        return;
      }

      if (data.type === 'trade') {
        this._handleTradeData(data);
        return;
      }

      log.debug('Received message:', data);

    } catch (error) {
      log.error('Failed to parse WebSocket message:', error.message);
    }
  }

  _handleTradeData(data) {
    if (!Array.isArray(data.data)) return;

    data.data.forEach(trade => {
      const { s: symbol, p: price, t: timestamp, v: volume } = trade;
      
      if (!symbol || price == null) return;

      this.emit('trade', {
        ticker: symbol,
        price: parseFloat(price),
        timestamp: timestamp || Date.now(),
        volume: volume || 0
      });
    });
  }

  _onError(error) {
    log.error('WebSocket error:', error);
    this.emit('error', { 
      code: 'WS_ERROR', 
      message: 'WebSocket connection error',
      originalError: error 
    });
  }

  _onClose(event) {
    const shouldReconnect = this.state !== States.STOPPED && !this.manualClose;
    this.manualClose = false;

    const { code, reason, wasClean } = event;
    log.warn(`WebSocket closed [${code}]: ${reason || 'No reason'} (clean: ${wasClean})`);

    this._stopHeartbeat();
    if (shouldReconnect) {
      this._setState(States.DISCONNECTED);
    }

    this.emit('disconnected', { code, reason, wasClean });

    if (shouldReconnect) {
      this._scheduleReconnect();
    }
  }

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

  _sendSubscribe(symbol) {
    this._send({ type: 'subscribe', symbol });
    log.debug(`Subscribed to ${symbol}`);
  }

  _sendUnsubscribe(symbol) {
    this._send({ type: 'unsubscribe', symbol });
    log.debug(`Unsubscribed from ${symbol}`);
  }

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

  _startHeartbeat() {
    this._stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      const timeSinceLastPong = Date.now() - this.lastPongTime;
      
      if (timeSinceLastPong > this.heartbeatIntervalMs * 2) {
        log.warn('Heartbeat timeout - connection may be dead');
        this.reconnect();
      }
    }, this.heartbeatIntervalMs);
  }

  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.state === States.STOPPED) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      log.error(`Max reconnection attempts (${this.maxReconnectAttempts}) exceeded`);
      this._setState(States.STOPPED);
      this.emit('error', {
        code: 'MAX_RETRIES_EXCEEDED',
        message: `Failed to connect after ${this.maxReconnectAttempts} attempts`
      });
      return;
    }

    this._setState(States.RECONNECTING);

    const delay = Math.min(
      CONFIG.FINNHUB.RECONNECT.INITIAL_DELAY *
        Math.pow(CONFIG.FINNHUB.RECONNECT.BACKOFF_MULTIPLIER, this.reconnectAttempts),
      CONFIG.FINNHUB.RECONNECT.MAX_DELAY
    );

    this.reconnectAttempts++;

    log.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  reconnect() {
    log.info('Forcing reconnect...');
    this.disconnect();
    setTimeout(() => this.connect(), 100);
  }

  disconnect() {
    this._stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.manualClose = true;
      try {
        this.ws.close(1000, 'Client disconnect');
      } catch (error) {
        log.error('Error during disconnect:', error.message);
      }
      this.ws = null;
    }

    if (this.state !== States.STOPPED) {
      this._setState(States.DISCONNECTED);
    }
  }

  stop() {
    log.info('Stopping WebSocket...');
    this._setState(States.STOPPED);
    this.disconnect();
    this.subscribedSymbols.clear();
    this.pendingSubscriptions.clear();
  }

  _setState(state) {
    if (this.state !== state) {
      const oldState = this.state;
      this.state = state;
      log.debug(`State: ${oldState} → ${state}`);
      this.emit('state', { state, oldState });
    }
  }

  getState() {
    return this.state;
  }

  isConnected() {
    return this.state === States.CONNECTED;
  }
}
