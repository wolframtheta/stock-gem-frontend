import { resolveAssetUrl } from './asset-url.util';

describe('resolveAssetUrl', () => {
  const env = process.env as Record<string, string | undefined>;

  afterEach(() => {
    delete env['NG_APP_ASSET_PUBLIC_BASE_URL'];
    delete env['NG_APP_API_URL'];
    delete env['NG_APP_UPLOAD_PUBLIC_PATH'];
  });

  it('uses NG_APP_ASSET_PUBLIC_BASE_URL for filename', () => {
    env['NG_APP_ASSET_PUBLIC_BASE_URL'] = 'https://cdn.example.com/media/images';
    expect(resolveAssetUrl('abc.png')).toBe(
      'https://cdn.example.com/media/images/abc.png',
    );
  });

  it('maps legacy path prefix to asset base via filename', () => {
    env['NG_APP_ASSET_PUBLIC_BASE_URL'] = 'https://cdn.example.com/media/images';
    expect(resolveAssetUrl('/uploads/images/abc.png')).toBe(
      'https://cdn.example.com/media/images/abc.png',
    );
  });

  it('rewrites same-origin absolute URLs when asset base is set', () => {
    env['NG_APP_ASSET_PUBLIC_BASE_URL'] = 'https://host.com/media/images';
    expect(
      resolveAssetUrl('https://host.com/uploads/images/x.png'),
    ).toBe('https://host.com/media/images/x.png');
  });

  it('passes through data URLs', () => {
    env['NG_APP_ASSET_PUBLIC_BASE_URL'] = 'https://host.com/media/images';
    const data = 'data:image/jpeg;base64,abc';
    expect(resolveAssetUrl(data)).toBe(data);
  });
});
