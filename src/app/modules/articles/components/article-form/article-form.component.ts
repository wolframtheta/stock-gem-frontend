import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { ArticlesService } from '../../services/articles.service';
import { ConfigService } from '../../../config/services/config.service';
import { CreateArticleDto } from '../../models/article.model';
import { UploadsService } from '../../../../core/services/uploads.service';
import { resolveAssetUrl } from '../../../../core/utils/asset-url.util';

interface SizeFormRow {
  id?: string;
  label: string;
  warehouseQuantity: number;
}

@Component({
  selector: 'app-article-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SelectModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToggleSwitchModule,
    InputNumberModule,
  ],
  providers: [MessageService],
  templateUrl: './article-form.component.html',
  styleUrl: './article-form.component.css',
})
export class ArticleFormComponent implements OnInit {
  @ViewChild('sizesSectionTitle') sizesSectionTitle?: ElementRef<HTMLElement>;
  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;

  form: FormGroup;
  articleId: string | null = null;
  collections: { id: string; name: string }[] = [];
  articleTypes: { id: string; name: string }[] = [];
  loading = false;
  addModalVisible = false;
  addModalType: 'collection' | 'articleType' = 'collection';
  addModalName = '';
  photoPath: string | null = null;
  uploadingPhoto = false;
  hasSizes = false;
  sizes: SizeFormRow[] = [];
  sizesError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private articlesService: ArticlesService,
    private configService: ConfigService,
    private messageService: MessageService,
    private uploadsService: UploadsService,
  ) {
    this.form = this.fb.group({
      ownReference: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required]],
      cost: [null, [Validators.min(0)]],
      pvp: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.min(0)]],
      observations: [''],
      collectionId: [null],
      articleTypeId: [null],
    });
  }

  ngOnInit() {
    this.loadCollections();
    this.loadArticleTypes();

    this.articleId = this.route.snapshot.paramMap.get('id');
    if (this.articleId && this.articleId !== 'new') {
      this.loadArticle();
    }
  }

  get computedStockTotal(): number {
    if (!this.hasSizes) {
      return this.coerceNumber(this.form.get('stock')?.value);
    }
    return this.sizes.reduce(
      (sum, s) => sum + Math.max(0, this.coerceNumber(s.warehouseQuantity)),
      0,
    );
  }

  private coerceNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private coerceOptionalNumber(value: unknown): number | null {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private updateStockFromSizes(): void {
    if (!this.hasSizes) {
      return;
    }
    this.form
      .get('stock')
      ?.setValue(this.computedStockTotal, { emitEvent: false });
  }

  onSizeQuantityChange(): void {
    this.sizes = this.sizes.map((size) => ({
      ...size,
      warehouseQuantity: this.coerceNumber(size.warehouseQuantity),
    }));
    this.updateStockFromSizes();
  }

  get canSubmit(): boolean {
    if (this.form.invalid || this.loading) {
      return false;
    }
    if (this.hasSizes && this.sizes.length === 0) {
      return false;
    }
    return true;
  }

  loadCollections() {
    this.configService.getCollections().subscribe({
      next: (data) => {
        this.collections = data;
      },
      error: () => {},
    });
  }

  loadArticleTypes() {
    this.configService.getArticleTypes().subscribe({
      next: (data) => {
        this.articleTypes = data;
      },
      error: () => {},
    });
  }

  openAddModal(type: 'collection' | 'articleType') {
    this.addModalType = type;
    this.addModalName = '';
    this.addModalVisible = true;
  }

  closeAddModal() {
    this.addModalVisible = false;
  }

  saveAddModal() {
    const name = this.addModalName.trim();
    if (!name) return;

    const req =
      this.addModalType === 'collection'
        ? this.configService.createCollection(name)
        : this.configService.createArticleType(name);

    req.subscribe({
      next: (created) => {
        if (this.addModalType === 'collection') {
          this.collections = [...this.collections, created];
          this.form.patchValue({ collectionId: created.id });
        } else {
          this.articleTypes = [...this.articleTypes, created];
          this.form.patchValue({ articleTypeId: created.id });
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Èxit',
          detail: 'Creat',
        });
        this.closeAddModal();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error',
        });
      },
    });
  }

  loadArticle() {
    if (!this.articleId) return;

    this.loading = true;
    this.articlesService.getById(this.articleId).subscribe({
      next: (article) => {
        this.form.patchValue({
          ...article,
          collectionId: article.collectionId,
          articleTypeId: article.articleTypeId,
          cost: this.coerceOptionalNumber(article.cost),
          pvp: this.coerceNumber(article.pvp),
          stock: this.coerceNumber(article.stock),
        });
        this.hasSizes = article.hasSizes ?? false;
        this.setStockControlState(this.hasSizes);
        this.updateStockFromSizes();
        this.sizes = (article.sizes ?? []).map((s) => ({
          id: s.id,
          label: s.label,
          warehouseQuantity: this.coerceNumber(s.warehouseQuantity),
        }));
        this.photoPath =
          article.photos?.[0]?.path ?? article.photo ?? null;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: "Error en carregar l'article",
        });
        this.loading = false;
      },
    });
  }

  private setStockControlState(hasSizes: boolean) {
    const stockControl = this.form.get('stock');
    if (!stockControl) {
      return;
    }
    if (hasSizes) {
      stockControl.disable({ emitEvent: false });
    } else {
      stockControl.enable({ emitEvent: false });
    }
  }

  onHasSizesChange(checked: boolean) {
    this.hasSizes = checked;
    this.setStockControlState(checked);
    this.sizesError = null;
    if (checked) {
      const currentStock = Number(this.form.get('stock')?.value ?? 0);
      if (this.sizes.length === 0 && currentStock > 0) {
        this.sizes = [
          { label: 'Única', warehouseQuantity: currentStock },
        ];
      }
      this.updateStockFromSizes();
      setTimeout(() => this.sizesSectionTitle?.nativeElement.focus(), 0);
    }
  }

  addSizeRow() {
    this.sizes = [...this.sizes, { label: '', warehouseQuantity: 0 }];
    this.sizesError = null;
    this.updateStockFromSizes();
    setTimeout(() => {
      const index = this.sizes.length - 1;
      document.getElementById(`size-label-${index}`)?.focus();
    }, 0);
  }

  removeSizeRow(index: number) {
    const row = this.sizes[index];
    if (row.warehouseQuantity > 0) {
      return;
    }
    this.sizes = this.sizes.filter((_, i) => i !== index);
    this.sizesError = null;
    this.updateStockFromSizes();
  }

  canRemoveSize(row: SizeFormRow): boolean {
    return row.warehouseQuantity <= 0;
  }

  private focusFirstInvalidSizeField(): void {
    if (!this.hasSizes) {
      return;
    }
    const emptyIndex = this.sizes.findIndex((s) => !s.label.trim());
    if (emptyIndex >= 0) {
      document.getElementById(`size-label-${emptyIndex}`)?.focus();
      return;
    }
    document.getElementById('sizesLegend')?.focus();
  }

  private validateSizes(): boolean {
    if (!this.hasSizes) {
      this.sizesError = null;
      return true;
    }
    if (this.sizes.length === 0) {
      this.sizesError = 'Afegeix almenys una talla';
      return false;
    }
    const labels = this.sizes.map((s) => s.label.trim().toLowerCase());
    if (labels.some((l) => !l)) {
      this.sizesError = 'Totes les talles han de tenir nom';
      return false;
    }
    const unique = new Set(labels);
    if (unique.size !== labels.length) {
      this.sizesError = 'Les talles han de tenir noms únics';
      return false;
    }
    this.sizesError = null;
    return true;
  }

  onSubmit() {
    if (!this.validateSizes()) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidSizeField();
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.normalizePayload(
      this.form.getRawValue(),
      this.photoPath,
    );

    if (this.articleId && this.articleId !== 'new') {
      this.articlesService.update(this.articleId, formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Article actualitzat correctament',
          });
          this.router.navigate(['/articles']);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || "Error en actualitzar l'article",
          });
          this.loading = false;
        },
      });
    } else {
      this.articlesService.create(formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Article creat correctament',
          });
          this.router.navigate(['/articles']);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || "Error en crear l'article",
          });
          this.loading = false;
        },
      });
    }
  }

  cancel() {
    this.router.navigate(['/articles']);
  }

  openPhotoPicker() {
    this.photoInput?.nativeElement.click();
  }

  onPhotosSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.uploadPhoto(file);
    input.value = '';
  }

  uploadPhoto(file: File) {
    this.uploadingPhoto = true;
    this.uploadsService.uploadImage(file).subscribe({
      next: ({ path }) => {
        this.photoPath = path;
        this.uploadingPhoto = false;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error en pujar la imatge',
        });
        this.uploadingPhoto = false;
      },
    });
  }

  removePhoto() {
    this.photoPath = null;
  }

  photoUrl(path: string): string {
    return resolveAssetUrl(path);
  }

  private normalizePayload(
    value: Record<string, unknown>,
    photoPath: string | null,
  ): CreateArticleDto {
    const payload: CreateArticleDto = {
      ...(value as unknown as CreateArticleDto),
      cost: this.coerceOptionalNumber(value['cost']),
      pvp: this.coerceNumber(value['pvp']),
      photoPaths: photoPath ? [photoPath] : [],
      hasSizes: this.hasSizes,
    };

    if (this.hasSizes) {
      delete payload.stock;
      payload.sizes = this.sizes.map((s, index) => ({
        id: s.id,
        label: s.label.trim(),
        warehouseQuantity: Math.max(0, this.coerceNumber(s.warehouseQuantity)),
        sortOrder: index,
      }));
    } else {
      delete payload.sizes;
      payload.stock = this.coerceNumber(value['stock']);
    }

    return payload;
  }
}
