import { createServer } from "@src/server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function runServer() {
  const { server } = createServer('.');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.info("Cline Persona Server is running");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});