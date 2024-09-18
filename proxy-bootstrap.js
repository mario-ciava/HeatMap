(function () {
  try {
    var origin = window.location && window.location.origin;
    if (!origin || origin === "null") {
      origin = "http://localhost:8080";
    }
    window.__HEATMAP_PROXY_BASE = origin.replace(/\/$/, "") + "/proxy";
  } catch (error) {
    console.error("Failed to initialize proxy base", error);
  }
})();
