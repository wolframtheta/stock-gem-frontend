import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FairsService, Fair, FairStatistics } from '../../services/fairs.service';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import type { TimeSeriesResponse } from '../../../statistics/services/statistics.service';

const CHART_COLORS = [
  'rgba(139, 92, 246, 0.8)',
  'rgba(99, 102, 241, 0.8)',
  'rgba(168, 85, 247, 0.8)',
  'rgba(124, 58, 237, 0.8)',
  'rgba(109, 40, 217, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(234, 88, 12, 0.8)',
];

const MONTH_LABELS: Record<string, string> = {
  '01': 'Gen', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Oct', '11': 'Nov', '12': 'Des',
};

@Component({
  selector: 'app-fair-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ChartModule, ButtonModule],
  templateUrl: './fair-detail.component.html',
  styleUrl: './fair-detail.component.css',
})
export class FairDetailComponent implements OnInit {
  fair = signal<Fair | null>(null);
  stats = signal<FairStatistics | null>(null);
  loading = signal(false);
  from = signal<string>('');
  to = signal<string>('');

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
    plugins: {
      legend: { display: true, position: 'bottom' as const },
    },
    scales: {
      x: {
        title: { display: false },
        ticks: { maxRotation: 45, minRotation: 0 },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: '€' },
      },
    },
  };

  composturasChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: true, position: 'bottom' as const },
    },
    scales: {
      x: {
        title: { display: false },
        ticks: { maxRotation: 45, minRotation: 0 },
      },
      y: {
        beginAtZero: true,
        title: { display: false },
      },
    },
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fairsService: FairsService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/fairs']);
      return;
    }
    this.fairsService.getById(id).subscribe({
      next: (f) => {
        this.fair.set(f);
        this.from.set(f.startDate);
        this.to.set(f.endDate);
        this.loadStats(id);
        this.loadCharts(id);
      },
      error: () => this.router.navigate(['/fairs']),
    });
  }

  loadStats(fairId: string) {
    this.fairsService
      .getStatistics(fairId)
      .subscribe({ next: (s) => this.stats.set(s) });
  }

  loadCharts(fairId: string) {
    const from = this.from() || undefined;
    const to = this.to() || undefined;
    this.loading.set(true);
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
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  refreshCharts() {
    const f = this.fair();
    if (f) this.loadCharts(f.id);
  }

  private toLineChartData(ts: TimeSeriesResponse | null) {
    if (!ts || ts.series.length === 0) return null;
    const labels = this.formatPeriodLabels(ts.periods);
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

  private formatPeriodLabels(periods: string[]): string[] {
    return periods.map((p) => {
      const [y, m, d] = p.split('-');
      if (d) return `${d}/${m}`;
      return m?.length === 2 ? `${MONTH_LABELS[m] ?? m} ${y}` : p;
    });
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('ca-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(v ?? 0);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('ca-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
    const countSeries = ts.series.find((s) => s.label === 'Quantitat');
    return countSeries
      ? countSeries.data.reduce((a, b) => a + b, 0)
      : 0;
  }
}
