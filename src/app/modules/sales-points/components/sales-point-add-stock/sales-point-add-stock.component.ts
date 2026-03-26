import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { SalesPointsService } from '../../services/sales-points.service';
import { SalesPoint } from '../../models/sales-point.model';

interface AddStockRow {
  articleId: string;
  ownReference: string;
  description: string;
  quantityAvailable: number;
  quantityAtDestination: number;
  selected: boolean;
  quantityToAdd: number;
}

@Component({
  selector: 'app-sales-point-add-stock',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CheckboxModule,
    ButtonModule,
  ],
  providers: [MessageService],
  templateUrl: './sales-point-add-stock.component.html',
  styleUrl: './sales-point-add-stock.component.css',
})
export class SalesPointAddStockComponent implements OnInit {
  salesPoint = signal<SalesPoint | null>(null);
  rows = signal<AddStockRow[]>([]);
  loading = signal(false);
  submitting = signal(false);
  isWarehouse = signal(false);

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private salesPointsService: SalesPointsService,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadData(id);
    }
  }

  loadData(destinationId: string) {
    this.loading.set(true);
    this.salesPointsService
      .getById(destinationId)
      .pipe(
        catchError(() => {
          this.router.navigate(['/sales-points']);
          return of(null);
        }),
      )
      .subscribe({
        next: (sp) => {
          if (sp) {
            this.salesPoint.set(sp);
            this.loadAvailableForAdd(destinationId);
          } else {
            this.loading.set(false);
          }
        },
        error: () => this.loading.set(false),
      });
  }

  loadAvailableForAdd(destinationId: string) {
    this.loading.set(true);
    this.salesPointsService
      .getDefaultWarehouse()
      .pipe(catchError(() => of(null)))
      .subscribe({
        next: (wh) => {
          this.isWarehouse.set(!!wh && wh.id === destinationId);
          this.salesPointsService
            .getAvailableForAdd(destinationId)
            .pipe(
              catchError(() => of([])),
              finalize(() => this.loading.set(false)),
            )
            .subscribe({
              next: (items) => {
                const rows: AddStockRow[] = items.map((it) => ({
                  articleId: it.articleId,
                  ownReference: it.ownReference,
                  description: it.description,
                  quantityAvailable: it.quantityAvailable,
                  quantityAtDestination: it.quantityAtDestination,
                  selected: false,
                  quantityToAdd: 0,
                }));
                this.rows.set(rows);
              },
            });
        },
      });
  }

  toggleRow(row: AddStockRow) {
    row.selected = !row.selected;
    if (!row.selected) row.quantityToAdd = 0;
    else row.quantityToAdd = Math.min(1, row.quantityAvailable);
    this.rows.update((r) => [...r]);
  }

  setQuantityToAdd(row: AddStockRow, value: number) {
    const clamped = Math.max(
      0,
      Math.min(value, row.quantityAvailable),
    );
    row.quantityToAdd = clamped;
    if (clamped > 0) row.selected = true;
    this.rows.update((r) => [...r]);
  }

  getSelectedItems(): { articleId: string; quantity: number }[] {
    return this.rows()
      .filter((r) => r.selected && r.quantityToAdd > 0)
      .map((r) => ({
        articleId: r.articleId,
        quantity: r.quantityAtDestination + r.quantityToAdd,
      }));
  }

  hasAnySelected(): boolean {
    return this.getSelectedItems().length > 0;
  }

  hasAnyOverMax(): boolean {
    return this.rows().some(
      (r) =>
        r.selected &&
        r.quantityToAdd > 0 &&
        r.quantityToAdd > r.quantityAvailable,
    );
  }

  onSubmit() {
    const sp = this.salesPoint();
    const items = this.getSelectedItems();
    if (!sp || items.length === 0) return;

    this.submitting.set(true);
    this.salesPointsService
      .assignStockBatch(sp.id, items)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Stock assignat correctament',
          });
          this.router.navigate(['/sales-points', sp.id, 'stock']);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || "Error en assignar l'stock",
          });
        },
      });
  }
}
