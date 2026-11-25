import { Actor } from 'apify';
import {
  buildOpenFda510kSearch,
  buildOpenFdaRecallSearch,
  parseClinicalTrialRecord,
  parseFda510kRecord,
  parseFdaRecallRecord,
} from '../domain/pharma-parsers.js';
import { parseActorInput, type PharmaOutputRecord } from '../domain/pharma-schema.js';
import type { PharmaSource } from '../ports/pharma-source.js';
import type { BillingMeter } from '../shared/billing-meter.js';

export type PharmaBillingEvent = 'record-extracted' | 'mcp-query';

export interface ExtractionDependencies {
  source: PharmaSource;
  billing: BillingMeter<PharmaBillingEvent>;
  pushData: (items: PharmaOutputRecord[]) => Promise<void>;
}

/**
 * Executes batch extraction for ClinicalTrials.gov v2, openFDA recalls, or openFDA 510(k) clearances.
 */
export async function runPharmaExtraction(
  rawInput: unknown,
  deps: ExtractionDependencies,
): Promise<PharmaOutputRecord[]> {
  const input = parseActorInput(rawInput);
  let records: PharmaOutputRecord[];

  if (input.mode === 'fda_recalls') {
    const search = buildOpenFdaRecallSearch({
      query: input.query,
      sponsor: input.sponsor,
      classification: input.classification,
      status: input.status,
    });
    const raw = await deps.source.searchFdaRecalls({
      category: input.recallCategory,
      search,
      limit: input.maxItems,
    });
    records = raw.map((r) => parseFdaRecallRecord(r, input.recallCategory));
  } else if (input.mode === 'fda_510k') {
    const search = buildOpenFda510kSearch({
      query: input.query,
      applicant: input.sponsor,
    });
    const raw = await deps.source.searchFda510k({
      search,
      limit: input.maxItems,
    });
    records = raw.map(parseFda510kRecord);
  } else {
    const raw = await deps.source.searchClinicalTrials({
      query: input.query,
      condition: input.condition,
      intervention: input.intervention,
      sponsor: input.sponsor,
      status: input.status,
      phase: input.phase,
      limit: input.maxItems,
    });
    records = raw.map(parseClinicalTrialRecord);
  }

  if (records.length > 0) {
    await deps.pushData(records);
    await deps.billing.charge('record-extracted', records.length);
  }

  return records;
}

/**
 * Runs the standard batch Apify Actor extraction mode.
 */
export async function runActorBatch(
  source: PharmaSource,
  billing: BillingMeter<PharmaBillingEvent>,
): Promise<void> {
  const input = await Actor.getInput();
  await runPharmaExtraction(input, {
    source,
    billing,
    pushData: async (items) => {
      await Actor.pushData(items);
    },
  });
}
