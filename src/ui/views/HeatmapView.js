export class HeatmapView {
  constructor(app, assets, modalView, helpers = {}) {
    this.app = app;
    this.assets = assets;
    this.modalView = modalView;
    this.helpers = helpers;
  }

  setApp(app) {
    this.app = app;
  }

  buildHeatmap(container) {
    container.innerHTML = "";

    this.assets.forEach((asset, index) => {
      const tile = document.createElement("div");
      tile.className = "asset-tile neutral tile-enter";
      tile.dataset.index = index;
      tile.dataset.state = "neutral";
      tile.style.animationDelay = `${index * 0.03}s`;

      const canvas = document.createElement("canvas");
      canvas.className = "sparkline-canvas";
      canvas.width = 120;
      canvas.height = 25;

      tile.innerHTML = `
      <div class="ticker">${asset.ticker}</div>
      <div class="price">$${asset.price.toFixed(2)}</div>
      <div class="change">${asset.change.toFixed(2)}%</div>
      <span class="status-dot standby" aria-hidden="true"></span>
    `;

      tile.insertBefore(canvas, tile.firstChild);

      tile.addEventListener("animationend", (event) => {
        if (event.animationName === "tileEntry") {
          tile.classList.remove("tile-enter");
        }
      });

      tile.addEventListener("click", () => this.modalView.showAssetDetails(index));

      container.appendChild(tile);
    });

    const addTile = document.createElement("div");
    addTile.className = "asset-tile add-tile tile-enter";
    addTile.style.animationDelay = `${this.assets.length * 0.03}s`;
    addTile.innerHTML = `
    <div class="add-tile-icon">+</div>
    <div class="add-tile-text">
      <span class="add-tile-title">Add</span>
      <span class="add-tile-subtitle">ticker</span>
    </div>
  `;
    addTile.addEventListener("click", () => this.helpers.openAddTickerModal?.());
    addTile.addEventListener("animationend", (event) => {
      if (event.animationName === "tileEntry") {
        addTile.classList.remove("tile-enter");
      }
    });
    container.appendChild(addTile);
  }
}
