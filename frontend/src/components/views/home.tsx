"use client";

import { useEffect } from "react";
import { Link } from "@/components/link";
import { Logo, Mark } from "@/components/logo";
import { prefetchAllDeskPages, prefetchHqRoute } from "@/lib/prefetch-route";

const NAV = [
  { href: "/desk/diagnose", label: "Record diagnosis", short: "Diagnose" },
  { href: "/desk/sync", label: "Sync queue", short: "Queue" },
  { href: "/desk/signals", label: "Disease signals", short: "Signals" },
] as const;

const BOARD = [
  { id: "apt_ibrahim_today", name: "Ibrahim Osman", doctor: "Dr. Hassan Idris", reason: "Vomiting", when: "08:00", state: "Completed" },
  { id: "apt_omar_today", name: "Omar Siddig", doctor: "Dr. Leila Nur", reason: "Fever, three days", when: "09:00", state: "Scheduled" },
  { id: "apt_sara_today", name: "Sara Khalid", doctor: "Dr. Leila Nur", reason: "Typhoid review", when: "09:30", state: "Checked in" },
];

export function HomeView() {
  useEffect(() => {
    prefetchAllDeskPages();
    const runHq = () => prefetchHqRoute();
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(runHq);
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(runHq, 0);
    return () => window.clearTimeout(t);
  }, []);


  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col">
        <header className="shrink-0 px-4 pt-3 pb-2 sm:relative sm:flex sm:h-[3.75rem] sm:items-center sm:px-6 sm:pb-0 sm:pt-0 lg:px-8">
          <Link href="/" className="relative z-10 shrink-0" title="Home" aria-label="Taha Clinic home">
            <Logo />
          </Link>
          <nav
            className="pointer-events-none mt-3 flex items-center justify-center gap-4 text-[12px] font-medium text-[#64748b] sm:absolute sm:inset-y-0 sm:left-6 sm:right-6 sm:mt-0 sm:gap-6 sm:text-[13px] lg:left-8 lg:right-8"
            aria-label="Quick links"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="pointer-events-auto whitespace-nowrap transition hover:text-clinic"
                title={item.label}
              >
                <span className="md:hidden">{item.short}</span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            ))}
          </nav>
        </header>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(11rem,0.42fr)] overflow-hidden lg:grid-cols-2 lg:grid-rows-1">
          <section className="flex min-h-0 flex-col justify-center overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="w-full max-w-xl">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-clinic">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-clinic" />
                Epidemiological data sync
              </p>
              <h1 className="mt-4 text-[clamp(1.75rem,4.2vw+1rem,3rem)] font-bold leading-[1.12] tracking-[-0.03em] text-[#0f172a]">
                Disease signal for headquarters.
                <span className="mt-1 block text-[#1e293b]">Names stay local.</span>
              </h1>
              <p className="mt-5 max-w-[30rem] text-[15px] leading-7 text-[#64748b]">
                The workstation keeps the chart when the link is down. A saved diagnosis queues ten anonymized fields.
                Headquarters watches disease and region, and never receives a name, phone, national ID, or street.
              </p>
              <div className="mt-7 flex w-full max-w-[30rem] flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/clinic"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-clinic px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,86,255,0.28)] hover:bg-clinic-deep sm:w-auto"
                >
                  Open the clinic
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/hq"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-[#e8edf3] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc] sm:w-auto"
                >
                  Surveillance desk
                </Link>
              </div>
              <p className="mt-7 flex max-w-[30rem] items-start gap-2 text-xs leading-5 text-[#94a3b8]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c5ccd6]" />
                Taha Clinic Khartoum. Identifiers stay inside the facility.
              </p>
            </div>
          </section>

          <section className="relative min-h-0 overflow-hidden bg-[linear-gradient(185deg,#07122e_0%,#123a86_34%,#0b6ec8_62%,#14d0dc_100%)]">
            <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-cyan/30 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky/25 blur-3xl" />
            <div className="absolute top-16 right-[-12%] bottom-[-18%] left-8 overflow-hidden rounded-tl-2xl border border-white/50 bg-[#f7f8fa] shadow-[0_24px_60px_rgba(4,12,32,0.35)] sm:left-12">
              <div className="flex h-full">
                <aside className="hidden w-[148px] shrink-0 border-r border-[#e6eaf0] bg-white px-3 py-4 sm:block">
                  <span className="flex items-center gap-2 px-1">
                    <Mark className="h-6 w-6" />
                    <span className="text-[11px] font-semibold leading-tight text-ink">
                      Taha Clinic
                      <span className="block font-medium text-[#8b93a3]">Board</span>
                    </span>
                  </span>
                  <p className="mt-5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa3b2]">Menu</p>
                  <ul className="mt-2 space-y-1 text-[13px]">
                    <li className="flex items-center justify-between rounded-md bg-[#f3f5f8] px-2 py-1.5 font-medium text-ink">
                      Board
                    </li>
                    <li className="flex items-center justify-between px-2 py-1.5 text-[#5c677a]">
                      Patients
                    </li>
                    <li className="flex items-center justify-between px-2 py-1.5 text-[#5c677a]">
                      Queue
                      <span className="rounded-full bg-clay px-1.5 text-[10px] font-semibold text-white">2</span>
                    </li>
                    <li className="px-2 py-1.5 text-[#5c677a]">Headquarters</li>
                  </ul>
                </aside>
                <div className="min-w-0 flex-1 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-ink">Clinic board</h2>
                      <p className="text-[11px] text-[#8b93a3]">Wednesday, 25 Nov 2026 · Khartoum</p>
                    </div>
                    <p className="hidden text-right text-[11px] text-[#8b93a3] sm:block">
                      2 rows waiting
                      <span className="block">to reach headquarters</span>
                    </p>
                  </div>
                  <p className="mt-4 text-[11px] font-medium text-[#8b93a3]">Today</p>
                  <div className="mt-2 grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[11px] text-[#8b93a3]">On the board</p>
                      <p className="text-3xl font-semibold tracking-tight text-ink">3</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e6ebf2]">
                        <div className="h-full w-2/3 rounded-full bg-clinic" />
                      </div>
                      <p className="mt-1 text-[10px] text-[#8b93a3]">Appointments dated 25 Nov</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#8b93a3]">Sync queue</p>
                      <p className="text-3xl font-semibold tracking-tight text-ink">
                        2 <span className="text-sm font-semibold text-clay">held</span>
                      </p>
                      <p className="mt-2 text-[10px] text-[#8b93a3]">Pending and failed. The chart is already saved.</p>
                    </div>
                  </div>
                  <div className="mt-5 overflow-hidden rounded-md border border-[#e6eaf0] bg-white">
                    <div className="grid grid-cols-[1fr_0.9fr_auto] gap-2 border-b border-[#eef1f5] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa3b2]">
                      <span>Patient</span>
                      <span>Clinician</span>
                      <span>Visit</span>
                    </div>
                    {BOARD.map((row) => (
                      <div key={row.id} className="grid grid-cols-[1fr_0.9fr_auto] items-center gap-2 border-b border-[#f2f4f7] px-3 py-2.5 last:border-0">
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold text-ink">{row.name}</span>
                          <span className="block truncate text-[11px] text-[#8b93a3]">{row.when} · {row.reason}</span>
                        </span>
                        <span className="truncate text-[12px] text-[#5c677a]">{row.doctor}</span>
                        <span className="text-[11px] font-medium text-clinic">{row.state}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-28 left-3 z-10 w-[240px] rounded-xl border border-[#eceff3] bg-white p-3 shadow-[0_16px_40px_rgba(7,18,46,0.18)] sm:top-36 sm:left-14">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-clay">Outbreak flag</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-ink">Influenza · Khartoum</p>
              <p className="mt-1 text-[12px] leading-5 text-[#5c677a]">The last 14 days pulled away from the 14 days before.</p>
              <p className="mt-2 text-[11px] font-semibold text-clinic">1 active flag</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
