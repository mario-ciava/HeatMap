# HeatMap Dashboard

> Static ES module heatmap built as a CSS and animation playground with a trading terminal look.  
> Runs from plain HTML/CSS/JS, streams Finnhub data through a tiny proxy and falls back to a synthetic market when you are offline.

## Overview

This repo hosts a **single-page heatmap** with zero frontend dependencies: no bundler, no framework, no CDN fonts. Everything lives under `index.html`, `css/` and `src/`. Real data comes from Finnhub (WebSocket + REST) and is mediated by `proxy/server.js`, a hardened Express + `ws` proxy that keeps API keys off the browser. When Finnhub is unreachable you get a simulation mode that keeps UI features usable.  
It was built to push layout, theme work, sparklines and transitions without a framework. The trading terminal vibe is just a skin to make the animations earn their keep.

The stack is small on purpose:
- **UI skeleton** (`index.html`, `css/*`): control panel, stats bar and two modal windows (asset details + add-ticker flow).
- **Controllers & state** (`src/`): event-driven core (`StateManager`, `TileRegistry`, `TileController`, `SimulationController`, `AppController`).
- **Transports** (`src/transport/*`): finnhub WebSocket client, REST client with rate limit handling and a market status poller.
- **Proxy** (`proxy/server.js`): https-safe reverse proxy with token bucket rate limiting and WebSocket fan-out.
- **Deployment**: `Dockerfile` serves the static app via nginx; `docker-compose.yml` brings up nginx + proxy side by side.

This is a **visualization toy**. It is not a brokerage UI, not an OMS, not even a reasonable watchlist for real money.

## Table of Contents

- [Architecture Snapshot](#architecture-snapshot)
- [Quick Start](#quick-start)
- [Operating Modes](#operating-modes)
- [UI & Interaction Layer](#ui--interaction-layer)
- [Data & Transport Layer](#data--transport-layer)
- [Proxy Service](#proxy-service)
- [Configuration](#configuration)
- [Testing & Instrumentation](#testing--instrumentation)
- [Security & Privacy Notes](#security--privacy-notes)
- [Limitations](#limitations)
- [Roadmap](#roadmap)
- [License](#license)

## Architecture Snapshot

| Stage | Module / File | Description |
| --- | --- | --- |
| 1 | `index.html`, `css/*` | Bare static shell, CSP locked down, responsive grid, canned themes (`data-theme`). |
| 2 | `src/core/main.js` | Bootstraps everything, wires controllers to DOM, exposes helpers (toasts, filters, theme cycling). |
| 3 | `src/services/AppController.js` | Central orchestrator: toggles modes, coordinates views, manages API keys and talks to transports. |
| 4 | `src/core/StateManager.js` | Canonical tile store + market status cache; emits events for UI repainting. |
| 5 | `src/registry/TileRegistry.js` + `src/render/TileRenderer.js` | DOM caching, sparkline buffers, batched paint pipeline via `UpdateScheduler`. |
| 6 | `src/controllers/SimulationController.js` | Synthetic tick data generator with volatility controls and keyboard shortcuts. |
| 7 | `src/transport/FinnhubTransport.js` + friends | Wraps WebSocket, REST and market status polling; sequential REST warm-up, WS fallback, dot state heuristics. |
| 8 | `proxy/server.js` | Express + `ws` proxy with CORS controls, token bucket rate limiter, streaming handshake, `/api/*` whitelist. |
| 9 | `Dockerfile`, `docker-compose.yml` | nginx serves the SPA; proxy runs separately with health checks on a shared network. |

## Quick Start

### 1. Clone and install dev dependencies (only needed for tests)
```bash
git clone https://github.com/mario-ciava/HeatMap.git
cd HeatMap
npm install
```

### 2. Simulation-only mode (no Finnhub key required)
1. Open `index.html` from a static server (any `python3 -m http.server` works).
2. Everything runs locally; the transport stays idle, simulation loop drives tiles at `CONFIG.UI.UPDATE_FREQUENCY`.

### 3. Real data mode with local proxy
1. Copy `.env.proxy.example` to `.env.proxy` (create the file if missing) and set `FINNHUB_API_KEY=your_key`.
2. Start the proxy:
   ```bash
   cd proxy
   npm install
   FINNHUB_API_KEY=pk_xxx ALLOWED_ORIGINS=http://localhost:4173 npm start
   ```
   Default port: `8080`.
3. Serve the frontend (nginx via Docker or any static server) from the repo root.
4. The browser-side bootstrap (`proxy-bootstrap.js`) points `window.__HEATMAP_PROXY_BASE` to `http://<host>/proxy`, so `AppController` automatically enables proxy mode and hides API key inputs.

### 4. Full docker-compose stack
```bash
docker compose up -d --build
```
- `heatmap-app` : nginx serving `/usr/share/nginx/html`.
- `heatmap-proxy` : node 20 alpine, needs `.env.proxy` with `FINNHUB_API_KEY` and optional `ALLOWED_ORIGINS`.
- Network `shared-edge` must exist (create via `docker network create shared-edge` once).

Stop everything with `docker compose down`.

## Operating Modes

- **Simulation** (default): `SimulationController` mutates placeholder assets (`SIMULATION_ASSETS`) with sine-based momentum + noise. Volatility and update cadence are adjustable from sliders or via `AppController.setSimulationFrequency`.
- **Real Data**: `FinnhubTransport` subscribes to tickers via WebSocket, batches REST calls to backfill `StateManager`, polls `/stock/market-status` to color the status dots and tracks fetching progress for UI messaging. Mode toggling preserves last real quotes so you can hop back without losing context.
- **Custom tickers**: the add-ticker modal hits Finnhub `/search`, stores metadata under `heatmap_custom_assets_v1` in `localStorage` and injects assets into whichever mode is active. Real-data tickers try a one-off REST fetch (`AppController.fetchQuoteDirect`) to seed the tile.

## UI & Interaction Layer

- **Control Panel** (`src/ui/views/ControlPanelView.js`): custom dropdowns (no native `<select>`), search/filter/sort logic, volatility & speed sliders, API key accordions, keyboard shortcuts and stats updates batched via `requestAnimationFrame`.
- **Heatmap grid** (`src/ui/views/HeatmapView.js`): builds each tile with sparkline canvas, ticker, price, change and status dot. Adds the “+ Add ticker” tile at the end.
- **Modal** (`src/ui/views/ModalView.js`): shows detailed metrics, draws a mini chart with gradients, handles cursor overlays and respects the current mode (simulation data vs live feed). Shares formatters from `main.js`.
- **Helpers** (`src/utils/helpers.js`): debounce/throttle, formatting, CSV export, keyboard shortcuts, theme cycling. No external utility libraries.
- **Themes**: predefined tokens under `css/tokens.css` + `data-theme` attribute. `cycleTheme` rotates through Thermal, Matrix, Ocean, Sunset, Monochrome.
- **Accessibility niceties**: custom selects manage focus order manually, modals lock scroll, stats are announced via `aria-live`.

## Data & Transport Layer

- **EventEmitter** (`src/core/EventEmitter.js`): tiny observer implementation powering all cross-module events (state changes, transport updates, scheduler flushes).
- **StateManager** (`src/core/StateManager.js`): stores canonical tile data, handles reset workflows, computes percentage changes, marks tiles dirty, caches market status and serializes snapshots if needed.
- **TileRegistry + TileController + TileRenderer**: cache DOM nodes, manage sparkline histories, schedule paints via `UpdateScheduler` (RAF-driven). `TileRenderer` applies CSS classes for gain/loss thresholds (`CONFIG.UI.THRESHOLDS`) and animates state transitions without thrashing the layout.
- **SimulationController**: uses sin-based oscillators, visible-tile pruning and momentum dampening to keep CPU costs low. Exposes pause/resume/frequency APIs for UI controls.
- **FinnhubTransport**: wraps `WebSocketClient`, `RESTClient` and `MarketStatusService`. Features include:
  - Sequential REST warm-up prioritizing tiles with no data.
  - Token-aware REST client with exponential backoff (`BACKOFF_429`) and concurrency caps.
  - WebSocket heartbeat with reconnect/backoff (`CONFIG.FINNHUB.RECONNECT`), subscription persistence and fallback to REST polling when WS stays down.
  - Dot state heuristics: when market status is unknown, recent trades (<5 minutes) keep the tile “open,” otherwise standby.
- **Perf instrumentation**: `src/utils/PerfMonitor.js` + `perfHelpers` measure batches, paints and simulation ticks. Toggle via `window.__heatmapPerfEnabled`.

## Proxy Service

`proxy/server.js` is a single file by design:
- **Express** handles `/api/*` GET calls, strips double slashes and only forwards whitelisted paths (`/quote`, `/stock/market-status`, `/search`).
- **Token bucket rate limiter** protects Finnhub quotas per client IP (`RATE_LIMIT_REQUESTS` / `RATE_LIMIT_WINDOW_MS`). Headers `X-RateLimit-*` are mirrored downstream.
- **CORS enforcement** via `ALLOWED_ORIGINS`. Default is permissive (any origin) but production should list explicit domains.
- **WebSocket fan-out**: `ws` server accepts `/ws`, opens a single upstream connection per client and relays messages once Finnhub confirms the link.
- **Environment flags**:

| Variable | Purpose |
| --- | --- |
| `FINNHUB_API_KEY` | Required; injected into REST query params and WS URL. |
| `FINNHUB_REST_BASE`, `FINNHUB_WS_BASE` | Optional overrides for Finnhub endpoints. |
| `ALLOWED_ORIGINS` | Comma-separated list checked on every request/upgrade. |
| `PORT` | Proxy port (default 8080). |
| `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_MS` | Token bucket tuning. |

If you skip the proxy and flip `CONFIG.SECURITY.PROXY_MODE` to `false`, the frontend will store the API key in `localStorage`. Do that only on localhost.

## Configuration

Centralized under `src/config.js`:
- `CONFIG.SECURITY`: proxy toggles, base URL (auto-derived from `proxy-bootstrap.js` or `VITE_PROXY_URL` env), future proofing for direct mode.
- `CONFIG.FINNHUB`: websocket URL, REST base, reconnect thresholds, rate limit caps, staleness heuristics.
- `CONFIG.UI`: update cadence, gain/loss thresholds, sparkline history length, simulation volatility multipliers.
- `CONFIG.API_KEY`: storage key (used only without proxy) and an optional dev key for local testing.
- `TICKER_EXCHANGE_MAP`: maps tickers to exchanges so `MarketStatusService` knows which venues to poll. Defaults to US for most items.
- `REAL_DATA_ASSETS` / `SIMULATION_ASSETS`: base asset metadata. Simulation list appends 50 tech/EV/clean-energy names on top of the real set.

Adjust values directly in the file; no build step required.

## Testing & Instrumentation

- **Unit tests** (Vitest): minimal coverage for pure logic (`TileRegistry`, `UpdateScheduler`, `SimulationController`). Run with:
  ```bash
  npm test
  ```
- **Manual verification**: because this is a DOM-heavy project, real validation is opening the browser, switching modes, adding/removing tickers and watching the perf report via `window.showHeatmapPerf()`.
- **Health checks**: nginx exposes `/healthz`; proxy exposes `/healthz`; docker-compose wiring uses those for `restart: unless-stopped`.

## Security & Privacy Notes

- The front-end never embeds the Finnhub key when proxy mode is on. The key lives in the proxy container or env vars.
- Direct mode (no proxy) stores the API key via `localStorage` under `finnhub_api_key`. There is no encryption, no key rotation and no user accounts.
- All state is local to the browser: custom tickers, last-used theme and simulation data live in `localStorage`; delete them manually if needed.
- No authentication, authorization or TLS termination is supplied. You own the nginx/proxy deployment and the firewall around it.
- This app pushes quotes to the DOM and nothing else. Do not rely on it for compliance, record-keeping or audit trails.

## Limitations

- Only Finnhub is supported. No Polygon, Yahoo or self-hosted feeds.
- The proxy performs no caching or batching; heavy use will trip rate limits quickly on free Finnhub accounts.
- Web UI assumes desktop real estate; mobile experience is untested.
- No persistence for real trades beyond the current session. Refresh the page and you start over.
- CSS animations and sparklines rely on the browser’s canvas. Underpowered machines will stutter when displaying all 100 tiles.
- Accessibility is “best effort.” Screen readers will announce stats and modals, but there is no comprehensive audit.

## Roadmap

- [ ] Optional worker/service-worker build to cache assets offline.
- [ ] Simple JSON export/import for saved custom tickers.
- [ ] Additional transport strategies (e.g., SSE or polling-only mode for corporate firewalls).
- [ ] Snapshot sharing (generate static PNG/HTML from the current grid).
- [x] Proxy-first architecture with API key isolation.

Use it as a playground, not as infrastructure. If you need real trading screens, write (or buy) a proper one.

## License
See [LICENSE](./LICENSE).
