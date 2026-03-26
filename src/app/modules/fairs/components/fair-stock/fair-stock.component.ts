import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { catchError, finalize, of } from 'rxjs';
import { forkJoin } from 'rxjs';
import {
  FairsService,
  Fair,
  FairStockItem,
  FairStatistics,
} from '../../services/fairs.service';
import { SalesPointsService } from '../../../sales-points/services/sales-points.service';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ChartModule } from 'primeng/chart';
import type { TimeSeriesResponse } from '../../../statistics/services/statistics.service';

const CHART_COLORS = [
  'rgba(139, 92, 246, 0.8)',
  'rgba(99, 102, 241, 0.8)',
  'rgba(168, 85, 247, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(234, 88, 12, 0.8)',
];

const MONTH_LABELS: Record<string, string> = {
  '01': 'Gen', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Oct', '11': 'Nov', '12': 'Des',
};

@Component({
  selector: 'app-fair-stock',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DialogModule,
    CheckboxModule,
    SelectModule,
    ButtonModule,
    ConfirmDialogModule,
    ChartModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './fair-stock.component.html',
  styleUrl: './fair-stock.component.css',
})
export class FairStockComponent implements OnInit {
  fair = signal<Fair | null>(null);
  stockItems = signal<FairStockItem[]>([]);
  salesPoints = signal<{ id: string; name: string; code: string }[]>([]);
  fairs = signal<Fair[]>([]);
  loading = signal(false);
  moveModalVisible = signal(false);
  moveToId = signal<string | null>(null);
  moveSelected = signal<Record<string, number>>({});
  stats = signal<FairStatistics | null>(null);
  finalizing = signal(false);
  reopening = signal(false);
  chartsLoading = signal(false);
  salesTimeSeries = signal<TimeSeriesResponse | null>(null);
  articlesTimeSeries = signal<TimeSeriesResponse | null>(null);
  composturasTimeSeries = signal<TimeSeriesResponse | null>(null);

  salesChartData = computed(() => this.toLineChartData(this.salesTimeSeries()));
  articlesChartData = computed(() => this.toLineChartData(this.articlesTimeSeries()));
  composturasChartData = computed(() =>
    this.toLineChartData(this.composturasTimeSeries()),
  );

  lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: { legend: { display: true, position: 'bottom' as const } },
    scales: {
      x: { ticks: { maxRotation: 45, minRotation: 0 } },
      y: { beginAtZero: true, title: { display: true, text: '€' } },
    },
  };

  composturasChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: { legend: { display: true, position: 'bottom' as const } },
    scales: {
      x: { ticks: { maxRotation: 45, minRotation: 0 } },
      y: { beginAtZero: true },
    },
  };

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fairsService: FairsService,
    private salesPointsService: SalesPointsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadFair(id);
      this.loadStockAndArticles(id);
      this.loadStatistics(id);
      this.salesPointsService.getAll().subscribe({
        next: (pts) => this.salesPoints.set(pts),
      });
      this.fairsService.getAll().subscribe({
        next: (f) => this.fairs.set(f),
      });
    }
  }

  loadCharts(fairId: string, from?: string, to?: string) {
    this.chartsLoading.set(true);
    forkJoin({
      sales: this.fairsService.getSalesTimeSeries(fairId, from, to, 'week'),
      articles: this.fairsService.getArticlesTimeSeries(fairId, from, to, 'week'),
      composturas: this.fairsService.getComposturasTimeSeries(
        fairId,
        from,
        to,
        'week',
      ),
    }).subscribe({
      next: (data) => {
        this.salesTimeSeries.set(data.sales);
        this.articlesTimeSeries.set(data.articles);
        this.composturasTimeSeries.set(data.composturas);
        this.chartsLoading.set(false);
      },
      error: () => this.chartsLoading.set(false),
    });
  }

  private toLineChartData(ts: TimeSeriesResponse | null) {
    if (!ts || ts.series.length === 0) return null;
    const labels = ts.periods.map((p) => {
      const [y, m, d] = p.split('-');
      if (d) return `${d}/${m}`;
      return m?.length === 2 ? `${MONTH_LABELS[m] ?? m} ${y}` : p;
    });
    const datasets = ts.series.map((s, i) => ({
      label: s.label,
      data: s.data,
      borderColor: CHART_COLORS[i % CHART_COLORS.length].replace('0.8', '1'),
      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
      fill: false,
      tension: 0.3,
    }));
    return { labels, datasets };
  }

  totalForSeries(ts: TimeSeriesResponse | null): number {
    if (!ts) return 0;
    return ts.series.reduce(
      (sum, s) => sum + s.data.reduce((a, b) => a + b, 0),
      0,
    );
  }

  composturasCount(): number {
    const ts = this.composturasTimeSeries();
    if (!ts) return 0;
    const s = ts.series.find((x) => x.label === 'Quantitat');
    return s ? s.data.reduce((a, b) => a + b, 0) : 0;
  }

  loadStatistics(fairId: string) {
    this.fairsService
      .getStatistics(fairId)
      .pipe(catchError(() => of(null)))
      .subscribe({ next: (s) => this.stats.set(s) });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ca-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value ?? 0);
  }

  confirmFinalize() {
    const f = this.fair();
    if (!f) return;
    this.confirmationService.confirm({
      message: `Vols finalitzar la fira "${f.name}"? Tot el stock restant tornarà al magatzem principal.`,
      header: 'Finalitzar fira',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Finalitzar',
      rejectLabel: 'Cancel·lar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.finalizeFair(),
    });
  }

  finalizeFair() {
    const f = this.fair();
    if (!f) return;
    this.finalizing.set(true);
    this.fairsService.finalize(f.id).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Fira finalitzada',
          detail: res.message,
        });
        this.loadStockAndArticles(f.id);
        this.loadStatistics(f.id);
        this.loadCharts(f.id, f.startDate, f.endDate);
        this.finalizing.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error',
        });
        this.finalizing.set(false);
      },
    });
  }

  reopenFair() {
    const f = this.fair();
    if (!f) return;
    this.reopening.set(true);
    this.fairsService.reopen(f.id).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Fira reoberta',
          detail: res.message,
        });
        this.loadStockAndArticles(f.id);
        this.loadStatistics(f.id);
        this.loadCharts(f.id, f.startDate, f.endDate);
        this.reopening.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error',
        });
        this.reopening.set(false);
      },
    });
  }

  loadFair(id: string) {
    this.fairsService.getById(id).subscribe({
      next: (f) => {
        this.fair.set(f);
        this.loadCharts(id, f.startDate, f.endDate);
      },
      error: () => this.router.navigate(['/fairs']),
    });
  }

  loadStockAndArticles(fairId: string) {
    this.loading.set(true);
    this.fairsService
      .getStock(fairId)
      .pipe(catchError(() => of([])))
      .subscribe({
        next: (stock) => {
          this.stockItems.set(stock);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  moveTargetOptions = computed(() => {
    const f = this.fair();
    const points = this.salesPoints();
    const fairsList = this.fairs();
    if (!f) return [];
    const pointOpts = points.map((p) => ({
      id: p.id,
      label: `🏪 ${p.name} (${p.code})`,
    }));
    const fairOpts = fairsList
      .filter((fa) => fa.id !== f.id)
      .map((fa) => ({
        id: `fair:${fa.id}`,
        label: `📅 Fira: ${fa.name}`,
      }));
    return [...pointOpts, ...fairOpts];
  });

  openMoveModal() {
    this.moveSelected.set({});
    this.moveToId.set(null);
    this.moveModalVisible.set(true);
  }

  closeMoveModal() {
    this.moveModalVisible.set(false);
  }

  toggleMoveItem(item: FairStockItem, checked: boolean) {
    const sel = { ...this.moveSelected() };
    if (checked) sel[item.articleId] = item.quantity;
    else delete sel[item.articleId];
    this.moveSelected.set(sel);
  }

  setMoveQuantity(articleId: string, qty: number) {
    const sel = { ...this.moveSelected() };
    if (qty > 0) sel[articleId] = qty;
    else delete sel[articleId];
    this.moveSelected.set(sel);
  }

  getMoveQuantity(articleId: string): number {
    return this.moveSelected()[articleId] ?? 0;
  }

  isMoveSelected(articleId: string): boolean {
    return articleId in this.moveSelected();
  }

  submitMove() {
    const f = this.fair();
    const toValue = this.moveToId();
    if (!f || !toValue) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenció',
        detail: 'Selecciona un destí',
      });
      return;
    }
    const [toType, toId] = toValue.startsWith('fair:')
      ? (['fair', toValue.slice(5)] as const)
      : (['point', toValue] as const);
    const items = Object.entries(this.moveSelected())
      .filter(([, qty]) => qty > 0)
      .map(([articleId, quantity]) => ({ articleId, quantity }));
    if (items.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenció',
        detail: 'Selecciona almenys un article',
      });
      return;
    }
    this.loading.set(true);
    this.salesPointsService
      .moveStock('fair', f.id, toType, toId, items)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Stock mogut correctament',
          });
          this.closeMoveModal();
          this.loadStockAndArticles(f.id);
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
}
