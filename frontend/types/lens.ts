export interface LensData {
  neighborhood_id: string;
  neighborhood_name: string;

  // Lens 1 fields
  raw_count?: number | null;
  per_capita?: number | null;
  reference_raw?: number | null;
  reference_per_capita?: number | null;

  // Lens 2 fields
  value?: number | null;
  reference_value?: number | null;

  // Lens 3 fields (not yet implemented)
  clearance_rate?: number | null;
  reference_rate?: number | null;
  gap?: number | null;

  // Common
  low_confidence: boolean;
  per_capita_applicable: boolean;

  // Computed frontend-side: end date within 90 days of today
  provisional?: boolean;
}