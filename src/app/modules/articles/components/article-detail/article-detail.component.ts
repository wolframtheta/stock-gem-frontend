import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, defaultIfEmpty, finalize, of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ChartModule } from 'primeng/chart';
import { ArticlesService } from '../../services/articles.service';
import { SalesPointsService } from '../../../sales-points/services/sales-points.service';
import {
  Article,
  StockBreakdown,
  ArticlePriceHistory,
  ArticleStockHistory,
} from '../../models/article.model';
import { SalesPoint } from '../../../sales-points/models/sales-point.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    ChartModule,
  ],
  providers: [MessageService],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.css',
})
export class ArticleDetailComponent implements OnInit {
  article = signal<Article | null>(null);
  stockBreakdown = signal<StockBreakdown | null>(null);
  priceHistory = signal<ArticlePriceHistory[]>([]);
  stockHistory = signal<ArticleStockHistory[]>([]);
  salesPointsByCode = signal<Map<string, string>>(new Map());
  loading = signal(false);
  addStockVisible = false;
  addStockQty = 1;
  addStockDate = new Date().toISOString().split('T')[0];
  stockHistoryYear = new Date().getFullYear();

  readonly isBotiga = computed(
    () => this.auth.currentUser()?.role === 'botiga',
  );

  manufacturingByDay = computed(() => {
    const history = this.stockHistory();
    const byDate = new Map<string, number>();
    for (const h of history) {
      const date = h.recordedAt.split('T')[0];
      byDate.set(date, (byDate.get(date) ?? 0) + h.quantityAdded);
    }
    return Array.from(byDate.entries())
      .map(([date, quantity]) => ({ date, quantity }))
      .sort((a, b) => a.date.localeCompare(b.date));
  });

  manufacturingChartData = computed(() => {
    const byDay = this.manufacturingByDay();
    if (byDay.length === 0) return null;
    return {
      labels: byDay.map((d) => d.date),
      datasets: [
        {
          label: 'Quantitat fabricada',
          data: byDay.map((d) => d.quantity),
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
        },
      ],
    };
  });

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private articlesService: ArticlesService,
    private salesPointsService: SalesPointsService,
    private messageService: MessageService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.loadSalesPoints();
      this.loadArticle(id);
      this.loadStockBreakdown(id);
      this.loadPriceHistory(id);
      this.loadStockHistory(id);
    }
  }

  loadSalesPoints() {
    this.salesPointsService
      .getAll()
      .pipe(
        catchError(() => of([])),
        defaultIfEmpty([]),
      )
      .subscribe({
        next: (points: SalesPoint[]) => {
          const map = new Map<string, string>();
          points.forEach((p) => map.set(p.code, p.name));
          this.salesPointsByCode.set(map);
        },
      });
  }

  loadArticle(id: string) {
    this.loading.set(true);
    this.articlesService
      .getById(id)
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (a) => this.article.set(a ?? null),
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: "Error en carregar l'article",
          });
          this.router.navigate(['/articles']);
        },
      });
  }

  loadStockBreakdown(id: string) {
    this.articlesService
      .getStockBreakdown(id)
      .pipe(catchError(() => of(null)))
      .subscribe({
        next: (b) => this.stockBreakdown.set(b ?? null),
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: "Error en carregar l'stock",
          });
        },
      });
  }

  getSalesPointName(code: string, fallback?: string): string {
    if (code === 'FIRA') return fallback ?? 'Fira';
    return this.salesPointsByCode().get(code) ?? fallback ?? code ?? '-';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ca-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  loadPriceHistory(id: string) {
    this.articlesService.getPriceHistory(id).subscribe({
      next: (data) => this.priceHistory.set(data),
      error: () => {},
    });
  }

  loadStockHistory(id: string) {
    this.articlesService
      .getStockHistory(id, this.stockHistoryYear)
      .subscribe({
        next: (data) => this.stockHistory.set(data),
        error: () => {},
      });
  }

  openAddStock() {
    this.addStockQty = 1;
    this.addStockDate = new Date().toISOString().split('T')[0];
    this.addStockVisible = true;
  }

  addStockQtyChange(delta: number) {
    this.addStockQty = Math.max(1, this.addStockQty + delta);
  }

  submitAddStock() {
    const a = this.article();
    if (!a || this.addStockQty < 1) return;

    this.loading.set(true);
    this.articlesService
      .addStock(a.id, this.addStockQty, this.addStockDate)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (updated) => {
          this.article.set(updated);
          this.loadStockBreakdown(a.id);
          this.loadStockHistory(a.id);
          this.addStockVisible = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Stock afegit',
          });
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

  onStockHistoryYearChange() {
    const a = this.article();
    if (a) this.loadStockHistory(a.id);
  }
}
