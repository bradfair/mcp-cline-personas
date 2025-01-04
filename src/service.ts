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
}

export interface PersonaService {
  setPersona(name: string, description: string, template: string, version: number): void;
  getPersona(name: string): Persona | null;
  listPersonas(): string[];
  deletePersona(name: string): void;
}

export class ComponentPersonaService implements ComponentService, PersonaService {
  private componentRoot: string;
  private personaRoot: string;

  constructor(projectRoot: string) {
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
    const filePath = this.getComponentPath(name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Persona operations
  setPersona(name: string, description: string, template: string, version: number): void {
    const persona = new Persona(name, description, template, version);
    persona.saveToFile(this.getPersonaPath(name));
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
}