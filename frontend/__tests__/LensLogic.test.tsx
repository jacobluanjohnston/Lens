import { render, screen } from "@testing-library/react";
import NeighborhoodPanel from "@/components/NeighborhoodPanel";
import { isProvisionalDate, metricFor } from "@/lib/lensLogic";
import type { LensData } from "@/types/lens";

const row: LensData = {
  neighborhood_id: "mission",
  neighborhood_name: "Mission",
  raw_count: 240,
  per_capita: 12.5,
  low_confidence: false,
  per_capita_applicable: true,
};

test("metricFor selects the requested Lens 1 metric", () => {
  expect(metricFor(false, 1, "raw", row)).toBe(240);
  expect(metricFor(false, 1, "per_capita", row)).toBe(12.5);
});

describe("provisional data flag", () => {
  const now = new Date("2026-07-19T12:00:00Z").getTime();
  const baseProps = {
    compareMode: false,
    compareNeighborhood: null,
    compareRanges: {
      baselineStart: "2024-04-01",
      baselineEnd: "2024-12-01",
      compareStart: "2025-01-01",
      compareEnd: "2025-09-01",
    },
    activeLens: 1 as const,
    lens1Mode: "raw" as const,
    dateRange: { start: "2026-01-01", end: "2026-07-01" },
    onFixProvisional: jest.fn(),
  };

  beforeEach(() => jest.spyOn(Date, "now").mockReturnValue(now));
  afterEach(() => jest.restoreAllMocks());

  test("renders when the end date is within 90 days", () => {
    const neighborhood = { ...row, provisional: isProvisionalDate("2026-07-01") };
    render(<NeighborhoodPanel {...baseProps} neighborhood={neighborhood} />);
    expect(screen.getByText(/reports for recent months are still being filed/i)).toBeInTheDocument();
  });

  test("does not render when the end date is outside 90 days", () => {
    const neighborhood = { ...row, provisional: isProvisionalDate("2026-04-01") };
    render(<NeighborhoodPanel {...baseProps} neighborhood={neighborhood} />);
    expect(screen.queryByText(/reports for recent months are still being filed/i)).not.toBeInTheDocument();
  });
});
