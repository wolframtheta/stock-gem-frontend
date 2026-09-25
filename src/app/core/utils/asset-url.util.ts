import { uploadPublicPath } from './upload-public-path.util';

/** Resolves stored filename or legacy public path to absolute URL for <img src>. */
export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) {
    return '';
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const apiUrl = process.env.NG_APP_API_URL ?? 'http://localhost:3500/api';
  const origin = apiUrl.replace(/\/api\/?$/, '');
  const publicPath = uploadPublicPath();
  const urlPath = path.startsWith('/')
    ? path
    : `${publicPath}/${path.replace(/^\/+/, '')}`;
  return `${origin}${urlPath}`;
}
