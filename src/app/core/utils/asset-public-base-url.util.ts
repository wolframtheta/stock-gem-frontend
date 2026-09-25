/** Full public base URL for image GETs (<img src>), e.g. https://host/media/images */
export function assetPublicBaseUrl(): string | null {
  const raw = process.env.NG_APP_ASSET_PUBLIC_BASE_URL?.trim();
  if (!raw) {
    return null;
  }
  const normalized = raw.replace(/\/+$/, '');
  return normalized || null;
}
