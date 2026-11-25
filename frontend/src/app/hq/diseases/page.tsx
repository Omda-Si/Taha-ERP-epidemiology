import { Suspense } from "react";
import { HqDiseases } from "@/components/views/hq-diseases";

export default function DiseasesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading diseases…</p>}>
      <HqDiseases />
    </Suspense>
  );
}
