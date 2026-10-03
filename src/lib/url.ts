/**
 * Prefixes a path with the configured base ('/portfolio/').
 * Every internal link and asset path goes through this one function,
 * so moving to a custom domain only needs a config change.
 *
 *   url()                 -> '/portfolio/'
 *   url('#work')          -> '/portfolio/#work'
 *   url('work/data-integrity/') -> '/portfolio/work/data-integrity/'
 */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return prefix + path.replace(/^\/+/, '');
}

/** Absolute URL (with origin), for canonical links, Open Graph and RSS. */
export function absoluteUrl(path: string, site: URL | undefined): string {
  if (!site) return url(path);
  return new URL(url(path), site).toString();
}
