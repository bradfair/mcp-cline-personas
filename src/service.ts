import fs from 'fs';
import path from 'path';
import { Component } from '@/component';
import { Persona } from '@/persona';

const serviceDirectoryName = '.cline-personas';

export interface ComponentService {
  setComponent(name: string, description: string, text: string, version: number): void;
  getComponent(name: string): Component | null;
  listComponents(): string[];
  deleteComponent(name: string): void;
  describeComponents(): Map<string, string>;
}

export interface PersonaService {
  setPersona(name: string, description: string, template: string, version: number): void;
  getPersona(name: string): Persona | null;
  listPersonas(): string[];
  deletePersona(name: string): void;
  describePersonas(): Map<string, string>;
}

export class ComponentPersonaService implements ComponentService, PersonaService {
  private componentRoot: string;
  private personaRoot: string;
  public readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.componentRoot = path.join(projectRoot, serviceDirectoryName, 'components');
    this.personaRoot = path.join(projectRoot, serviceDirectoryName, 'personas');
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    if (!fs.existsSync(this.componentRoot)) {
      fs.mkdirSync(this.componentRoot, { recursive: true });
    }
    if (!fs.existsSync(this.personaRoot)) {
      fs.mkdirSync(this.personaRoot, { recursive: true });
    }
  }

  private getComponentPath(name: string): string {
    return path.join(this.componentRoot, `${name}.json`);
  }

  private getPersonaPath(name: string): string {
    return path.join(this.personaRoot, `${name}.json`);
  }

  // Component operations
  setComponent(name: string, description: string, text: string, version: number): void {
    const component = new Component(name, description, text, version);
    component.saveToFile(this.getComponentPath(name));
  }

  getComponent(name: string): Component | null {
    const filePath = this.getComponentPath(name);
    if (!fs.existsSync(filePath)) return null;
    return Component.loadFromFile(filePath);
  }

  listComponents(): string[] {
    if (!fs.existsSync(this.componentRoot)) return [];
    return fs.readdirSync(this.componentRoot)
      .filter(file => file.endsWith('.json'))
      .map(file => path.basename(file, '.json'));
  }

  deleteComponent(name: string): void {
    const personas = this.listPersonas();
    let dependents = [];
    for (const personaName of personas) {
      const persona = this.getPersona(personaName);
      if (persona && persona.requiredComponents().includes(name)) {
        dependents.push(personaName);
      }
    }
    if (dependents.length > 0) {
      throw new Error(`Cannot delete component: required by personas: ${dependents.join(', ')}`);
    }

    const filePath = this.getComponentPath(name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Persona operations
  setPersona(name: string, description: string, template: string, version: number): void {
    const persona = new Persona(name, description, template, version);
    
    // Validate that all template variables exist as components
    const templateComponents = persona.requiredComponents();
    for (const componentName of templateComponents) {
      if (!this.getComponent(componentName)) {
        throw new Error(`Cannot save persona: depends on non-existent component: ${componentName}`);
      }
    }

    persona.saveToFile(this.getPersonaPath(name));
  }

  activatePersona(name: string): void {
    const persona = this.getPersona(name);
    if (!persona) {
      throw new Error(`Persona not found: ${name}`);
    }

    const clinerulesPath = path.join(this.projectRoot, '.clinerules');
    fs.writeFileSync(clinerulesPath, persona.template);
  }

  getActivePersona(): string | null {
    const clinerulesPath = path.join(this.projectRoot, '.clinerules');
    if (!fs.existsSync(clinerulesPath)) {
      return null;
    }

    const currentClineRules = fs.readFileSync(clinerulesPath, 'utf-8');

    // Find the active persona by comparing rendered personas with the current .clinerules file
    const personas = this.listPersonas();
    for (const personaName of personas) {
      const renderedPersona = this.renderPersona(personaName);
      if (renderedPersona === currentClineRules) {
        return personaName;
      }
    }

    return null;
  }

  getPersona(name: string): Persona | null {
    const filePath = this.getPersonaPath(name);
    if (!fs.existsSync(filePath)) return null;
    return Persona.loadFromFile(filePath);
  }

  listPersonas(): string[] {
    if (!fs.existsSync(this.personaRoot)) return [];
    return fs.readdirSync(this.personaRoot)
      .filter(file => file.endsWith('.json'))
      .map(file => path.basename(file, '.json'));
  }

  deletePersona(name: string): void {
    const filePath = this.getPersonaPath(name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  describePersonas(): Map<string, string> {
    const personaMap = new Map<string, string>();
    for (const name of this.listPersonas()) {
      const persona = this.getPersona(name);
      if (persona) {
        personaMap.set(name, persona.description);
      }
    }
    return personaMap;
  }

  describeComponents(): Map<string, string> {
    const componentMap = new Map<string, string>();
    for (const name of this.listComponents()) {
      const component = this.getComponent(name);
      if (component) {
        componentMap.set(name, component.description);
      }
    }
    return componentMap;
  }

  renderPersona(name: string): string {
    const persona = this.getPersona(name);
    if (!persona) {
      throw new Error(`Persona not found: ${name}`);
    }

    // Get all required components and their texts
    const data: Record<string, string> = {};
    for (const componentName of persona.requiredComponents()) {
      const component = this.getComponent(componentName);
      if (!component) {
        throw new Error(`Cannot render persona: missing required component: ${componentName}`);
      }
      data[componentName] = component.text;
    }

    return persona.render(data);
  }
}
