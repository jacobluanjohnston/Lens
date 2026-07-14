"use client";

import dynamic from "next/dynamic";
import type { LensData } from "@/types/lens";

const ClientMap = dynamic(() => import("./ClientMap"), {
  ssr: false,
});

interface MapProps {
  activeLens: 1 | 2 | 3;
  lensData: LensData[];
  fetchId: number;
  onSelectNeighborhood: (lens: LensData | null) => void;
}

export default function Map({
  activeLens,
  lensData,
  fetchId,
  onSelectNeighborhood,
}: MapProps) {
  return (
    <ClientMap
      activeLens={activeLens}
      lensData={lensData}
      fetchId={fetchId}
      onSelectNeighborhood={onSelectNeighborhood}
    />
  );
}
