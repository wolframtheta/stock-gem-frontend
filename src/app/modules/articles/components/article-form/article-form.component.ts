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

interface VariantFormRow {
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
  @ViewChild('variantsSectionTitle') variantsSectionTitle?: ElementRef<HTMLElement>;
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
  hasVariants = false;
  variants: VariantFormRow[] = [];
  variantsError: string | null = null;

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
      name: ['', [Validators.required]],
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
    if (!this.hasVariants) {
      return this.coerceNumber(this.form.get('stock')?.value);
    }
    return this.variants.reduce(
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

  private updateStockFromVariants(): void {
    if (!this.hasVariants) {
      return;
    }
    this.form
      .get('stock')
      ?.setValue(this.computedStockTotal, { emitEvent: false });
  }

  onVariantQuantityChange(): void {
    this.variants = this.variants.map((variant) => ({
      ...variant,
      warehouseQuantity: this.coerceNumber(variant.warehouseQuantity),
    }));
    this.updateStockFromVariants();
  }

  get canSubmit(): boolean {
    if (this.form.invalid || this.loading) {
      return false;
    }
    if (this.hasVariants && this.variants.length === 0) {
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
        this.hasVariants = article.hasVariants ?? false;
        this.setStockControlState(this.hasVariants);
        this.updateStockFromVariants();
        this.variants = (article.variants ?? []).map((s) => ({
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

  private setStockControlState(hasVariants: boolean) {
    const stockControl = this.form.get('stock');
    if (!stockControl) {
      return;
    }
    if (hasVariants) {
      stockControl.disable({ emitEvent: false });
    } else {
      stockControl.enable({ emitEvent: false });
    }
  }

  onHasVariantsChange(checked: boolean) {
    this.hasVariants = checked;
    this.setStockControlState(checked);
    this.variantsError = null;
    if (checked) {
      const currentStock = Number(this.form.get('stock')?.value ?? 0);
      if (this.variants.length === 0 && currentStock > 0) {
        this.variants = [
          { label: 'Única', warehouseQuantity: currentStock },
        ];
      }
      this.updateStockFromVariants();
      setTimeout(() => this.variantsSectionTitle?.nativeElement.focus(), 0);
    }
  }

  addVariantRow() {
    this.variants = [...this.variants, { label: '', warehouseQuantity: 0 }];
    this.variantsError = null;
    this.updateStockFromVariants();
    setTimeout(() => {
      const index = this.variants.length - 1;
      document.getElementById(`size-label-${index}`)?.focus();
    }, 0);
  }

  removeVariantRow(index: number) {
    const row = this.variants[index];
    if (row.warehouseQuantity > 0) {
      return;
    }
    this.variants = this.variants.filter((_, i) => i !== index);
    this.variantsError = null;
    this.updateStockFromVariants();
  }

  canRemoveVariant(row: VariantFormRow): boolean {
    return row.warehouseQuantity <= 0;
  }

  private focusFirstInvalidVariantField(): void {
    if (!this.hasVariants) {
      return;
    }
    const emptyIndex = this.variants.findIndex((s) => !s.label.trim());
    if (emptyIndex >= 0) {
      document.getElementById(`size-label-${emptyIndex}`)?.focus();
      return;
    }
    document.getElementById('variantsLegend')?.focus();
  }

  private validateVariants(): boolean {
    if (!this.hasVariants) {
      this.variantsError = null;
      return true;
    }
    if (this.variants.length === 0) {
      this.variantsError = 'Afegeix almenys una variant';
      return false;
    }
    const labels = this.variants.map((s) => s.label.trim().toLowerCase());
    if (labels.some((l) => !l)) {
      this.variantsError = 'Totes les variants han de tenir nom';
      return false;
    }
    const unique = new Set(labels);
    if (unique.size !== labels.length) {
      this.variantsError = 'Les variants han de tenir noms únics';
      return false;
    }
    this.variantsError = null;
    return true;
  }

  onSubmit() {
    if (!this.validateVariants()) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidVariantField();
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
      hasVariants: this.hasVariants,
    };

    if (this.hasVariants) {
      delete payload.stock;
      payload.variants = this.variants.map((s, index) => ({
        id: s.id,
        label: s.label.trim(),
        warehouseQuantity: Math.max(0, this.coerceNumber(s.warehouseQuantity)),
        sortOrder: index,
      }));
    } else {
      delete payload.variants;
      payload.stock = this.coerceNumber(value['stock']);
    }

    return payload;
  }
}
