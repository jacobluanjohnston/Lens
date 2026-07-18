import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import Controls from "@/components/Controls";

const baseProps = {
  start: "2018-01-01",
  end: "2026-07-01",
  category: "",
  categories: [],
  loading: false,
  activeLens: 2 as const,
  compareMode: true,
  baselineStart: "2024-04-01",
  baselineEnd: "2024-12-01",
  compareStart: "2025-01-01",
  compareEnd: "2025-09-01",
  onStartChange: vi.fn(),
  onEndChange: vi.fn(),
  onCategoryChange: vi.fn(),
  onCompareModeChange: vi.fn(),
  onBaselineStartChange: vi.fn(),
  onBaselineEndChange: vi.fn(),
  onCompareStartChange: vi.fn(),
  onCompareEndChange: vi.fn(),
};

describe("PresetDropdown — Lurie preset wiring", () => {
  it("selecting Mayor Lurie takes office fires all four date setters with the correct dates", async () => {
    const user = userEvent.setup();
    render(<Controls {...baseProps} />);

    const select = screen.getByRole("combobox", { name: /preset events/i });
    await user.selectOptions(select, "lurie-inauguration");

    expect(baseProps.onBaselineStartChange).toHaveBeenCalledWith("2024-04-01");
    expect(baseProps.onBaselineEndChange).toHaveBeenCalledWith("2024-12-01");
    expect(baseProps.onCompareStartChange).toHaveBeenCalledWith("2025-01-01");
    expect(baseProps.onCompareEndChange).toHaveBeenCalledWith("2025-09-01");
  });
});
