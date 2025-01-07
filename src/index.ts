import { createServer } from "@src/server.js";
import { logger } from "@src/logger.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function runServer() {
  logger.setLevel("info");
  const { server } = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Cline Persona Server is running");
}

runServer().catch((error) => {
  logger.error("Fatal error running server:", error);
  process.exit(1);
});