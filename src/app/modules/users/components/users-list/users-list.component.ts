import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { UsersService } from '../../services/users.service';
import { User, USER_ROLE_LABELS } from '../../models/user.model';
import { Router } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogModule,
    EmptyStateComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css',
})
export class UsersListComponent implements OnInit {
  users = signal<User[]>([]);
  loading = signal(false);
  readonly roleLabels = USER_ROLE_LABELS;

  constructor(
    private usersService: UsersService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.usersService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.users.set(data),
        error: (error) => {
          console.error('Error loading users:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: "Error en carregar els usuaris",
          });
        },
      });
  }

  editUser(user: User) {
    this.router.navigate(['/users', user.id, 'edit']);
  }

  confirmDelete(user: User) {
    this.confirmationService.confirm({
      message: `Estàs segur d'eliminar l'usuari "${user.name}"?`,
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteUser(user);
      },
    });
  }

  deleteUser(user: User) {
    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Èxit',
          detail: 'Usuari eliminat correctament',
        });
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || "Error en eliminar l'usuari",
        });
      },
    });
  }
}
