import type { Incident } from "@/types/incident";
import type { CompareData } from "@/types/compare";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function fetchIncidents(
  start: string,
  end: string,
  category: string
): Promise<Incident[]> {
  const endExclusive = isoDate(
    new Date(new Date(end).getTime() + 86_400_000)
  );

  const params = new URLSearchParams({
    start,
    end: endExclusive,
  });

  if (category) {
    params.set("category", category);
  }

  const res = await fetch(`/incidents?${params}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isCompareData(value: unknown): value is CompareData {
  return (
    typeof value === "object" &&
    value !== null &&
    "neighborhood_id" in value &&
    typeof value.neighborhood_id === "string" &&
    "neighborhood_name" in value &&
    typeof value.neighborhood_name === "string" &&
    "baseline_ratio" in value &&
    isNullableNumber(value.baseline_ratio) &&
    "compare_ratio" in value &&
    isNullableNumber(value.compare_ratio) &&
    "delta" in value &&
    isNullableNumber(value.delta) &&
    "baseline_count" in value &&
    typeof value.baseline_count === "number" &&
    "compare_count" in value &&
    typeof value.compare_count === "number"
  );
}

export async function fetchCompareData(
  baselineStart: string,
  baselineEnd: string,
  compareStart: string,
  compareEnd: string
): Promise<CompareData[]> {
  const params = new URLSearchParams({
    baseline_start: baselineStart.slice(0, 7),
    baseline_end: baselineEnd.slice(0, 7),
    compare_start: compareStart.slice(0, 7),
    compare_end: compareEnd.slice(0, 7),
  });
  const response = await fetch(`/lens/compare?${params}`);
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      typeof body === "object" &&
      body !== null &&
      "detail" in body &&
      typeof body.detail === "string"
        ? body.detail
        : `Unable to load comparison (HTTP ${response.status}).`;
    throw new Error(detail);
  }

  if (!Array.isArray(body) || !body.every(isCompareData)) {
    throw new Error("Unexpected comparison response from server.");
  }

  return body;
}
