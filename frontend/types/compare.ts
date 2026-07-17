export interface CompareData {
  neighborhood_id: string;
  neighborhood_name: string;
  baseline_ratio: number | null;
  compare_ratio: number | null;
  delta: number | null;
  compare_count: number;
}
