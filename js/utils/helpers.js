/**
 * Utility Helper Functions
 * Reusable utilities for the application
 */

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Sleep/delay utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format number as percentage
 * @param {number} value
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatPercent(value, decimals = 2) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format number as currency
 * @param {number} value
 * @param {string} [currency='USD']
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatCurrency(value, currency = 'USD', decimals = 2) {
  if (currency === 'USD') {
    return `$${value.toFixed(decimals)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Check if running from file:// protocol
 * @returns {boolean}
 */
export function isFileProtocol() {
  return location.protocol === 'file:';
}

/**
 * Check if running from HTTP/HTTPS
 * @returns {boolean}
 */
export function isHttpProtocol() {
  return /^https?:$/i.test(location.protocol);
}

/**
 * Safe JSON parse with fallback
 * @param {string} jsonString
 * @param {*} fallback
 * @returns {*}
 */
export function safeJsonParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallback;
  }
}

/**
 * Safe localStorage get
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
export function getFromStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Safe localStorage set
 * @param {string} key
 * @param {*} value
 * @returns {boolean} Success status
 */
export function setInStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Generate unique ID
 * @returns {string}
 */
export function uniqueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone object (simple version)
 * @param {*} obj
 * @returns {*}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise}
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Group array by key
 * @param {Array} array
 * @param {Function|string} keyGetter
 * @returns {Map}
 */
export function groupBy(array, keyGetter) {
  const map = new Map();
  const getKey = typeof keyGetter === 'function' 
    ? keyGetter 
    : (item) => item[keyGetter];
  
  array.forEach((item) => {
    const key = getKey(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  
  return map;
}

/**
 * Calculate simple moving average
 * @param {number[]} values
 * @param {number} period
 * @returns {number[]}
 */
export function simpleMovingAverage(values, period) {
  const result = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    const slice = values.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / period;
    result.push(avg);
  }
  return result;
}
