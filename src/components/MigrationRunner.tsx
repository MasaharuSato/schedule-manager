"use client";

import { useEffect } from "react";
import { runMigrationV2 } from "@/lib/migration";

export default function MigrationRunner() {
  useEffect(() => {
    runMigrationV2();
  }, []);
  return null;
}
