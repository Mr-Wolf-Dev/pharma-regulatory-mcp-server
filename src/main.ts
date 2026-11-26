import { pathToFileURL } from 'node:url';
import { runActorBatch, type PharmaBillingEvent } from './adapters/apify-actor.js';
import { createConfiguredMcpServer, createPharmaMcpHttpServer } from './adapters/mcp-server.js';
import { PharmaHttpClient } from './adapters/pharma-http-client.js';
import { runDualModeActor } from './shared/actor-runner.js';
import { createApifyBillingMeter } from './shared/billing-meter.js';

export async function main(): Promise<void> {
  const source = new PharmaHttpClient();
  const billing = createApifyBillingMeter<PharmaBillingEvent>();

  await runDualModeActor({
    runBatch: () => runActorBatch(source, billing),
    createMcpServer: () => createPharmaMcpHttpServer({ source, billing }),
    createStdioMcpServer: () => createConfiguredMcpServer({ source, billing }),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
