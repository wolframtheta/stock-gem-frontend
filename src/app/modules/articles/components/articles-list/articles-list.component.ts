import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, defaultIfEmpty, finalize, of } from 'rxjs';
import { ArticlesService } from '../../services/articles.service';
import { Article } from '../../models/article.model';
import { Router } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-articles-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ConfirmDialogModule,
    EmptyStateComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './articles-list.component.html',
  styleUrl: './articles-list.component.css',
})
export class ArticlesListComponent implements OnInit {
  articles = signal<Article[]>([]);
  loading = signal(false);
  searchOwnRef = '';
  searchSupplierRef = '';
  selectedArticle: Article | null = null;
  deleteDialogVisible = false;

  readonly isBotiga = computed(
    () => this.auth.currentUser()?.role === 'botiga',
  );

  constructor(
    private articlesService: ArticlesService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    public router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadArticles();
  }

  loadArticles() {
    this.loading.set(true);
    this.articlesService
      .getAll()
      .pipe(
        catchError(() => of([])),
        defaultIfEmpty([]),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (data) => this.articles.set(data ?? []),
        error: (error) => {
          console.error('Error loading articles:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error en carregar els articles',
          });
        },
      });
  }

  search() {
    if (!this.searchOwnRef && !this.searchSupplierRef) {
      this.loadArticles();
      return;
    }

    this.loading.set(true);
    this.articlesService
      .search({
        ownReference: this.searchOwnRef || undefined,
        supplierReference: this.searchSupplierRef || undefined,
      })
      .pipe(
        catchError(() => of([])),
        defaultIfEmpty([]),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (data) => this.articles.set(data ?? []),
        error: (error) => {
          console.error('Error searching articles:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error en cercar articles',
          });
        },
      });
  }

  clearSearch() {
    this.searchOwnRef = '';
    this.searchSupplierRef = '';
    this.loadArticles();
  }

  viewArticle(article: Article) {
    this.router.navigate(['/articles', article.id]);
  }

  editArticle(article: Article) {
    this.router.navigate(['/articles', article.id, 'edit']);
  }

  confirmDelete(article: Article) {
    this.selectedArticle = article;
    this.confirmationService.confirm({
      message: `Estàs segur d'eliminar l'article "${article.ownReference}"?`,
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteArticle();
      },
    });
  }

  deleteArticle() {
    if (!this.selectedArticle) return;

    this.articlesService.delete(this.selectedArticle.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Èxit',
          detail: 'Article eliminat correctament',
        });
        this.loadArticles();
        this.selectedArticle = null;
      },
      error: (error) => {
        console.error('Error deleting article:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en eliminar l\'article',
        });
      },
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ca-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  getDisplayQuantity(article: Article): number {
    return article.quantityAtFair ?? article.stock;
  }
}

