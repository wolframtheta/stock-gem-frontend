import { Pipe, PipeTransform } from '@angular/core';
import { resolveAssetUrl } from '../utils/asset-url.util';

/** Resolves stored upload paths to public GET URLs (NG_APP_ASSET_PUBLIC_BASE_URL when set). */
@Pipe({
  name: 'assetUrl',
  standalone: true,
})
export class AssetUrlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return resolveAssetUrl(value);
  }
}
