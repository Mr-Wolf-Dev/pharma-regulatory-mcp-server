import { gotScraping } from 'got-scraping';
import type {
  RawClinicalTrialStudy,
  RawOpenFda510k,
  RawOpenFdaRecall,
} from '../domain/pharma-parsers.js';
import type {
  ClinicalTrialQuery,
  Device510kQuery,
  PharmaSource,
  RecallQuery,
} from '../ports/pharma-source.js';
import { fetchJsonWithRetry } from '../shared/http-client.js';

async function fetchOpenFdaResults<T>(url: string): Promise<T[]> {
  const response = await gotScraping({
    url,
    http2: false,
    timeout: { request: 15000 },
    throwHttpErrors: false,
    headers: { Accept: 'application/json' },
  });

  if (response.statusCode === 404) {
    return [];
  }
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`HTTP ${response.statusCode} from ${url}`);
  }
  const parsed = JSON.parse(response.body) as { results?: T[] };
  return Array.isArray(parsed.results) ? parsed.results : [];
}

/**
 * HTTP-only client for keyless openFDA and ClinicalTrials.gov v2 APIs.
 */
export class PharmaHttpClient implements PharmaSource {
  async searchFdaRecalls(query: RecallQuery): Promise<RawOpenFdaRecall[]> {
    const params = new URLSearchParams({
      limit: String(Math.max(1, Math.min(100, query.limit ?? 20))),
    });
    if (query.search) {
      params.set('search', query.search);
    }
    const url = `https://api.fda.gov/${query.category}/enforcement.json?${params.toString()}`;
    return fetchOpenFdaResults<RawOpenFdaRecall>(url);
  }

  async searchFda510k(query: Device510kQuery): Promise<RawOpenFda510k[]> {
    const params = new URLSearchParams({
      limit: String(Math.max(1, Math.min(100, query.limit ?? 20))),
    });
    if (query.search) {
      params.set('search', query.search);
    }
    const url = `https://api.fda.gov/device/510k.json?${params.toString()}`;
    return fetchOpenFdaResults<RawOpenFda510k>(url);
  }

  async searchClinicalTrials(query: ClinicalTrialQuery): Promise<RawClinicalTrialStudy[]> {
    const params = new URLSearchParams({
      pageSize: String(Math.max(1, Math.min(100, query.limit ?? 20))),
    });
    if (query.query) params.set('query.term', query.query);
    if (query.condition) params.set('query.cond', query.condition);
    if (query.intervention) params.set('query.intr', query.intervention);
    if (query.sponsor) params.set('query.spons', query.sponsor);
    if (query.status) params.set('filter.overallStatus', query.status.toUpperCase());
    if (query.phase) {
      params.set('query.term', [query.query, query.phase].filter(Boolean).join(' '));
    }

    const url = `https://clinicaltrials.gov/api/v2/studies?${params.toString()}`;
    const res = await fetchJsonWithRetry<{ studies?: RawClinicalTrialStudy[] }>(url);
    return Array.isArray(res.studies) ? res.studies : [];
  }
}
