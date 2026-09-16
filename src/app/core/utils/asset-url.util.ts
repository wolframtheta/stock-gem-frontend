/** Resolves API-relative upload paths to absolute URLs for <img src>. */
export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) {
    return '';
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const apiUrl = process.env.NG_APP_API_URL ?? 'http://localhost:3500/api';
  const origin = apiUrl.replace(/\/api\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
