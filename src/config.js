/**
 * Central Configuration
 * All app-wide constants and settings
 */

function computeDefaultProxyBase() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin.replace(/\/$/, "")}/proxy`;
  }
  if (typeof globalThis !== "undefined" && globalThis.location?.origin) {
    return `${globalThis.location.origin.replace(/\/$/, "")}/proxy`;
  }
  return "http://localhost:8080/proxy";
}

const runtimeProxyOverride =
  typeof globalThis !== "undefined" && globalThis.__HEATMAP_PROXY_BASE
    ? String(globalThis.__HEATMAP_PROXY_BASE).replace(/\/$/, "")
    : null;

const DEFAULT_PROXY_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PROXY_URL)
    || runtimeProxyOverride
    || computeDefaultProxyBase();

export const CONFIG = {
  // === Security & Proxy Settings ===
  SECURITY: {
    // Force proxy mode: API key is always managed server-side (secure)
    // Set to false only if you want to test direct API calls in development
    PROXY_MODE: true, // true = always use proxy (recommended)
    FORCE_PROXY_MODE: false, // Deprecated (use PROXY_MODE: true instead)
    // Base URL for the VPS proxy (can be overridden via VITE_PROXY_URL env var)
    PROXY_BASE: DEFAULT_PROXY_BASE
  },

  // === Finnhub API Settings ===
  FINNHUB: {
    // When PROXY_MODE is true, these will point to your Worker
    WS_URL: 'wss://ws.finnhub.io',
    REST_BASE: 'https://finnhub.io/api/v1',
    
    // Reconnect strategy for WebSocket
    RECONNECT: {
      INITIAL_DELAY: 1000,      // Start with 1s
      MAX_DELAY: 30000,         // Cap at 30s
      BACKOFF_MULTIPLIER: 2,    // Double each time
      MAX_RETRIES: 10           // Max 10 retries before giving up
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
  
  // === API Key Settings ===
  API_KEY: {
    // API key is managed server-side by the VPS proxy (secure)
    // No sensitive data stored in frontend code
    LOCAL_DEV_KEY: '', // Empty - proxy handles authentication
    STORAGE_KEY: 'finnhub_api_key'  // localStorage key (not used in proxy mode)
  },

  // === Storage Keys ===
  STORAGE: {
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

  // Additional simulation assets
  'SNOW': 'US',
  'DDOG': 'US',
  'NET': 'US',
  'ZM': 'US',
  'UBER': 'US',
  'LYFT': 'US',
  'ABNB': 'US',
  'SQ': 'US',
  'PYPL': 'US',
  'SHOP': 'US',
  'SPOT': 'US',
  'ROKU': 'US',
  'TWLO': 'US',
  'DOCU': 'US',
  'CRWD': 'US',
  'PANW': 'US',
  'ZS': 'US',
  'NOW': 'US',
  'WDAY': 'US',
  'TEAM': 'US',
  'MDB': 'US',
  'PLTR': 'US',
  'RBLX': 'US',
  'U': 'US',
  'EA': 'US',
  'TTWO': 'US',
  'F': 'US',
  'GM': 'US',
  'TM': 'US',
  'RIVN': 'US',
  'LCID': 'US',
  'NIO': 'US',
  'LI': 'US',
  'XPEV': 'US',
  'ON': 'US',
  'MU': 'US',
  'AMAT': 'US',
  'LRCX': 'US',
  'KLAC': 'US',
  'MRVL': 'US',
  'MPWR': 'US',
  'ENPH': 'US',
  'SEDG': 'US',
  'FSLR': 'US',
  'RUN': 'US',
  'PLUG': 'US',
  'BLDP': 'US',
  'BE': 'US',
  'NEE': 'US',
  'COIN': 'US',

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

// ============================================================================
// Asset Lists
// ============================================================================

/**
 * Real Data Assets - Used when in Real Data mode (50 assets)
 * These are well-established stocks with reliable real-time data
 */
export const REAL_DATA_ASSETS = [
  { ticker: "AAPL", name: "Apple Inc.", price: 182.52, basePrice: 182.52, change: 0, sector: "Technology" },
  { ticker: "MSFT", name: "Microsoft", price: 378.85, basePrice: 378.85, change: 0, sector: "Technology" },
  { ticker: "GOOGL", name: "Alphabet", price: 138.21, basePrice: 138.21, change: 0, sector: "Technology" },
  { ticker: "AMZN", name: "Amazon", price: 127.74, basePrice: 127.74, change: 0, sector: "Consumer" },
  { ticker: "TSLA", name: "Tesla", price: 256.24, basePrice: 256.24, change: 0, sector: "Automotive" },
  { ticker: "META", name: "Meta", price: 311.71, basePrice: 311.71, change: 0, sector: "Technology" },
  { ticker: "NVDA", name: "NVIDIA", price: 521.88, basePrice: 521.88, change: 0, sector: "Technology" },
  { ticker: "JPM", name: "JP Morgan", price: 147.35, basePrice: 147.35, change: 0, sector: "Financial" },
  { ticker: "V", name: "Visa", price: 247.12, basePrice: 247.12, change: 0, sector: "Financial" },
  { ticker: "JNJ", name: "Johnson & J", price: 158.19, basePrice: 158.19, change: 0, sector: "Healthcare" },
  { ticker: "WMT", name: "Walmart", price: 163.42, basePrice: 163.42, change: 0, sector: "Retail" },
  { ticker: "PG", name: "Procter & G", price: 152.38, basePrice: 152.38, change: 0, sector: "Consumer" },
  { ticker: "MA", name: "Mastercard", price: 401.22, basePrice: 401.22, change: 0, sector: "Financial" },
  { ticker: "UNH", name: "UnitedHealth", price: 521.13, basePrice: 521.13, change: 0, sector: "Healthcare" },
  { ticker: "DIS", name: "Disney", price: 91.8, basePrice: 91.8, change: 0, sector: "Entertainment" },
  { ticker: "NFLX", name: "Netflix", price: 481.73, basePrice: 481.73, change: 0, sector: "Entertainment" },
  { ticker: "ADBE", name: "Adobe", price: 589.27, basePrice: 589.27, change: 0, sector: "Technology" },
  { ticker: "CRM", name: "Salesforce", price: 221.49, basePrice: 221.49, change: 0, sector: "Technology" },
  { ticker: "PFE", name: "Pfizer", price: 28.92, basePrice: 28.92, change: 0, sector: "Healthcare" },
  { ticker: "TMO", name: "Thermo Fisher", price: 547.38, basePrice: 547.38, change: 0, sector: "Healthcare" },
  { ticker: "CSCO", name: "Cisco", price: 49.67, basePrice: 49.67, change: 0, sector: "Technology" },
  { ticker: "ORCL", name: "Oracle", price: 106.84, basePrice: 106.84, change: 0, sector: "Technology" },
  { ticker: "INTC", name: "Intel", price: 43.65, basePrice: 43.65, change: 0, sector: "Technology" },
  { ticker: "IBM", name: "IBM", price: 140.28, basePrice: 140.28, change: 0, sector: "Technology" },
  { ticker: "BAC", name: "Bank of America", price: 31.82, basePrice: 31.82, change: 0, sector: "Financial" },
  { ticker: "C", name: "Citigroup", price: 45.33, basePrice: 45.33, change: 0, sector: "Financial" },
  { ticker: "GS", name: "Goldman Sachs", price: 394.11, basePrice: 394.11, change: 0, sector: "Financial" },
  { ticker: "MS", name: "Morgan Stanley", price: 85.27, basePrice: 85.27, change: 0, sector: "Financial" },
  { ticker: "HD", name: "Home Depot", price: 328.4, basePrice: 328.4, change: 0, sector: "Retail" },
  { ticker: "LOW", name: "Lowe's", price: 205.55, basePrice: 205.55, change: 0, sector: "Retail" },
  { ticker: "KO", name: "Coca-Cola", price: 58.73, basePrice: 58.73, change: 0, sector: "Consumer" },
  { ticker: "PEP", name: "PepsiCo", price: 172.66, basePrice: 172.66, change: 0, sector: "Consumer" },
  { ticker: "NKE", name: "Nike", price: 97.42, basePrice: 97.42, change: 0, sector: "Consumer" },
  { ticker: "MCD", name: "McDonald's", price: 257.88, basePrice: 257.88, change: 0, sector: "Consumer" },
  { ticker: "SBUX", name: "Starbucks", price: 88.11, basePrice: 88.11, change: 0, sector: "Consumer" },
  { ticker: "COST", name: "Costco", price: 684.92, basePrice: 684.92, change: 0, sector: "Retail" },
  { ticker: "T", name: "AT&T", price: 16.24, basePrice: 16.24, change: 0, sector: "Telecom" },
  { ticker: "VZ", name: "Verizon", price: 39.77, basePrice: 39.77, change: 0, sector: "Telecom" },
  { ticker: "XOM", name: "Exxon Mobil", price: 115.6, basePrice: 115.6, change: 0, sector: "Energy" },
  { ticker: "CVX", name: "Chevron", price: 158.95, basePrice: 158.95, change: 0, sector: "Energy" },
  { ticker: "SHEL", name: "Shell plc", price: 66.12, basePrice: 66.12, change: 0, sector: "Energy" },
  { ticker: "AMD", name: "Advanced Micro Devices", price: 117.53, basePrice: 117.53, change: 0, sector: "Technology" },
  { ticker: "AVGO", name: "Broadcom", price: 1289.4, basePrice: 1289.4, change: 0, sector: "Technology" },
  { ticker: "QCOM", name: "Qualcomm", price: 134.22, basePrice: 134.22, change: 0, sector: "Technology" },
  { ticker: "TXN", name: "Texas Instruments", price: 168.37, basePrice: 168.37, change: 0, sector: "Technology" },
  { ticker: "BMY", name: "Bristol-Myers Squibb", price: 45.91, basePrice: 45.91, change: 0, sector: "Healthcare" },
  { ticker: "ABBV", name: "AbbVie", price: 165.74, basePrice: 165.74, change: 0, sector: "Healthcare" },
  { ticker: "MRK", name: "Merck & Co.", price: 122.18, basePrice: 122.18, change: 0, sector: "Healthcare" },
  { ticker: "BA", name: "Boeing", price: 196.44, basePrice: 196.44, change: 0, sector: "Industrial" },
  { ticker: "GE", name: "GE Aerospace", price: 164.3, basePrice: 164.3, change: 0, sector: "Industrial" },
];

/**
 * Simulation Assets - Used when in Simulation mode (100 assets)
 * Includes all Real Data assets plus 50 additional assets for richer visualization
 */
export const SIMULATION_ASSETS = [
  // Original 50 assets from Real Data
  ...REAL_DATA_ASSETS,

  // Additional 50 assets for simulation mode
  { ticker: "SNOW", name: "Snowflake", price: 145.32, basePrice: 145.32, change: 0, sector: "Technology" },
  { ticker: "DDOG", name: "Datadog", price: 89.45, basePrice: 89.45, change: 0, sector: "Technology" },
  { ticker: "NET", name: "Cloudflare", price: 62.18, basePrice: 62.18, change: 0, sector: "Technology" },
  { ticker: "ZM", name: "Zoom", price: 68.91, basePrice: 68.91, change: 0, sector: "Technology" },
  { ticker: "UBER", name: "Uber", price: 58.34, basePrice: 58.34, change: 0, sector: "Transportation" },
  { ticker: "LYFT", name: "Lyft", price: 12.67, basePrice: 12.67, change: 0, sector: "Transportation" },
  { ticker: "ABNB", name: "Airbnb", price: 128.56, basePrice: 128.56, change: 0, sector: "Consumer" },
  { ticker: "SQ", name: "Block", price: 54.23, basePrice: 54.23, change: 0, sector: "Financial" },
  { ticker: "PYPL", name: "PayPal", price: 59.87, basePrice: 59.87, change: 0, sector: "Financial" },
  { ticker: "SHOP", name: "Shopify", price: 67.45, basePrice: 67.45, change: 0, sector: "Technology" },
  { ticker: "SPOT", name: "Spotify", price: 187.23, basePrice: 187.23, change: 0, sector: "Entertainment" },
  { ticker: "ROKU", name: "Roku", price: 71.34, basePrice: 71.34, change: 0, sector: "Entertainment" },
  { ticker: "TWLO", name: "Twilio", price: 56.78, basePrice: 56.78, change: 0, sector: "Technology" },
  { ticker: "DOCU", name: "DocuSign", price: 48.92, basePrice: 48.92, change: 0, sector: "Technology" },
  { ticker: "CRWD", name: "CrowdStrike", price: 198.45, basePrice: 198.45, change: 0, sector: "Cybersecurity" },
  { ticker: "PANW", name: "Palo Alto Networks", price: 287.56, basePrice: 287.56, change: 0, sector: "Cybersecurity" },
  { ticker: "ZS", name: "Zscaler", price: 142.89, basePrice: 142.89, change: 0, sector: "Cybersecurity" },
  { ticker: "NOW", name: "ServiceNow", price: 678.34, basePrice: 678.34, change: 0, sector: "Technology" },
  { ticker: "WDAY", name: "Workday", price: 234.12, basePrice: 234.12, change: 0, sector: "Technology" },
  { ticker: "TEAM", name: "Atlassian", price: 176.89, basePrice: 176.89, change: 0, sector: "Technology" },
  { ticker: "MDB", name: "MongoDB", price: 298.45, basePrice: 298.45, change: 0, sector: "Technology" },
  { ticker: "PLTR", name: "Palantir", price: 18.67, basePrice: 18.67, change: 0, sector: "Technology" },
  { ticker: "RBLX", name: "Roblox", price: 34.56, basePrice: 34.56, change: 0, sector: "Gaming" },
  { ticker: "U", name: "Unity Software", price: 28.91, basePrice: 28.91, change: 0, sector: "Gaming" },
  { ticker: "EA", name: "Electronic Arts", price: 124.78, basePrice: 124.78, change: 0, sector: "Gaming" },
  { ticker: "TTWO", name: "Take-Two Interactive", price: 142.33, basePrice: 142.33, change: 0, sector: "Gaming" },
  { ticker: "F", name: "Ford", price: 11.89, basePrice: 11.89, change: 0, sector: "Automotive" },
  { ticker: "GM", name: "General Motors", price: 34.56, basePrice: 34.56, change: 0, sector: "Automotive" },
  { ticker: "TM", name: "Toyota", price: 178.92, basePrice: 178.92, change: 0, sector: "Automotive" },
  { ticker: "RIVN", name: "Rivian", price: 13.45, basePrice: 13.45, change: 0, sector: "EV" },
  { ticker: "LCID", name: "Lucid", price: 3.28, basePrice: 3.28, change: 0, sector: "EV" },
  { ticker: "NIO", name: "Nio", price: 6.73, basePrice: 6.73, change: 0, sector: "EV" },
  { ticker: "LI", name: "Li Auto", price: 26.84, basePrice: 26.84, change: 0, sector: "EV" },
  { ticker: "XPEV", name: "XPeng", price: 10.92, basePrice: 10.92, change: 0, sector: "EV" },
  { ticker: "ON", name: "ON Semiconductor", price: 68.45, basePrice: 68.45, change: 0, sector: "Semiconductors" },
  { ticker: "MU", name: "Micron", price: 87.34, basePrice: 87.34, change: 0, sector: "Semiconductors" },
  { ticker: "AMAT", name: "Applied Materials", price: 156.78, basePrice: 156.78, change: 0, sector: "Semiconductors" },
  { ticker: "LRCX", name: "Lam Research", price: 689.23, basePrice: 689.23, change: 0, sector: "Semiconductors" },
  { ticker: "KLAC", name: "KLA Corp", price: 567.89, basePrice: 567.89, change: 0, sector: "Semiconductors" },
  { ticker: "MRVL", name: "Marvell", price: 58.92, basePrice: 58.92, change: 0, sector: "Semiconductors" },
  { ticker: "MPWR", name: "Monolithic Power", price: 487.34, basePrice: 487.34, change: 0, sector: "Semiconductors" },
  { ticker: "ENPH", name: "Enphase Energy", price: 87.56, basePrice: 87.56, change: 0, sector: "Clean Energy" },
  { ticker: "SEDG", name: "SolarEdge", price: 34.28, basePrice: 34.28, change: 0, sector: "Clean Energy" },
  { ticker: "FSLR", name: "First Solar", price: 178.91, basePrice: 178.91, change: 0, sector: "Clean Energy" },
  { ticker: "RUN", name: "Sunrun", price: 13.67, basePrice: 13.67, change: 0, sector: "Clean Energy" },
  { ticker: "PLUG", name: "Plug Power", price: 4.89, basePrice: 4.89, change: 0, sector: "Hydrogen" },
  { ticker: "BLDP", name: "Ballard Power", price: 3.45, basePrice: 3.45, change: 0, sector: "Hydrogen" },
  { ticker: "BE", name: "Bloom Energy", price: 11.23, basePrice: 11.23, change: 0, sector: "Clean Energy" },
  { ticker: "NEE", name: "NextEra Energy", price: 73.45, basePrice: 73.45, change: 0, sector: "Utilities" },
  { ticker: "COIN", name: "Coinbase", price: 189.34, basePrice: 189.34, change: 0, sector: "Fintech" },
];

/**
 * Detect if running on localhost/development environment
 * @returns {boolean}
 */
export function isLocalDevelopment() {
  if (typeof window === 'undefined') return true;

  const hostname = window.location.hostname;
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '0.0.0.0'
    || hostname.startsWith('192.168.')
    || hostname.startsWith('10.')
    || hostname.endsWith('.local');
}

/**
 * Determine if proxy mode should be used
 * @returns {boolean}
 */
export function shouldUseProxy() {
  const security = CONFIG.SECURITY;

  // Explicit override
  if (security.PROXY_MODE === true) return true;
  if (security.PROXY_MODE === false) return false;

  // Force proxy for testing locally
  if (security.FORCE_PROXY_MODE === true) return true;

  // Auto-detect: use proxy only on production domains
  return !isLocalDevelopment();
}

/**
 * Get the appropriate API endpoints based on environment
 * @returns {Object} { wsUrl, restBase, useProxy, mode }
 */
export function getApiEndpoints() {
  const useProxy = shouldUseProxy();

  if (useProxy) {
    const proxyBase = CONFIG.SECURITY.PROXY_BASE;
    return {
      wsUrl: proxyBase.replace(/^https/, 'wss').replace(/^http/, 'ws') + '/ws',
      restBase: proxyBase + '/api',
      useProxy: true,
      mode: 'proxy'
    };
  }

  return {
    wsUrl: CONFIG.FINNHUB.WS_URL,
    restBase: CONFIG.FINNHUB.REST_BASE,
    useProxy: false,
    mode: 'direct'
  };
}
