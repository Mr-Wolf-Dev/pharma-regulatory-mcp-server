import { describe, expect, it } from 'vitest';
import {
  buildOpenFda510kSearch,
  buildOpenFdaRecallSearch,
  parseClinicalTrialRecord,
  parseFda510kRecord,
  parseFdaRecallRecord,
} from '../../src/domain/pharma-parsers.js';
import { parseActorInput } from '../../src/domain/pharma-schema.js';

describe('pharma-schema & query builders', () => {
  it('validates actor input defaults and builds openFDA Lucene queries', () => {
    const parsed = parseActorInput({ condition: 'melanoma', maxItems: 15 });
    expect(parsed.mode).toBe('clinical_trials');
    expect(parsed.recallCategory).toBe('drug');
    expect(parsed.maxItems).toBe(15);

    expect(
      buildOpenFdaRecallSearch({
        query: 'ibuprofen',
        sponsor: 'Acme Pharma',
        classification: 'Class I',
      }),
    ).toBe('"ibuprofen" AND recalling_firm:"Acme Pharma" AND classification:"Class I"');

    expect(buildOpenFda510kSearch({ query: 'Pulse Oximeter', applicant: 'Masimo' })).toBe(
      'device_name:"Pulse Oximeter" AND applicant:"Masimo"',
    );
  });
});

describe('pharma-parsers', () => {
  it('normalizes openFDA recalls and 510(k) clearances', () => {
    const recall = parseFdaRecallRecord(
      {
        recall_number: 'D-0123-2026',
        recalling_firm: 'Acme Pharma LLC',
        product_description: 'Ibuprofen 200mg',
        reason_for_recall: 'Subpotent drug',
        classification: 'Class II',
        status: 'Ongoing',
        report_date: '20261015',
      },
      'drug',
    );
    expect(recall.recordId).toBe('fda-recall:drug:D-0123-2026');
    expect(recall.classification).toBe('Class II');

    const device = parseFda510kRecord({
      k_number: 'K250123',
      device_name: 'Smart ECG Patch',
      applicant: 'MedTech Inc',
      decision_description: 'Substantially Equivalent',
      decision_date: '2026-09-01',
      product_code: 'DPS',
    });
    expect(device.recordId).toBe('fda-510k:K250123');
    expect(device.url).toContain('K250123');
  });

  it('normalizes ClinicalTrials.gov v2 protocolSection studies', () => {
    const trial = parseClinicalTrialRecord({
      protocolSection: {
        identificationModule: {
          nctId: 'NCT02978404',
          briefTitle: 'Radiosurgery and Nivolumab in Brain Metastases',
          organization: { fullName: 'CHUM', class: 'OTHER' },
        },
        statusModule: {
          overallStatus: 'RECRUITING',
          startDateStruct: { date: '2025-01-10' },
          completionDateStruct: { date: '2027-12-31' },
        },
        sponsorCollaboratorsModule: {
          leadSponsor: { name: 'CHUM', class: 'OTHER' },
        },
        designModule: {
          phases: ['PHASE2'],
          enrollmentInfo: { count: 60 },
        },
        conditionsModule: { conditions: ['Brain Metastases', 'Melanoma'] },
        armsInterventionsModule: { interventions: [{ name: 'Nivolumab', type: 'DRUG' }] },
        contactsLocationsModule: { locations: [{ city: 'Montreal' }, { city: 'Toronto' }] },
      },
    });

    expect(trial.recordId).toBe('ct:NCT02978404');
    expect(trial.phases).toEqual(['PHASE2']);
    expect(trial.enrollmentCount).toBe(60);
    expect(trial.interventions).toEqual(['Nivolumab']);
    expect(trial.locationsCount).toBe(2);
    expect(trial.url).toBe('https://clinicaltrials.gov/study/NCT02978404');
  });
});
