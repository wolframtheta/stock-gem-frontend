import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { catchError, of } from 'rxjs';
import { FairsService, Fair } from '../../services/fairs.service';

@Component({
  selector: 'app-fairs-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmDialogModule],
  providers: [MessageService],
  templateUrl: './fairs-list.component.html',
  styleUrl: './fairs-list.component.css',
})
export class FairsListComponent implements OnInit {
  fairs = signal<Fair[]>([]);
  loading = signal(false);

  constructor(
    private fairsService: FairsService,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    this.loadFairs();
  }

  loadFairs() {
    this.loading.set(true);
    this.fairsService
      .getAll()
      .pipe(
        catchError(() => of([])),
      )
      .subscribe({
        next: (data) => {
          this.fairs.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  confirmDelete(fair: Fair) {
    // Use ConfirmationService - add to template
  }

  deleteFair(id: string) {
    this.fairsService.delete(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Èxit',
          detail: 'Fira eliminada',
        });
        this.loadFairs();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error',
        });
      },
    });
  }

  formatDate(d: string): string {
    return d ? new Date(d).toISOString().split('T')[0] : '-';
  }
}
