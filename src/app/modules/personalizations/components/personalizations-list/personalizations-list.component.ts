import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PersonalizationsService } from '../../services/personalizations.service';
import { Personalization } from '../../models/personalization.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-personalizations-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ConfirmDialogModule,
    EmptyStateComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './personalizations-list.component.html',
  styleUrl: './personalizations-list.component.css',
})
export class PersonalizationsListComponent implements OnInit {
  personalizations: Personalization[] = [];
  loading = false;
  searchText = '';

  constructor(
    private personalizationsService: PersonalizationsService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.loadPersonalizations();
  }

  loadPersonalizations() {
    this.loading = true;
    this.personalizationsService.getAll().subscribe({
      next: (data) => {
        this.personalizations = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading personalizations:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar les personalitzacions',
        });
        this.loading = false;
      },
    });
  }

  search() {
    if (!this.searchText.trim()) {
      this.loadPersonalizations();
      return;
    }

    this.loading = true;
    this.personalizationsService.search({ code: this.searchText }).subscribe({
      next: (data) => {
        this.personalizations = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching personalizations:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en cercar personalitzacions',
        });
        this.loading = false;
      },
    });
  }

  clearSearch() {
    this.searchText = '';
    this.loadPersonalizations();
  }

  editPersonalization(personalization: Personalization) {
    this.router.navigate(['/personalizaciones', personalization.id, 'edit']);
  }

  confirmDelete(personalization: Personalization) {
    this.confirmationService.confirm({
      message: `Estàs segur d'eliminar la personalization "${personalization.code}"?`,
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deletePersonalization(personalization);
      },
    });
  }

  deletePersonalization(personalization: Personalization) {
    this.personalizationsService.delete(personalization.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Èxit',
          detail: 'Personalization eliminada correctament',
        });
        this.loadPersonalizations();
      },
      error: (error) => {
        console.error('Error deleting personalization:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en eliminar la personalization',
        });
      },
    });
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ca-ES');
  }
}

