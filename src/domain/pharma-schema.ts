import { z } from 'zod';

export const ActorInputSchema = z.object({
  mode: z.enum(['clinical_trials', 'fda_recalls', 'fda_510k']).default('clinical_trials'),
  query: z.string().trim().optional(),
  condition: z.string().trim().optional(),
  intervention: z.string().trim().optional(),
  sponsor: z.string().trim().optional(),
  recallCategory: z.enum(['drug', 'device', 'food']).default('drug'),
  classification: z.string().trim().optional(),
  status: z.string().trim().optional(),
  phase: z.string().trim().optional(),
  maxItems: z.number().int().min(1).max(100).default(20),
});

export type ActorInput = z.infer<typeof ActorInputSchema>;

export function parseActorInput(raw: unknown): ActorInput {
  return ActorInputSchema.parse(raw ?? {});
}

export interface FdaRecallRecord {
  recordType: 'fda_recall';
  recordId: string;
  recallNumber: string;
  category: 'drug' | 'device' | 'food';
  recallingFirm: string | null;
  productDescription: string | null;
  reasonForRecall: string | null;
  classification: string | null;
  status: string | null;
  reportDate: string | null;
  state: string | null;
  country: string | null;
  distributionPattern: string | null;
}

export interface Fda510kRecord {
  recordType: 'fda_510k';
  recordId: string;
  kNumber: string;
  deviceName: string | null;
  applicant: string | null;
  decisionDescription: string | null;
  decisionDate: string | null;
  productCode: string | null;
  advisoryCommittee: string | null;
  clearanceType: string | null;
  url: string;
}

export interface ClinicalTrialRecord {
  recordType: 'clinical_trial';
  recordId: string;
  nctId: string;
  briefTitle: string | null;
  officialTitle: string | null;
  sponsor: string | null;
  sponsorClass: string | null;
  overallStatus: string | null;
  phases: string[];
  enrollmentCount: number | null;
  conditions: string[];
  interventions: string[];
  startDate: string | null;
  completionDate: string | null;
  locationsCount: number;
  url: string;
}

export type PharmaOutputRecord = FdaRecallRecord | Fda510kRecord | ClinicalTrialRecord;
