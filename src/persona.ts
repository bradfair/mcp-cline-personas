import fs from 'fs';
import path from 'path';
import { logger } from '@src/logger.js';

export class Persona {
  constructor(
    public name: string,
    public description: string,
    public template: string,
    public version: number
  ) {}

  saveToFile(filePath: string): void {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          name: this.name,
          description: this.description,
          template: this.template,
          version: this.version
        }, null, 2)
      );
    } catch (error) {
      throw new Error(`Failed to save persona: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static loadFromFile(filePath: string): Persona {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File does not exist');
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      if (!data.name || !data.description || !data.template || data.version === undefined) {
        throw new Error('Invalid persona data in file');
      }

      return new Persona(
        data.name,
        data.description,
        data.template,
        Number(data.version)
      );
    } catch (error) {
      const errorMsg = `Failed to load persona: ${error}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  equals(other: Persona | null | undefined): boolean {
    if (!other) return false;
    return this.name === other.name &&
      this.description === other.description &&
      this.template === other.template &&
      this.version === other.version;
  }

  render(data: Record<string, string>): string {
    // Create a normalized data object with lowercase keys
    const normalizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key.toLowerCase(), value])
    );

    return this.template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, varName) => {
      const normalizedVar = varName.trim().toLowerCase();
      return normalizedData[normalizedVar] !== undefined ? normalizedData[normalizedVar] : match;
    });
  }

  requiredComponents(): string[] {
    const matches = this.template.match(/\{\{\s*([^}]+)\s*\}\}/g);
    if (!matches) return [];
    
    const components = new Set<string>();
    for (const match of matches) {
      const varName = match.replace(/\{\{\s*|\s*\}\}/g, '').toLowerCase();
      if (varName) {
        components.add(varName);
      }
    }
    return Array.from(components);
  }
}
