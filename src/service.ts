import fs from "fs";
import path from "path";
import { Component } from "@src/component.js";
import { Persona } from "@src/persona.js";
import { logger } from "@src/logger.js";

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
    if (!fs.existsSync(path.join(projectRoot, serviceDirectoryName))) {
      logger.debug(`Creating service directory at ${path.join(projectRoot, serviceDirectoryName)}`);
      fs.mkdirSync(path.join(projectRoot, serviceDirectoryName), { recursive: true });
    }
    const componentRoot = path.join(projectRoot, serviceDirectoryName, "components");
    if (!fs.existsSync(componentRoot)) {
      logger.debug(`Creating component directory at ${componentRoot}`);
      fs.mkdirSync(componentRoot, { recursive: true });
    }
    return componentRoot;
  }

  private getPersonaRoot(projectRoot: string): string {
    if (!fs.existsSync(path.join(projectRoot, serviceDirectoryName))) {
      logger.debug(`Creating service directory at ${path.join(projectRoot, serviceDirectoryName)}`);
      fs.mkdirSync(path.join(projectRoot, serviceDirectoryName), { recursive: true });
    }
    const personaRoot = path.join(projectRoot, serviceDirectoryName, "personas");
    if (!fs.existsSync(personaRoot)) {
      logger.debug(`Creating persona directory at ${personaRoot}`);
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
    logger.info(`Setting component ${name} (version ${version})`);
    const component = new Component(name, description, text, version);
    const filePath = this.getComponentPath(projectRoot, name);
    logger.debug(`Saving component to ${filePath}`);
    component.saveToFile(filePath);
  }

  getComponent(projectRoot: string, name: string): Component | null {
    const filePath = this.getComponentPath(projectRoot, name);
    logger.debug(`Loading component ${name} from ${filePath}`);
    if (!fs.existsSync(filePath)) {
      logger.warn(`Component file not found: ${filePath}`);
      return null;
    }
    return Component.loadFromFile(filePath);
  }

  listComponents(projectRoot: string): string[] {
    const componentRoot = this.getComponentRoot(projectRoot);
    logger.debug(`Listing components from ${componentRoot}`);
    return fs
      .readdirSync(componentRoot)
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.basename(file, ".json"));
  }

  deleteComponent(projectRoot: string, name: string): void {
    logger.info(`Attempting to delete component ${name}`);
    const personas = this.listPersonas(projectRoot);
    let dependents = [];
    for (const personaName of personas) {
      const persona = this.getPersona(projectRoot, personaName);
      if (persona && persona.requiredComponents().includes(name)) {
        dependents.push(personaName);
      }
    }
    if (dependents.length > 0) {
      const errorMsg = `Cannot delete component: required by personas: ${dependents.join(", ")}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const filePath = this.getComponentPath(projectRoot, name);
    if (fs.existsSync(filePath)) {
      logger.debug(`Deleting component file at ${filePath}`);
      fs.unlinkSync(filePath);
    } else {
      logger.warn(`Component file not found: ${filePath}`);
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
    logger.info(`Setting persona ${name} (version ${version})`);
    const persona = new Persona(name, description, template, version);

    // Validate that all template variables exist as components
    const templateComponents = persona.requiredComponents();
    for (const componentName of templateComponents) {
      if (!this.getComponent(projectRoot, componentName)) {
        const errorMsg = `Cannot save persona: depends on non-existent component: ${componentName}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
    }

    const filePath = this.getPersonaPath(projectRoot, name);
    logger.debug(`Saving persona to ${filePath}`);
    persona.saveToFile(filePath);
  }

  activatePersona(projectRoot: string, name: string): void {
    logger.info(`Activating persona ${name}`);
    const persona = this.getPersona(projectRoot, name);
    if (!persona) {
      const errorMsg = `Persona not found: ${name}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const clinerulesPath = path.join(projectRoot, ".clinerules");
    logger.debug(`Writing persona template to ${clinerulesPath}`);
    fs.writeFileSync(clinerulesPath, persona.template);
  }

  getActivePersona(projectRoot: string): string | null {
    logger.debug(`Getting active persona`);
    const clinerulesPath = path.join(projectRoot, ".clinerules");
    if (!fs.existsSync(clinerulesPath)) {
      logger.debug(`No active persona found - .clinerules file missing`);
      return null;
    }

    const currentClineRules = fs.readFileSync(clinerulesPath, "utf-8");

    // Find the active persona by comparing rendered personas with the current .clinerules file
    const personas = this.listPersonas(projectRoot);
    for (const personaName of personas) {
      const renderedPersona = this.renderPersona(projectRoot, personaName);
      if (renderedPersona === currentClineRules) {
        logger.debug(`Active persona found: ${personaName}`);
        return personaName;
      }
    }

    logger.debug(`No matching active persona found`);
    return null;
  }

  getPersona(projectRoot: string, name: string): Persona | null {
    const filePath = this.getPersonaPath(projectRoot, name);
    logger.debug(`Loading persona ${name} from ${filePath}`);
    if (!fs.existsSync(filePath)) {
      logger.warn(`Persona file not found: ${filePath}`);
      return null;
    }
    return Persona.loadFromFile(filePath);
  }

  listPersonas(projectRoot: string): string[] {
    const personaRoot = this.getPersonaRoot(projectRoot);
    logger.debug(`Listing personas from ${personaRoot}`);
    return fs
      .readdirSync(personaRoot)
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.basename(file, ".json"));
  }

  deletePersona(projectRoot: string, name: string): void {
    logger.info(`Deleting persona ${name}`);
    const filePath = this.getPersonaPath(projectRoot, name);
    if (fs.existsSync(filePath)) {
      logger.debug(`Deleting persona file at ${filePath}`);
      fs.unlinkSync(filePath);
    } else {
      logger.warn(`Persona file not found: ${filePath}`);
    }
  }

  describePersonas(projectRoot: string): Map<string, string> {
    logger.debug(`Describing personas`);
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
    logger.debug(`Describing components`);
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
    logger.debug(`Rendering persona ${name}`);
    const persona = this.getPersona(projectRoot, name);
    if (!persona) {
      const errorMsg = `Persona not found: ${name}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Get all required components and their texts
    const data: Record<string, string> = {};
    for (const componentName of persona.requiredComponents()) {
      const component = this.getComponent(projectRoot, componentName);
      if (!component) {
        const errorMsg = `Cannot render persona: missing required component: ${componentName}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      data[componentName] = component.text;
    }

    return persona.render(data);
  }
}
