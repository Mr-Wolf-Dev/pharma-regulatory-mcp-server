import type {
  RawClinicalTrialStudy,
  RawOpenFda510k,
  RawOpenFdaRecall,
} from '../domain/pharma-parsers.js';

export interface RecallQuery {
  category: 'drug' | 'device' | 'food';
  search?: string;
  limit?: number;
}

export interface Device510kQuery {
  search?: string;
  limit?: number;
}

export interface ClinicalTrialQuery {
  query?: string;
  condition?: string;
  intervention?: string;
  sponsor?: string;
  status?: string;
  phase?: string;
  limit?: number;
}

export interface PharmaSource {
  searchFdaRecalls(query: RecallQuery): Promise<RawOpenFdaRecall[]>;
  searchFda510k(query: Device510kQuery): Promise<RawOpenFda510k[]>;
  searchClinicalTrials(query: ClinicalTrialQuery): Promise<RawClinicalTrialStudy[]>;
}
