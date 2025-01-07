import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ComponentPersonaService } from "@src/service.js";

type ToolInput = {
  type: "object";
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: unknown;
};

enum ToolName {
  LIST_PERSONAS = "listPersonas",
  LIST_COMPONENTS = "listComponents",
  CREATE_OR_UPDATE_PERSONA = "createOrUpdatePersona",
  CREATE_OR_UPDATE_COMPONENT = "createOrUpdateComponent",
  DELETE_PERSONA = "deletePersona",
  DELETE_COMPONENT = "deleteComponent",
  ACTIVATE_PERSONA = "activatePersona",
  GET_ACTIVE_PERSONA = "getActivePersona"
}

export const createServer = (projectRoot: string) => {
  const service = new ComponentPersonaService();
  const server = new Server(
    {
      name: "persona-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define tool schemas based on service.ts implementation
  const ListPersonasSchema = z.object({
    projectRoot: z.string()
  });
  const ListComponentsSchema = z.object({
    projectRoot: z.string()
  });
  const CreateOrUpdatePersonaSchema = z.object({
    projectRoot: z.string(),
    name: z.string(),
    description: z.string(),
    template: z.string(),
    version: z.number()
  });
  
  const CreateOrUpdateComponentSchema = z.object({
    projectRoot: z.string(),
    name: z.string(),
    description: z.string(),
    text: z.string(),
    version: z.number()
  });
  
  const DeletePersonaSchema = z.object({
    projectRoot: z.string(),
    name: z.string()
  });
  
  const DeleteComponentSchema = z.object({
    projectRoot: z.string(),
    name: z.string()
  });
  const ActivatePersonaSchema = z.object({
    projectRoot: z.string(),
    name: z.string()
  });
  const GetActivePersonaSchema = z.object({
    projectRoot: z.string()
  });

  // Setup tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [
      {
        name: ToolName.LIST_PERSONAS,
        description: "List all available personas",
        inputSchema: {
    type: "object",
    ...zodToJsonSchema(ListPersonasSchema)
  } as ToolInput
      },
      {
        name: ToolName.LIST_COMPONENTS,
        description: "List all available components",
        inputSchema: {
    type: "object",
    ...zodToJsonSchema(ListComponentsSchema)
  } as ToolInput
      },
      {
        name: ToolName.CREATE_OR_UPDATE_PERSONA,
        description: "Create or update a persona",
        inputSchema: {
          type: "object",
          ...zodToJsonSchema(CreateOrUpdatePersonaSchema)
        } as ToolInput
      },
      {
        name: ToolName.CREATE_OR_UPDATE_COMPONENT,
        description: "Create or update a component",
        inputSchema: {
          type: "object",
          ...zodToJsonSchema(CreateOrUpdateComponentSchema)
        } as ToolInput
      },
      {
        name: ToolName.DELETE_PERSONA,
        description: "Delete a persona",
        inputSchema: {
          type: "object",
          ...zodToJsonSchema(DeletePersonaSchema)
        } as ToolInput
      },
      {
        name: ToolName.DELETE_COMPONENT,
        description: "Delete a component",
        inputSchema: {
          type: "object",
          ...zodToJsonSchema(DeleteComponentSchema)
        } as ToolInput
      },
      {
        name: ToolName.ACTIVATE_PERSONA,
        description: "Activate a specific persona",
        inputSchema: {
    type: "object",
    ...zodToJsonSchema(ActivatePersonaSchema)
  } as ToolInput
      },
      {
        name: ToolName.GET_ACTIVE_PERSONA,
        description: "Get the currently active persona",
        inputSchema: {
    type: "object",
    ...zodToJsonSchema(GetActivePersonaSchema)
  } as ToolInput
      }
    ];

    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case ToolName.LIST_PERSONAS:
        return {
          content: [{
            type: "text",
            text: JSON.stringify(service.listPersonas(projectRoot))
          }]
        };

      case ToolName.LIST_COMPONENTS:
        return {
          content: [{
            type: "text",
            text: JSON.stringify(service.listComponents(projectRoot))
          }]
        };

      case ToolName.CREATE_OR_UPDATE_PERSONA:
        const createPersonaArgs = CreateOrUpdatePersonaSchema.parse(args);
        const personaData = {
          description: createPersonaArgs.description,
          template: createPersonaArgs.template,
          version: createPersonaArgs.version
        };
        service.setPersona(
          projectRoot,
          createPersonaArgs.name,
          createPersonaArgs.description,
          createPersonaArgs.template,
          createPersonaArgs.version
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true })
          }]
        };

      case ToolName.CREATE_OR_UPDATE_COMPONENT:
        const createComponentArgs = CreateOrUpdateComponentSchema.parse(args);
        const componentData = {
          description: createComponentArgs.description,
          text: createComponentArgs.text,
          version: createComponentArgs.version
        };
        service.setComponent(
          projectRoot,
          createComponentArgs.name,
          createComponentArgs.description,
          createComponentArgs.text,
          createComponentArgs.version
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true })
          }]
        };

      case ToolName.DELETE_PERSONA:
        const deletePersonaArgs = DeletePersonaSchema.parse(args);
        service.deletePersona(projectRoot, deletePersonaArgs.name);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true })
          }]
        };

      case ToolName.DELETE_COMPONENT:
        const deleteComponentArgs = DeleteComponentSchema.parse(args);
        service.deleteComponent(projectRoot, deleteComponentArgs.name);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true })
          }]
        };

      case ToolName.ACTIVATE_PERSONA:
        const activateArgs = ActivatePersonaSchema.parse(args);
        service.activatePersona(projectRoot, activateArgs.name);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true })
          }]
        };

      case ToolName.GET_ACTIVE_PERSONA:
        const activePersona = service.getActivePersona(projectRoot);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ activePersona })
          }]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  return { server, service };
};
