import { ComponentPersonaService } from "@src/service";
import { createServer } from "@src/server";
import fs from 'fs';
import path from 'path';
import { describe, it, beforeEach, afterEach } from '@jest/globals';

describe('Server', () => {
  let tempDir: string;
  let service: ComponentPersonaService;
  let server: ReturnType<typeof createServer>;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(__dirname, 'server-test-'));
    service = new ComponentPersonaService(tempDir);
    server = createServer(service);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Persona Operations', () => {
    it('should list personas', async () => {
      service.setPersona('test1', 'desc1', 'template1', 1);
      service.setPersona('test2', 'desc2', 'template2', 1);

      const response = await server.server.listPrompts();
      expect(response).toEqual({
        personas: [
          { name: 'test1', description: 'desc1' },
          { name: 'test2', description: 'desc2' }
        ]
      });
    });

    it('should create/update persona', async () => {
      const response = await server.server.createOrUpdatePersona({
        name: 'test',
        description: 'desc',
        template: 'template',
        version: 1
      });

      expect(response).toEqual({ success: true });
      expect(service.getPersona('test')).toBeTruthy();
    });

    it('should delete persona', async () => {
      service.setPersona('test', 'desc', 'template', 1);
      
      const response = await server.server.deletePersona({ name: 'test' });
      expect(response).toEqual({ success: true });
      expect(service.getPersona('test')).toBeNull();
    });

    it('should activate persona', async () => {
      service.setPersona('test', 'desc', 'template', 1);
      
      const response = await server.server.activatePersona({ name: 'test' });
      expect(response).toEqual({ success: true });
      expect(service.getActivePersona()).toBe('test');
    });
  });

  describe('Component Operations', () => {
    it('should list components', async () => {
      service.setComponent('test1', 'desc1', 'text1', 1);
      service.setComponent('test2', 'desc2', 'text2', 1);

      const response = await server.server.listTools();
      expect(response).toEqual({
        tools: [
          { name: 'test1', description: 'desc1' },
          { name: 'test2', description: 'desc2' }
        ]
      });
    });

    it('should create/update component', async () => {
      const response = await server.server.createOrUpdateComponent({
        name: 'test',
        description: 'desc',
        text: 'text',
        version: 1
      });

      expect(response).toEqual({ success: true });
      expect(service.getComponent('test')).toBeTruthy();
    });

    it('should delete component', async () => {
      service.setComponent('test', 'desc', 'text', 1);
      
      const response = await server.server.deleteComponent({ name: 'test' });
      expect(response).toEqual({ success: true });
      expect(service.getComponent('test')).toBeNull();
    });
  });

  describe('Active Persona', () => {
    it('should get active persona', async () => {
      service.setPersona('test', 'desc', 'template', 1);
      service.activatePersona('test');

      const response = await server.server.listResources();
      expect(response).toEqual({
        resources: [{
          name: 'test',
          description: 'Currently active persona'
        }]
      });
    });

    it('should return empty when no active persona', async () => {
      const response = await server.server.listResources();
      expect(response).toEqual({ resources: [] });
    });
  });

  describe('Error Handling', () => {
    it('should throw for invalid persona creation', async () => {
      await expect(server.server.createOrUpdatePersona({
        invalid: 'data'
      } as any)).rejects.toThrow('Invalid arguments');
    });

    it('should throw for invalid component creation', async () => {
      await expect(server.server.createOrUpdateComponent({
        invalid: 'data'
      } as any)).rejects.toThrow('Invalid arguments');
    });

    it('should throw for unknown tool', async () => {
      await expect(server.server.callTool({
        name: 'unknownTool',
        arguments: {}
      })).rejects.toThrow('Unknown tool');
    });
  });
});
