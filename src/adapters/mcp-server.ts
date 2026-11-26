import type { Server } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  buildOpenFda510kSearch,
  buildOpenFdaRecallSearch,
  parseClinicalTrialRecord,
  parseFda510kRecord,
  parseFdaRecallRecord,
} from '../domain/pharma-parsers.js';
import type { PharmaSource } from '../ports/pharma-source.js';
import type { BillingMeter } from '../shared/billing-meter.js';
import { createMcpHttpServer } from '../shared/mcp-http-server.js';
import type { PharmaBillingEvent } from './apify-actor.js';

export interface McpServerDependencies {
  source: PharmaSource;
  billing: BillingMeter<PharmaBillingEvent>;
}

export function createConfiguredMcpServer(deps: McpServerDependencies): McpServer {
  const server = new McpServer({
    name: 'pharma-regulatory-mcp-server',
    version: '0.1.0',
  });

  server.registerTool(
    'search_fda_recalls',
    {
      description:
        'Search official openFDA enforcement recalls for drugs, medical devices, or food.',
      inputSchema: {
        category: z.enum(['drug', 'device', 'food']).optional().describe('Recall category (default "drug")'),
        query: z.string().optional().describe('Free-text product or reason query'),
        recallingFirm: z.string().optional().describe('Recalling company/firm name'),
        classification: z.string().optional().describe('FDA recall class (e.g. "Class I", "Class II")'),
        status: z.string().optional().describe('Recall status (e.g. "Ongoing", "Terminated")'),
        maxItems: z.number().int().min(1).max(100).optional().describe('Max recalls to return (default 20)'),
      },
    },
    async ({ category, query, recallingFirm, classification, status, maxItems }) => {
      const cat = category ?? 'drug';
      const search = buildOpenFdaRecallSearch({
        query,
        sponsor: recallingFirm,
        classification,
        status,
      });
      const raw = await deps.source.searchFdaRecalls({
        category: cat,
        search,
        limit: maxItems ?? 20,
      });
      const recalls = raw.map((r) => parseFdaRecallRecord(r, cat));
      await deps.billing.charge('mcp-query', 1);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ count: recalls.length, recalls }, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    'search_fda_device_510k',
    {
      description:
        'Search official openFDA 510(k) medical device premarket clearances by device name or applicant.',
      inputSchema: {
        deviceName: z.string().optional().describe('Medical device name keyword'),
        applicant: z.string().optional().describe('Applicant / manufacturer name'),
        maxItems: z.number().int().min(1).max(100).optional().describe('Max clearances to return (default 20)'),
      },
    },
    async ({ deviceName, applicant, maxItems }) => {
      const search = buildOpenFda510kSearch({ query: deviceName, applicant });
      const raw = await deps.source.searchFda510k({ search, limit: maxItems ?? 20 });
      const clearances = raw.map(parseFda510kRecord);
      await deps.billing.charge('mcp-query', 1);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ count: clearances.length, clearances }, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    'search_clinical_trials',
    {
      description:
        'Search ClinicalTrials.gov v2 studies by condition, intervention/drug, sponsor, recruitment status, or keyword.',
      inputSchema: {
        query: z.string().optional().describe('General search term'),
        condition: z.string().optional().describe('Disease or condition (e.g. "melanoma")'),
        intervention: z.string().optional().describe('Drug or intervention (e.g. "pembrolizumab")'),
        sponsor: z.string().optional().describe('Trial sponsor name'),
        status: z.string().optional().describe('Overall status (e.g. "RECRUITING", "COMPLETED")'),
        phase: z.string().optional().describe('Trial phase filter (e.g. "PHASE3")'),
        maxItems: z.number().int().min(1).max(100).optional().describe('Max studies to return (default 20)'),
      },
    },
    async ({ query, condition, intervention, sponsor, status, phase, maxItems }) => {
      const raw = await deps.source.searchClinicalTrials({
        query,
        condition,
        intervention,
        sponsor,
        status,
        phase,
        limit: maxItems ?? 20,
      });
      const studies = raw.map(parseClinicalTrialRecord);
      await deps.billing.charge('mcp-query', 1);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ count: studies.length, studies }, null, 2),
          },
        ],
      };
    },
  );

  return server;
}

/**
 * Creates a stateless Streamable HTTP MCP server compatible with Apify Standby mode.
 */
export function createPharmaMcpHttpServer(deps: McpServerDependencies): Server {
  return createMcpHttpServer({
    serviceName: 'pharma-regulatory-mcp-server',
    createServer: () => createConfiguredMcpServer(deps),
  });
}
