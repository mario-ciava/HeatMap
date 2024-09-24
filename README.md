# HeatMap Dashboard

[![Status](https://img.shields.io/badge/Status-Complete-success)]()
[![HTML/JS](https://img.shields.io/badge/Stack-Vanilla%20JS-yellow)]()
[![License](https://img.shields.io/badge/License-MIT-blue)]()
[![Tests](https://img.shields.io/badge/Tests-Passing-success)]()

> Static ES module heatmap built as a CSS and animation playground with a trading terminal look.
> Runs from plain HTML/CSS/JS, streams Finnhub data through a tiny proxy and falls back to a synthetic market when you are offline.

## Why This Exists

This repo hosts a **single-page heatmap** with zero frontend dependencies: no bundler, no framework, no CDN fonts. 
It was built to push layout, theme work, sparklines and transitions without the crutch of a framework. The "trading terminal" aesthetic is just a skin to make the animations earn their keep.

## Core Mechanics

### 1. The Simulation Engine
When Finnhub is unreachable (or in default mode), `SimulationController.js` takes over. It doesn't just randomize numbers; it uses sine-based oscillators with momentum and noise to generate plausible "market movements". It manages volatility states and guarantees that price drifts feel organic rather than chaotic.

### 2. High-Performance Rendering
The UI does not use React or Vue. Instead, `TileRegistry` manages a cache of DOM nodes while `UpdateScheduler` batches DOM reads and writes into `requestAnimationFrame` cycles to avoid layout thrashing. Sparklines are drawn on canvas buffers. This pipeline allows 100+ tiles to update at 60fps on modest hardware.

### 3. Resilience & Heuristics
The transport layer (`FinnhubTransport`) isn't just a fetch wrapper. It implements:
- **Sequential Warm-up**: Prioritizes fetching data for empty tiles first.
- **Dot State Heuristics**: If the market status API is flaky, it infers "Open/Closed" state based on the timestamp of the last received trade.
- **Graceful Degradation**: Seamlessly falls back to REST polling if the WebSocket connection drops or is blocked.

### 4. Traffic Control (The Proxy)
The `proxy/server.js` is more than a security measure; it's a **token bucket rate limiter**. It protects your Finnhub quota by enforcing strict request limits per client IP and manages WebSocket fan-out (one upstream connection serves multiple downstream clients), ensuring a single dashboard instance doesn't burn your daily limits.

## Architecture

The stack is small on purpose. Everything lives under `index.html`, `css/` and `src/`.

- **Control & State**: `AppController` coordinates the show, while `StateManager` acts as the single source of truth, emitting events to the UI.
- **UI Layer**: `HeatmapView` and `ModalView` render the grid and charts. Themes are handled by CSS variables in `tokens.css`.
- **Deployment**: A simple `Dockerfile` serves the static app via nginx, while `docker-compose.yml` pairs it with the proxy.

## Quick Start

### 1. Simulation Mode (No API Key)
Just serve `index.html` with any static server.
```bash
python3 -m http.server
# Open http://localhost:8000
```

### 2. Real Data Mode
Requires a Finnhub API key.
1.  Set `FINNHUB_API_KEY=your_key` in `.env.proxy`.
2.  Start the proxy: `cd proxy && npm start`.
3.  Serve the root directory. The app auto-detects the proxy at `/proxy`.

### 3. Docker Bundle
Runs nginx + proxy together.
```bash
# Network 'shared-edge' must exist or be removed from compose
docker compose up -d --build
```

## Configuration & Specs

- **Config**: Tweak `src/config.js` to adjust update frequency, volatility, or mapped exchanges. No build step required—just save and refresh.
- **Limitations**: Only supports Finnhub. Mobile layouts are "best effort".

## License

See [LICENSE](./LICENSE).
