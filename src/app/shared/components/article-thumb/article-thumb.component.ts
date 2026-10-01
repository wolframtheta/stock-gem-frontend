import { Component, input } from '@angular/core';
import { AssetUrlPipe } from '../../../core/pipes/asset-url.pipe';

/** Article photo thumbnail + name, used in stock listings. */
@Component({
  selector: 'app-article-thumb',
  standalone: true,
  imports: [AssetUrlPipe],
  template: `
    <span class="article-thumb">
      @if (photo()) {
        <img class="article-thumb-img" [src]="photo() | assetUrl" [alt]="name()" loading="lazy" />
      } @else {
        <span class="article-thumb-img article-thumb-placeholder"><i class="pi pi-image"></i></span>
      }
      <span class="article-thumb-name">{{ name() || '-' }}</span>
    </span>
  `,
  styles: `
    .article-thumb { display: inline-flex; align-items: center; gap: 0.75rem; }
    .article-thumb-img { width: 48px; height: 48px; flex: none; border-radius: 6px; object-fit: cover; background: #f1f1f1; }
    .article-thumb-placeholder { display: inline-flex; align-items: center; justify-content: center; color: #aaa; }
    .article-thumb-name { font-weight: 500; }
  `,
})
export class ArticleThumbComponent {
  photo = input<string | null | undefined>(null);
  name = input<string | null | undefined>('');
}
