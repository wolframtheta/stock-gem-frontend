import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ArticlesService } from '../../services/articles.service';
import { ConfigService } from '../../../config/services/config.service';
import { CreateArticleDto } from '../../models/article.model';
import { UploadsService } from '../../../../core/services/uploads.service';
import { resolveAssetUrl } from '../../../../core/utils/asset-url.util';

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
  ],
  providers: [MessageService],
  templateUrl: './article-form.component.html',
  styleUrl: './article-form.component.css',
})
export class ArticleFormComponent implements OnInit {
  form: FormGroup;
  articleId: string | null = null;
  collections: { id: string; name: string }[] = [];
  articleTypes: { id: string; name: string }[] = [];
  loading = false;
  addModalVisible = false;
  addModalType: 'collection' | 'articleType' = 'collection';
  addModalName = '';
  photoPaths: string[] = [];
  uploadingPhoto = false;

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
        });
        this.photoPaths =
          article.photos?.map((p) => p.path) ??
          (article.photo ? [article.photo] : []);
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar l\'article',
        });
        this.loading = false;
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.normalizePayload(this.form.value, this.photoPaths);

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
            detail: error.error?.message || 'Error en actualitzar l\'article',
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
            detail: error.error?.message || 'Error en crear l\'article',
          });
          this.loading = false;
        },
      });
    }
  }

  cancel() {
    this.router.navigate(['/articles']);
  }

  onPhotosSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) {
      return;
    }
    Array.from(files).forEach((file) => this.uploadPhoto(file));
    input.value = '';
  }

  uploadPhoto(file: File) {
    this.uploadingPhoto = true;
    this.uploadsService.uploadImage(file).subscribe({
      next: ({ path }) => {
        this.photoPaths = [...this.photoPaths, path];
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

  removePhoto(index: number) {
    this.photoPaths = this.photoPaths.filter((_, i) => i !== index);
  }

  photoUrl(path: string): string {
    return resolveAssetUrl(path);
  }

  private normalizePayload(
    value: Record<string, unknown>,
    photoPaths: string[],
  ): CreateArticleDto {
    const rawCost = value['cost'];
    const cost =
      rawCost === '' || rawCost === null || rawCost === undefined
        ? null
        : Number(rawCost);
    return {
      ...(value as unknown as CreateArticleDto),
      cost,
      photoPaths,
    };
  }
}
