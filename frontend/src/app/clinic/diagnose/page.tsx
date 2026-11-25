import { Suspense } from "react";
import { DiagnoseForm } from "@/components/views/diagnose-form";

export default function DiagnosePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Opening the chart…</p>}>
      <DiagnoseForm />
    </Suspense>
  );
}
