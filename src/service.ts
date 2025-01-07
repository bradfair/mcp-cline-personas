import fs from "fs";
import path from "path";
import { Component } from "@src/component.js";
import { Persona } from "@src/persona.js";

const serviceDirectoryName = ".cline-personas";

export interface ComponentService {
  setComponent(
    projectRoot: string,
    name: string,
    description: string,
    text: string,
    version: number
  ): void;
  getComponent(projectRoot: string, name: string): Component | null;
  listComponents(projectRoot: string): string[];
  deleteComponent(projectRoot: string, name: string): void;
  describeComponents(projectRoot: string): Map<string, string>;
}

export interface PersonaService {
  setPersona(
    projectRoot: string,
    name: string,
    description: string,
    template: string,
    version: number
  ): void;
  getPersona(projectRoot: string, name: string): Persona | null;
  listPersonas(projectRoot: string): string[];
  deletePersona(projectRoot: string, name: string): void;
  describePersonas(projectRoot: string): Map<string, string>;
}

export class ComponentPersonaService
  implements ComponentService, PersonaService
{
  private getComponentRoot(projectRoot: string): string {
    const componentRoot = path.join(projectRoot, serviceDirectoryName, "components");
    if (!fs.existsSync(componentRoot)) {
      fs.mkdirSync(componentRoot, { recursive: true });
    }
    return componentRoot;
  }

  private getPersonaRoot(projectRoot: string): string {
    const personaRoot = path.join(projectRoot, serviceDirectoryName, "personas");
    if (!fs.existsSync(personaRoot)) {
      fs.mkdirSync(personaRoot, { recursive: true });
    }
    return personaRoot;
  }

  private getComponentPath(projectRoot: string, name: string): string {
    const componentRoot = this.getComponentRoot(projectRoot);
    return path.join(componentRoot, `${name}.json`);
  }

  private getPersonaPath(projectRoot: string, name: string): string {
    const personaRoot = this.getPersonaRoot(projectRoot);
    return path.join(personaRoot, `${name}.json`);
  }

  // Component operations
  setComponent(
    projectRoot: string,
    name: string,
    description: string,
    text: string,
    version: number
  ): void {
    const component = new Component(name, description, text, version);
    component.saveToFile(this.getComponentPath(projectRoot, name));
  }

  getComponent(projectRoot: string, name: string): Component | null {
    const filePath = this.getComponentPath(projectRoot, name);
    if (!fs.existsSync(filePath)) return null;
    return Component.loadFromFile(filePath);
  }

  listComponents(projectRoot: string): string[] {
    const componentRoot = this.getComponentRoot(projectRoot);
    return fs
      .readdirSync(componentRoot)
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.basename(file, ".json"));
  }

  deleteComponent(projectRoot: string, name: string): void {
    const personas = this.listPersonas(projectRoot);
    let dependents = [];
    for (const personaName of personas) {
      const persona = this.getPersona(projectRoot, personaName);
      if (persona && persona.requiredComponents().includes(name)) {
        dependents.push(personaName);
      }
    }
    if (dependents.length > 0) {
      throw new Error(
        `Cannot delete component: required by personas: ${dependents.join(
          ", "
        )}`
      );
    }

    const filePath = this.getComponentPath(projectRoot, name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Persona operations
    setPersona(
    projectRoot: string,
    name: string,
    description: string,
    template: string,
    version: number
  ): void {
    const persona = new Persona(name, description, template, version);

    // Validate that all template variables exist as components
    const templateComponents = persona.requiredComponents();
    for (const componentName of templateComponents) {
      if (!this.getComponent(projectRoot, componentName)) {
        throw new Error(
          `Cannot save persona: depends on non-existent component: ${componentName}`
        );
      }
    }

    persona.saveToFile(this.getPersonaPath(projectRoot, name));
  }

    activatePersona(projectRoot: string, name: string): void {
    const persona = this.getPersona(projectRoot, name);
    if (!persona) {
      throw new Error(`Persona not found: ${name}`);
    }

    const clinerulesPath = path.join(projectRoot, ".clinerules");
    fs.writeFileSync(clinerulesPath, persona.template);
  }

    getActivePersona(projectRoot: string): string | null {
    const clinerulesPath = path.join(projectRoot, ".clinerules");
    if (!fs.existsSync(clinerulesPath)) {
      return null;
    }

    const currentClineRules = fs.readFileSync(clinerulesPath, "utf-8");

    // Find the active persona by comparing rendered personas with the current .clinerules file
    const personas = this.listPersonas(projectRoot);
    for (const personaName of personas) {
      const renderedPersona = this.renderPersona(projectRoot, personaName);
      if (renderedPersona === currentClineRules) {
        return personaName;
      }
    }

    return null;
  }

    getPersona(projectRoot: string, name: string): Persona | null {
    const filePath = this.getPersonaPath(projectRoot, name);
    if (!fs.existsSync(filePath)) return null;
    return Persona.loadFromFile(filePath);
  }

    listPersonas(projectRoot: string): string[] {
    const personaRoot = this.getPersonaRoot(projectRoot);
    return fs
      .readdirSync(personaRoot)
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.basename(file, ".json"));
  }

    deletePersona(projectRoot: string, name: string): void {
    const filePath = this.getPersonaPath(projectRoot, name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

    describePersonas(projectRoot: string): Map<string, string> {
    const personaMap = new Map<string, string>();
    for (const name of this.listPersonas(projectRoot)) {
      const persona = this.getPersona(projectRoot, name);
      if (persona) {
        personaMap.set(name, persona.description);
      }
    }
    return personaMap;
  }

    describeComponents(projectRoot: string): Map<string, string> {
    const componentMap = new Map<string, string>();
    for (const name of this.listComponents(projectRoot)) {
      const component = this.getComponent(projectRoot, name);
      if (component) {
        componentMap.set(name, component.description);
      }
    }
    return componentMap;
  }

    renderPersona(projectRoot: string, name: string): string {
    const persona = this.getPersona(projectRoot, name);
    if (!persona) {
      throw new Error(`Persona not found: ${name}`);
    }

    // Get all required components and their texts
    const data: Record<string, string> = {};
    for (const componentName of persona.requiredComponents()) {
      const component = this.getComponent(projectRoot, componentName);
      if (!component) {
        throw new Error(
          `Cannot render persona: missing required component: ${componentName}`
        );
      }
      data[componentName] = component.text;
    }

    return persona.render(data);
  }
}
