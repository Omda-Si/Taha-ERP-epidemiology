let hqBundleStarted = false;
let deskBundleStarted = false;

export function prefetchHqRoute() {
  if (hqBundleStarted) return;
  hqBundleStarted = true;
  void import("@/components/hq-shell");
}

/** One chunk: router + all three desk pages — avoids re-compile when switching tabs. */
export function prefetchAllDeskPages() {
  if (deskBundleStarted) return;
  deskBundleStarted = true;
  void import("@/components/desk-router");
}

export function prefetchDeskRoute() {
  prefetchAllDeskPages();
}

export function prefetchRoute(href: string) {
  const path = href.split("?")[0] ?? href;
  if (path === "/hq" || path.startsWith("/hq/")) prefetchHqRoute();
  if (path === "/desk" || path.startsWith("/desk/")) prefetchAllDeskPages();
}