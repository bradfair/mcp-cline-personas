import { Persona } from "@src/persona.js";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { jest } from "@jest/globals";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Persona", () => {
  let tempDir: string;
  let testFilePath: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(__dirname, "persona-test-"));
    testFilePath = path.join(tempDir, "test-persona.json");
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
    it("should create a persona with all fields", () => {
      const persona = new Persona("Test", "Description", "Template", 1);
      expect(persona.name).toBe("Test");
      expect(persona.description).toBe("Description");
      expect(persona.template).toBe("Template");
      expect(persona.version).toBe(1);
    });
  });

  describe("saveToFile", () => {
    it("should save persona as JSON file", () => {
      const persona = new Persona("Test", "Description", "Template", 1);
      persona.saveToFile(testFilePath);

      expect(fs.existsSync(testFilePath)).toBe(true);

      const fileContent = JSON.parse(fs.readFileSync(testFilePath, "utf-8"));
      expect(fileContent).toEqual({
        name: "Test",
        description: "Description",
        template: "Template",
        version: 1,
      });
    });

    it("should throw error for invalid path", () => {
      const persona = new Persona("Test", "Description", "Template", 1);
      expect(() => persona.saveToFile("/invalid/path/test.json")).toThrow();
    });

    it("should throw error when trying to write to read-only file", () => {
      const mockWrite = jest
        .spyOn(fs, "writeFileSync")
        .mockImplementation(() => {
          throw new Error("EPERM: operation not permitted, open");
        });

      const persona = new Persona("Test", "Description", "Template", 1);
      expect(() => persona.saveToFile(testFilePath)).toThrow(
        "Failed to save persona: EPERM: operation not permitted, open"
      );

      mockWrite.mockRestore();
    });
  });

  describe("loadFromFile", () => {
    it("should load persona from JSON file", () => {
      const originalPersona = new Persona("Test", "Description", "Template", 1);
      originalPersona.saveToFile(testFilePath);

      const loadedPersona = Persona.loadFromFile(testFilePath);
      expect(loadedPersona).toBeInstanceOf(Persona);
      expect(loadedPersona).toEqual(originalPersona);
    });

    it("should throw error for non-existent file", () => {
      expect(() => Persona.loadFromFile("/nonexistent/file.json")).toThrow();
    });

    it("should throw error for invalid JSON", () => {
      fs.writeFileSync(testFilePath, "invalid json");
      expect(() => Persona.loadFromFile(testFilePath)).toThrow();
    });

    it("should throw error when trying to read from write-only file", () => {
      const originalRead = fs.readFileSync;
      const originalExists = fs.existsSync;
      try {
        fs.readFileSync = jest.fn<typeof fs.readFileSync>().mockImplementation((path: fs.PathOrFileDescriptor, options?: { encoding?: BufferEncoding | null; flag?: string } | null | BufferEncoding) => {
          throw new Error("EACCES: permission denied, open");
        }) as jest.MockedFunction<typeof fs.readFileSync>;
        fs.existsSync = jest.fn<typeof fs.existsSync>().mockReturnValue(true);

        expect(() => Persona.loadFromFile(testFilePath)).toThrow(
          "Failed to load persona: Error: EACCES: permission denied, open"
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
        // Missing template and version
      };
      fs.writeFileSync(testFilePath, JSON.stringify(invalidData));

      expect(() => Persona.loadFromFile(testFilePath)).toThrow(
        "Invalid persona data in file"
      );
    });
  });

  describe("render", () => {
    let persona: Persona;

    beforeEach(() => {
      persona = new Persona(
        "Test",
        "Description",
        "{{ greeting }} {{ name }}!",
        1
      );
    });

    it("should replace single variable", () => {
      const result = persona.render({ greeting: "Hello" });
      expect(result).toBe("Hello {{ name }}!");
    });

    it("should replace multiple variables", () => {
      const result = persona.render({ greeting: "Hi", name: "Alice" });
      expect(result).toBe("Hi Alice!");
    });

    it("should handle case insensitive variable names", () => {
      const result = persona.render({ GREETING: "Hey", NAME: "Bob" });
      expect(result).toBe("Hey Bob!");
    });

    it("should leave unmatched variables as-is", () => {
      const result = persona.render({ name: "Charlie" });
      expect(result).toBe("{{ greeting }} Charlie!");
    });

    it("should handle complex templates", () => {
      const complexPersona = new Persona(
        "Test",
        "Description",
        "{{ header }}\n{{ body }}\n{{ footer }}",
        1
      );
      const result = complexPersona.render({
        header: "Welcome",
        body: "This is the content",
        footer: "Goodbye",
      });
      expect(result).toBe("Welcome\nThis is the content\nGoodbye");
    });
  });

  describe("requiredComponents", () => {
    it("should return single variable name", () => {
      const persona = new Persona("Test", "Description", "{{ name }}", 1);
      expect(persona.requiredComponents()).toEqual(["name"]);
    });

    it("should return multiple variable names", () => {
      const persona = new Persona(
        "Test",
        "Description",
        "{{ greeting }} {{ name }}!",
        1
      );
      expect(persona.requiredComponents()).toEqual(["greeting", "name"]);
    });

    it("should return variable names case insensitive", () => {
      const persona = new Persona(
        "Test",
        "Description",
        "{{ GREETING }} {{ NAME }}",
        1
      );
      expect(persona.requiredComponents()).toEqual(["greeting", "name"]);
    });

    it("should handle malformed templates", () => {
      const persona = new Persona("Test", "Description", "{{ {greeting} }}", 1);
      expect(persona.requiredComponents()).toEqual([]);
    });
  });

  describe("equals", () => {
    let persona: Persona;

    beforeEach(() => {
      persona = new Persona("Test", "Description", "Template", 1);
    });

    it("should return true for identical personas", () => {
      const other = new Persona("Test", "Description", "Template", 1);
      expect(persona.equals(other)).toBe(true);
    });

    it("should return false for different names", () => {
      const other = new Persona("Different", "Description", "Template", 1);
      expect(persona.equals(other)).toBe(false);
    });

    it("should return false for different descriptions", () => {
      const other = new Persona("Test", "Different", "Template", 1);
      expect(persona.equals(other)).toBe(false);
    });

    it("should return false for different template", () => {
      const other = new Persona("Test", "Description", "Different", 1);
      expect(persona.equals(other)).toBe(false);
    });

    it("should return false for different versions", () => {
      const other = new Persona("Test", "Description", "Template", 2);
      expect(persona.equals(other)).toBe(false);
    });

    it("should return false when comparing with null", () => {
      expect(persona.equals(null)).toBe(false);
    });

    it("should return false when comparing with undefined", () => {
      expect(persona.equals(undefined)).toBe(false);
    });
  });
});
