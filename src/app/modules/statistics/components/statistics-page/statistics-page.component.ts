import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { StatisticsService } from '../../services/statistics.service';
import type { TimeSeriesResponse } from '../../services/statistics.service';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';

const CHART_COLORS = [
  'rgba(139, 92, 246, 0.8)',
  'rgba(99, 102, 241, 0.8)',
  'rgba(168, 85, 247, 0.8)',
  'rgba(124, 58, 237, 0.8)',
  'rgba(109, 40, 217, 0.8)',
  'rgba(88, 28, 135, 0.8)',
  'rgba(67, 56, 202, 0.8)',
  'rgba(79, 70, 229, 0.8)',
  'rgba(129, 140, 248, 0.8)',
  'rgba(165, 180, 252, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(5, 150, 105, 0.8)',
  'rgba(34, 197, 94, 0.8)',
  'rgba(22, 163, 74, 0.8)',
  'rgba(234, 88, 12, 0.8)',
];

const MONTH_LABELS: Record<string, string> = {
  '01': 'Gen', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Oct', '11': 'Nov', '12': 'Des',
};

@Component({
  selector: 'app-statistics-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ChartModule, ButtonModule],
  templateUrl: './statistics-page.component.html',
  styleUrl: './statistics-page.component.css',
})
export class StatisticsPageComponent implements OnInit {
  from = signal<string>('');
  to = signal<string>('');
  loading = signal(false);

  storeTimeSeries = signal<TimeSeriesResponse | null>(null);
  articleTimeSeries = signal<TimeSeriesResponse | null>(null);
  fairTimeSeries = signal<TimeSeriesResponse | null>(null);
  manufacturingTimeSeries = signal<TimeSeriesResponse | null>(null);

  storeChartData = computed(() => this.toLineChartData(this.storeTimeSeries()));
  articleChartData = computed(() => this.toLineChartData(this.articleTimeSeries()));
  fairChartData = computed(() => this.toLineChartData(this.fairTimeSeries()));
  manufacturingChartData = computed(() =>
    this.toLineChartData(this.manufacturingTimeSeries()),
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

  manufacturingChartOptions = {
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
        title: { display: true, text: 'Unitats' },
      },
    },
  };

  constructor(private stats: StatisticsService) {}

  ngOnInit() {
    const year = new Date().getFullYear();
    this.from.set(`${year}-01-01`);
    this.to.set(`${year}-12-31`);
    this.loadAll();
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
      const [y, m] = p.split('-');
      return m?.length === 2 ? `${MONTH_LABELS[m] ?? m} ${y}` : p;
    });
  }

  loadAll() {
    const from = this.from() || undefined;
    const to = this.to() || undefined;
    this.loading.set(true);
    forkJoin({
      store: this.stats.getSalesByStoreTimeSeries(from, to),
      article: this.stats.getSalesByArticleTimeSeries(from, to),
      fair: this.stats.getSalesByFairTimeSeries(from, to),
      manufacturing: this.stats.getManufacturingTimeSeries(from, to),
    }).subscribe({
      next: (data) => {
        this.storeTimeSeries.set(data.store);
        this.articleTimeSeries.set(data.article);
        this.fairTimeSeries.set(data.fair);
        this.manufacturingTimeSeries.set(data.manufacturing);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('ca-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(v);
  }

  totalForSeries(ts: TimeSeriesResponse | null): number {
    if (!ts) return 0;
    return ts.series.reduce(
      (sum, s) => sum + s.data.reduce((a, b) => a + b, 0),
      0,
    );
  }
}
