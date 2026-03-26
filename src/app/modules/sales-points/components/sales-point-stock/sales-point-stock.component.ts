import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, defaultIfEmpty, finalize, forkJoin, of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SalesPointsService } from '../../services/sales-points.service';
import { FairsService } from '../../../fairs/services/fairs.service';
import { ArticlesService } from '../../../articles/services/articles.service';
import { SalesPoint, SalesPointStockItem } from '../../models/sales-point.model';
import { Article } from '../../../articles/models/article.model';

@Component({
  selector: 'app-sales-point-stock',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SelectModule,
    DialogModule,
    ButtonModule,
    CheckboxModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService],
  templateUrl: './sales-point-stock.component.html',
  styleUrl: './sales-point-stock.component.css',
})
export class SalesPointStockComponent implements OnInit {
  salesPoint = signal<SalesPoint | null>(null);
  stockItems = signal<SalesPointStockItem[]>([]);
  articles = signal<Article[]>([]);
  salesPoints = signal<SalesPoint[]>([]);
  fairs = signal<{ id: string; name: string }[]>([]);
  loading = signal(false);
  editingValues = signal<Record<string, number>>({});
  moveModalVisible = signal(false);
  moveForm: FormGroup;
  moveSelected = signal<Record<string, number>>({});

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private salesPointsService: SalesPointsService,
    private fairsService: FairsService,
    private articlesService: ArticlesService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {
    this.moveForm = this.fb.group({
      toId: [null, Validators.required],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSalesPoint(id);
      this.loadStockAndArticles(id);
      this.salesPointsService.getAll().subscribe({
        next: (points) => this.salesPoints.set(points),
      });
      this.fairsService.getAll().subscribe({
        next: (fairs) => this.fairs.set(fairs),
      });
    }
  }

  loadSalesPoint(id: string) {
    this.salesPointsService.getById(id).subscribe({
      next: (sp) => this.salesPoint.set(sp),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: "Error en carregar el punt de venta",
        });
        this.router.navigate(['/sales-points']);
      },
    });
  }

  loadStockAndArticles(salesPointId: string) {
    this.loading.set(true);
    forkJoin({
      stock: this.salesPointsService.getStock(salesPointId).pipe(
        catchError(() => of([])),
        defaultIfEmpty([]),
      ),
      articles: this.articlesService.getAll().pipe(
        catchError(() => of([])),
        defaultIfEmpty([]),
      ),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ stock, articles }) => {
          this.stockItems.set(stock);
          this.articles.set(articles);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: "Error en carregar l'stock o els articles",
          });
        },
      });
  }

  getDisplayQuantity(item: SalesPointStockItem): number {
    const edited = this.editingValues()[item.articleId];
    return edited !== undefined ? edited : item.quantity;
  }

  incrementQuantity(item: SalesPointStockItem) {
    const current = this.getDisplayQuantity(item);
    const max = item.maxQuantity ?? item.quantity;
    if (current >= max) return;
    const next = { ...this.editingValues(), [item.articleId]: current + 1 };
    this.editingValues.set(next);
  }

  decrementQuantity(item: SalesPointStockItem) {
    const current = this.getDisplayQuantity(item);
    if (current <= 1) return;
    const next = { ...this.editingValues(), [item.articleId]: current - 1 };
    this.editingValues.set(next);
  }

  setQuantityFromInput(item: SalesPointStockItem, value: string | number) {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(num) || num < 1) return;
    const max = item.maxQuantity ?? item.quantity;
    const clamped = Math.min(Math.max(num, 1), max);
    const next = { ...this.editingValues(), [item.articleId]: clamped };
    this.editingValues.set(next);
  }

  saveQuantity(item: SalesPointStockItem) {
    const sp = this.salesPoint();
    const newQty = this.getDisplayQuantity(item);
    const max = item.maxQuantity ?? item.quantity;
    if (!sp || newQty < 1 || newQty > max) return;
    if (newQty === item.quantity) {
      const { [item.articleId]: _, ...rest } = this.editingValues();
      this.editingValues.set(rest);
      return;
    }

    this.loading.set(true);
    this.salesPointsService
      .updateStockAtPoint(sp.id, item.articleId, newQty)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Quantitat actualitzada',
          });
          const { [item.articleId]: _, ...rest } = this.editingValues();
          this.editingValues.set(rest);
          this.loadStockAndArticles(sp.id);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || "Error en actualitzar",
          });
        },
      });
  }

  confirmRemove(item: SalesPointStockItem) {
    this.confirmationService.confirm({
      message: `Eliminar "${item.article?.ownReference}" d'aquest punt? El stock anirà al magatzem.`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancel·lar',
      accept: () => this.removeItem(item),
    });
  }

  removeItem(item: SalesPointStockItem) {
    const sp = this.salesPoint();
    if (!sp) return;

    this.loading.set(true);
    this.salesPointsService
      .removeFromPoint(sp.id, item.articleId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Article eliminat del punt',
          });
          this.loadStockAndArticles(sp.id);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || "Error en eliminar",
          });
        },
      });
  }

  openMoveModal() {
    this.moveSelected.set({});
    this.moveForm.reset({ toId: null });
    this.moveModalVisible.set(true);
  }

  closeMoveModal() {
    this.moveModalVisible.set(false);
  }

  toggleMoveItem(item: SalesPointStockItem, checked: boolean) {
    const sel = { ...this.moveSelected() };
    if (checked) {
      sel[item.articleId] = item.quantity;
    } else {
      delete sel[item.articleId];
    }
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
    const sp = this.salesPoint();
    const toValue = this.moveForm.get('toId')?.value as string;
    if (!sp || !toValue) {
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

    if (toType === 'point' && toId === sp.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenció',
        detail: 'Selecciona un destí diferent',
      });
      return;
    }

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
      .moveStock('point', sp.id, toType, toId, items)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Stock mogut correctament',
          });
          this.closeMoveModal();
          this.loadStockAndArticles(sp.id);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || "Error en moure l'stock",
          });
        },
      });
  }

  moveTargetOptions = computed(() => {
    const sp = this.salesPoint();
    const points = this.salesPoints();
    const fairsList = this.fairs();
    if (!sp) return [];
    const pointOpts = points
      .filter((p) => p.id !== sp.id)
      .map((p) => ({ id: p.id, label: `🏪 ${p.name} (${p.code})` }));
    const fairOpts = fairsList.map((f) => ({
      id: `fair:${f.id}`,
      label: `📅 Fira: ${f.name}`,
    }));
    return [...pointOpts, ...fairOpts];
  });
}
