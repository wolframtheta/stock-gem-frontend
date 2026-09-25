import { assetPublicBaseUrl } from './asset-public-base-url.util';
import { uploadPublicPath } from './upload-public-path.util';

function storedUploadFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (trimmed.includes('/')) {
    const parts = trimmed.replace(/^\/+/, '').split('/');
    return parts[parts.length - 1] ?? trimmed;
  }
  return trimmed;
}

/** Resolves stored filename or legacy public path to absolute URL for <img src>. */
export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) {
    return '';
  }
  if (path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    const base = assetPublicBaseUrl();
    if (!base) {
      return path;
    }
    try {
      const configured = new URL(base);
      const current = new URL(path);
      if (current.origin !== configured.origin) {
        return path;
      }
      const filename = storedUploadFilename(current.pathname);
      return filename ? `${base.replace(/\/+$/, '')}/${filename}` : path;
    } catch {
      return path;
    }
  }

  const base = assetPublicBaseUrl();
  if (base) {
    const filename = storedUploadFilename(path);
    return filename ? `${base}/${filename}` : '';
  }

  const apiUrl = process.env.NG_APP_API_URL ?? 'http://localhost:3500/api';
  const origin = apiUrl.replace(/\/api\/?$/, '');
  const publicPath = uploadPublicPath();
  const urlPath = path.startsWith('/')
    ? path
    : `${publicPath}/${path.replace(/^\/+/, '')}`;
  return `${origin}${urlPath}`;
}
