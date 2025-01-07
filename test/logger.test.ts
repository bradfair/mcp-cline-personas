import { Logger, logger } from "@src/logger.js";
import { jest } from "@jest/globals";

describe("Logger", () => {
  let originalConsole: any;

  beforeEach(() => {
    originalConsole = { ...console };
    jest.spyOn(console, "debug").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    Object.assign(console, originalConsole);
  });

  it("should be a singleton", () => {
    const logger1 = Logger.getInstance();
    const logger2 = Logger.getInstance();
    expect(logger1).toBe(logger2);
  });

  it("should log debug messages when level is debug", () => {
    logger.setLevel("debug");
    logger.debug("test message");
    expect(console.error).toHaveBeenCalledWith("[DEBUG] test message");
  });

  it("should not log debug messages when level is info", () => {
    logger.setLevel("info");
    logger.debug("test message");
    expect(console.error).not.toHaveBeenCalled();
  });

  it("should log info messages when level is info", () => {
    logger.setLevel("info");
    logger.info("test message");
    expect(console.error).toHaveBeenCalledWith("[INFO] test message");
  });

  it("should log warn messages when level is warn", () => {
    logger.setLevel("warn");
    logger.warn("test message");
    expect(console.warn).toHaveBeenCalledWith("[WARN] test message");
  });

  it("should log error messages when level is error", () => {
    logger.setLevel("error");
    logger.error("test message");
    expect(console.error).toHaveBeenCalledWith("[ERROR] test message");
  });

  it("should format messages with arguments", () => {
    logger.setLevel("info");
    logger.info("test %s", "message");
    expect(console.error).toHaveBeenCalledWith("[INFO] test message");
  });
});
