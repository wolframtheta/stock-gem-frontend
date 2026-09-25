const DEFAULT_UPLOAD_PUBLIC_PATH = '/uploads/images';

export function uploadPublicPath(): string {
  const raw = process.env.NG_APP_UPLOAD_PUBLIC_PATH?.trim();
  if (!raw) {
    return DEFAULT_UPLOAD_PUBLIC_PATH;
  }
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  const normalized = withLeading.replace(/\/+$/, '');
  return normalized || DEFAULT_UPLOAD_PUBLIC_PATH;
}
