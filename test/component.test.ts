import { Component } from "@src/component.js";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { jest } from "@jest/globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Component", () => {
  let tempDir: string;
  let testFilePath: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(__dirname, "component-test-"));
    testFilePath = path.join(tempDir, "test-component.json");
  });

  afterEach(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe("constructor", () => {
    it("should create a component with all fields", () => {
      const component = new Component("Test", "Description", "Text", 1);
      expect(component.name).toBe("Test");
      expect(component.description).toBe("Description");
      expect(component.text).toBe("Text");
      expect(component.version).toBe(1);
    });
  });

  describe("saveToFile", () => {
    it("should save component as JSON file", () => {
      const component = new Component("Test", "Description", "Text", 1);
      component.saveToFile(testFilePath);

      expect(fs.existsSync(testFilePath)).toBe(true);

      const fileContent = JSON.parse(fs.readFileSync(testFilePath, "utf-8"));
      expect(fileContent).toEqual({
        name: "Test",
        description: "Description",
        text: "Text",
        version: 1,
      });
    });

    it("should throw error for invalid path", () => {
      const component = new Component("Test", "Description", "Text", 1);
      expect(() => component.saveToFile("/invalid/path/test.json")).toThrow();
    });

    it("should throw error when trying to write to read-only file", () => {
      const mockWrite = jest
        .spyOn(fs, "writeFileSync")
        .mockImplementation(() => {
          throw new Error("EPERM: operation not permitted, open");
        });

      const component = new Component("Test", "Description", "Text", 1);
      expect(() => component.saveToFile(testFilePath)).toThrow(
        "Failed to save component: EPERM: operation not permitted, open"
      );

      mockWrite.mockRestore();
    });
  });

  describe("loadFromFile", () => {
    it("should load component from JSON file", () => {
      const originalComponent = new Component("Test", "Description", "Text", 1);
      originalComponent.saveToFile(testFilePath);

      const loadedComponent = Component.loadFromFile(testFilePath);
      expect(loadedComponent).toBeInstanceOf(Component);
      expect(loadedComponent).toEqual(originalComponent);
    });

    it("should throw error for non-existent file", () => {
      expect(() => Component.loadFromFile("/nonexistent/file.json")).toThrow();
    });

    it("should throw error for invalid JSON", () => {
      fs.writeFileSync(testFilePath, "invalid json");
      expect(() => Component.loadFromFile(testFilePath)).toThrow();
    });

    it("should throw error when trying to read from write-only file", () => {
      const originalRead = fs.readFileSync;
      const originalExists = fs.existsSync;
      try {
        fs.readFileSync = jest.fn<typeof fs.readFileSync>().mockImplementation((path: fs.PathOrFileDescriptor, options?: { encoding?: BufferEncoding | null; flag?: string } | null | BufferEncoding) => {
          throw new Error("EACCES: permission denied, open");
        }) as jest.MockedFunction<typeof fs.readFileSync>;
        fs.existsSync = jest.fn<typeof fs.existsSync>().mockReturnValue(true) as jest.MockedFunction<typeof fs.existsSync>;

        expect(() => Component.loadFromFile(testFilePath)).toThrow(
          "Failed to load component: Error: EACCES: permission denied, open"
        );
      } finally {
        fs.readFileSync = originalRead;
        fs.existsSync = originalExists;
      }
    });

    it("should throw error for JSON missing required fields", () => {
      const invalidData = {
        name: "Test",
        description: "Description",
        // Missing text and version
      };
      fs.writeFileSync(testFilePath, JSON.stringify(invalidData));

      expect(() => Component.loadFromFile(testFilePath)).toThrow(
        "Invalid component data in file"
      );
    });
  });

  describe("equals", () => {
    let component: Component;

    beforeEach(() => {
      component = new Component("Test", "Description", "Text", 1);
    });

    it("should return true for identical components", () => {
      const other = new Component("Test", "Description", "Text", 1);
      expect(component.equals(other)).toBe(true);
    });

    it("should return false for different names", () => {
      const other = new Component("Different", "Description", "Text", 1);
      expect(component.equals(other)).toBe(false);
    });

    it("should return false for different descriptions", () => {
      const other = new Component("Test", "Different", "Text", 1);
      expect(component.equals(other)).toBe(false);
    });

    it("should return false for different text", () => {
      const other = new Component("Test", "Description", "Different", 1);
      expect(component.equals(other)).toBe(false);
    });

    it("should return false for different versions", () => {
      const other = new Component("Test", "Description", "Text", 2);
      expect(component.equals(other)).toBe(false);
    });

    it("should return false when comparing with null", () => {
      expect(component.equals(null)).toBe(false);
    });

    it("should return false when comparing with undefined", () => {
      expect(component.equals(undefined)).toBe(false);
    });
  });
});
