import { Component, OnInit, signal } from '@angular/core';
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
  personalizations = signal<Personalization[]>([]);
  loading = signal(false);
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
    this.loading.set(true);
    this.personalizationsService.getAll().subscribe({
      next: (data) => {
        this.personalizations.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading personalizations:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar les personalitzacions',
        });
        this.loading.set(false);
      },
    });
  }

  search() {
    if (!this.searchText.trim()) {
      this.loadPersonalizations();
      return;
    }

    this.loading.set(true);
    this.personalizationsService.search({ description: this.searchText }).subscribe({
      next: (data) => {
        this.personalizations.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error searching personalizations:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en cercar personalitzacions',
        });
        this.loading.set(false);
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
      message: `Estàs segur d'eliminar la personalization "${personalization.description}"?`,
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

  formatPrice(value: number | string | null): string {
    return Number(value ?? 0).toFixed(2);
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ca-ES');
  }
}

