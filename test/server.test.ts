import { createServer } from '@src/server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('createServer', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    // Create temp directory
    tempDir = await fs.mkdtemp(join(tmpdir(), 'persona-server-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should create a server instance with correct configuration', async () => {
    const { server } = createServer(tempDir);
    
    expect(server).toBeInstanceOf(Server);
  });
});
