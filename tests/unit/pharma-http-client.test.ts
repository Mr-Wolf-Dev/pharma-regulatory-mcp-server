import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PharmaHttpClient } from '../../src/adapters/pharma-http-client.js';

const server = setupServer();

describe('PharmaHttpClient', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('queries openFDA recalls, 510(k), ClinicalTrials v2, and maps openFDA 404 to []', async () => {
    server.use(
      http.get('https://api.fda.gov/drug/enforcement.json', () =>
        HttpResponse.json({ results: [{ recall_number: 'D-1', recalling_firm: 'Acme' }] }),
      ),
      http.get('https://api.fda.gov/device/510k.json', () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'No matches found!' } }, { status: 404 }),
      ),
      http.get('https://clinicaltrials.gov/api/v2/studies', () =>
        HttpResponse.json({
          studies: [{ protocolSection: { identificationModule: { nctId: 'NCT000001' } } }],
        }),
      ),
    );

    const client = new PharmaHttpClient();
    const recalls = await client.searchFdaRecalls({ category: 'drug', limit: 5 });
    const devices = await client.searchFda510k({ search: 'device_name:"Nonexistent"', limit: 5 });
    const trials = await client.searchClinicalTrials({ condition: 'melanoma', limit: 5 });

    expect(recalls).toHaveLength(1);
    expect(devices).toEqual([]);
    expect(trials[0]?.protocolSection?.identificationModule?.nctId).toBe('NCT000001');
  });
});
