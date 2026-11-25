import type {
  ClinicalTrialRecord,
  Fda510kRecord,
  FdaRecallRecord,
} from './pharma-schema.js';

function quoteLucene(value: string): string {
  const escaped = value.replace(/["\\]/g, '').trim();
  return `"${escaped}"`;
}

/**
 * Builds an openFDA Lucene search query for enforcement recalls.
 */
export function buildOpenFdaRecallSearch(params: {
  query?: string;
  sponsor?: string;
  classification?: string;
  status?: string;
}): string | undefined {
  const clauses: string[] = [];
  if (params.query?.trim()) {
    clauses.push(quoteLucene(params.query));
  }
  if (params.sponsor?.trim()) {
    clauses.push(`recalling_firm:${quoteLucene(params.sponsor)}`);
  }
  if (params.classification?.trim()) {
    clauses.push(`classification:${quoteLucene(params.classification)}`);
  }
  if (params.status?.trim()) {
    clauses.push(`status:${quoteLucene(params.status)}`);
  }
  return clauses.length > 0 ? clauses.join(' AND ') : undefined;
}

/**
 * Builds an openFDA Lucene search query for 510(k) device clearances.
 */
export function buildOpenFda510kSearch(params: {
  query?: string;
  applicant?: string;
}): string | undefined {
  const clauses: string[] = [];
  if (params.query?.trim()) {
    clauses.push(`device_name:${quoteLucene(params.query)}`);
  }
  if (params.applicant?.trim()) {
    clauses.push(`applicant:${quoteLucene(params.applicant)}`);
  }
  return clauses.length > 0 ? clauses.join(' AND ') : undefined;
}

export interface RawOpenFdaRecall {
  recall_number?: string;
  event_id?: string;
  recalling_firm?: string;
  product_description?: string;
  reason_for_recall?: string;
  classification?: string;
  status?: string;
  report_date?: string;
  state?: string;
  country?: string;
  distribution_pattern?: string;
}

/**
 * Normalizes an openFDA enforcement recall record.
 */
export function parseFdaRecallRecord(
  raw: RawOpenFdaRecall,
  category: 'drug' | 'device' | 'food',
): FdaRecallRecord {
  const recallNumber = raw.recall_number ?? raw.event_id ?? 'unknown';
  return {
    recordType: 'fda_recall',
    recordId: `fda-recall:${category}:${recallNumber}`,
    recallNumber,
    category,
    recallingFirm: raw.recalling_firm ?? null,
    productDescription: raw.product_description ?? null,
    reasonForRecall: raw.reason_for_recall ?? null,
    classification: raw.classification ?? null,
    status: raw.status ?? null,
    reportDate: raw.report_date ?? null,
    state: raw.state ?? null,
    country: raw.country ?? null,
    distributionPattern: raw.distribution_pattern ?? null,
  };
}

export interface RawOpenFda510k {
  k_number?: string;
  device_name?: string;
  applicant?: string;
  decision_description?: string;
  decision_date?: string;
  product_code?: string;
  advisory_committee_description?: string;
  clearance_type?: string;
}

/**
 * Normalizes an openFDA 510(k) medical device clearance record.
 */
export function parseFda510kRecord(raw: RawOpenFda510k): Fda510kRecord {
  const kNumber = raw.k_number ?? 'unknown';
  return {
    recordType: 'fda_510k',
    recordId: `fda-510k:${kNumber}`,
    kNumber,
    deviceName: raw.device_name ?? null,
    applicant: raw.applicant ?? null,
    decisionDescription: raw.decision_description ?? null,
    decisionDate: raw.decision_date ?? null,
    productCode: raw.product_code ?? null,
    advisoryCommittee: raw.advisory_committee_description ?? null,
    clearanceType: raw.clearance_type ?? null,
    url: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${encodeURIComponent(kNumber)}`,
  };
}

export interface RawClinicalTrialStudy {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
      officialTitle?: string;
      organization?: { fullName?: string; class?: string };
    };
    statusModule?: {
      overallStatus?: string;
      startDateStruct?: { date?: string };
      completionDateStruct?: { date?: string };
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: { name?: string; class?: string };
    };
    designModule?: {
      phases?: string[];
      enrollmentInfo?: { count?: number };
    };
    conditionsModule?: {
      conditions?: string[];
    };
    armsInterventionsModule?: {
      interventions?: Array<{ name?: string; type?: string }>;
    };
    contactsLocationsModule?: {
      locations?: unknown[];
    };
  };
}

/**
 * Normalizes a ClinicalTrials.gov v2 study record.
 */
export function parseClinicalTrialRecord(raw: RawClinicalTrialStudy): ClinicalTrialRecord {
  const ps = raw.protocolSection;
  const idMod = ps?.identificationModule;
  const statusMod = ps?.statusModule;
  const sponsorMod = ps?.sponsorCollaboratorsModule?.leadSponsor;
  const designMod = ps?.designModule;
  const nctId = idMod?.nctId ?? 'unknown';

  const interventions = (ps?.armsInterventionsModule?.interventions ?? [])
    .map((i) => i.name?.trim())
    .filter((v): v is string => Boolean(v));

  return {
    recordType: 'clinical_trial',
    recordId: `ct:${nctId}`,
    nctId,
    briefTitle: idMod?.briefTitle ?? null,
    officialTitle: idMod?.officialTitle ?? null,
    sponsor: sponsorMod?.name ?? idMod?.organization?.fullName ?? null,
    sponsorClass: sponsorMod?.class ?? idMod?.organization?.class ?? null,
    overallStatus: statusMod?.overallStatus ?? null,
    phases: Array.isArray(designMod?.phases) ? designMod.phases : [],
    enrollmentCount:
      typeof designMod?.enrollmentInfo?.count === 'number'
        ? designMod.enrollmentInfo.count
        : null,
    conditions: Array.isArray(ps?.conditionsModule?.conditions)
      ? ps.conditionsModule.conditions
      : [],
    interventions,
    startDate: statusMod?.startDateStruct?.date ?? null,
    completionDate: statusMod?.completionDateStruct?.date ?? null,
    locationsCount: Array.isArray(ps?.contactsLocationsModule?.locations)
      ? ps.contactsLocationsModule.locations.length
      : 0,
    url: `https://clinicaltrials.gov/study/${encodeURIComponent(nctId)}`,
  };
}
