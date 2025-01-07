import { format } from "util";

export class Logger {
  private static instance: Logger;
  private level: "debug" | "info" | "warn" | "error" = "info";

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLevel(level: "debug" | "info" | "warn" | "error"): void {
    this.level = level;
  }

  public debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.error(`[DEBUG] ${format(message, ...args)}`);
    }
  }

  public info(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      console.error(`[INFO] ${format(message, ...args)}`);
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${format(message, ...args)}`);
    }
  }

  public error(message: string, ...args: any[]): void {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${format(message, ...args)}`);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

export const logger = Logger.getInstance();
