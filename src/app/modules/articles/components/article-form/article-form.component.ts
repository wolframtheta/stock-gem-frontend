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
import { SuppliersService } from '../../../suppliers/services/suppliers.service';
import { ConfigService } from '../../../config/services/config.service';
import { Article, CreateArticleDto } from '../../models/article.model';
import { Supplier } from '../../../suppliers/models/supplier.model';

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
  suppliers: Supplier[] = [];
  collections: { id: string; name: string }[] = [];
  articleTypes: { id: string; name: string }[] = [];
  loading = false;
  addModalVisible = false;
  addModalType: 'collection' | 'articleType' = 'collection';
  addModalName = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private articlesService: ArticlesService,
    private suppliersService: SuppliersService,
    private configService: ConfigService,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      ownReference: ['', [Validators.required, Validators.maxLength(100)]],
      supplierReference: ['', [Validators.maxLength(100)]],
      family: ['', [Validators.maxLength(100)]],
      subfamily: ['', [Validators.maxLength(100)]],
      description: ['', [Validators.required]],
      shortDescription: ['', [Validators.maxLength(255)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      pvp: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.min(0)]],
      weight: [null, [Validators.min(0)]],
      margin: [null],
      taxBase: [null, [Validators.min(0)]],
      observations: [''],
      photo: ['', [Validators.maxLength(500)]],
      barcode: ['', [Validators.maxLength(100)]],
      supplierId: [null],
      collectionId: [null],
      articleTypeId: [null],
    });
  }

  ngOnInit() {
    this.loadSuppliers();
    this.loadCollections();
    this.loadArticleTypes();

    this.articleId = this.route.snapshot.paramMap.get('id');
    if (this.articleId && this.articleId !== 'new') {
      this.loadArticle();
    }
  }

  loadSuppliers() {
    this.suppliersService.getAll().subscribe({
      next: (data) => {
        this.suppliers = data;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      },
    });
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
          supplierId: article.supplierId,
          collectionId: article.collectionId,
          articleTypeId: article.articleTypeId,
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading article:', error);
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
    const formValue = this.form.value;

    if (this.articleId && this.articleId !== 'new') {
      // Update
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
          console.error('Error updating article:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error en actualitzar l\'article',
          });
          this.loading = false;
        },
      });
    } else {
      // Create
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
          console.error('Error creating article:', error);
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
}

