/**
 * Main Entry Point
 * Initializes the application and maintains backward compatibility with existing UI code
 */

import { AppController } from '../services/AppController.js';
import { CONFIG } from '../config.js';
import { logger } from '../utils/Logger.js';

const log = logger.child('Main');

// Set log level from config
logger.setLevel(CONFIG.LOG_LEVEL);

// ============================================================================
// Asset Data (same as original)
// ============================================================================

const assets = [
  { ticker: 'AAPL', name: 'Apple Inc.', price: 182.52, basePrice: 182.52, change: 0, sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft', price: 378.85, basePrice: 378.85, change: 0, sector: 'Technology' },
  { ticker: 'GOOGL', name: 'Alphabet', price: 138.21, basePrice: 138.21, change: 0, sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon', price: 127.74, basePrice: 127.74, change: 0, sector: 'Consumer' },
  { ticker: 'TSLA', name: 'Tesla', price: 256.24, basePrice: 256.24, change: 0, sector: 'Automotive' },
  { ticker: 'META', name: 'Meta', price: 311.71, basePrice: 311.71, change: 0, sector: 'Technology' },
  { ticker: 'NVDA', name: 'NVIDIA', price: 521.88, basePrice: 521.88, change: 0, sector: 'Technology' },
  { ticker: 'JPM', name: 'JP Morgan', price: 147.35, basePrice: 147.35, change: 0, sector: 'Financial' },
  { ticker: 'V', name: 'Visa', price: 247.12, basePrice: 247.12, change: 0, sector: 'Financial' },
  { ticker: 'JNJ', name: 'Johnson & J', price: 158.19, basePrice: 158.19, change: 0, sector: 'Healthcare' },
  { ticker: 'WMT', name: 'Walmart', price: 163.42, basePrice: 163.42, change: 0, sector: 'Retail' },
  { ticker: 'PG', name: 'Procter & G', price: 152.38, basePrice: 152.38, change: 0, sector: 'Consumer' },
  { ticker: 'MA', name: 'Mastercard', price: 401.22, basePrice: 401.22, change: 0, sector: 'Financial' },
  { ticker: 'UNH', name: 'UnitedHealth', price: 521.13, basePrice: 521.13, change: 0, sector: 'Healthcare' },
  { ticker: 'DIS', name: 'Disney', price: 91.80, basePrice: 91.80, change: 0, sector: 'Entertainment' },
  { ticker: 'NFLX', name: 'Netflix', price: 481.73, basePrice: 481.73, change: 0, sector: 'Entertainment' },
  { ticker: 'ADBE', name: 'Adobe', price: 589.27, basePrice: 589.27, change: 0, sector: 'Technology' },
  { ticker: 'CRM', name: 'Salesforce', price: 221.49, basePrice: 221.49, change: 0, sector: 'Technology' },
  { ticker: 'PFE', name: 'Pfizer', price: 28.92, basePrice: 28.92, change: 0, sector: 'Healthcare' },
  { ticker: 'TMO', name: 'Thermo Fisher', price: 547.38, basePrice: 547.38, change: 0, sector: 'Healthcare' },
  { ticker: 'CSCO', name: 'Cisco', price: 49.67, basePrice: 49.67, change: 0, sector: 'Technology' },
  { ticker: 'ORCL', name: 'Oracle', price: 106.84, basePrice: 106.84, change: 0, sector: 'Technology' },
  { ticker: 'INTC', name: 'Intel', price: 43.65, basePrice: 43.65, change: 0, sector: 'Technology' },
  { ticker: 'IBM', name: 'IBM', price: 140.28, basePrice: 140.28, change: 0, sector: 'Technology' },
  { ticker: 'BAC', name: 'Bank of America', price: 31.82, basePrice: 31.82, change: 0, sector: 'Financial' },
  { ticker: 'C', name: 'Citigroup', price: 45.33, basePrice: 45.33, change: 0, sector: 'Financial' },
  { ticker: 'GS', name: 'Goldman Sachs', price: 394.11, basePrice: 394.11, change: 0, sector: 'Financial' },
  { ticker: 'MS', name: 'Morgan Stanley', price: 85.27, basePrice: 85.27, change: 0, sector: 'Financial' },
  { ticker: 'HD', name: 'Home Depot', price: 328.40, basePrice: 328.40, change: 0, sector: 'Retail' },
  { ticker: 'LOW', name: "Lowe's", price: 205.55, basePrice: 205.55, change: 0, sector: 'Retail' },
  { ticker: 'KO', name: 'Coca-Cola', price: 58.73, basePrice: 58.73, change: 0, sector: 'Consumer' },
  { ticker: 'PEP', name: 'PepsiCo', price: 172.66, basePrice: 172.66, change: 0, sector: 'Consumer' },
  { ticker: 'NKE', name: 'Nike', price: 97.42, basePrice: 97.42, change: 0, sector: 'Consumer' },
  { ticker: 'MCD', name: "McDonald's", price: 257.88, basePrice: 257.88, change: 0, sector: 'Consumer' },
  { ticker: 'SBUX', name: 'Starbucks', price: 88.11, basePrice: 88.11, change: 0, sector: 'Consumer' },
  { ticker: 'COST', name: 'Costco', price: 684.92, basePrice: 684.92, change: 0, sector: 'Retail' },
  { ticker: 'T', name: 'AT&T', price: 16.24, basePrice: 16.24, change: 0, sector: 'Telecom' },
  { ticker: 'VZ', name: 'Verizon', price: 39.77, basePrice: 39.77, change: 0, sector: 'Telecom' },
  { ticker: 'XOM', name: 'Exxon Mobil', price: 115.60, basePrice: 115.60, change: 0, sector: 'Energy' },
  { ticker: 'CVX', name: 'Chevron', price: 158.95, basePrice: 158.95, change: 0, sector: 'Energy' },
  { ticker: 'SHEL', name: 'Shell plc', price: 66.12, basePrice: 66.12, change: 0, sector: 'Energy' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', price: 117.53, basePrice: 117.53, change: 0, sector: 'Technology' },
  { ticker: 'AVGO', name: 'Broadcom', price: 1289.40, basePrice: 1289.40, change: 0, sector: 'Technology' },
  { ticker: 'QCOM', name: 'Qualcomm', price: 134.22, basePrice: 134.22, change: 0, sector: 'Technology' },
  { ticker: 'TXN', name: 'Texas Instruments', price: 168.37, basePrice: 168.37, change: 0, sector: 'Technology' },
  { ticker: 'BMY', name: 'Bristol-Myers Squibb', price: 45.91, basePrice: 45.91, change: 0, sector: 'Healthcare' },
  { ticker: 'ABBV', name: 'AbbVie', price: 165.74, basePrice: 165.74, change: 0, sector: 'Healthcare' },
  { ticker: 'MRK', name: 'Merck & Co.', price: 122.18, basePrice: 122.18, change: 0, sector: 'Healthcare' },
  { ticker: 'BA', name: 'Boeing', price: 196.44, basePrice: 196.44, change: 0, sector: 'Industrial' },
  { ticker: 'GE', name: 'GE Aerospace', price: 164.30, basePrice: 164.30, change: 0, sector: 'Industrial' }
];

// ============================================================================
// Global App Instance
// ============================================================================

let app = null;

// ============================================================================
// Initialization
// ============================================================================

function initHeatmap() {
  log.info('Initializing heatmap...');

  const heatmapContainer = document.getElementById('heatmap');
  if (!heatmapContainer) {
    log.error('Heatmap container not found');
    return;
  }

  // Clear existing content
  heatmapContainer.innerHTML = '';

  // Create tiles
  assets.forEach((asset, index) => {
    const tile = document.createElement('div');
    tile.className = 'asset-tile neutral';
    tile.dataset.index = index;
    tile.style.animationDelay = `${index * 0.03}s`;

    const canvas = document.createElement('canvas');
    canvas.className = 'sparkline-canvas';
    canvas.width = 120;
    canvas.height = 25;

    tile.innerHTML = `
      <div class="ticker">${asset.ticker}</div>
      <div class="price">$${asset.price.toFixed(2)}</div>
      <div class="change">${asset.change.toFixed(2)}%</div>
      <span class="status-dot standby" aria-hidden="true"></span>
    `;

    tile.insertBefore(canvas, tile.firstChild);

    // Add click handler for modal
    tile.addEventListener('click', () => showAssetDetails(index));

    heatmapContainer.appendChild(tile);
  });

  // Create add tile button
  const addTile = document.createElement('div');
  addTile.className = 'asset-tile add-tile';
  addTile.style.animationDelay = `${assets.length * 0.03}s`;
  addTile.innerHTML = `
    <div class="add-tile-icon">+</div>
    <div class="add-tile-label">Add Ticker</div>
  `;
  addTile.addEventListener('click', () => {
    showToast('Add ticker feature coming soon');
  });
  heatmapContainer.appendChild(addTile);

  // Initialize app controller
  app = new AppController(assets);
  app.init();

  // Listen for tile updates to refresh statistics
  app.state.on('tile:updated', () => {
    updateStats();
  });

  // Setup remaining UI features
  setupFiltersAndSearch();
  setupSliders();
  setupThemes();
  setupKeyboardShortcuts();
  setupButtons();

  // Initial stats update
  updateStats();

  log.info('Heatmap initialized successfully');
  showToast('Heatmap loaded');
}

// ============================================================================
// UI Features (from original script)
// ============================================================================

function setupFiltersAndSearch() {
  const search = document.getElementById('asset-search');
  const filterSelect = document.getElementById('filter-select');
  const sortSelect = document.getElementById('sort-select');

  if (search) {
    search.addEventListener('input', debounce(applyFilters, 300));
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', applyFilters);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', applyFilters);
  }
}

function applyFilters() {
  const searchTerm = document.getElementById('asset-search')?.value.toLowerCase() || '';
  const filter = document.getElementById('filter-select')?.value || 'all';
  const sort = document.getElementById('sort-select')?.value || 'default';

  const tiles = Array.from(document.querySelectorAll('.asset-tile:not(.add-tile)'));

  tiles.forEach(tile => {
    const index = parseInt(tile.dataset.index);
    if (isNaN(index)) return; // Skip tiles without valid index

    const asset = assets[index];
    if (!asset) return; // Skip if asset not found

    const tileState = app.state.getTile(asset.ticker);

    let show = true;

    // Search filter
    if (searchTerm) {
      show = asset.ticker.toLowerCase().includes(searchTerm) ||
             asset.name.toLowerCase().includes(searchTerm) ||
             asset.sector.toLowerCase().includes(searchTerm);
    }

    // Category filter
    if (show) {
      const change = tileState?.change || 0;
      switch (filter) {
        case 'gaining':
          show = change > CONFIG.UI.THRESHOLDS.MILD_GAIN;
          break;
        case 'losing':
          show = change < CONFIG.UI.THRESHOLDS.MILD_LOSS;
          break;
        case 'neutral':
          show = change >= CONFIG.UI.THRESHOLDS.MILD_LOSS &&
                 change <= CONFIG.UI.THRESHOLDS.MILD_GAIN;
          break;
      }
    }

    tile.classList.toggle('hidden', !show);
  });

  // Apply sorting
  applySorting(sort);

  // Update stats
  updateStats();
}

function applySorting(sortType) {
  const container = document.getElementById('heatmap');
  const allTiles = Array.from(container.children);

  // Separate add-tile from regular tiles
  const addTile = allTiles.find(t => t.classList.contains('add-tile'));
  const tiles = allTiles.filter(t => !t.classList.contains('add-tile'));

  tiles.sort((a, b) => {
    const indexA = parseInt(a.dataset.index);
    const indexB = parseInt(b.dataset.index);

    // Handle invalid indices
    if (isNaN(indexA) || isNaN(indexB)) return 0;

    const assetA = assets[indexA];
    const assetB = assets[indexB];

    // Handle missing assets
    if (!assetA || !assetB) return 0;

    const tileA = app.state.getTile(assetA.ticker);
    const tileB = app.state.getTile(assetB.ticker);

    switch (sortType) {
      case 'change-desc':
        return (tileB?.change || 0) - (tileA?.change || 0);
      case 'change-asc':
        return (tileA?.change || 0) - (tileB?.change || 0);
      case 'price-desc':
        return (tileB?.price || 0) - (tileA?.price || 0);
      case 'price-asc':
        return (tileA?.price || 0) - (tileB?.price || 0);
      case 'ticker':
        return assetA.ticker.localeCompare(assetB.ticker);
      default:
        return indexA - indexB;
    }
  });

  // Re-append tiles in sorted order
  tiles.forEach(tile => container.appendChild(tile));

  // Always append add-tile at the end
  if (addTile) {
    container.appendChild(addTile);
  }
}

function updateStats() {
  const tiles = document.querySelectorAll('.asset-tile:not(.hidden):not(.add-tile)');
  let gaining = 0;
  let losing = 0;
  let totalChange = 0;
  const changes = [];

  tiles.forEach(tile => {
    const index = parseInt(tile.dataset.index);
    if (isNaN(index)) return; // Skip tiles without valid index

    const asset = assets[index];
    if (!asset) return; // Skip if asset not found

    const tileState = app.state.getTile(asset.ticker);
    const change = tileState?.change || 0;

    if (change > CONFIG.UI.THRESHOLDS.MILD_GAIN) gaining++;
    else if (change < CONFIG.UI.THRESHOLDS.MILD_LOSS) losing++;

    totalChange += change;
    changes.push(Math.abs(change));
  });

  const count = tiles.length || 1;

  document.getElementById('gaining').textContent = gaining;
  document.getElementById('losing').textContent = losing;
  document.getElementById('totalAssets').textContent = count;

  const marketTemp = ((gaining - losing) / count * 50).toFixed(1);
  const tempEl = document.getElementById('marketTemp');
  tempEl.textContent = `${marketTemp}°C`;
  tempEl.className = `stat-value ${marketTemp > 10 ? 'positive' : marketTemp < -10 ? 'negative' : 'neutral'}`;

  // Volatility: average of absolute changes (represents actual market movement)
  const volatility = (changes.reduce((sum, val) => sum + val, 0) / count).toFixed(2);
  document.getElementById('volatility').textContent = `${volatility}%`;

  // Average Change: net average (can be positive or negative)
  const avgChange = (totalChange / count).toFixed(2);
  const avgEl = document.getElementById('avgChange');
  avgEl.textContent = `${avgChange > 0 ? '+' : ''}${avgChange}%`;
  avgEl.className = `stat-value ${avgChange > 0 ? 'positive' : avgChange < 0 ? 'negative' : 'neutral'}`;
}

function setupSliders() {
  // Volatility slider (simulation mode only)
  const volatilitySlider = document.getElementById('volatility-slider');
  const volatilityValue = document.getElementById('volatility-value');

  if (volatilitySlider && volatilityValue) {
    const updateVolatilitySlider = (slider) => {
      const value = parseFloat(slider.value);
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      const progress = ((value - min) / (max - min)) * 100;
      slider.style.setProperty('--slider-progress', `${progress}%`);
    };

    // Initialize on load
    updateVolatilitySlider(volatilitySlider);

    volatilitySlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      CONFIG.UI.VOLATILITY.USER_MULTIPLIER = value;
      volatilityValue.textContent = `${value.toFixed(2)}x`;

      updateVolatilitySlider(e.target);

      showToast(`Volatility: ${value.toFixed(2)}x`);
    });
  }

  // Speed slider (simulation mode only)
  const speedSlider = document.getElementById('speed-slider');
  const speedValue = document.getElementById('speed-value');

  if (speedSlider && speedValue) {
    const updateSpeedSlider = (slider) => {
      const value = parseInt(slider.value);
      const min = parseInt(slider.min);
      const max = parseInt(slider.max);
      const progress = ((value - min) / (max - min)) * 100;
      slider.style.setProperty('--slider-progress', `${progress}%`);
    };

    // Initialize on load
    updateSpeedSlider(speedSlider);

    speedSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      CONFIG.UI.UPDATE_FREQUENCY = value;
      speedValue.textContent = `${value}ms`;

      updateSpeedSlider(e.target);

      showToast(`Update delay: ${value}ms`);
    });
  }
}

function setupThemes() {
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', cycleTheme);
  }
}

function setupButtons() {
  const btnToggle = document.getElementById('btn-toggle-animation');
  const btnCrash = document.getElementById('btn-market-crash');
  const btnBull = document.getElementById('btn-bull-run');
  const btnReset = document.getElementById('btn-reset');
  const btnExport = document.getElementById('btn-export');
  const btnModalClose = document.getElementById('modal-close-btn');

  if (btnToggle) btnToggle.addEventListener('click', toggleAnimation);
  if (btnCrash) btnCrash.addEventListener('click', simulateMarketCrash);
  if (btnBull) btnBull.addEventListener('click', simulateBullRun);
  if (btnReset) btnReset.addEventListener('click', resetMarket);
  if (btnExport) btnExport.addEventListener('click', exportToCSV);
  if (btnModalClose) btnModalClose.addEventListener('click', closeModal);
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const modal = document.getElementById('modal');
    if (modal && modal.classList.contains('active')) return;

    switch (e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        toggleAnimation();
        break;
      case 'c':
        simulateMarketCrash();
        break;
      case 'b':
        simulateBullRun();
        break;
      case 'r':
        resetMarket();
        break;
      case 'e':
        exportToCSV();
        break;
      case 't':
        cycleTheme();
        break;
      case 'escape':
        closeModal();
        break;
    }
  });
}

// ============================================================================
// Modal Functions
// ============================================================================

function showAssetDetails(index) {
  const asset = assets[index];
  const tileState = app.state.getTile(asset.ticker);
  const history = app.priceHistory.get(asset.ticker) || [];
  const mode = app.state.getMode();

  document.getElementById('modal-ticker').textContent = asset.ticker;
  document.getElementById('modal-name').textContent = asset.name;

  // Handle cases where price might be null (in real mode without data)
  const currentPrice = tileState?.price;
  const currentChange = tileState?.change;

  // Build details HTML
  let detailsHTML = `
    <div class="detail-row">
      <span class="detail-label">Current Price</span>
      <span class="detail-value">${currentPrice != null ? `$${currentPrice.toFixed(2)}` : '---'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Change</span>
      <span class="detail-value" style="color: ${currentChange > 0 ? '#10b981' : currentChange < 0 ? '#ef4444' : '#8b92a4'}">
        ${currentChange != null ? `${currentChange > 0 ? '+' : ''}${currentChange.toFixed(2)}%` : '---'}
      </span>
    </div>
  `;

  // Only show "Session Total" in simulation mode
  if (mode === 'simulation') {
    const firstPrice = history[0] || asset.basePrice;
    let sessionChange = '0.00';
    if (currentPrice != null && firstPrice != null) {
      sessionChange = ((currentPrice - firstPrice) / firstPrice * 100).toFixed(2);
    }

    detailsHTML += `
      <div class="detail-row">
        <span class="detail-label">Session Total</span>
        <span class="detail-value" style="color: ${sessionChange > 0 ? '#10b981' : sessionChange < 0 ? '#ef4444' : '#8b92a4'}">
          ${sessionChange !== '0.00' ? `${sessionChange > 0 ? '+' : ''}${sessionChange}%` : '---'}
        </span>
      </div>
    `;
  }

  detailsHTML += `
    <div class="detail-row">
      <span class="detail-label">Sector</span>
      <span class="detail-value">${asset.sector}</span>
    </div>
  `;

  document.getElementById('modal-details').innerHTML = detailsHTML;

  const modal = document.getElementById('modal');
  modal.classList.add('active');
  document.documentElement.style.overflow = 'hidden';

  setTimeout(() => drawModalChart(history), 150);
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('active');
  document.documentElement.style.overflow = '';
}

function drawModalChart(history) {
  if (history.length < 2) return;

  const canvas = document.getElementById('modal-chart');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const trend = history[history.length - 1] - history[0];

  // Y-axis labels
  const yAxisContainer = document.getElementById('chart-y-axis');
  if (yAxisContainer) {
    yAxisContainer.innerHTML = `
      <div>$${max.toFixed(2)}</div>
      <div>$${((max + min) / 2).toFixed(2)}</div>
      <div>$${min.toFixed(2)}</div>
    `;
  }

  // Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  if (trend > 0) {
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
  } else {
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.01)');
  }

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, height);

  history.forEach((p, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - ((p - min) / range) * height * 0.85 - height * 0.075;
    ctx.lineTo(x, y);
  });

  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Main line
  ctx.strokeStyle = trend > 0 ? '#10b981' : '#ef4444';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = trend > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
  ctx.shadowBlur = 10;
  ctx.beginPath();

  history.forEach((p, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - ((p - min) / range) * height * 0.85 - height * 0.075;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

// ============================================================================
// Control Functions
// ============================================================================

function toggleAnimation() {
  showToast('Use mode toggle to switch between simulation and real data');
}

function simulateMarketCrash() {
  assets.forEach(asset => {
    const tile = app.state.getTile(asset.ticker);
    if (tile) {
      // Ensure we have a base price (use placeholder for simulation)
      const basePrice = tile.basePrice || tile._placeholderBasePrice;
      tile.basePrice = basePrice;

      tile.change = -5 - Math.random() * 5;
      tile.price = basePrice * (1 + tile.change / 100);
      app.paintTile(asset.ticker);
    }
  });
  showToast('Market crash simulated');
  updateStats();
}

function simulateBullRun() {
  assets.forEach(asset => {
    const tile = app.state.getTile(asset.ticker);
    if (tile) {
      // Ensure we have a base price (use placeholder for simulation)
      const basePrice = tile.basePrice || tile._placeholderBasePrice;
      tile.basePrice = basePrice;

      tile.change = 5 + Math.random() * 5;
      tile.price = basePrice * (1 + tile.change / 100);
      app.paintTile(asset.ticker);
    }
  });
  showToast('Bull run simulated');
  updateStats();
}

function resetMarket() {
  assets.forEach(asset => {
    const tile = app.state.getTile(asset.ticker);
    if (tile) {
      // Ensure we have a base price (use placeholder for simulation)
      const basePrice = tile.basePrice || tile._placeholderBasePrice;
      tile.basePrice = basePrice;

      tile.change = 0;
      tile.price = basePrice;
      app.paintTile(asset.ticker);
    }
  });
  showToast('Market reset');
  updateStats();
}

function exportToCSV() {
  const headers = ['Ticker', 'Name', 'Sector', 'Price', 'Change %'];
  const rows = assets.map(a => {
    const tile = app.state.getTile(a.ticker);
    return [a.ticker, a.name, a.sector, tile?.price?.toFixed(2) || '0.00', tile?.change?.toFixed(2) || '0.00'];
  });
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `heatmap-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully');
}

// Theme cycling
const THEMES = ['thermal', 'matrix', 'ocean', 'sunset', 'monochrome'];
const THEME_NAMES = {
  thermal: 'Thermal',
  matrix: 'Matrix',
  ocean: 'Ocean',
  sunset: 'Sunset',
  monochrome: 'Monochrome'
};

let currentTheme = localStorage.getItem('heatmap-theme') || 'thermal';

// Apply saved theme on load
document.body.setAttribute('data-theme', currentTheme);

function cycleTheme() {
  const currentIndex = THEMES.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  currentTheme = THEMES[nextIndex];

  // Apply theme
  document.body.setAttribute('data-theme', currentTheme);

  // Save preference
  try {
    localStorage.setItem('heatmap-theme', currentTheme);
  } catch (e) {
    log.warn('Failed to save theme preference');
  }

  showToast(`Theme: ${THEME_NAMES[currentTheme]}`);
}

// ============================================================================
// Utility Functions
// ============================================================================

function showToast(message, duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ============================================================================
// Initialization on DOM Ready
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeatmap);
} else {
  initHeatmap();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (app) {
    app.transport.stop();
  }
});

// Pause when tab hidden
document.addEventListener('visibilitychange', () => {
  if (!app) return;
  
  if (document.hidden) {
    // Tab hidden - could pause updates here if needed
  } else {
    // Tab visible again
    updateStats();
  }
});
