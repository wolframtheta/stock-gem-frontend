import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ComposturasService } from '../../services/composturas.service';
import { Compostura } from '../../models/compostura.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-composturas-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ConfirmDialogModule,
    EmptyStateComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './composturas-list.component.html',
  styleUrl: './composturas-list.component.css',
})
export class ComposturasListComponent implements OnInit {
  composturas: Compostura[] = [];
  loading = false;
  searchText = '';

  constructor(
    private composturasService: ComposturasService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.loadComposturas();
  }

  loadComposturas() {
    this.loading = true;
    this.composturasService.getAll().subscribe({
      next: (data) => {
        this.composturas = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading composturas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar les compostures',
        });
        this.loading = false;
      },
    });
  }

  search() {
    if (!this.searchText.trim()) {
      this.loadComposturas();
      return;
    }

    this.loading = true;
    this.composturasService.search({ code: this.searchText }).subscribe({
      next: (data) => {
        this.composturas = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching composturas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en cercar compostures',
        });
        this.loading = false;
      },
    });
  }

  clearSearch() {
    this.searchText = '';
    this.loadComposturas();
  }

  editCompostura(compostura: Compostura) {
    this.router.navigate(['/composturas', compostura.id, 'edit']);
  }

  confirmDelete(compostura: Compostura) {
    this.confirmationService.confirm({
      message: `Estàs segur d'eliminar la compostura "${compostura.code}"?`,
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteCompostura(compostura);
      },
    });
  }

  deleteCompostura(compostura: Compostura) {
    this.composturasService.delete(compostura.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Èxit',
          detail: 'Compostura eliminada correctament',
        });
        this.loadComposturas();
      },
      error: (error) => {
        console.error('Error deleting compostura:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en eliminar la compostura',
        });
      },
    });
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ca-ES');
  }
}

