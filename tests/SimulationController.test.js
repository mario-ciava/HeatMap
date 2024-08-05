import { describe, it, expect, vi, beforeEach } from "vitest";
import { SimulationController } from "../src/controllers/SimulationController.js";

const mockState = () => {
  const tile = {
    _placeholderPrice: 10,
    _placeholderBasePrice: 10,
    basePrice: 10,
    change: 0,
    price: 10,
    hasInfo: false,
    dirty: false,
  };
  return {
    getTile: vi.fn(() => tile),
    emit: vi.fn(),
  };
};

describe("SimulationController", () => {
  let controller;
  let state;
  const transport = { start: vi.fn(), stop: vi.fn() };
  const tileController = { handleTileUpdated: vi.fn() };

  beforeEach(() => {
    state = mockState();
    transport.start.mockReset();
    transport.stop.mockReset();
    controller = new SimulationController({
      state,
      transport,
      tileController,
      assets: [{ ticker: "AAA" }],
    });
  });

  it("starts and stops the simulation loop", () => {
    controller.start(1000);
    expect(controller.isRunning()).toBe(true);
    controller.stop();
    expect(controller.isRunning()).toBe(false);
  });

  it("updates transport when requested", () => {
    controller.startTransport(["AAA"]);
    expect(transport.start).toHaveBeenCalledWith(["AAA"]);
    controller.stopTransport();
    expect(transport.stop).toHaveBeenCalled();
  });
});
