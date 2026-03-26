import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { SalesPointsService } from '../../services/sales-points.service';
import { SalesPoint } from '../../models/sales-point.model';
import { Router } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-sales-points-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ConfirmDialogModule,
    EmptyStateComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './sales-points-list.component.html',
  styleUrl: './sales-points-list.component.css',
})
export class SalesPointsListComponent implements OnInit {
  salesPoints = signal<SalesPoint[]>([]);
  loading = signal(false);

  constructor(
    private salesPointsService: SalesPointsService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.loadSalesPoints();
  }

  loadSalesPoints() {
    this.loading.set(true);
    this.salesPointsService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.salesPoints.set(data),
        error: (error) => {
          console.error('Error loading sales points:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: "Error en carregar els punts de venta",
          });
        },
      });
  }

  editSalesPoint(salesPoint: SalesPoint) {
    this.router.navigate(['/sales-points', salesPoint.id, 'edit']);
  }

  manageStock(salesPoint: SalesPoint) {
    this.router.navigate(['/sales-points', salesPoint.id, 'stock']);
  }

  confirmDelete(salesPoint: SalesPoint) {
    this.confirmationService.confirm({
      message: `Estàs segur d'eliminar el punt de venta "${salesPoint.name}"?`,
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteSalesPoint(salesPoint);
      },
    });
  }

  deleteSalesPoint(salesPoint: SalesPoint) {
    this.salesPointsService.delete(salesPoint.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Èxit',
          detail: 'Punt de venta eliminat correctament',
        });
        this.loadSalesPoints();
      },
      error: (error) => {
        console.error('Error deleting sales point:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || "Error en eliminar el punt de venta",
        });
      },
    });
  }
}
