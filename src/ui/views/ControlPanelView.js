import { CONFIG } from "../../config.js";
import { perfStart, perfEnd } from "../../utils/perfHelpers.js";

export class ControlPanelView {
  constructor(app, assets, helpers) {
    this.app = app;
    this.assets = assets;
    this.helpers = helpers;
    this.statsUpdateScheduled = false;
    this.enhancedSelectWrappers = new Set();
    this.openCustomSelect = null;
    this.canvasResizeInProgress = false;
    this.currentSingleTileMode = false; // Track current state
    this._handlePointerDown = (event) => {
      if (this.openCustomSelect && !this.openCustomSelect.contains(event.target)) {
        this.openCustomSelect._close?.({ focusTrigger: false });
      }
    };
    this._handleKeyDown = (event) => {
      if (event.key === "Escape" && this.openCustomSelect) {
        this.openCustomSelect._close?.();
      }
    };
  }

  init() {
    this.#setupFiltersAndSearch();
    this.#setupSliders();
    this.#setupThemes();
    this.#setupButtons();
    this.#setupKeyboardShortcuts();
    this.#setupDetailsAnimation();

    document.addEventListener("pointerdown", this._handlePointerDown);
    document.addEventListener("keydown", this._handleKeyDown);
  }

  scheduleStatsUpdate() {
    if (this.statsUpdateScheduled) return;
    this.statsUpdateScheduled = true;
    requestAnimationFrame(() => {
      this.statsUpdateScheduled = false;
      this.updateStats();
    });
  }

  updateStats() {
    const perfId = perfStart("updateStats");
    let sampleCount = 0;
    let gaining = 0;
    let losing = 0;
    let neutral = 0;
    let totalChange = 0;
    const changes = [];

    try {
      const tiles = document.querySelectorAll(
        ".asset-tile:not(.hidden):not(.add-tile)",
      );
      sampleCount = tiles.length;

      tiles.forEach((tile) => {
        const index = parseInt(tile.dataset.index);
        if (Number.isNaN(index)) return;

        const asset = this.assets[index];
        if (!asset) return;

        const tileState = this.app.state.getTile(asset.ticker);
        const change = tileState?.change || 0;

        if (change > CONFIG.UI.THRESHOLDS.MILD_GAIN) gaining++;
        else if (change < CONFIG.UI.THRESHOLDS.MILD_LOSS) losing++;
        else neutral++;

        totalChange += change;
        changes.push(Math.abs(change));
      });

      const count = sampleCount || 1;

      document.getElementById("gaining").textContent = gaining;
      document.getElementById("losing").textContent = losing;
      document.getElementById("neutral").textContent = neutral;
      document.getElementById("totalAssets").textContent = count;

      const marketTemp = (((gaining - losing) / count) * 50).toFixed(1);
      const tempEl = document.getElementById("marketTemp");
      tempEl.textContent = `${marketTemp}°C`;
      tempEl.className = `stat-value ${marketTemp > 10 ? "positive" : marketTemp < -10 ? "negative" : "neutral"}`;

      const volatility = (
        changes.reduce((sum, val) => sum + val, 0) / count
      ).toFixed(2);
      document.getElementById("volatility").textContent = `${volatility}%`;

      const avgChange = (totalChange / count).toFixed(2);
      const avgEl = document.getElementById("avgChange");
      avgEl.textContent = `${avgChange > 0 ? "+" : ""}${avgChange}%`;
      avgEl.className = `stat-value ${avgChange > 0 ? "positive" : avgChange < 0 ? "negative" : "neutral"}`;
    } finally {
      perfEnd(perfId, Math.max(sampleCount, 1));
    }
  }

  #setupFiltersAndSearch() {
    const search = document.getElementById("asset-search");
    const filterSelect = document.getElementById("filter-select");
    const sortSelect = document.getElementById("sort-select");

    this.#enhanceDropdown(filterSelect);
    this.#enhanceDropdown(sortSelect);

    if (search) {
      search.addEventListener("input", this.helpers.debounce(() => this.applyFilters(), 300));
    }

    if (filterSelect) {
      filterSelect.addEventListener("change", () => this.applyFilters());
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", () => this.applyFilters());
    }
  }

  applyFilters() {
    const perfId = perfStart("applyFilters");
    let processed = 0;
    try {
      const searchTerm =
        document.getElementById("asset-search")?.value.toLowerCase() || "";
      const filter = document.getElementById("filter-select")?.value || "all";
      const sort = document.getElementById("sort-select")?.value || "default";

      const tiles = Array.from(
        document.querySelectorAll(".asset-tile:not(.add-tile)"),
      );

      let visibleCount = 0;

      tiles.forEach((tile) => {
        processed++;
        const index = parseInt(tile.dataset.index);
        if (Number.isNaN(index)) return;

        const asset = this.assets[index];
        if (!asset) return;

        const tileState = this.app.state.getTile(asset.ticker);

        let show = true;

        if (searchTerm) {
          show =
            asset.ticker.toLowerCase().includes(searchTerm) ||
            asset.name.toLowerCase().includes(searchTerm) ||
            asset.sector.toLowerCase().includes(searchTerm);
        }

        if (show) {
          const change = tileState?.change || 0;
          switch (filter) {
            case "gaining":
              show = change > CONFIG.UI.THRESHOLDS.MILD_GAIN;
              break;
            case "losing":
              show = change < CONFIG.UI.THRESHOLDS.MILD_LOSS;
              break;
            case "neutral":
              show =
                change >= CONFIG.UI.THRESHOLDS.MILD_LOSS &&
                change <= CONFIG.UI.THRESHOLDS.MILD_GAIN;
              break;
          }
        }

        tile.classList.toggle("hidden", !show);
        if (show) visibleCount++;
      });

      // Apply special styling when only one tile is visible
      const container = document.getElementById("heatmap");
      if (container) {
        const isSingleTile = visibleCount === 1;
        container.classList.toggle("single-tile-mode", isSingleTile);

        // Resize canvas only when state actually changes
        if (this.currentSingleTileMode !== isSingleTile) {
          this.currentSingleTileMode = isSingleTile;
          this.#resizeCanvasesForMode(isSingleTile);
        }
      }

      this.applySorting(sort);
      this.updateStats();
    } finally {
      perfEnd(perfId, Math.max(processed, 1));
    }
  }

  applySorting(sortType) {
    const perfId = perfStart("applySorting");
    let processed = 0;
    try {
      const container = document.getElementById("heatmap");
      const allTiles = Array.from(container.children);

      const addTile = allTiles.find((t) => t.classList.contains("add-tile"));
      const tiles = allTiles.filter((t) => !t.classList.contains("add-tile"));

      tiles.sort((a, b) => {
        processed++;
        const indexA = parseInt(a.dataset.index);
        const indexB = parseInt(b.dataset.index);

        if (Number.isNaN(indexA) || Number.isNaN(indexB)) return 0;

        const assetA = this.assets[indexA];
        const assetB = this.assets[indexB];

        if (!assetA || !assetB) return 0;

        const tileA = this.app.state.getTile(assetA.ticker);
        const tileB = this.app.state.getTile(assetB.ticker);

        switch (sortType) {
          case "change-desc":
            return (tileB?.change || 0) - (tileA?.change || 0);
          case "change-asc":
            return (tileA?.change || 0) - (tileB?.change || 0);
          case "price-desc":
            return (tileB?.price || 0) - (tileA?.price || 0);
          case "price-asc":
            return (tileA?.price || 0) - (tileB?.price || 0);
          case "ticker":
            return assetA.ticker.localeCompare(assetB.ticker);
          default:
            return indexA - indexB;
        }
      });

      tiles.forEach((tile) => container.appendChild(tile));
      if (addTile) {
        container.appendChild(addTile);
      }
    } finally {
      perfEnd(perfId, Math.max(processed, 1));
    }
  }

  #setupSliders() {
    const volatilitySlider = document.getElementById("volatility-slider");
    const volatilityValue = document.getElementById("volatility-value");

    if (volatilitySlider && volatilityValue) {
      const updateVolatilitySlider = (slider) => {
        const value = parseFloat(slider.value);
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const progress = ((value - min) / (max - min)) * 100;
        slider.style.setProperty("--slider-progress", `${progress}%`);
      };

      updateVolatilitySlider(volatilitySlider);

      volatilitySlider.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        CONFIG.UI.VOLATILITY.USER_MULTIPLIER = value;
        volatilityValue.textContent = `${value.toFixed(2)}x`;

        updateVolatilitySlider(e.target);

        this.helpers.showToast?.(`Volatility: ${value.toFixed(2)}x`);
      });
    }

    const speedSlider = document.getElementById("speed-slider");
    const speedValue = document.getElementById("speed-value");

    if (speedSlider && speedValue) {
      // Initialize slider with value from config
      speedSlider.value = CONFIG.UI.UPDATE_FREQUENCY;
      speedValue.textContent = `${CONFIG.UI.UPDATE_FREQUENCY}ms`;

      const updateSpeedSlider = (slider) => {
        const value = parseInt(slider.value);
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        const progress = ((value - min) / (max - min)) * 100;
        slider.style.setProperty("--slider-progress", `${progress}%`);
      };

      updateSpeedSlider(speedSlider);

      speedSlider.addEventListener("input", (e) => {
        const value = parseInt(e.target.value);
        if (this.app && typeof this.app.setSimulationFrequency === "function") {
          this.app.setSimulationFrequency(value);
        } else {
          CONFIG.UI.UPDATE_FREQUENCY = value;
        }
        speedValue.textContent = `${value}ms`;

        updateSpeedSlider(e.target);

        this.helpers.showToast?.(`Update delay: ${value}ms`);
      });
    }
  }

  #setupThemes() {
    const themeBtn = document.getElementById("theme-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", this.helpers.cycleTheme);
    }
  }

  #setupButtons() {
    const btnToggle = document.getElementById("btn-toggle-animation");
    const btnCrash = document.getElementById("btn-market-crash");
    const btnBull = document.getElementById("btn-bull-run");
    const btnReset = document.getElementById("btn-reset");
    const btnExport = document.getElementById("btn-export");
    const btnModalClose = document.getElementById("modal-close-btn");

    if (btnToggle) btnToggle.addEventListener("click", this.helpers.toggleAnimation);
    if (btnCrash) btnCrash.addEventListener("click", this.helpers.simulateMarketCrash);
    if (btnBull) btnBull.addEventListener("click", this.helpers.simulateBullRun);
    if (btnReset) btnReset.addEventListener("click", this.helpers.resetMarket);
    if (btnExport) btnExport.addEventListener("click", this.helpers.exportToCSV);
    if (btnModalClose) btnModalClose.addEventListener("click", this.helpers.closeModal);
  }

  #setupDetailsAnimation() {
    const details = document.querySelector(".api-settings");
    if (!details) return;

    const summary = details.querySelector(".api-settings-label");
    const content = details.querySelector(".api-settings-content");
    if (!summary || !content) return;

    let isAnimating = false;

    summary.addEventListener("click", (e) => {
      e.preventDefault();

      if (isAnimating) return;
      isAnimating = true;

      if (!details.open) {
        // Opening
        details.open = true;
        content.style.overflow = "hidden";
        content.style.opacity = "0";
        const fullHeight = content.scrollHeight;
        content.style.height = "0px";

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            content.style.transition = "height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease";
            content.style.height = `${fullHeight}px`;
            content.style.opacity = "1";
          });
        });

        const onTransitionEnd = () => {
          content.style.height = "";
          content.style.overflow = "";
          content.style.transition = "";
          content.style.opacity = "";
          isAnimating = false;
          content.removeEventListener("transitionend", onTransitionEnd);
        };
        content.addEventListener("transitionend", onTransitionEnd, { once: true });
      } else {
        // Closing
        const fullHeight = content.scrollHeight;
        content.style.height = `${fullHeight}px`;
        content.style.overflow = "hidden";
        content.style.opacity = "1";

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            content.style.transition = "height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease";
            content.style.height = "0px";
            content.style.opacity = "0";
          });
        });

        const onTransitionEnd = () => {
          details.open = false;
          content.style.height = "";
          content.style.overflow = "";
          content.style.transition = "";
          content.style.opacity = "";
          isAnimating = false;
          content.removeEventListener("transitionend", onTransitionEnd);
        };
        content.addEventListener("transitionend", onTransitionEnd, { once: true });
      }
    });
  }

  #enhanceDropdown(select) {
    if (!select || select.dataset.enhanced === "true") return;

    const parent = select.parentElement;
    if (!parent) return;

    const wrapper = document.createElement("div");
    wrapper.className = "custom-select";

    const dropdownId = `${select.id || `select-${Math.random().toString(36).slice(2)}`}-menu`;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", dropdownId);

    const dropdown = document.createElement("div");
    dropdown.className = "select-dropdown";
    dropdown.id = dropdownId;
    dropdown.setAttribute("role", "listbox");

    const optionButtons = [];

    const buildOptionButton = (option, index) => {
      const optionBtn = document.createElement("button");
      optionBtn.type = "button";
      optionBtn.className = "select-option";
      optionBtn.dataset.value = option.value;
      optionBtn.setAttribute("role", "option");
      optionBtn.setAttribute("aria-selected", option.selected ? "true" : "false");
      optionBtn.tabIndex = -1;
      optionBtn.textContent = option.textContent;

      optionBtn.addEventListener("click", () => {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: false }));
        this.#closeAllCustomSelects();
      });

      optionBtn.addEventListener("mouseenter", () => optionBtn.focus());
      optionBtn.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const direction = event.key === "ArrowDown" ? 1 : -1;
          const nextIndex = (index + direction + optionButtons.length) % optionButtons.length;
          optionButtons[nextIndex].focus();
        } else if (event.key === "Home") {
          event.preventDefault();
          optionButtons[0].focus();
        } else if (event.key === "End") {
          event.preventDefault();
          optionButtons[optionButtons.length - 1].focus();
        } else if (event.key === "Escape") {
          this.#closeAllCustomSelects();
        }
      });

      optionButtons.push(optionBtn);
      dropdown.appendChild(optionBtn);
    };

    Array.from(select.options).forEach(buildOptionButton);

    const updateSelection = () => {
      trigger.textContent = select.options[select.selectedIndex]?.textContent || "";
      optionButtons.forEach((button) => {
        const selected = button.dataset.value === select.value;
        button.setAttribute("aria-selected", selected ? "true" : "false");
      });
    };

    const scrollOptionIntoView = (button) => {
      const buttonTop = button.offsetTop;
      const buttonHeight = button.offsetHeight;
      const viewTop = dropdown.scrollTop;
      const viewBottom = viewTop + dropdown.clientHeight;

      if (buttonTop < viewTop) {
        dropdown.scrollTop = buttonTop;
      } else if (buttonTop + buttonHeight > viewBottom) {
        dropdown.scrollTop = buttonTop - dropdown.clientHeight + buttonHeight;
      }
    };

    const closeDropdown = ({ focusTrigger = true } = {}) => {
      if (!wrapper.classList.contains("open")) return;
      wrapper.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
      optionButtons.forEach((button) => (button.tabIndex = -1));
      if (focusTrigger) {
        trigger.focus({ preventScroll: true });
      }
      if (this.openCustomSelect === wrapper) {
        this.openCustomSelect = null;
      }
    };

    const openDropdown = () => {
      if (wrapper.classList.contains("open")) return;
      this.#closeAllCustomSelects(wrapper);
      wrapper.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
      optionButtons.forEach((button) => (button.tabIndex = 0));
      const selectedBtn =
        optionButtons.find((btn) => btn.dataset.value === select.value) ||
        optionButtons[0];
      if (selectedBtn) {
        selectedBtn.focus();
        scrollOptionIntoView(selectedBtn);
      }
      this.openCustomSelect = wrapper;
    };

    wrapper._close = closeDropdown;

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      if (wrapper.classList.contains("open")) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    trigger.addEventListener("keydown", (event) => {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        openDropdown();
      }
    });

    wrapper.addEventListener("focusout", (event) => {
      if (!wrapper.contains(event.relatedTarget)) {
        closeDropdown({ focusTrigger: false });
      }
    });

    select.addEventListener("change", updateSelection);
    select.addEventListener("focus", () => {
      trigger.focus({ preventScroll: true });
      openDropdown();
    });

    const associatedLabel = select.id
      ? document.querySelector(`label[for="${select.id}"]`)
      : null;
    if (associatedLabel) {
      associatedLabel.addEventListener("click", (event) => {
        event.preventDefault();
        trigger.focus({ preventScroll: true });
        openDropdown();
      });
    }

    updateSelection();

    wrapper.classList.add("custom-select-wrapper");
    parent.insertBefore(wrapper, select);
    wrapper.appendChild(trigger);
    wrapper.appendChild(dropdown);

    select.dataset.enhanced = "true";
    select.style.display = "none";
    this.enhancedSelectWrappers.add(wrapper);
  }

  closeAllCustomSelects() {
    this.#closeAllCustomSelects();
  }

  #closeAllCustomSelects(except) {
    this.enhancedSelectWrappers.forEach((wrapper) => {
      if (wrapper !== except && wrapper.classList.contains("open")) {
        wrapper._close?.({ focusTrigger: false });
      }
    });
  }

  #resizeCanvasesForMode(isSingleTile) {
    // Prevent multiple simultaneous resize operations
    if (this.canvasResizeInProgress) return;
    this.canvasResizeInProgress = true;

    // CSS handles the canvas dimensions via .single-tile-mode class
    // TileRenderer reads clientWidth/clientHeight from CSS
    // We just need to force re-render with new dimensions

    const canvases = document.querySelectorAll(".asset-tile:not(.hidden) .sparkline-canvas");

    // Force context recreation and mark for redraw
    canvases.forEach((canvas) => {
      // Remove inline styles to let CSS take over
      canvas.style.width = '';
      canvas.style.height = '';

      // Delete cached context to force recreation with new dimensions
      delete canvas.__ctx;

      const tile = canvas.closest(".asset-tile");
      if (tile) {
        const index = parseInt(tile.dataset.index);
        if (!Number.isNaN(index)) {
          const asset = this.assets[index];
          if (asset && this.app?.tileRegistry) {
            const cached = this.app.tileRegistry.getCacheByTicker(asset.ticker);
            if (cached) {
              cached.needsSparklineUpdate = true;
              cached.lastHistoryLength = 0; // Force sparkline redraw
            }
          }
        }
      }
    });

    // Force reflow to apply new CSS dimensions
    canvases.forEach((canvas) => void canvas.offsetHeight);

    // Re-render visible tiles with new dimensions from CSS
    requestAnimationFrame(() => {
      canvases.forEach((canvas) => {
        const tile = canvas.closest(".asset-tile");
        if (tile) {
          const index = parseInt(tile.dataset.index);
          if (!Number.isNaN(index)) {
            const asset = this.assets[index];
            if (asset && this.app?.paintTile) {
              this.app.paintTile(asset.ticker, index);
            }
          }
        }
      });

      this.canvasResizeInProgress = false;
    });
  }

  #setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") return;
      const modal = document.getElementById("modal");
      if (modal && modal.classList.contains("active")) return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          this.helpers.toggleAnimation();
          break;
        case "c":
          this.helpers.simulateMarketCrash();
          break;
        case "b":
          this.helpers.simulateBullRun();
          break;
        case "r":
          this.helpers.resetMarket();
          break;
        case "e":
          this.helpers.exportToCSV();
          break;
        case "t":
          this.helpers.cycleTheme();
          break;
        case "escape":
          this.helpers.closeModal();
          break;
      }
    });
  }
}
