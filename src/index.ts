import { createServer } from "@src/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function runServer() {
  const { server } = createServer('.');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Secure MCP Filesystem Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});