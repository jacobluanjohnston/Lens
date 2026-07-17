"use client";

import dynamic from "next/dynamic";
import type { LensData } from "@/types/lens";
import type { CompareData } from "@/types/compare";

const ClientMap = dynamic(() => import("./ClientMap"), {
  ssr: false,
});

interface MapProps {
  activeLens: 1 | 2 | 3;
  lens1Mode: "raw" | "per_capita";
  lensData: LensData[];
  compareMode: boolean;
  compareData: CompareData[];
  fetchId: number;
  onSelectNeighborhood: (lens: LensData | null) => void;
  onSelectCompareNeighborhood: (comparison: CompareData | null) => void;
}

export default function Map({
  activeLens,
  lens1Mode,
  lensData,
  compareMode,
  compareData,
  fetchId,
  onSelectNeighborhood,
  onSelectCompareNeighborhood,
}: MapProps) {
  return (
    <ClientMap
      activeLens={activeLens}
      lens1Mode={lens1Mode}
      lensData={lensData}
      compareMode={compareMode}
      compareData={compareData}
      fetchId={fetchId}
      onSelectNeighborhood={onSelectNeighborhood}
      onSelectCompareNeighborhood={onSelectCompareNeighborhood}
    />
  );
}
