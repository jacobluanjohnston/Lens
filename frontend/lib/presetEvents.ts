// presets of events to only show before and after a specific event for example mayor inauguration or world cup

export interface PresetEvent {
  id: string;
  label: string;
  baselineStart: string;
  baselineEnd: string;
  compareStart: string;
  compareEnd: string;
}

export const PRESET_EVENTS: PresetEvent[] = [
  {
    id: "lurie-inauguration",
    label: "Mayor Lurie takes office",
    baselineStart: "2024-04-01",
    baselineEnd: "2024-12-01",
    compareStart: "2025-01-01",
    compareEnd: "2025-09-01",
  },
  {
    id: "world-cup-sf-2026",
    label: "World Cup SF (2026)",
    baselineStart: "2026-01-01",
    baselineEnd: "2026-04-01",
    compareStart: "2026-05-01",
    compareEnd: "2026-07-01",
  },
];