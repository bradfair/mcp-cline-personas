import fs from 'fs';
import path from 'path';
import { describe, it, beforeEach, afterEach } from '@jest/globals';
import { ComponentPersonaService } from '@/service';
import { Component } from '@/component';
import { Persona } from '@/persona';

describe('ComponentPersonaService', () => {
  let tempDir: string;
  let service: ComponentPersonaService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync('test-');
    service = new ComponentPersonaService(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Component operations', () => {
    it('should set and get a component', () => {
      service.setComponent('test', 'description', 'text', 1);
      const component = service.getComponent('test');
      expect(component).toBeInstanceOf(Component);
      expect(component?.name).toBe('test');
      expect(component?.description).toBe('description');
      expect(component?.text).toBe('text');
      expect(component?.version).toBe(1);
    });

    it('should return null for non-existent component', () => {
      const component = service.getComponent('nonexistent');
      expect(component).toBeNull();
    });

    it('should list components', () => {
      service.setComponent('test1', 'desc1', 'text1', 1);
      service.setComponent('test2', 'desc2', 'text2', 1);
      const components = service.listComponents();
      expect(components).toEqual(['test1', 'test2']);
    });

    it('should delete a component', () => {
      service.setComponent('test', 'description', 'text', 1);
      service.deleteComponent('test');
      const component = service.getComponent('test');
      expect(component).toBeNull();
    });

    it('should handle idempotent delete', () => {
      service.deleteComponent('nonexistent'); // Should not throw
    });
  });

  describe('Persona operations', () => {
    it('should set and get a persona', () => {
      service.setPersona('test', 'description', 'template', 1);
      const persona = service.getPersona('test');
      expect(persona).toBeInstanceOf(Persona);
      expect(persona?.name).toBe('test');
      expect(persona?.description).toBe('description');
      expect(persona?.template).toBe('template');
      expect(persona?.version).toBe(1);
    });

    it('should return null for non-existent persona', () => {
      const persona = service.getPersona('nonexistent');
      expect(persona).toBeNull();
    });

    it('should list personas', () => {
      service.setPersona('test1', 'desc1', 'template1', 1);
      service.setPersona('test2', 'desc2', 'template2', 1);
      const personas = service.listPersonas();
      expect(personas).toEqual(['test1', 'test2']);
    });

    it('should delete a persona', () => {
      service.setPersona('test', 'description', 'template', 1);
      service.deletePersona('test');
      const persona = service.getPersona('test');
      expect(persona).toBeNull();
    });

    it('should handle idempotent delete', () => {
      service.deletePersona('nonexistent'); // Should not throw
    });
  });

  describe('Directory handling', () => {
    it('should create component directory if not exists', () => {
      const dir = path.join(tempDir, 'new-components');
      const newService = new ComponentPersonaService(dir);
      expect(fs.existsSync(dir)).toBeTruthy();
    });

    it('should create persona directory if not exists', () => {
      const dir = path.join(tempDir, 'new-personas');
      const newService = new ComponentPersonaService(dir);
      expect(fs.existsSync(dir)).toBeTruthy();
    });

    it('should return empty array when listing non-existent component directory', () => {
      const dir = path.join(tempDir, 'empty-components');
      // Create then remove directory to ensure it doesn't exist
      fs.mkdirSync(dir, { recursive: true });
      fs.rmdirSync(dir);
      
      const newService = new ComponentPersonaService(dir);
      expect(newService.listComponents()).toEqual([]);
    });

    it('should return empty array when listing non-existent persona directory', () => {
      const dir = path.join(tempDir, 'empty-personas');
      // Create then remove directory to ensure it doesn't exist
      fs.mkdirSync(dir, { recursive: true });
      fs.rmdirSync(dir);
      
      const newService = new ComponentPersonaService(dir);
      expect(newService.listPersonas()).toEqual([]);
    });

    it('should handle removed component directory after initialization', () => {
      // Service creates directories in constructor
      expect(fs.existsSync(path.join(tempDir, '.cline-personas', 'components'))).toBeTruthy();
      
      // Remove the components directory
      fs.rmdirSync(path.join(tempDir, '.cline-personas', 'components'));
      
      // Verify listComponents handles missing directory
      expect(service.listComponents()).toEqual([]);
    });

    it('should handle removed persona directory after initialization', () => {
      // Service creates directories in constructor
      expect(fs.existsSync(path.join(tempDir, '.cline-personas', 'personas'))).toBeTruthy();
      
      // Remove the personas directory
      fs.rmdirSync(path.join(tempDir, '.cline-personas', 'personas'));
      
      // Verify listPersonas handles missing directory
      expect(service.listPersonas()).toEqual([]);
    });
  });
});
