import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SuppliersService } from '../../services/suppliers.service';
import { Supplier } from '../../models/supplier.model';
import { Router } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ConfirmDialogModule,
    EmptyStateComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './suppliers-list.component.html',
  styleUrl: './suppliers-list.component.css',
})
export class SuppliersListComponent implements OnInit {
  suppliers: Supplier[] = [];
  loading = false;
  searchText = '';

  constructor(
    private suppliersService: SuppliersService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading = true;
    this.suppliersService.getAll().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar els proveïdors',
        });
        this.loading = false;
      },
    });
  }

  search() {
    if (!this.searchText.trim()) {
      this.loadSuppliers();
      return;
    }

    this.loading = true;
    this.suppliersService.search(this.searchText).subscribe({
      next: (data) => {
        this.suppliers = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching suppliers:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en cercar proveïdors',
        });
        this.loading = false;
      },
    });
  }

  clearSearch() {
    this.searchText = '';
    this.loadSuppliers();
  }

  editSupplier(supplier: Supplier) {
    this.router.navigate(['/suppliers', supplier.id, 'edit']);
  }

  confirmDelete(supplier: Supplier) {
    this.confirmationService.confirm({
      message: `Estàs segur d'eliminar el proveïdor "${supplier.name} ${supplier.surname}"?`,
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteSupplier(supplier);
      },
    });
  }

  deleteSupplier(supplier: Supplier) {
    this.suppliersService.delete(supplier.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Èxit',
          detail: 'Proveïdor eliminat correctament',
        });
        this.loadSuppliers();
      },
      error: (error) => {
        console.error('Error deleting supplier:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en eliminar el proveïdor',
        });
      },
    });
  }
}

