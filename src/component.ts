import fs from 'fs';
import path from 'path';
import { logger } from '@src/logger.js';

export class Component {
  constructor(
    public name: string,
    public description: string,
    public text: string,
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
          text: this.text,
          version: this.version
        }, null, 2)
      );
    } catch (error) {
      throw new Error(`Failed to save component: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static loadFromFile(filePath: string): Component {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File does not exist');
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      if (!data.name || !data.description || !data.text || data.version === undefined) {
        throw new Error('Invalid component data in file');
      }

      return new Component(
        data.name,
        data.description,
        data.text,
        Number(data.version)
      );
    } catch (error) {
      const errorMsg = `Failed to load component: ${error}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  equals(other: Component | null | undefined): boolean {
    if (!other) return false;
    return this.name === other.name &&
      this.description === other.description &&
      this.text === other.text &&
      this.version === other.version;
  }
}
