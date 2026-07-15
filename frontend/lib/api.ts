import type { Incident } from "@/types/incident";

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