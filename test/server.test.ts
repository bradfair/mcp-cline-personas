import { createServer } from "@src/server";
import { 
  ListToolsRequestSchema,
  JSONRPCMessage
} from "@modelcontextprotocol/sdk/types.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ComponentPersonaService } from "@src/service";

import fs from "fs";

describe("Server Tools", () => {
  let server: ReturnType<typeof createServer>;
  let transport: ReturnType<typeof InMemoryTransport.createLinkedPair>;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync("persona-test-");
    server = createServer(tempDir);
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
    const service = (server.server as any)._service as ComponentPersonaService;
    fs.rmSync(tempDir, { recursive: true });
  });
});
