/**
 * Central Configuration
 * All app-wide constants and settings
 */

export const CONFIG = {
  // === Finnhub API Settings ===
  FINNHUB: {
    WS_URL: 'wss://ws.finnhub.io',
    REST_BASE: 'https://finnhub.io/api/v1',
    
    // Reconnect strategy for WebSocket
    RECONNECT: {
      INITIAL_DELAY: 1000,      // Start with 1s
      MAX_DELAY: 30000,         // Cap at 30s
      BACKOFF_MULTIPLIER: 2,    // Double each time
      MAX_RETRIES: Infinity     // Never give up
    },
    
    // Rate limiting for REST endpoints
    RATE_LIMIT: {
      MAX_CALLS_PER_MINUTE: 60, // Free tier limit
      BACKOFF_429: 60000,       // Wait 60s after 429
      MARKET_STATUS_INTERVAL: 60000, // Check every 60s
    },
    
    // Market status heuristic fallback
    TRADE_STALENESS_MS: 300000, // 5 minutes
  },
  
  // === UI Update Settings ===
  UI: {
    UPDATE_FREQUENCY: 1000,     // Simulation mode update rate
    THRESHOLDS: {
      STRONG_GAIN: 3,
      MILD_GAIN: 0.5,
      STRONG_LOSS: -3,
      MILD_LOSS: -0.5
    },
    HISTORY_LENGTH: 50,
    VOLATILITY: {
      BASE: 0.5,
      USER_MULTIPLIER: 1.0,
      AMPLITUDE: 0.3
    }
  },
  
  // === Storage Keys ===
  STORAGE: {
    API_KEY: 'd3n3tqpr01qmso3665q0d3n3tqpr01qmso3665qg',
    THEME: 'heatmap_theme',
    STATE: 'heatmap-state'
  },
  
  // === Logging ===
  LOG_LEVEL: 'info' // 'debug' | 'info' | 'warn' | 'error'
};

/**
 * Ticker to Exchange Mapping
 * Maps each ticker to its primary exchange for market status checks
 * 
 * Exchanges: US, TO (Toronto), V (Venture), CN (Canadian), L (London), etc.
 * Default: US for unmapped tickers
 */
export const TICKER_EXCHANGE_MAP = {
  // US Stocks (default, but explicit for clarity)
  'AAPL': 'US',
  'MSFT': 'US',
  'GOOGL': 'US',
  'AMZN': 'US',
  'TSLA': 'US',
  'META': 'US',
  'NVDA': 'US',
  'JPM': 'US',
  'V': 'US',
  'JNJ': 'US',
  'WMT': 'US',
  'PG': 'US',
  'MA': 'US',
  'UNH': 'US',
  'DIS': 'US',
  'NFLX': 'US',
  'ADBE': 'US',
  'CRM': 'US',
  'PFE': 'US',
  'TMO': 'US',
  'CSCO': 'US',
  'ORCL': 'US',
  'INTC': 'US',
  'IBM': 'US',
  'BAC': 'US',
  'C': 'US',
  'GS': 'US',
  'MS': 'US',
  'HD': 'US',
  'LOW': 'US',
  'KO': 'US',
  'PEP': 'US',
  'NKE': 'US',
  'MCD': 'US',
  'SBUX': 'US',
  'COST': 'US',
  'T': 'US',
  'VZ': 'US',
  'XOM': 'US',
  'CVX': 'US',
  'SHEL': 'US', // Shell ADR traded on US exchanges
  'AMD': 'US',
  'AVGO': 'US',
  'QCOM': 'US',
  'TXN': 'US',
  'BMY': 'US',
  'ABBV': 'US',
  'MRK': 'US',
  'BA': 'US',
  'GE': 'US',
  
  // Example: If you add European stocks in future:
  // 'BMW.DE': 'GER',
  // 'SAP.DE': 'GER',
  // 'VOD.L': 'L',  // Vodafone on London
};

/**
 * Get exchange for a ticker (with US as fallback)
 */
export function getExchangeForTicker(ticker) {
  return TICKER_EXCHANGE_MAP[ticker] || 'US';
}

/**
 * Get all unique exchanges currently in use
 */
export function getActiveExchanges(tickers) {
  const exchanges = new Set();
  tickers.forEach(ticker => {
    exchanges.add(getExchangeForTicker(ticker));
  });
  return Array.from(exchanges);
}
