import { createServer } from "@src/server.js";
import { 
  ListToolsRequestSchema,
  JSONRPCMessage
} from "@modelcontextprotocol/sdk/types.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ComponentPersonaService } from "@src/service.js";

import fs from "fs";

describe("Server Tools", () => {
  let server: ReturnType<typeof createServer>;
  let transport: ReturnType<typeof InMemoryTransport.createLinkedPair>;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync("persona-test-");
    server = createServer();
    transport = InMemoryTransport.createLinkedPair();
  });

  test("should list all tools successfully", async () => {
    const [clientTransport, serverTransport] = transport;
    
    // Connect server
    await server.server.connect(serverTransport);

    // Create client
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    await client.connect(clientTransport);

    // Get tools
    const tools = await client.listTools();

    // Verify tools list
    expect(tools.tools).toHaveLength(8);
    expect(tools.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "listPersonas",
          description: "List all available personas",
          inputSchema: expect.any(Object)
        }),
        expect.objectContaining({
          name: "listComponents",
          description: "List all available components", 
          inputSchema: expect.any(Object)
        }),
        expect.objectContaining({
          name: "createOrUpdatePersona",
          description: "Create or update a persona",
          inputSchema: expect.any(Object)
        }),
        expect.objectContaining({
          name: "createOrUpdateComponent",
          description: "Create or update a component",
          inputSchema: expect.any(Object)
        }),
        expect.objectContaining({
          name: "deletePersona",
          description: "Delete a persona",
          inputSchema: expect.any(Object)
        }),
        expect.objectContaining({
          name: "deleteComponent",
          description: "Delete a component",
          inputSchema: expect.any(Object)
        }),
        expect.objectContaining({
          name: "activatePersona",
          description: "Activate a specific persona",
          inputSchema: expect.any(Object)
        }),
        expect.objectContaining({
          name: "getActivePersona",
          description: "Get the currently active persona",
          inputSchema: expect.any(Object)
        })
      ])
    );
  });

  afterEach(() => {
    // Clean up temporary directory
    const { service } = server;
    fs.rmSync(tempDir, { recursive: true });
  });

  test("should list personas successfully", async () => {
    const [clientTransport, serverTransport] = transport;
    
    // Connect server
    await server.server.connect(serverTransport);

    // Create client
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    await client.connect(clientTransport);

    // Create test persona
    const { service } = server;
    service.setPersona(tempDir, "test-persona", "test description", "template", 1);

    // Get personas
    const response = await client.callTool({
      name: "listPersonas",
      arguments: { projectRoot: tempDir }
    }) as { content: Array<{ type: string; text: string }> };

    // Verify response
    expect(response.content[0].text).toBeDefined();
    const personas = JSON.parse(response.content[0].text);
    expect(personas).toEqual(expect.arrayContaining(["test-persona"]));
  });

  test("should list components successfully", async () => {
    const [clientTransport, serverTransport] = transport;
    
    // Connect server
    await server.server.connect(serverTransport);

    // Create client
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    await client.connect(clientTransport);

    // Create test component
    const { service } = server;
    service.setComponent(tempDir, "test-component", "test description", "text", 1);

    // Get components
    const response = await client.callTool({
      name: "listComponents",
      arguments: { projectRoot: tempDir }
    }) as { content: Array<{ type: string; text: string }> };

    // Verify response
    expect(response.content[0].text).toBeDefined();
    const components = JSON.parse(response.content[0].text);
    expect(components).toEqual(expect.arrayContaining(["test-component"]));
  });

  test("should create or update persona successfully", async () => {
    const [clientTransport, serverTransport] = transport;
    
    // Connect server
    await server.server.connect(serverTransport);

    // Create client
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    await client.connect(clientTransport);

    // Create persona
    const response = await client.callTool({
      name: "createOrUpdatePersona",
      arguments: { 
        projectRoot: tempDir,
        name: "test-persona",
        description: "test description",
        template: "template",
        version: 1
      }
    }) as { content: Array<{ type: string; text: string }> };

    // Verify response
    expect(response.content[0].text).toBeDefined();
    const result = JSON.parse(response.content[0].text);
    expect(result.success).toBe(true);

    // Verify persona was created
    const { service } = server;
    const persona = service.getPersona(tempDir, "test-persona");
    expect(persona).toBeDefined();
    expect(persona?.description).toBe("test description");
  });

  test("should create or update component successfully", async () => {
    const [clientTransport, serverTransport] = transport;
    
    // Connect server
    await server.server.connect(serverTransport);

    // Create client
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    await client.connect(clientTransport);

    // Create component
    const response = await client.callTool({
      name: "createOrUpdateComponent",
      arguments: {
        projectRoot: tempDir,
        name: "test-component",
        description: "test description",
        text: "test text",
        version: 1
      }
    }) as { content: Array<{ type: string; text: string }> };

    // Verify response
    expect(response.content[0].text).toBeDefined();
    const result = JSON.parse(response.content[0].text);
    expect(result.success).toBe(true);

    // Verify component was created
    const { service } = server;
    const component = service.getComponent(tempDir, "test-component");
    expect(component).toBeDefined();
    expect(component?.description).toBe("test description");
    expect(component?.text).toBe("test text");
  });

  test("should delete persona successfully", async () => {
    const [clientTransport, serverTransport] = transport;
    
    // Connect server
    await server.server.connect(serverTransport);

    // Create client
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    await client.connect(clientTransport);

    // Create test persona
    const { service } = server;
    service.setPersona(tempDir, "test-persona", "test description", "template", 1);

    // Delete persona
    const response = await client.callTool({
      name: "deletePersona",
      arguments: {
        projectRoot: tempDir,
        name: "test-persona"
      }
    }) as { content: Array<{ type: string; text: string }> };

    // Verify response
    expect(response.content[0].text).toBeDefined();
    const result = JSON.parse(response.content[0].text);
    expect(result.success).toBe(true);

    // Verify persona was deleted
    const deletedPersona = service.getPersona(tempDir, "test-persona");
    expect(deletedPersona).toBeNull();
  });

  test("should delete component successfully", async () => {
    const [clientTransport, serverTransport] = transport;
    
    // Connect server
    await server.server.connect(serverTransport);

    // Create client
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    await client.connect(clientTransport);

    // Create test component
    const { service } = server;
    service.setComponent(tempDir, "test-component", "test description", "test text", 1);

    // Delete component
    const response = await client.callTool({
      name: "deleteComponent",
      arguments: {
        projectRoot: tempDir,
        name: "test-component"
      }
    }) as { content: Array<{ type: string; text: string }> };

    // Verify response
    expect(response.content[0].text).toBeDefined();
    const result = JSON.parse(response.content[0].text);
    expect(result.success).toBe(true);

    // Verify component was deleted
    const deletedComponent = service.getComponent(tempDir, "test-component");
    expect(deletedComponent).toBeNull();
  });

  test("should activate persona successfully", async () => {
    const [clientTransport, serverTransport] = transport;
    
    // Connect server
    await server.server.connect(serverTransport);

    // Create client
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    await client.connect(clientTransport);

    // Create test persona
    const { service } = server;
    service.setPersona(tempDir, "test-persona", "test description", "template", 1);

    // Activate persona
    const response = await client.callTool({
      name: "activatePersona",
      arguments: {
        projectRoot: tempDir,
        name: "test-persona"
      }
    }) as { content: Array<{ type: string; text: string }> };

    // Verify response
    expect(response.content[0].text).toBeDefined();
    const result = JSON.parse(response.content[0].text);
    expect(result.success).toBe(true);

    // Verify persona was activated
    const activePersona = service.getActivePersona(tempDir);
    expect(activePersona).toBe("test-persona");
  });

  test("should get active persona successfully", async () => {
    const [clientTransport, serverTransport] = transport;
    
    // Connect server
    await server.server.connect(serverTransport);

    // Create client
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    await client.connect(clientTransport);

    // Create and activate test persona
    const { service } = server;
    service.setPersona(tempDir, "test-persona", "test description", "template", 1);
    service.activatePersona(tempDir, "test-persona");

    // Get active persona
    const response = await client.callTool({
      name: "getActivePersona",
      arguments: { projectRoot: tempDir }
    }) as { content: Array<{ type: string; text: string }> };

    // Verify response
    expect(response.content[0].text).toBeDefined();
    expect(response.content[0].text).toBe("test-persona");
  });

  // Should return null if no active persona
  test("should return null if no active persona", async () => {
    const [clientTransport, serverTransport] = transport;
    
    // Connect server
    await server.server.connect(serverTransport);

    // Create client
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    await client.connect(clientTransport);

    // Get active persona
    const response = await client.callTool({
      name: "getActivePersona",
      arguments: { projectRoot: tempDir }
    }) as { content: Array<{ type: string; text: string }> };

    // Verify response
    expect(response.content).toHaveLength(0);
  });

  // Should throw an error requesting a non-existent tool
  test("should throw error for non-existent tool", async () => {
    const [clientTransport, serverTransport] = transport;
    
    // Connect server
    await server.server.connect(serverTransport);

    // Create client
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    await client.connect(clientTransport);

    // Call non-existent tool
    await expect(client.callTool({
      name: "nonExistentTool",
      arguments: { tempDir }
    })).rejects.toThrow("Unknown tool: nonExistentTool");
  });
});
