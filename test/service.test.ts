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
    tempDir = fs.mkdtempSync(path.join(__dirname, 'test-'));
    console.log('Created temp dir:', tempDir);
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

  describe('Component deletion validation', () => {
    it('should prevent deleting a component when personas depend on it', () => {
      // Create component and persona that depends on it
      service.setComponent('comp1', 'desc', 'text', 1);
      service.setPersona('persona1', 'desc', 'template with {{comp1}}', 1);
      
      expect(() => service.deleteComponent('comp1')).toThrow(
        /Cannot delete component: required by personas:.*persona1/
      );
    });

    it('should allow deleting a component when no personas depend on it', () => {
      service.setComponent('comp1', 'desc', 'text', 1);
      service.deleteComponent('comp1');
      expect(service.getComponent('comp1')).toBeNull();
    });
  });

  describe('Persona validation', () => {
    it('should prevent saving persona with non-existent component dependencies', () => {
      expect(() => service.setPersona(
        'persona1',
        'desc',
        'template with {{nonexistent}}',
        1
      )).toThrow('Cannot save persona: depends on non-existent component: nonexistent');
    });

    it('should allow saving persona when all dependencies exist', () => {
      service.setComponent('comp1', 'desc', 'text', 1);
      expect(() => service.setPersona(
        'persona1',
        'desc',
        'template with {{comp1}}',
        1
      )).not.toThrow();
    });
  });

  describe('Persona activation', () => {
    it('should write persona template to .clinerules file', () => {
      service.setPersona('persona1', 'desc', 'template content', 1);
      service.activatePersona('persona1');
      let clineRulesPath = path.join(service.projectRoot, '.clinerules')
      expect(fs.existsSync(clineRulesPath)).toBeTruthy();
      expect(fs.readFileSync(clineRulesPath, 'utf-8')).toBe('template content');
    });

    it('should throw when activating non-existent persona', () => {
      expect(() => service.activatePersona('nonexistent'))
        .toThrow('Persona not found: nonexistent');
    });

    it('should get active persona name from .clinerules file', () => {
      service.setPersona('persona1', 'desc', 'template content', 1);
      service.activatePersona('persona1');
      
      const activePersona = service.getActivePersona();
      expect(activePersona).toBe('persona1');
    });

    it('should return null when no persona is active', () => {
      expect(service.getActivePersona()).toBeNull();
    });

    it('should return null when .clinerules file is empty', () => {
      fs.writeFileSync(path.join(service.projectRoot, '.clinerules'), '');
      expect(service.getActivePersona()).toBeNull();
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

  describe('renderPersona', () => {
    it('should render persona with component texts', () => {
      // Setup components
      service.setComponent('comp1', 'desc1', 'text1', 1);
      service.setComponent('comp2', 'desc2', 'text2', 1);
      
      // Setup persona with template
      const template = 'Component 1: {{comp1}}\nComponent 2: {{comp2}}';
      service.setPersona('test', 'description', template, 1);
      
      // Render persona
      const result = service.renderPersona('test');
      
      // Verify output
      expect(result).toBe('Component 1: text1\nComponent 2: text2');
    });

    it('should throw when persona does not exist', () => {
      expect(() => service.renderPersona('nonexistent'))
        .toThrow('Persona not found: nonexistent');
    });

    it('should handle missing components in template', () => {
      // Create a component that isn't referenced by any persona
      service.setComponent('unusedComp', 'desc', 'text', 1);
      
      // Create persona that depends on a different component
      service.setPersona('test', 'description', 'Template with {{unusedComp}}', 1);
      
      // Delete the unused component to simulate it being missing
      service.deleteComponent('unusedComp');
      
      // Verify error is thrown when trying to render
      expect(() => service.renderPersona('test'))
        .toThrow('Cannot render persona: missing required component: unusedcomp');
    });
  });

  describe('describePersonas', () => {
    it('should return empty map when no personas exist', () => {
      const result = service.describePersonas();
      expect(result.size).toBe(0);
    });

    it('should return correct name-description mappings', () => {
      service.setPersona('persona1', 'description1', 'template1', 1);
      service.setPersona('persona2', 'description2', 'template2', 1);
      
      const result = service.describePersonas();
      expect(result.size).toBe(2);
      expect(result.get('persona1')).toBe('description1');
      expect(result.get('persona2')).toBe('description2');
    });
  });

  describe('describeComponents', () => {
    it('should return empty map when no components exist', () => {
      const result = service.describeComponents();
      expect(result.size).toBe(0);
    });

    it('should return correct name-description mappings', () => {
      service.setComponent('comp1', 'description1', 'text1', 1);
      service.setComponent('comp2', 'description2', 'text2', 1);
      
      const result = service.describeComponents();
      expect(result.size).toBe(2);
      expect(result.get('comp1')).toBe('description1');
      expect(result.get('comp2')).toBe('description2');
    });
  });
});
