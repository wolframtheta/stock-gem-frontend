import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ArticlesService } from '../../modules/articles/services/articles.service';
import { Article } from '../../modules/articles/models/article.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-stock-general',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    InputTextModule,
    EmptyStateComponent,
  ],
  templateUrl: './stock-general.component.html',
  styleUrl: './stock-general.component.css',
})
export class StockGeneralComponent implements OnInit {
  articles = signal<Article[]>([]);
  loading = signal(false);
  searchOwnRef = '';
  searchSupplierRef = '';

  constructor(private articlesService: ArticlesService) {}

  ngOnInit() {
    this.loadArticles();
  }

  loadArticles() {
    this.loading.set(true);
    this.articlesService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.articles.set(data ?? []),
        error: () => this.articles.set([]),
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
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.articles.set(data ?? []),
        error: () => this.articles.set([]),
      });
  }

  clearSearch() {
    this.searchOwnRef = '';
    this.searchSupplierRef = '';
    this.loadArticles();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ca-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  getQuantity(article: Article): number {
    return article.quantityAtFair ?? article.stock;
  }
}
