"use client";

import { useEffect } from "react";
import { useAvailabilityStore } from "../store/useAvailabilityStore";

export function AvailabilityInitializer() {
  const load = useAvailabilityStore((s) => s.load);

  useEffect(() => {
    load(null);
  }, [load]);

  return null;
}
