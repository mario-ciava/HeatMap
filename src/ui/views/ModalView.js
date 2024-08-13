import { perfStart, perfEnd } from "../../utils/perfHelpers.js";

export class ModalView {
  constructor(assets, helpers = {}) {
    this.assets = assets;
    this.helpers = helpers;
    this.app = null;
    this.currentModalAssetIndex = null;
  }

  setApp(app) {
    this.app = app;
  }

  init() {
    const modal = document.getElementById("modal");
    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          this.closeModal();
        }
      });
    }

    const modalClose = document.getElementById("modal-close-btn");
    if (modalClose) {
      modalClose.addEventListener("click", () => this.closeModal());
    }
  }

  showAssetDetails(index) {
    if (!this.app) return;
    this.currentModalAssetIndex = index;
    const asset = this.assets[index];
    const tileState = this.app.state.getTile(asset.ticker);
    const history = this.app.priceHistory.get(asset.ticker) || [];
    const mode = this.app.state.getMode();

    const detailRows = [];
    const addRow = (label, value, options = {}) => {
      const safeValue = value ?? "---";
      const styleAttr = options.color ? ` style="color: ${options.color}"` : "";
      detailRows.push(`
        <div class="detail-row">
          <span class="detail-label">${label}</span>
          <span class="detail-value"${styleAttr}>${safeValue}</span>
        </div>
      `);
    };

    const currentPrice =
      tileState?.price ?? (mode === "simulation" ? asset.price : null);
    addRow("Current Price", this.helpers.formatPrice(currentPrice));

    const currentChange =
      tileState?.change ?? (mode === "simulation" ? asset.change : null);
    const changeColor =
      currentChange > 0 ? "#10b981" : currentChange < 0 ? "#ef4444" : null;
    addRow(
      "Change",
      currentChange != null ? this.helpers.formatPercent(currentChange) : "---",
      changeColor ? { color: changeColor } : undefined,
    );

    if (mode === "simulation") {
      const firstPrice = history.length ? history[0] : asset.basePrice;
      let sessionChange = null;
      if (currentPrice != null && firstPrice != null && firstPrice !== 0) {
        sessionChange = ((currentPrice - firstPrice) / firstPrice) * 100;
      }
      const sessionColor =
        sessionChange > 0 ? "#10b981" : sessionChange < 0 ? "#ef4444" : null;
      addRow(
        "Session Total",
        sessionChange != null ? this.helpers.formatPercent(sessionChange) : "---",
        sessionColor ? { color: sessionColor } : undefined,
      );
    }

    addRow("Sector", asset.sector);

    const chartHistory = history.length
      ? [...history]
      : currentPrice != null
        ? [currentPrice]
        : [];

    const openValue =
      mode === "real"
        ? tileState?.open
        : (chartHistory[0] ?? tileState?._placeholderPrice ?? asset.price);

    const previousCloseValue =
      mode === "real"
        ? (tileState?.previousClose ?? tileState?.basePrice)
        : (tileState?.previousClose ??
          tileState?._placeholderBasePrice ??
          asset.basePrice);

    const highValue =
      mode === "real"
        ? tileState?.high
        : chartHistory.length
          ? Math.max(...chartHistory)
          : openValue;

    const lowValue =
      mode === "real"
        ? tileState?.low
        : chartHistory.length
          ? Math.min(...chartHistory)
          : openValue;

    const volumeValue = tileState?.volume;
    const lastTradeLabel =
      mode === "real"
        ? this.helpers.formatRelativeTime(tileState?.lastTradeTs)
        : "Simulated feed";

    addRow("Open", this.helpers.formatPrice(openValue));
    addRow("Previous Close", this.helpers.formatPrice(previousCloseValue));
    addRow("Day High", this.helpers.formatPrice(highValue));
    addRow("Day Low", this.helpers.formatPrice(lowValue));
    addRow("Volume", this.helpers.formatVolume(volumeValue));
    addRow("Last Trade", lastTradeLabel);

    document.getElementById("modal-details").innerHTML = detailRows.join("");

    const chartRange = document.getElementById("chart-time-range");
    if (chartRange) {
      chartRange.textContent =
        mode === "real" ? "Live Stream" : "Simulation Session";
    }

    const modal = document.getElementById("modal");
    modal.classList.add("active");
    document.documentElement.style.overflow = "hidden";

    this.resetChartOverlays();
    setTimeout(() => this.drawModalChart(chartHistory), 150);
  }

  closeModal() {
    this.currentModalAssetIndex = null;
    const modal = document.getElementById("modal");
    if (modal) {
      modal.classList.remove("active");
    }
    document.documentElement.style.overflow = "";
    this.resetChartOverlays();
  }

  updateModalIfOpen() {
    if (this.currentModalAssetIndex === null) return;
    const modal = document.getElementById("modal");
    if (!modal || !modal.classList.contains("active")) {
      this.currentModalAssetIndex = null;
      return;
    }
    this.showAssetDetails(this.currentModalAssetIndex);
  }

  drawModalChart(history) {
    const perfId = perfStart("drawModalChart");
    let pointCount = 0;
    const finish = (weight) => {
      perfEnd(perfId, Math.max(weight ?? pointCount, 1));
    };

    const canvas = document.getElementById("modal-chart");
    if (!canvas) {
      finish(1);
      return;
    }

    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const series = Array.isArray(history) ? history.slice() : [];
    if (series.length === 1) {
      series.push(series[0]);
    }

    const yAxisContainer = document.getElementById("chart-y-axis");

    if (series.length < 2) {
      if (yAxisContainer) {
        yAxisContainer.innerHTML = "";
      }
      canvas.__chartData = null;
      this.resetChartOverlays();
      finish(1);
      return;
    }

    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const trend = series[series.length - 1] - series[0];

    if (yAxisContainer) {
      yAxisContainer.innerHTML = `
        <div>${this.helpers.formatPrice(max)}</div>
        <div>${this.helpers.formatPrice((max + min) / 2)}</div>
        <div>${this.helpers.formatPrice(min)}</div>
      `;
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const points = series.map((price, index) => {
      const x = (index / (series.length - 1)) * width;
      const y = height - ((price - min) / range) * height * 0.82 - height * 0.09;
      return { x, y, value: price };
    });
    pointCount = points.length;

    const lineColor = trend >= 0 ? "#10b981" : "#ef4444";

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (trend >= 0) {
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
      gradient.addColorStop(1, "rgba(16, 185, 129, 0.02)");
    } else {
      gradient.addColorStop(0, "rgba(239, 68, 68, 0.2)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0.02)");
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, height);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor =
      trend >= 0 ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    canvas.__chartData = { points, width, height, color: lineColor };
    this.attachModalChartInteractions(canvas);
    finish();
  }

  resetChartOverlays() {
    const tooltip = document.getElementById("chart-tooltip");
    const cursor = document.getElementById("chart-cursor");
    const pointer = document.getElementById("chart-pointer");

    if (tooltip) {
      tooltip.classList.remove("visible");
      tooltip.style.left = "-9999px";
      tooltip.style.top = "-9999px";
    }

    if (cursor) {
      cursor.classList.remove("visible");
    }

    if (pointer) {
      pointer.classList.remove("visible");
      pointer.style.left = "-9999px";
      pointer.style.top = "-9999px";
    }
  }

  attachModalChartInteractions(canvas) {
    if (canvas.__chartInteractionsAttached) return;

    const tooltip = document.getElementById("chart-tooltip");
    const cursor = document.getElementById("chart-cursor");
    const pointer = document.getElementById("chart-pointer");
    if (!tooltip || !cursor || !pointer) return;

    const wrapper = canvas.parentElement;

    const handleMove = (event) => {
      const data = canvas.__chartData;
      if (!data || !data.points || data.points.length === 0) {
        this.resetChartOverlays();
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const clampedX = Math.max(0, Math.min(rect.width, relativeX));
      const index = Math.round(
        (clampedX / rect.width) * (data.points.length - 1),
      );
      const point = data.points[index];

      if (!point) {
        this.resetChartOverlays();
        return;
      }

      const offsetLeft = canvas.offsetLeft;
      const offsetTop = canvas.offsetTop;
      const wrapperWidth = wrapper.offsetWidth;
      const pointerSize = pointer.offsetWidth || 12;
      const accentColor = data.color || "#3b82f6";

      cursor.style.left = `${offsetLeft + point.x}px`;
      cursor.classList.add("visible");

      pointer.style.left = `${offsetLeft + point.x - pointerSize / 2}px`;
      pointer.style.top = `${offsetTop + point.y - pointerSize / 2}px`;
      pointer.style.background = accentColor;
      pointer.style.boxShadow = `0 0 12px ${accentColor}55`;
      pointer.classList.add("visible");

      tooltip.textContent = this.helpers.formatPrice(point.value);
      tooltip.style.borderColor = `${accentColor}66`;
      let tooltipLeft = offsetLeft + point.x + 12;
      const tooltipWidth = tooltip.offsetWidth || 96;
      if (tooltipLeft + tooltipWidth > wrapperWidth) {
        tooltipLeft = offsetLeft + point.x - tooltipWidth - 12;
      }
      tooltip.style.left = `${tooltipLeft}px`;
      tooltip.style.top = `${Math.max(8, offsetTop + point.y - 32)}px`;
      tooltip.classList.add("visible");
    };

    const handleLeave = () => {
      this.resetChartOverlays();
    };

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);
    canvas.__chartInteractionsAttached = true;
  }
}
