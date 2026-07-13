export interface LensData {
  neighborhood_id: string;
  neighborhood_name: string;

  raw_count: number | null;
  per_capita: number | null;

  reference_raw: number;
  reference_per_capita: number;

  value: number | null;
  reference_value: number;

  clearance_rate: number | null;
  reference_rate: number;

  gap: number | null;

  low_confidence: boolean;
  per_capita_applicable: boolean;
  provisional: boolean;
}