
        // Asset data with realistic financial symbols
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
            { ticker: 'LOW', name: 'Lowe\'s', price: 205.55, basePrice: 205.55, change: 0, sector: 'Retail' },
            { ticker: 'KO', name: 'Coca-Cola', price: 58.73, basePrice: 58.73, change: 0, sector: 'Consumer' },
            { ticker: 'PEP', name: 'PepsiCo', price: 172.66, basePrice: 172.66, change: 0, sector: 'Consumer' },
            { ticker: 'NKE', name: 'Nike', price: 97.42, basePrice: 97.42, change: 0, sector: 'Consumer' },
            { ticker: 'MCD', name: 'McDonald’s', price: 257.88, basePrice: 257.88, change: 0, sector: 'Consumer' },
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

        // Configuration
        const CONFIG = {
            UPDATE_FREQUENCY: 1000,
            THRESHOLDS: { STRONG_GAIN: 3, MILD_GAIN: 0.5, STRONG_LOSS: -3, MILD_LOSS: -0.5 },
            HISTORY_LENGTH: 50,
            VOLATILITY: {
                BASE: 0.5,
                USER_MULTIPLIER: 1.0,  // Controllabile dall'utente
                AMPLITUDE: 0.3
            }
        };

        
        // === Finnhub Integration (5 live tiles) ===
        const FINNHUB = {
            API_KEY: 'd3n3tqpr01qmso3665q0d3n3tqpr01qmso3665qg',
            BASE: 'https://finnhub.io/api/v1',
            liveTickers: assets.map(a => a.ticker), // all tiles live
            rateMs: 12000, // refresh every 12s to respect rate limits
            _interval: null,
            controller: null
        };
        

// === Finnhub API key masked display & visibility ===
function maskKey(k){
  if(!k) return '';
  if(k.length <= 6) return '•'.repeat(Math.max(0,k.length));
  return k.slice(0,3) + '•'.repeat(Math.max(0,k.length-6)) + k.slice(-3);
}
function loadApiKeyUI(){
  const display = document.getElementById('api-key-display');
  if(!display) return;
  // Prefer saved key in localStorage; fallback to FINNHUB.API_KEY if present
  const saved = localStorage.getItem('finnhub_api_key') || (FINNHUB && FINNHUB.API_KEY) || '';
  display.dataset.actual = saved;
  display.dataset.visible = 'false';
  display.value = maskKey(saved);
  // Hover preview (non-sticky)
  display.addEventListener('mouseenter', ()=>{
    if(display.dataset.visible !== 'true') display.value = saved;
  });
  display.addEventListener('mouseleave', ()=>{
    if(display.dataset.visible !== 'true') display.value = maskKey(saved);
  });
  // Eye toggle (sticky)
  const btn = document.getElementById('api-key-visibility');
  if(btn){
    btn.addEventListener('click', ()=>{
      const vis = display.dataset.visible === 'true';
      display.dataset.visible = vis ? 'false' : 'true';
      display.value = vis ? maskKey(saved) : saved;
    });
  }
}
// Re-run UI load after saving key
const _origSaveHandler = (function(){
  // Attach only once when DOM is ready
  return function(){
    const saveBtn = document.getElementById('api-key-save');
    if(!saveBtn) return;
    if(saveBtn.dataset._wired === '1') return;
    saveBtn.dataset._wired = '1';
    saveBtn.addEventListener('click', ()=>{
      // Assume elsewhere you store to localStorage; refresh display afterwards
      setTimeout(loadApiKeyUI, 50);
    });
  };
})();
// === Market status helpers & per-tile dot state ===
        FINNHUB.market = { status: 'open', lastCheck: 0 };
        async function getMarketStatus() {
            try {
                const url = `${FINNHUB.BASE}/stock/market-status?exchange=US&token=${FINNHUB.API_KEY}`;
                const r = await fetch(url);
                if (!r.ok) {
                    console.warn(`Market status check returned ${r.status}`);
                    FINNHUB.market.status = 'closed';
                    updateLiveIndicator('paused');
                    return;
                }
                const j = await r.json();
                if (j && j.market) {
                    // Finnhub returns e.g. 'open', 'closed', 'pre', 'post'
                    FINNHUB.market.status = j.market;
                    FINNHUB.market.lastCheck = Date.now();
                    updateLiveIndicator(j.market === 'open' ? 'live' : (j.market === 'closed' ? 'closed' : 'paused'));
                }
            } catch(e){
                // On failure, keep previous status and mark as paused
                console.warn('Market status check failed:', e.message);
                FINNHUB.market.status = 'closed';
                updateLiveIndicator('paused');
            }
        }
        function statusIsOpen(){ return FINNHUB.market.status === 'open'; }
        function setTileStatusDot(index){
            const cached = tileCache.get(index);
            if (!cached || !cached.element) return;
            let dot = cached.element.querySelector('.status-dot');
            if (!dot) return;
            // Reset
            dot.classList.remove('open','pre','post','closed','pulsing');
            const a = assets[index];
            
            // Check if in real mode
            if (!realMode) {
                // In simulation mode, always show as open
                dot.classList.add('open', 'pulsing');
                return;
            }
            
            // In real mode, check actual market status
            let s = FINNHUB.market.status || 'closed';
            // If tile is not live, treat as closed for updates
            if (!a.live) s = 'closed';
            dot.classList.add(s);
            // Pulse when the tile is eligible to update (market open and live)
            if (a.live && s === 'open') dot.classList.add('pulsing');
        }
        function refreshAllStatusDots(){
            assets.forEach((_, idx) => setTileStatusDot(idx));
        }
    

        function tagLiveTickers() {
            const set = new Set(FINNHUB.liveTickers);
            assets.forEach(a => {
                if (set.has(a.ticker)) a.live = true;
            });
        }

        async function fetchFinnhubQuote(ticker, signal){ FINNHUB.lastRequestAt = Date.now(); updateLastApi(FINNHUB.lastRequestAt);
            try {
                const url = `${FINNHUB.BASE}/quote?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB.API_KEY}`;
                const r = await fetch(url, signal ? { signal } : {});
                if (!r.ok) {
                    console.warn(`Finnhub quote fetch failed for ${ticker}: HTTP ${r.status}`);
                    return null;
                }
                return r.json();
            } catch (e) {
                if (e.name !== 'AbortError') {
                    console.warn(`Finnhub quote fetch error for ${ticker}:`, e.message);
                }
                return null;
            }
        }

        async function initializeLiveData() {
            tagLiveTickers();
            const live = assets.filter(a => a.live);
            const controller = new AbortController();
            FINNHUB.controller = controller;
            
            try {
                const results = await Promise.allSettled(live.map(a => fetchFinnhubQuote(a.ticker, controller.signal)));
                results.forEach((res, i) => {
                    const asset = live[i];
                    if (res.status === 'fulfilled' && res.value && typeof res.value.c === 'number') {
                        const q = res.value;
                        const prev = asset.price;
                        asset.price = (typeof q.c === 'number' && q.c > 0) ? q.c : prev;
                        const base = (typeof q.pc === 'number' && q.pc > 0) ? q.pc : asset.basePrice || prev;
                        asset.basePrice = base;

                        if (typeof q.dp === 'number' && Number.isFinite(q.dp)) {
                            asset.change = q.dp;
                        } else if (typeof q.c === 'number' && typeof q.pc === 'number' && q.pc > 0) {
                            asset.change = ((q.c - q.pc) / q.pc) * 100;
                        }

                        // seed sparkline/history
                        const ph = priceHistory.get(asset.ticker) || [];
                        if (ph.length === 0) ph.push(base);
                        ph.push(asset.price);
                        priceHistory.set(asset.ticker, ph.slice(-CONFIG.HISTORY_LENGTH));
                    } else {
                        // fallback to simulation for this ticker
                        asset.live = false;
                        asset.simulatedFallback = true;
                        if (res.reason && res.reason.message !== 'AbortError') {
                            console.warn('Finnhub init failed for', asset?.ticker);
                        }
                    }
                });
                updateLiveIndicator('live'); // set to Live if ok
            } catch(e) {
                console.warn('Error initializing live data:', e.message);
                updateLiveIndicator('paused');
            }
        }

        function updateLiveIndicator(state) {
            const el = document.querySelector('.live-indicator');
            if (!el) return;
            el.classList.remove('paused','closed');
            if (state === 'paused') { el.classList.add('paused'); el.textContent = 'Paused'; }
            else if (state === 'closed') { el.classList.add('closed'); el.textContent = 'Closed'; }
            else { el.textContent = 'Live'; }
        }

        function startLiveRefreshLoop() {
            if (FINNHUB._interval) clearInterval(FINNHUB._interval);
            FINNHUB._interval = setInterval(async () => {
                if (!realMode) return;
const live = assets.filter(a => a.live);
                for (const a of live) {
                    try {
                        const q = await fetchFinnhubQuote(a.ticker);
                        if (typeof q.c === 'number' && q.c > 0) {
                            const prevPrice = a.price;
                            const base = (typeof q.pc === 'number' && q.pc > 0) ? q.pc : a.basePrice || prevPrice;
                            a.price = q.c;
                            a.basePrice = base;
                            a.change = (typeof q.dp === 'number' && Number.isFinite(q.dp)) ? q.dp : ((a.price - base) / base) * 100;

                            const idx = assets.findIndex(x => x.ticker === a.ticker);
                            const cached = tileCache.get(idx);
                            if (cached) {
                                // Update the tile visuals (classes, badge, sparkline)
                                updateTileVisual(idx);
                            }

                            // push to history for sparkline
                            const hist = priceHistory.get(a.ticker) || [];
                            hist.push(a.price);
                            if (hist.length > CONFIG.HISTORY_LENGTH) hist.shift();
                            priceHistory.set(a.ticker, hist);
                        }
                        updateLiveIndicator('live');
                    } catch (e) {
                        console.warn('Finnhub refresh failed for', a.ticker, e);
                        updateLiveIndicator('paused');
                    }
                }
            }, FINNHUB.rateMs);
        }

        async function loadHistoryForModal(ticker) {
            // Only fetch for live tickers; otherwise use session history
            const asset = assets.find(x => x.ticker === ticker);
            if (!asset || !asset.live) return;

            const now = Math.floor(Date.now() / 1000);
            const from = now - 60 * 60 * 6; // last 6 hours

            try {
                const url = `${FINNHUB.BASE}/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=1&from=${from}&to=${now}&token=${FINNHUB.API_KEY}`;
                const r = await fetch(url);
                const j = await r.json();
                if (j && j.s === 'ok' && Array.isArray(j.c)) {
                    const hist = j.c.slice(-CONFIG.HISTORY_LENGTH);
                    priceHistory.set(ticker, hist);
                }
            } catch (e) {
                console.warn('Finnhub candle fetch failed for', ticker, e);
            }
        }

        // State management
        let currentFilter = 'all';
        let currentSort = 'default';
        let currentTheme = 'thermal';
        let dynamicSortEnabled = false;

        let animationActive = true;
        let updateInterval;

        // Cache DOM elements and price history
        const tileCache = new Map();
        const priceHistory = new Map();
        const elements = {
            search: document.getElementById('asset-search'),
            filterSelect: document.getElementById('filter-select'),
            sortSelect: document.getElementById('sort-select'),
            modal: document.getElementById('modal'),
            toast: document.getElementById('toast')
        };

        // Themes - Complete color definitions
        const themes = {
            thermal: {
                name: 'Thermal',
                colors: {
                    '--loss-extreme': '#1e3a5f',
                    '--loss-high': '#2e4a7f',
                    '--loss-medium': '#3e5a9f',
                    '--loss-low': '#4e6abf',
                    '--neutral': '#5a5a5a',
                    '--gain-low': '#bf6a4e',
                    '--gain-medium': '#df5a3e',
                    '--gain-high': '#ff4a2e',
                    '--gain-extreme': '#ff2a1e'
                }
            },
            matrix: {
                name: 'Matrix',
                colors: {
                    '--loss-extreme': '#001a00',
                    '--loss-high': '#003300',
                    '--loss-medium': '#004d00',
                    '--loss-low': '#006600',
                    '--neutral': '#1a1a1a',
                    '--gain-low': '#33cc33',
                    '--gain-medium': '#00ff00',
                    '--gain-high': '#66ff66',
                    '--gain-extreme': '#99ff99'
                }
            },
            ocean: {
                name: 'Ocean',
                colors: {
                    '--loss-extreme': '#001f3f',
                    '--loss-high': '#003d7a',
                    '--loss-medium': '#0056a3',
                    '--loss-low': '#0074d9',
                    '--neutral': '#3a3a5a',
                    '--gain-low': '#ff6b6b',
                    '--gain-medium': '#ff5252',
                    '--gain-high': '#ff3838',
                    '--gain-extreme': '#FF4136'
                }
            },
            sunset: {
                name: 'Sunset',
                colors: {
                    '--loss-extreme': '#1a1a2e',
                    '--loss-high': '#2e2e4e',
                    '--loss-medium': '#4a4a6a',
                    '--loss-low': '#6666aa',
                    '--neutral': '#4a4a4a',
                    '--gain-low': '#ff6b35',
                    '--gain-medium': '#ff8c42',
                    '--gain-high': '#ffa500',
                    '--gain-extreme': '#ffb347'
                }
            },
            monochrome: {
                name: 'Monochrome',
                colors: {
                    '--loss-extreme': '#0a0a0a',
                    '--loss-high': '#1a1a1a',
                    '--loss-medium': '#2a2a2a',
                    '--loss-low': '#3a3a3a',
                    '--neutral': '#4a4a4a',
                    '--gain-low': '#cccccc',
                    '--gain-medium': '#dddddd',
                    '--gain-high': '#eeeeee',
                    '--gain-extreme': '#ffffff'
                }
            }
        };

        // LocalStorage Manager
        const StorageManager = {
            save() {
                try {
                    localStorage.setItem('heatmap-state', JSON.stringify({
                        assets: assets.map(a => ({ 
                            ticker: a.ticker, 
                            price: a.price, 
                            basePrice: a.basePrice,
                            change: a.change 
                        })),
                        timestamp: Date.now()
                    }));
                } catch (e) {}
            },
            load() {
                try {
                    const saved = localStorage.getItem('heatmap-state');
                    if (saved) {
                        const state = JSON.parse(saved);
                        if (Date.now() - state.timestamp < 3600000) return state;
                    }
                } catch (e) {}
                return null;
            }
        };

        // Initialize the heatmap
        async function initHeatmap() {
            const heatmapContainer = document.getElementById('heatmap');
            heatmapContainer.innerHTML = '';

            // Load saved state
            const saved = StorageManager.load();
            if (saved) {
                assets.forEach((a, i) => {
                    if (saved.assets[i]) {
                        a.price = saved.assets[i].price;
                        a.basePrice = saved.assets[i].basePrice || a.basePrice;
                        a.change = saved.assets[i].change;
                    }
                });
                showToast('📊 Session restored');
            }

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
                    <span class="status-dot" aria-hidden="true"></span>
                `;
                
                tile.insertBefore(canvas, tile.firstChild);
                tile.addEventListener('click', () => showAssetDetails(index));
                heatmapContainer.appendChild(tile);

                // Cache tile elements
                tileCache.set(index, {
                    element: tile,
                    price: tile.querySelector('.price'),
                    change: tile.querySelector('.change'),
                    canvas: canvas
                });

                // Set initial status dot state
                setTileStatusDot(index);


                // Initialize price history
                priceHistory.set(asset.ticker, [asset.price]);
            });

            setupEventListeners();

            // API key load/save
            (function initApiKeyManager(){
                try {
                    const savedKey = localStorage.getItem('finnhub-api-key');
                    if (savedKey && typeof savedKey === 'string' && savedKey.trim()) {
                        FINNHUB.API_KEY = savedKey.trim();
                    }
                } catch(e){}
                const saveBtn = document.getElementById('api-key-save');
                const input = document.getElementById('api-key-input');
                if (saveBtn && input){
                    saveBtn.addEventListener('click', async () => {
                        const k = (input.value || '').trim();
                        if (!k) { showToast('⚠️ Invalid API key'); return; }
                        FINNHUB.API_KEY = k;
                        try { localStorage.setItem('finnhub-api-key', k); } catch(e){}
                        // Restart live refresh with new key
                        await getMarketStatus();
                        await initializeLiveData();
                        refreshAllStatusDots();
                        showToast('✅ Finnhub API key updated');
                    });
                }
            })();
                    await getMarketStatus();
            await initializeLiveData();
            applyLiveFlagsToTiles();
            refreshAllStatusDots();
                        startMarketSimulation();
            startLiveRefreshLoop();
            setInterval(async () => await getMarketStatus(), 60000);
                        setInterval(() => StorageManager.save(), 30000);
            
            // Initialize volatility slider display
            const volatilitySlider = document.getElementById('volatility-slider');
            const volatilityValue = document.getElementById('volatility-value');
            if (volatilitySlider && volatilityValue) {
                const initialV = parseFloat(volatilitySlider.value);
                const vMin = parseFloat(volatilitySlider.min);
                const vMax = parseFloat(volatilitySlider.max);
                const progress = ((initialV - vMin) / (vMax - vMin)) * 100;
                volatilitySlider.style.setProperty('--slider-progress', `${progress}%`);
                volatilityValue.textContent = '1.00x';
            }
            
            // Initialize speed slider display
            const speedSlider = document.getElementById('speed-slider');
            if (speedSlider) {
                const initialS = parseFloat(speedSlider.value);
                const sMin = parseFloat(speedSlider.min);
                const sMax = parseFloat(speedSlider.max);
                const progress = ((initialS - sMin) / (sMax - sMin)) * 100;
                speedSlider.style.setProperty('--slider-progress', `${progress}%`);
                // Ensure speed value shows correct initial value
                const speedValue = document.getElementById('speed-value');
                if (speedValue) speedValue.textContent = `${initialS}ms`;
            }
        }

        // Show asset details modal
        async function showAssetDetails(index) {
            const asset = assets[index];
            const history = priceHistory.get(asset.ticker) || [];
            const firstPrice = history[0] || asset.basePrice;
            
            // Session Total: change from start of session (first price in history)
            const sessionChange = ((asset.price - firstPrice) / firstPrice * 100).toFixed(2);

            document.getElementById('modal-ticker').textContent = asset.ticker;
            document.getElementById('modal-name').textContent = asset.name;
            document.getElementById('modal-details').innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Current Price</span>
                    <span class="detail-value">$${asset.price.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Change</span>
                    <span class="detail-value" style="color: ${asset.change > 0 ? '#10b981' : asset.change < 0 ? '#ef4444' : '#8b92a4'}">
                        ${asset.change > 0 ? '+' : ''}${asset.change.toFixed(2)}%
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Session Total</span>
                    <span class="detail-value" style="color: ${sessionChange > 0 ? '#10b981' : sessionChange < 0 ? '#ef4444' : '#8b92a4'}">
                        ${sessionChange > 0 ? '+' : ''}${sessionChange}%
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Sector</span>
                    <span class="detail-value">${asset.sector}</span>
                </div>
            `;

            if (asset.live) { try { await loadHistoryForModal(asset.ticker); document.getElementById('chart-time-range').textContent = 'Live (Finnhub)'; } catch (e) {} }
            elements.modal.classList.add('active');
  document.documentElement.style.overflow = 'hidden';
            
            // Draw chart with slight delay for smoother animation
            setTimeout(() => drawModalChart(history), 150);
        }

        function closeModal() {
            elements.modal.classList.remove('active');
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

            // Update Y-axis labels
            const yAxisContainer = document.getElementById('chart-y-axis');
            if (yAxisContainer) {
                yAxisContainer.innerHTML = `
                    <div>$${max.toFixed(2)}</div>
                    <div>$${((max + min) / 2).toFixed(2)}</div>
                    <div>$${min.toFixed(2)}</div>
                `;
            }

            // Draw horizontal grid lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = (height / 4) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Draw gradient background fill
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
                if (i === 0) ctx.lineTo(x, y);
                else ctx.lineTo(x, y);
            });
            
            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fill();

            // Draw main line
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

            // Draw points at key locations
            ctx.shadowBlur = 0;
            
            // Start point
            const startY = height - ((history[0] - min) / range) * height * 0.85 - height * 0.075;
            ctx.beginPath();
            ctx.arc(0, startY, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fill();
            ctx.strokeStyle = trend > 0 ? '#10b981' : '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();

            // End point (larger)
            const lastX = width;
            const lastY = height - ((history[history.length - 1] - min) / range) * height * 0.85 - height * 0.075;
            ctx.beginPath();
            ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
            ctx.fillStyle = trend > 0 ? '#10b981' : '#ef4444';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        
        // Helper: update a single tile's classes, change badge, and sparkline
        function updateTileVisual(index){
            const asset = assets[index];
            const cached = tileCache.get(index);
            if (!cached || !asset) return;
            
            // Update price/change text
            cached.price.textContent = `$${asset.price.toFixed(2)}`;
            cached.change.textContent = `${asset.change.toFixed(2)}%`;
            
            // Update classes with smooth transitions
            cached.element.classList.remove('gaining', 'gaining-strong', 'losing', 'losing-strong', 'neutral');
            cached.change.classList.remove('positive', 'negative');
            
            if (asset.change > CONFIG.THRESHOLDS.STRONG_GAIN) {
                cached.element.classList.add('gaining-strong');
                cached.change.classList.add('positive');
            } else if (asset.change > CONFIG.THRESHOLDS.MILD_GAIN) {
                cached.element.classList.add('gaining');
                cached.change.classList.add('positive');
            } else if (asset.change < CONFIG.THRESHOLDS.STRONG_LOSS) {
                cached.element.classList.add('losing-strong');
                cached.change.classList.add('negative');
            } else if (asset.change < CONFIG.THRESHOLDS.MILD_LOSS) {
                cached.element.classList.add('losing');
                cached.change.classList.add('negative');
            } else {
                cached.element.classList.add('neutral');
            }
            
            
            // Update status dot state
            setTileStatusDot(index);

            // Draw sparkline
            let history = priceHistory.get(asset.ticker) || [];
            if (history.length >= 2) {
                const ctx = cached.canvas.getContext('2d');
                const w = cached.canvas.width;
                const h = cached.canvas.height;
                ctx.clearRect(0, 0, w, h);
                
                const min = Math.min(...history);
                const max = Math.max(...history);
                const range = max - min || 1;
                const trend = history[history.length - 1] - history[0];
                
                ctx.strokeStyle = trend > 0 ? '#10b981' : '#ef4444';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                
                history.forEach((p, i) => {
                    const x = (i / (history.length - 1)) * w;
                    const y = h - ((p - min) / range) * h;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                
                ctx.stroke();
            }
        }
// Simulate realistic market movements
        function updateMarketData() {
            if (!animationActive) return;

            let gaining = 0;
            let losing = 0;
            let totalChange = 0;
            let visibleCount = 0;

            assets.forEach((asset, index) => {
                // Simulate realistic price movements with momentum
                if (!realMode || !asset.live) {
                const momentum = Math.sin(Date.now() / 10000 + index) * 0.3;
                const randomFactor = (Math.random() - 0.5) * 2;
                const volatility = (CONFIG.VOLATILITY.BASE + 
                                   Math.sin(Date.now() / 5000) * CONFIG.VOLATILITY.AMPLITUDE) * 
                                   CONFIG.VOLATILITY.USER_MULTIPLIER;
                
                const changeAmount = (momentum + randomFactor) * volatility;
                asset.change += changeAmount;
                
                // Strong mean reversion to prevent drift
                asset.change *= 0.98;
                
                // Clamp changes to realistic ranges
                asset.change = Math.max(-10, Math.min(10, asset.change));
                
                // Calculate price from base price + percentage change
                // This prevents exponential drift
                asset.price = asset.basePrice * (1 + asset.change / 100);
                }
                
                // Count gaining/losing for ALL assets (for market statistics)
                if (asset.change > CONFIG.THRESHOLDS.MILD_GAIN) {
                    gaining++;
                } else if (asset.change < CONFIG.THRESHOLDS.MILD_LOSS) {
                    losing++;
                }
                totalChange += asset.change;
                
                // Update tile using cache
                const cached = tileCache.get(index);
                if (!cached) return;
                
                // Track visible count
                if (!cached.element.classList.contains('hidden')) {
                    visibleCount++;
                }

                // Push price history for sparkline then refresh visuals
                let history = priceHistory.get(asset.ticker) || [];
                history.push(asset.price);
                if (history.length > CONFIG.HISTORY_LENGTH) history.shift();
                priceHistory.set(asset.ticker, history);

                updateTileVisual(index)
            });

            // Update statistics
            updateStats(gaining, losing, totalChange, visibleCount);
            
            // Apply dynamic filtering if a filter is active or there's a search term
            if (currentFilter !== 'all' || elements.search.value.trim() !== '') {
                applyFilters();
            } else if (dynamicSortEnabled) {
                // Apply dynamic sorting if enabled (and no filter active)
                applySorting();
            }
        }

        // Update statistics display
        function updateStats(gaining, losing, totalChange, count) {
            // Prevent division by zero
            const safeCount = count || 1;
            
            document.getElementById('gaining').textContent = gaining;
            document.getElementById('losing').textContent = losing;
            
            // Calculate market temperature (metaphorical)
            const marketTemp = ((gaining - losing) / safeCount * 50).toFixed(1);
            const tempEl = document.getElementById('marketTemp');
            tempEl.textContent = `${marketTemp}°C`;
            tempEl.className = `stat-value ${marketTemp > 10 ? 'positive' : marketTemp < -10 ? 'negative' : 'neutral'}`;
            
            // Calculate volatility
            const volatility = Math.abs(totalChange / safeCount * 10).toFixed(1);
            document.getElementById('volatility').textContent = `${volatility}%`;
            
            // Average change
            const avgChange = (totalChange / safeCount).toFixed(2);
            const avgEl = document.getElementById('avgChange');
            avgEl.textContent = `${avgChange}%`;
            avgEl.className = `stat-value ${avgChange > 0 ? 'positive' : avgChange < 0 ? 'negative' : 'neutral'}`;
            
            // Update visible count in both places
            document.getElementById('totalAssets').textContent = count;
            const inlineCounter = document.getElementById('totalAssets-inline');
            if (inlineCounter) {
                inlineCounter.textContent = count;
            }
        }

        // Market simulation controls
        function startMarketSimulation() {
            if (updateInterval) clearInterval(updateInterval);
            updateInterval = setInterval(updateMarketData, CONFIG.UPDATE_FREQUENCY);
        }

        function toggleAnimation() {
            animationActive = !animationActive;
            if (animationActive) {
                startMarketSimulation();
                showToast('▶️ Animation resumed');
            } else {
                clearInterval(updateInterval);
                showToast('⏸️ Animation Paused');
            }
            updateLiveIndicator();
        }

        // Keep header indicator consistent with state
        updateLiveIndicator();

        function simulateMarketCrash() {
            assets.forEach(asset => {
                asset.change = -5 - Math.random() * 5;
            });
            updateMarketData();
            showToast('📉 Market crash simulated!');
        }

        function simulateBullRun() {
            assets.forEach(asset => {
                asset.change = 5 + Math.random() * 5;
            });
            updateMarketData();
            showToast('📈 Bull run simulated!');
        }

        function resetMarket() {
            assets.forEach(asset => {
                asset.change = 0;
                asset.price = asset.basePrice;
            });
            updateMarketData();
            showToast('🔄 Market reset');
        }

        // Initialize on load
        window.addEventListener('DOMContentLoaded', () => {
            initHeatmap();
            showToast('🚀 Heatmap loaded');
        });

        // Save state before unload
        window.addEventListener('beforeunload', () => StorageManager.save());

        // Pause animation when tab not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(updateInterval);
            } else if (animationActive) {
                startMarketSimulation();
            }
        });

        // Filter and search functions
        function applyFilters() {
            const searchTerm = elements.search.value.toLowerCase();
            const tiles = Array.from(document.querySelectorAll('.asset-tile'));

            tiles.forEach((tile) => {
                const asset = (assets[Number(tile.dataset.index)]);
                let show = true;

                // Search filter
                if (searchTerm) {
                    show = asset.ticker.toLowerCase().includes(searchTerm) ||
                           asset.name.toLowerCase().includes(searchTerm) ||
                           asset.sector.toLowerCase().includes(searchTerm);
                }

                // Category filter
                switch (currentFilter) {
                    case 'gaining':
                        show = show && asset.change > CONFIG.THRESHOLDS.MILD_GAIN;
                        break;
                    case 'losing':
                        show = show && asset.change < CONFIG.THRESHOLDS.MILD_LOSS;
                        break;
                    case 'neutral':
                        show = show && (asset.change >= CONFIG.THRESHOLDS.MILD_LOSS && 
                                       asset.change <= CONFIG.THRESHOLDS.MILD_GAIN);
                        break;
                }

                tile.classList.toggle('hidden', !show);
            });

            // Update viewing box style based on filter status
            const viewingBox = document.getElementById('viewing-box');
            if (viewingBox) {
                const isFiltered = currentFilter !== 'all' || searchTerm !== '';
                viewingBox.classList.toggle('filtered', isFiltered);
            }

            applySorting();
        }

        function applySorting() {
            const container = document.getElementById('heatmap');
            const tiles = Array.from(container.children);

            // Sort all tiles (hidden and visible)
            tiles.sort((a, b) => {
                const indexA = parseInt(a.dataset.index);
                const indexB = parseInt(b.dataset.index);
                
                // Safety check
                if (isNaN(indexA) || isNaN(indexB) || !assets[indexA] || !assets[indexB]) {
                    return 0;
                }
                
                const assetA = assets[indexA];
                const assetB = assets[indexB];

                switch (currentSort) {
                    case 'change-desc': 
                        return assetB.change - assetA.change;
                    case 'change-asc': 
                        return assetA.change - assetB.change;
                    case 'price-desc': 
                        return assetB.price - assetA.price;
                    case 'price-asc': 
                        return assetA.price - assetB.price;
                    case 'ticker': 
                        return assetA.ticker.localeCompare(assetB.ticker);
                    default: 
                        return indexA - indexB;
                }
            });

            // Re-append all tiles in sorted order
            tiles.forEach(tile => container.appendChild(tile));
        }

        function debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), wait);
            };
        }
        // Update the header live indicator state based on animation + volatility
        function updateLiveIndicator() {
            const indicator = document.querySelector('.live-indicator');
            if (!indicator) return;
            indicator.classList.remove('paused', 'closed');
            if (!animationActive) {
                indicator.classList.add('paused');
                indicator.textContent = 'Paused';
            } else if (Number(CONFIG.VOLATILITY.USER_MULTIPLIER) === 0) {
                indicator.classList.add('closed');
                indicator.textContent = 'Market Closed';
            } else {
                indicator.textContent = 'Live';
            }
        }

        function setupEventListeners() {
            elements.search.addEventListener('input', debounce(applyFilters, 300));
            elements.filterSelect.addEventListener('change', (e) => {
                currentFilter = e.target.value;
                applyFilters();
            });
            elements.sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                dynamicSortEnabled = (currentSort !== 'default');
                applyFilters();
            });
            elements.modal.addEventListener('click', (e) => {
                if (e.target === elements.modal) closeModal();
            });
            
            // Volatility control
            const volatilitySlider = document.getElementById('volatility-slider');
            const volatilityValue = document.getElementById('volatility-value');
            
            volatilitySlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                CONFIG.VOLATILITY.USER_MULTIPLIER = value;
                volatilityValue.textContent = `${value.toFixed(2)}x`;
                
                // Update slider progress for webkit browsers
                const progress = ((value - 0) / (7.5 - 0)) * 100;
                e.target.style.setProperty('--slider-progress', `${progress}%`);
                
                showToast(`⚡ Volatility set to ${value.toFixed(2)}x`);
                updateLiveIndicator();
            });

            // Speed control
            const speedSlider = document.getElementById('speed-slider');
            const speedValue = document.getElementById('speed-value');
            
            speedSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                CONFIG.UPDATE_FREQUENCY = value;
                speedValue.textContent = `${value}ms`;
                
                // Update slider progress for webkit browsers
                const progress = ((value - 250) / (5000 - 250)) * 100;
                e.target.style.setProperty('--slider-progress', `${progress}%`);
                
                // Restart simulation with new speed
                if (animationActive) {
                    startMarketSimulation();
                }
                
                showToast(`⏱️ Update delay set to ${value}ms`);
            });
        }

        function exportToCSV() {
            const headers = ['Ticker', 'Name', 'Sector', 'Price', 'Change %'];
            const rows = assets.map(a => [a.ticker, a.name, a.sector, a.price.toFixed(2), a.change.toFixed(2)]);
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `heatmap-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('💾 Data exported');
        }

        function cycleTheme() {
            const themeNames = Object.keys(themes);
            const currentIndex = themeNames.indexOf(currentTheme);
            const nextIndex = (currentIndex + 1) % themeNames.length;
            currentTheme = themeNames[nextIndex];
            
            const theme = themes[currentTheme];
            Object.entries(theme.colors).forEach(([key, value]) => {
                document.documentElement.style.setProperty(key, value);
            });
            
            showToast(`🎨 Theme: ${theme.name}`);
        }

        function showToast(message, duration = 2500) {
            elements.toast.textContent = message;
            elements.toast.classList.add('show');
            setTimeout(() => elements.toast.classList.remove('show'), duration);
        }

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
  if (elements.modal && elements.modal.classList.contains('active')) return;
            switch(e.key.toLowerCase()) {
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

        // Save state before unload
        
    
// === Real-vs-Simulation Mode Management ===
let realMode = false;

function applyLiveFlagsToTiles(){
    const tiles = document.querySelectorAll('.asset-tile');
    tiles.forEach(tile => {
        const idx = Number(tile.dataset.index);
        const a = assets[idx];
        tile.classList.toggle('is-live', !!(a && a.live));
    });
}

function setMode(useReal){
    realMode = !!useReal;
    document.body.classList.toggle('real-mode', realMode);
    const label = document.getElementById('mode-toggle-label');
    if (label) label.textContent = realMode ? 'Real Data' : 'Simulation';

    if (realMode){
        // Stop simulation; live refresh loop already runs for live tickers
        if (updateInterval) clearInterval(updateInterval);
        animationActive = false;
        // make sure live flags are applied
        applyLiveFlagsToTiles();
        showToast('🛰️ Real data activated');
        // Update indicator for real mode
        updateLiveIndicator('closed'); // Will be updated by getMarketStatus
    } else {
        // Back to simulation for all tiles
        animationActive = true;
        startMarketSimulation();
        showToast('🧪 Simulation activated');
        // Update indicator for simulation mode
        updateLiveIndicator('live');
    }
    // Re-apply filters/sorting so counts/visibility stay coherent
    try { applyFilters(); } catch(e){ /* no-op */ }
    animateControlPanelFade();

}


// === Subtle fade animation for control panel on mode toggle ===
function animateControlPanelFade(){
  try{
    const panel = document.querySelector('.control-panel-body');
    if(!panel) return;
    const nodes = panel.querySelectorAll('.control-section, .control-group, .slider-control, .filter-select, .search-input');
    nodes.forEach((el, i) => {
      // Stagger slightly
      const delay = Math.min(i * 20, 160);
      el.style.animationDelay = delay + 'ms';
      el.classList.add('cp-fade-in');
      el.addEventListener('animationend', () => {
        el.style.animationDelay = '';
        el.classList.remove('cp-fade-in');
      }, { once: true });
    });
  }catch(e){}
}
// Wire the toggle after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const t = document.getElementById('mode-toggle');
    if (t){
        t.addEventListener('change', (e) => setMode(e.target.checked));
    }
});

    
// === Last API timestamp ===
function updateLastApi(ts){
  try{
    const el = document.getElementById('last-api');
    if(!el) return;
    const d = ts ? new Date(ts) : new Date();
    el.textContent = 'Last Update (API): ' + d.toLocaleString();
  }catch(e){}
}


// === Override: robust status-dot logic with standby ===
(function(){
  function computeStateForTicker(ticker){
    try{
      if (typeof computeExchangeState === 'function') {
        return computeExchangeState(ticker);
      }
      // Fallback to FINNHUB.market.status if present
      if (window.FINNHUB && FINNHUB.market && typeof FINNHUB.market.status === 'string'){
        return FINNHUB.market.status;
      }
    }catch(e){}
    return 'closed';
  }
  window.setTileStatusDot = function(index){
    const cached = tileCache && tileCache.get ? tileCache.get(index) : null;
    if(!cached || !cached.element) return;
    const dot = cached.element.querySelector('.status-dot');
    if(!dot) return;
    dot.classList.remove('open','pre','post','closed','pulsing','standby');
    const a = assets[index];
    const isReal = typeof realModeGetter === 'function' ? realModeGetter() : (typeof realMode !== 'undefined' ? realMode : false);
    if(!isReal){
      dot.classList.add('open','pulsing');
      return;
    }
    // If API is rate-limited or controller is updating, set standby
    const standby = (window.FH && FH.rateLimited) || (window.FINNHUB && FINNHUB.rateLimited) || (window.FH && FH.updating) || (window.FINNHUB && FINNHUB.updating);
    if(standby){ dot.classList.add('standby','pulsing'); return; }
    // If asset not live, mark closed
    if(a && a.live === false){ dot.classList.add('closed'); return; }
    const st = computeStateForTicker(a ? a.ticker : '');
    if (st === 'open') { dot.classList.add('open','pulsing'); return; }
    if (st === 'pre' || st === 'post') { dot.classList.add(st); return; }
    if (st === 'standby' || st === 'updating') { dot.classList.add('standby','pulsing'); return; }
    dot.classList.add('closed');
  };
})();


// === Viewing box accurate count ===
function updateViewingBox(){
  const box = document.getElementById('viewing-box');
  if(!box) return;
  const total = assets.length;
  const visible = document.querySelectorAll('.asset-tile:not(.hidden)').length;
  box.querySelector('.count').textContent = String(visible);
  // Toggle filtered style if not all visible or if search/filter active
  const q = (document.getElementById('asset-search')||{}).value || '';
  const sel = (document.getElementById('filter-select')||{}).value || 'all';
  const filtered = (visible !== total) || (q.trim().length>0) || (sel !== 'all');
  box.classList.toggle('filtered', !!filtered);
}
// Hook updateViewingBox after any filter/search/sort change
(function(){
  const search = document.getElementById('asset-search');
  if (search) search.addEventListener('input', debounce(updateViewingBox, 50));
  const sel = document.getElementById('filter-select');
  if (sel) sel.addEventListener('change', updateViewingBox);
  const sortSel = document.getElementById('sort-select');
  if (sortSel) sortSel.addEventListener('change', function(){ setTimeout(updateViewingBox, 0); });
  // Initial update
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(updateViewingBox, 0); }, { once:true });
})();


// === Override: live-indicator state to include 'standby' ===
function updateLiveIndicator(state) {
  const el = document.querySelector('.live-indicator');
  if (!el) return;
  el.classList.remove('paused','closed','standby');
  if (state === 'paused') { el.classList.add('paused'); el.textContent = 'Paused'; }
  else if (state === 'closed') { el.classList.add('closed'); el.textContent = 'Closed'; }
  else if (state === 'standby') { el.classList.add('standby'); el.textContent = 'Standby'; }
  else { el.textContent = 'Live'; }
}



/* --- Split from heatmap_v13.html --- */


(function(){
  function applyMode(checked){
    const body = document.body;
    const label = document.getElementById('mode-toggle-label');
    if(!label) return;
    if(checked){
      body.classList.add('real-mode');
      label.textContent = 'Real Data';
    }else{
      body.classList.remove('real-mode');
      label.textContent = 'Simulation';
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
  loadApiKeyUI();
  _origSaveHandler();

    var t = document.getElementById('mode-toggle');
    if(!t) return;
    // Initialize label based on current state
    applyMode(!!t.checked);
    // Listen to changes
    t.addEventListener('change', function(e){
      applyMode(!!e.target.checked);
    });
  });
})();


/* --- Split from heatmap_v13.html --- */


(function(){
  // Robust guards and fallbacks
  const W = window;
  const D = document;
  const FINNHUB = W.FINNHUB || (W.FINNHUB = {});
  const realModeGetter = () => {
    // Prefer explicit global boolean if present, else check body class
    if (typeof W.realMode === "boolean") return W.realMode;
    return D.body && D.body.classList ? D.body.classList.contains('real-mode') : false;
  };

  // Dot creation on every .asset-tile
  function ensureDots(){
    const tiles = D.querySelectorAll('.asset-tile');
    tiles.forEach(tile => {
      if (!tile.querySelector('.status-dot')){
        const dot = D.createElement('span');
        dot.className = 'status-dot closed';
        tile.appendChild(dot);
      }
    });
  }

  // Finnhub market status
  const FH = FINNHUB;
  FH.marketStatus = FH.marketStatus || {};
  FH.exchangeMap  = FH.exchangeMap || {};    // { 'AAPL':'US', ... }
  FH.defaultExchange = FH.defaultExchange || 'US';
  FH.marketPingMs = FH.marketPingMs || 60000;

  async function fetchMarketStatus(exchange){ FH.lastRequestAt = Date.now(); updateLastApi(FH.lastRequestAt);
    try {
      const base = FH.BASE || 'https://finnhub.io/api/v1';
      const token = FH.API_KEY || FH.apiKey || FH.token || '';
      const url = `${base}/stock/market-status?exchange=${encodeURIComponent(exchange)}&token=${encodeURIComponent(token)}`;
      const r = await fetch(url);
      if (!r.ok) {
        console.warn(`Market status returned ${r.status} for ${exchange}`);
        return { isOpen:false, session:'closed' };
      }
      return await r.json();
    } catch (e){
      if (e.message && !e.message.includes('Load failed')) {
        console.warn('Market status check:', e.message);
      }
      return { isOpen:false, session:'closed' };
    }
  }

  async function refreshAllMarketStatus(){
    if (!realModeGetter()) return; // Only check in real mode
    const exchanges = new Set([FH.defaultExchange, ...Object.values(FH.exchangeMap)]);
    const tasks = [...exchanges].map(async ex => {
      FH.marketStatus[ex] = await fetchMarketStatus(ex);
    });
    await Promise.allSettled(tasks);
    updateAllStatusDots();
  }

  function computeExchangeState(tile){
    // In simulation mode, always return 'open'
    if (!realModeGetter()) return 'open';
    
    // Try to detect ticker from data attributes or content
    let ticker = tile.getAttribute('data-ticker') || tile.dataset?.ticker;
    if (!ticker){
      // fallback: try find an element with class .ticker inside
      const t = tile.querySelector('.ticker, .asset-ticker, [data-role="ticker"]');
      if (t) ticker = (t.textContent || '').trim().split(/\s+/)[0];
    }
    const ex = FH.exchangeMap[ticker] || FH.defaultExchange;
    const st = FH.marketStatus[ex];
    if (!st) return 'closed';
    if (st.isOpen === true) return 'open';
    if (typeof st.session === 'string'){
      const s = st.session.toLowerCase();
      if (s.includes('pre')) return 'pre';
      if (s.includes('post')) return 'post';
    }
    return 'closed';
  }

  function updateAllStatusDots(){
    const tiles = D.querySelectorAll('.asset-tile');
    tiles.forEach(updateTileStatusDot);
  }

  function updateTileStatusDot(tile){
    const dot = tile.querySelector('.status-dot');
    if (!dot) return;
    
    // Get state based on mode
    const state = computeExchangeState(tile); // open | pre | post | closed
    
    // Clear and set classes
    dot.className = 'status-dot ' + state;

    // Pulse in appropriate conditions
    const shouldPulse = (state === 'open' || (!realModeGetter() && state === 'open'));
    if (shouldPulse) dot.classList.add('pulsing');
  }

  function startMarketStatusLoop(){
    if (FH._marketInterval) clearInterval(FH._marketInterval);
    const tick = ()=> {
      if (realModeGetter()) { // Only fetch in real mode
        refreshAllMarketStatus();
      } else {
        updateAllStatusDots(); // Just update visuals in simulation
      }
    };
    tick(); // first run
    FH._marketInterval = setInterval(tick, FH.marketPingMs);
  }

  // Observe DOM mutations to attach dots to dynamically added tiles
  const observer = new MutationObserver(() => ensureDots());
  function startObserver(){
    const root = D.querySelector('.tiles, .grid, .heatmap, body');
    if (!root) return;
    try {
      observer.observe(root, { childList:true, subtree:true });
    } catch(e) {
      // Avoid DataCloneError warnings
    }
  }

  // Boot
  function boot(){
    ensureDots();
    startObserver();
    startMarketStatusLoop();
  }
  if (D.readyState === 'loading'){
    D.addEventListener('DOMContentLoaded', boot, { once:true });
  } else {
    boot();
  }

  // Optional: listen for a custom mode toggle event to refresh dots
  W.addEventListener && W.addEventListener('modechange', updateAllStatusDots);
})();
