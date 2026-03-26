import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SalesService } from '../../services/sales.service';
import { Sale, PaymentType } from '../../models/sale.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ConfirmDialogModule,
    EmptyStateComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './sales-list.component.html',
  styleUrl: './sales-list.component.css',
})
export class SalesListComponent implements OnInit {
  sales = signal<Sale[]>([]);
  loading = signal(false);
  searchTerm = '';
  selectedSale: Sale | null = null;

  constructor(
    private salesService: SalesService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.loadSales();
  }

  loadSales() {
    this.loading.set(true);
    this.salesService.getAll().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (data) => this.sales.set(data),
      error: (error) => {
        console.error('Error loading sales:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar les vendes',
        });
      },
    });
  }

  search() {
    if (!this.searchTerm.trim()) {
      this.loadSales();
      return;
    }

    this.loading.set(true);
    this.salesService
      .search({ ticketNumber: this.searchTerm })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.sales.set(data),
        error: (error) => {
          console.error('Error searching sales:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error en cercar vendes',
          });
        },
      });
  }

  clearSearch() {
    this.searchTerm = '';
    this.loadSales();
  }

  viewSale(sale: Sale) {
    this.router.navigate(['/sales', sale.id, 'edit']);
  }

  confirmDelete(sale: Sale) {
    this.selectedSale = sale;
    this.confirmationService.confirm({
      message: `Estàs segur d'eliminar la venda "${sale.ticketNumber || 'sense ticket'}"?`,
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteSale();
      },
    });
  }

  deleteSale() {
    if (!this.selectedSale) return;

    this.salesService.delete(this.selectedSale.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Èxit',
          detail: 'Venda eliminada correctament',
        });
        this.selectedSale = null;
        this.loadSales();
      },
      error: (error) => {
        console.error('Error deleting sale:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en eliminar la venda',
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ca-ES');
  }

  getPaymentTypeLabel(type: PaymentType): string {
    const labels: Record<PaymentType, string> = {
      [PaymentType.CASH]: 'Efectiu',
      [PaymentType.CARD]: 'Targeta',
      [PaymentType.TRANSFER]: 'Transferència',
      [PaymentType.CASH_VOUCHER]: 'Val de caixa',
      [PaymentType.BIZUM]: 'Bizum',
    };
    return labels[type] || type;
  }
}

