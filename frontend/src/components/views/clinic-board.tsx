"use client";

import { Link } from "@/components/link";
import { DEMO_DAY } from "@/lib/catalog";
import { useClinic } from "@/lib/clinic-store";
import { formatFee, formatWhen, khartoumDate } from "@/lib/format";
import { PageHeader, Panel, Stat, StatusPill, TextLink } from "@/components/ui";

export function ClinicBoard() {
  const { state } = useClinic();
  const today = state.appointments
    .filter((row) => khartoumDate(row.schedule) === DEMO_DAY)
    .sort((a, b) => a.schedule.localeCompare(b.schedule));
  const pending = state.queue.filter((row) => row.status === "pending").length;
  const failed = state.queue.filter((row) => row.status === "failed").length;
  const rejected = state.queue.filter((row) => row.status === "rejected").length;
  const recent = [...state.diagnoses].sort((a, b) => b.diagnosedAt.localeCompare(a.diagnosedAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Clinic day · 25 Nov 2026"
        title="Board"
        lede="Reception and physicians work here. Saving a chart never waits on headquarters. Only a diagnosis enters the anonymized queue."
        actions={
          <Link href="/clinic/diagnose" className="rounded-md bg-clinic px-3 py-2 text-sm font-medium text-white hover:bg-clinic-deep">
            Record diagnosis
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="On the board" value={today.length} note="Appointments dated 25 Nov" />
        <Stat label="Pending" value={pending} note="Waiting on the worker" />
        <Stat label="Failed" value={failed} note="Transport errors, will retry" />
        <Stat label="Rejected" value={rejected} note="4xx. No automatic retry" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Today"
          action={<TextLink href="/clinic/appointments">All appointments</TextLink>}
        >
          <ul className="divide-y divide-line">
            {today.map((row) => {
              const person = state.patients.find((patient) => patient.id === row.patientId);
              const doctor = state.doctors.find((item) => item.id === row.doctorId);
              return (
                <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <div>
                    <Link href={`/clinic/patients/${row.patientId}`} className="font-medium hover:underline">
                      {person?.name}
                    </Link>
                    <p className="text-sm text-muted">
                      {formatWhen(row.schedule)} · {doctor?.name} · {row.reason}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-muted">{row.state.replace("_", " ")}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="Recent diagnoses" action={<TextLink href="/clinic/sync">Queue</TextLink>}>
          <ul className="space-y-3">
            {recent.map((row) => {
              const person = state.patients.find((patient) => patient.id === row.patientId);
              const queued = state.queue.find((item) => item.diagnosisId === row.id);
              return (
                <li key={row.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{row.diagnosisName}</p>
                    <p className="text-xs text-muted">
                      {person?.name} · {row.diagnosisCode}
                    </p>
                  </div>
                  {queued ? <StatusPill status={queued.status} /> : <span className="text-xs text-muted">not queued</span>}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
      <p className="text-xs text-muted">
        Fees on today&apos;s book: {formatFee(today.reduce((sum, row) => sum + row.fee, 0))}. Billing never syncs.
      </p>
    </div>
  );
}
