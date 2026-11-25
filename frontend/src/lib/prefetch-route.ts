let hqBundleStarted = false;

export function prefetchHqRoute() {
  if (hqBundleStarted) return;
  hqBundleStarted = true;
  void import("@/components/hq-shell");
}

export function prefetchRoute(href: string) {
  const path = href.split("?")[0] ?? href;
  if (path === "/hq" || path.startsWith("/hq/")) prefetchHqRoute();
}