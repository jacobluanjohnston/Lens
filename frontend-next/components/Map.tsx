"use client";

import dynamic from "next/dynamic";
import type { LensData } from "@/types/lens";

const ClientMap = dynamic(() => import("./ClientMap"), {
  ssr: false,
});

interface MapProps {
  activeLens: 1 | 2 | 3;
  // selectedNeighborhood: LensData | null;
  onSelectNeighborhood: (lens: LensData | null) => void;
}

export default function Map({
  activeLens,
  // selectedNeighborhood,
  onSelectNeighborhood,
}: MapProps) {
  return (
    <ClientMap
      activeLens={activeLens}
      // selectedNeighborhood={selectedNeighborhood}
      onSelectNeighborhood={onSelectNeighborhood}
    />
  );
}