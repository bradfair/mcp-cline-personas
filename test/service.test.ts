import fs from "fs";
import path, { dirname } from "path";
import { describe, it, beforeEach, afterEach } from "@jest/globals";
import { ComponentPersonaService } from "@src/service.js";
import { Component } from "@src/component.js";
import { Persona } from "@src/persona.js";
import { fileURLToPath } from "url";
import { jest } from "@jest/globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("ComponentPersonaService", () => {
  let tempDir: string;
  let service: ComponentPersonaService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync("component-persona-service-test-");
    console.log("Created temp dir:", tempDir);
    service = new ComponentPersonaService();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("Component operations", () => {
    it("should set and get a component", () => {
      service.setComponent(tempDir, "test", "description", "text", 1);
      const component = service.getComponent(tempDir, "test");
      expect(component).toBeInstanceOf(Component);
      expect(component?.name).toBe("test");
      expect(component?.description).toBe("description");
      expect(component?.text).toBe("text");
      expect(component?.version).toBe(1);
    });

    it("should return null for non-existent component", () => {
      const component = service.getComponent(tempDir, "nonexistent");
      expect(component).toBeNull();
    });

    it("should list components", () => {
      service.setComponent(tempDir, "test1", "desc1", "text1", 1);
      service.setComponent(tempDir, "test2", "desc2", "text2", 1);
      const components = service.listComponents(tempDir);
      expect(components).toEqual(["test1", "test2"]);
    });

    it("should delete a component", () => {
      service.setComponent(tempDir, "test", "description", "text", 1);
      service.deleteComponent(tempDir, "test");
      const component = service.getComponent(tempDir, "test");
      expect(component).toBeNull();
    });

    it("should handle idempotent delete", () => {
      service.deleteComponent(tempDir, "nonexistent"); // Should not throw
    });
  });

  describe("Persona operations", () => {
    it("should set and get a persona", () => {
      service.setPersona(tempDir, "test", "description", "template", 1);
      const persona = service.getPersona(tempDir, "test");
      expect(persona).toBeInstanceOf(Persona);
      expect(persona?.name).toBe("test");
      expect(persona?.description).toBe("description");
      expect(persona?.template).toBe("template");
      expect(persona?.version).toBe(1);
    });

    it("should return null for non-existent persona", () => {
      const persona = service.getPersona(tempDir, "nonexistent");
      expect(persona).toBeNull();
    });

    it("should list personas", () => {
      service.setPersona(tempDir, "test1", "desc1", "template1", 1);
      service.setPersona(tempDir, "test2", "desc2", "template2", 1);
      const personas = service.listPersonas(tempDir);
      expect(personas).toEqual(["test1", "test2"]);
    });

    it("should delete a persona", () => {
      service.setPersona(tempDir, "test", "description", "template", 1);
      service.deletePersona(tempDir, "test");
      const persona = service.getPersona(tempDir, "test");
      expect(persona).toBeNull();
    });

    it("should handle idempotent delete", () => {
      service.deletePersona(tempDir, "nonexistent"); // Should not throw
    });
  });

  describe("Component deletion validation", () => {
    it("should prevent deleting a component when personas depend on it", () => {
      // Create component and persona that depends on it
      service.setComponent(tempDir, "comp1", "desc", "text", 1);
      service.setPersona(tempDir, "persona1", "desc", "template with {{comp1}}", 1);

      expect(() => service.deleteComponent(tempDir, "comp1")).toThrow(
        /Cannot delete component: required by personas:.*persona1/
      );
    });

    it("should allow deleting a component when no personas depend on it", () => {
      service.setComponent(tempDir, "comp1", "desc", "text", 1);
      service.deleteComponent(tempDir, "comp1");
      expect(service.getComponent(tempDir, "comp1")).toBeNull();
    });
  });

  describe("Persona validation", () => {
    it("should prevent saving persona with non-existent component dependencies", () => {
      expect(() =>
        service.setPersona(
          tempDir,
          "persona1",
          "desc",
          "template with {{nonexistent}}",
          1
        )
      ).toThrow(
        "Cannot save persona: depends on non-existent component: nonexistent"
      );
    });

    it("should allow saving persona when all dependencies exist", () => {
      service.setComponent(tempDir, "comp1", "desc", "text", 1);
      expect(() =>
        service.setPersona(tempDir, "persona1", "desc", "template with {{comp1}}", 1)
      ).not.toThrow();
    });
  });

  describe("Persona activation", () => {
    it("should write persona template to .clinerules file", () => {
      service.setPersona(tempDir, "persona1", "desc", "template content", 1);
      service.activatePersona(tempDir, "persona1");
      let clineRulesPath = path.join(tempDir, ".clinerules");
      expect(fs.existsSync(clineRulesPath)).toBeTruthy();
      expect(fs.readFileSync(clineRulesPath, "utf-8")).toBe("template content");
    });

    it("should throw when activating non-existent persona", () => {
      expect(() => service.activatePersona(tempDir, "nonexistent")).toThrow(
        "Persona not found: nonexistent"
      );
    });

    it("should get active persona name from .clinerules file", () => {
      service.setPersona(tempDir, "persona1", "desc", "template content", 1);
      service.activatePersona(tempDir, "persona1");

      const activePersona = service.getActivePersona(tempDir);
      expect(activePersona).toBe("persona1");
    });

    it("should return null when no persona is active", () => {
      expect(service.getActivePersona(tempDir)).toBeNull();
    });

    it("should return null when .clinerules file is empty", () => {
      fs.writeFileSync(path.join(tempDir, ".clinerules"), "");
      expect(service.getActivePersona(tempDir)).toBeNull();
    });
  });

  describe("Directory handling", () => {
    it("should create component directory if not exists", () => {
      const dir = path.join(tempDir, "new-components");
      const newService = new ComponentPersonaService();
      newService.listComponents(dir);
      expect(fs.existsSync(dir)).toBeTruthy();
    });

    it("should create persona directory if not exists", () => {
      const dir = path.join(tempDir, "new-personas");
      const newService = new ComponentPersonaService();
      newService.listPersonas(dir);
      expect(fs.existsSync(dir)).toBeTruthy();
    });
  });

  describe("renderPersona", () => {
    it("should render persona with component texts", () => {
      // Setup components
      service.setComponent(tempDir, "comp1", "desc1", "text1", 1);
      service.setComponent(tempDir, "comp2", "desc2", "text2", 1);

      // Setup persona with template
      const template = "Component 1: {{comp1}}\nComponent 2: {{comp2}}";
      service.setPersona(tempDir, "test", "description", template, 1);

      // Render persona
      const result = service.renderPersona(tempDir, "test");

      // Verify output
      expect(result).toBe("Component 1: text1\nComponent 2: text2");
    });

    it("should throw when persona does not exist", () => {
      expect(() => service.renderPersona(tempDir, "nonexistent")).toThrow(
        "Persona not found: nonexistent"
      );
    });

    it("should handle missing components in template", () => {
      // Create a component that isn't referenced by any persona
      service.setComponent(tempDir, "unusedComp", "desc", "text", 1);

      // Create persona that depends on a different component
      service.setPersona(
        tempDir,
        "test",
        "description",
        "Template with {{unusedComp}}",
        1
      );

      // Delete the unused component to simulate it being missing
      service.deleteComponent(tempDir, "unusedComp");

      // Verify error is thrown when trying to render
      expect(() => service.renderPersona(tempDir, "test")).toThrow(
        "Cannot render persona: missing required component: unusedcomp"
      );
    });
  });

  describe("describePersonas", () => {
    it("should return empty map when no personas exist", () => {
      const result = service.describePersonas(tempDir);
      expect(result.size).toBe(0);
    });

    it("should return correct name-description mappings", () => {
      service.setPersona(tempDir, "persona1", "description1", "template1", 1);
      service.setPersona(tempDir, "persona2", "description2", "template2", 1);

      const result = service.describePersonas(tempDir);
      expect(result.size).toBe(2);
      expect(result.get("persona1")).toBe("description1");
      expect(result.get("persona2")).toBe("description2");
    });
  });

  describe("describeComponents", () => {
    it("should return empty map when no components exist", () => {
      const result = service.describeComponents(tempDir);
      expect(result.size).toBe(0);
    });

    it("should return correct name-description mappings", () => {
      service.setComponent(tempDir, "comp1", "description1", "text1", 1);
      service.setComponent(tempDir, "comp2", "description2", "text2", 1);

      const result = service.describeComponents(tempDir);
      expect(result.size).toBe(2);
      expect(result.get("comp1")).toBe("description1");
      expect(result.get("comp2")).toBe("description2");
    });
  });
});
