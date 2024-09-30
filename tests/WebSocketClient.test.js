import { describe, expect, it, vi } from "vitest";
import { WebSocketClient } from "../src/transport/WebSocketClient.js";

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.OPEN;
    MockWebSocket.instances.push(this);
  }

  close(code, reason) {
    this.readyState = MockWebSocket.CLOSED;
    if (typeof this.onclose === "function") {
      this.onclose({ code, reason, wasClean: true });
    }
  }

  send() {}
}

MockWebSocket.instances = [];

describe("WebSocketClient", () => {
  it("stop keeps stopped state and does not reconnect", () => {
    vi.useFakeTimers();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const prevWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = MockWebSocket;

    try {
      MockWebSocket.instances = [];

      const client = new WebSocketClient(null);
      client.connect();
      expect(MockWebSocket.instances).toHaveLength(1);

      client.stop();
      expect(client.getState()).toBe("stopped");

      vi.runOnlyPendingTimers();
      vi.advanceTimersByTime(60_000);
      expect(MockWebSocket.instances).toHaveLength(1);
      expect(client.getState()).toBe("stopped");
    } finally {
      globalThis.WebSocket = prevWebSocket;
      warnSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});
