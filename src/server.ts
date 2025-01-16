import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ComponentPersonaService } from "@src/service";
import { z } from "zod";

interface PersonaServer extends Server {
  listPrompts(): Promise<{
    personas: Array<{ name: string; description: string }>;
  }>;
  createOrUpdatePersona(args: {
    name: string;
    description: string;
    template: string;
    version: number;
  }): Promise<{ success: boolean }>;
  deletePersona(args: { name: string }): Promise<{ success: boolean }>;
  activatePersona(args: { name: string }): Promise<{ success: boolean }>;
  listTools(): Promise<{ tools: Array<{ name: string; description: string }> }>;
  createOrUpdateComponent(args: {
    name: string;
    description: string;
    text: string;
    version: number;
  }): Promise<{ success: boolean }>;
  deleteComponent(args: { name: string }): Promise<{ success: boolean }>;
  listResources(): Promise<{
    resources: Array<{ name: string; description: string }>;
  }>;
  callTool(args: { name: string; arguments?: unknown }): Promise<unknown>;
}

const PersonaSchema = z.object({
  name: z.string(),
  description: z.string(),
});

const ComponentSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const createServer = (
  service: ComponentPersonaService
): { server: PersonaServer } => {
  const server = new Server(
    {
      name: "cline-personas",
      version: "0.1.0",
    },
    {
      capabilities: {
        personas: {},
        components: {},
        logging: {},
      },
    }
  );

  // List Personas
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    const personas = service.describePersonas();
    return {
      personas: Array.from(personas).map(([name, description]) => ({
        name,
        description,
      })),
    };
  });

  // List Components
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const components = service.describeComponents();
    return {
      tools: Array.from(components).map(([name, description]) => ({
        name,
        description,
      })),
    };
  });

  // Zod schemas for request validation
  const CreatePersonaSchema = z.object({
    name: z.string(),
    description: z.string(),
    template: z.string(),
    version: z.number(),
  });

  const CreateComponentSchema = z.object({
    name: z.string(),
    description: z.string(),
    text: z.string(),
    version: z.number(),
  });

  const DeleteSchema = z.object({
    name: z.string(),
  });

  // Create/Update Persona
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    if (request.params.name === "createOrUpdatePersona") {
      const result = CreatePersonaSchema.safeParse(request.params.arguments);
      if (!result.success) {
        throw new Error(`Invalid arguments: ${result.error.message}`);
      }
      const { name, description, template, version } = result.data;
      service.setPersona(name, description, template, version);
      return { success: true };
    }
    throw new Error("Unknown tool");
  });

  // Create/Update Component
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    if (request.params.name === "createOrUpdateComponent") {
      const result = CreateComponentSchema.safeParse(request.params.arguments);
      if (!result.success) {
        throw new Error(`Invalid arguments: ${result.error.message}`);
      }
      const { name, description, text, version } = result.data;
      service.setComponent(name, description, text, version);
      return { success: true };
    }
    throw new Error("Unknown tool");
  });

  // Delete Persona
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    if (request.params.name === "deletePersona") {
      const result = DeleteSchema.safeParse(request.params.arguments);
      if (!result.success) {
        throw new Error(`Invalid arguments: ${result.error.message}`);
      }
      const { name } = result.data;
      service.deletePersona(name);
      return { success: true };
    }
    throw new Error("Unknown tool");
  });

  // Delete Component
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    if (request.params.name === "deleteComponent") {
      const result = DeleteSchema.safeParse(request.params.arguments);
      if (!result.success) {
        throw new Error(`Invalid arguments: ${result.error.message}`);
      }
      const { name } = result.data;
      service.deleteComponent(name);
      return { success: true };
    }
    throw new Error("Unknown tool");
  });

  // Activate Persona
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    if (request.params.name === "activatePersona") {
      const result = DeleteSchema.safeParse(request.params.arguments);
      if (!result.success) {
        throw new Error(`Invalid arguments: ${result.error.message}`);
      }
      const { name } = result.data;
      service.activatePersona(name);
      return { success: true };
    }
    throw new Error("Unknown tool");
  });

  // Get Active Persona
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const activePersona = service.getActivePersona();
    return {
      resources: activePersona
        ? [
            {
              name: activePersona,
              description: "Currently active persona",
            },
          ]
        : [],
    };
  });

  return { server: server as PersonaServer };
};

export const createPersonaServer = (projectRoot: string) => {
  const service = new ComponentPersonaService(projectRoot);
  return createServer(service);
};
