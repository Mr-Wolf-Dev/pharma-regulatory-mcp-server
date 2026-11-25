import type { AddressInfo } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  runPharmaExtraction,
  type PharmaBillingEvent,
} from '../../src/adapters/apify-actor.js';
import { createPharmaMcpHttpServer } from '../../src/adapters/mcp-server.js';
import type { PharmaSource } from '../../src/ports/pharma-source.js';
import type { BillingMeter } from '../../src/shared/billing-meter.js';

const fakeSource: PharmaSource = {
  async searchFdaRecalls() {
    return [
      {
        recall_number: 'D-999',
        recalling_firm: 'Demo Pharma',
        classification: 'Class II',
        status: 'Ongoing',
      },
    ];
  },
  async searchFda510k() {
    return [
      {
        k_number: 'K250999',
        device_name: 'Demo Monitor',
        applicant: 'Demo MedTech',
      },
    ];
  },
  async searchClinicalTrials() {
    return [
      {
        protocolSection: {
          identificationModule: { nctId: 'NCT09999999', briefTitle: 'Demo Melanoma Trial' },
          statusModule: { overallStatus: 'RECRUITING' },
          sponsorCollaboratorsModule: { leadSponsor: { name: 'Demo Biotech', class: 'INDUSTRY' } },
          designModule: { phases: ['PHASE3'], enrollmentInfo: { count: 120 } },
        },
      },
    ];
  },
};

describe('Pharma Regulatory Actor & Streamable HTTP MCP Server', () => {
  const charges: Array<{ eventName: PharmaBillingEvent; count: number }> = [];
  const billing: BillingMeter<PharmaBillingEvent> = {
    async charge(eventName, count = 1) {
      charges.push({ eventName, count });
    },
  };

  let baseUrl = '';
  let closeServer: () => Promise<void>;

  beforeAll(async () => {
    const server = createPharmaMcpHttpServer({ source: fakeSource, billing });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
    closeServer = () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
  });

  afterAll(async () => {
    await closeServer();
  });

  it('runs batch extraction across all 3 modes and charges record-extracted', async () => {
    charges.length = 0;
    const pushed: unknown[] = [];

    const trials = await runPharmaExtraction(
      { mode: 'clinical_trials', condition: 'melanoma' },
      { source: fakeSource, billing, pushData: async (items) => void pushed.push(...items) },
    );
    const recalls = await runPharmaExtraction(
      { mode: 'fda_recalls', recallCategory: 'drug' },
      { source: fakeSource, billing, pushData: async (items) => void pushed.push(...items) },
    );
    const devices = await runPharmaExtraction(
      { mode: 'fda_510k', query: 'Monitor' },
      { source: fakeSource, billing, pushData: async (items) => void pushed.push(...items) },
    );

    expect(trials).toHaveLength(1);
    expect(recalls).toHaveLength(1);
    expect(devices).toHaveLength(1);
    expect(pushed).toHaveLength(3);
    expect(charges).toEqual([
      { eventName: 'record-extracted', count: 1 },
      { eventName: 'record-extracted', count: 1 },
      { eventName: 'record-extracted', count: 1 },
    ]);
  });

  it('serves /mcp/.well-known/glama.json and all 3 Pharma MCP tools', async () => {
    charges.length = 0;
    const glamaRes = await fetch(`${baseUrl}/mcp/.well-known/glama.json`);
    expect(glamaRes.status).toBe(200);

    const client = new Client({ name: 'test-client', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`));
    await client.connect(transport);

    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual([
      'search_fda_recalls',
      'search_fda_device_510k',
      'search_clinical_trials',
    ]);

    const r1 = await client.callTool({ name: 'search_fda_recalls', arguments: { category: 'drug' } });
    expect(
      JSON.parse((r1.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}').count,
    ).toBe(1);

    const r2 = await client.callTool({ name: 'search_fda_device_510k', arguments: { deviceName: 'Monitor' } });
    expect(
      JSON.parse((r2.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}').count,
    ).toBe(1);

    const r3 = await client.callTool({ name: 'search_clinical_trials', arguments: { condition: 'melanoma' } });
    expect(
      JSON.parse((r3.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}').count,
    ).toBe(1);

    expect(charges).toEqual([
      { eventName: 'mcp-query', count: 1 },
      { eventName: 'mcp-query', count: 1 },
      { eventName: 'mcp-query', count: 1 },
    ]);

    await transport.close();
  });
});
