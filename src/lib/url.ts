/**
 * Turns the build-time page path into the public URL path.
 * With `build.format: 'file'`, Astro reports `/about.html` while the site serves `/about`.
 */
export function cleanPath(pathname: string): string {
  const path = pathname.replace(/(\/index)?\.html$/, '').replace(/\/$/, '');
  return path === '' ? '/' : path;
}
