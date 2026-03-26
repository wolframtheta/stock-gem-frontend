import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { WorkshopsService } from '../../services/workshops.service';
import { Workshop } from '../../models/workshop.model';
import { Router } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-workshops-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ConfirmDialogModule,
    EmptyStateComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './workshops-list.component.html',
  styleUrl: './workshops-list.component.css',
})
export class WorkshopsListComponent implements OnInit {
  workshops: Workshop[] = [];
  loading = false;
  searchText = '';

  constructor(
    private workshopsService: WorkshopsService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.loadWorkshops();
  }

  loadWorkshops() {
    this.loading = true;
    this.workshopsService.getAll().subscribe({
      next: (data) => {
        this.workshops = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading workshops:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar els tallers',
        });
        this.loading = false;
      },
    });
  }

  search() {
    if (!this.searchText.trim()) {
      this.loadWorkshops();
      return;
    }

    this.loading = true;
    this.workshopsService.search(this.searchText).subscribe({
      next: (data) => {
        this.workshops = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching workshops:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en cercar tallers',
        });
        this.loading = false;
      },
    });
  }

  clearSearch() {
    this.searchText = '';
    this.loadWorkshops();
  }

  editWorkshop(workshop: Workshop) {
    this.router.navigate(['/workshops', workshop.id, 'edit']);
  }

  confirmDelete(workshop: Workshop) {
    this.confirmationService.confirm({
      message: `Estàs segur d'eliminar el taller "${workshop.name}"?`,
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteWorkshop(workshop);
      },
    });
  }

  deleteWorkshop(workshop: Workshop) {
    this.workshopsService.delete(workshop.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Èxit',
          detail: 'Taller eliminat correctament',
        });
        this.loadWorkshops();
      },
      error: (error) => {
        console.error('Error deleting workshop:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en eliminar el taller',
        });
      },
    });
  }
}

