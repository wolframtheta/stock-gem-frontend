import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClientsService } from '../../services/clients.service';
import { Client } from '../../models/client.model';
import { Router } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ConfirmDialogModule,
    EmptyStateComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.css',
})
export class ClientsListComponent implements OnInit {
  clients: Client[] = [];
  loading = false;
  searchText = '';

  constructor(
    private clientsService: ClientsService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.loading = true;
    this.clientsService.getAll().subscribe({
      next: (data) => {
        this.clients = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar els clients',
        });
        this.loading = false;
      },
    });
  }

  search() {
    if (!this.searchText.trim()) {
      this.loadClients();
      return;
    }

    this.loading = true;
    this.clientsService.search(this.searchText).subscribe({
      next: (data) => {
        this.clients = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching clients:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en cercar clients',
        });
        this.loading = false;
      },
    });
  }

  clearSearch() {
    this.searchText = '';
    this.loadClients();
  }

  editClient(client: Client) {
    this.router.navigate(['/clients', client.id, 'edit']);
  }

  confirmDelete(client: Client) {
    this.confirmationService.confirm({
      message: `Estàs segur d'eliminar el client "${client.name} ${client.surname}"?`,
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteClient(client);
      },
    });
  }

  deleteClient(client: Client) {
    this.clientsService.delete(client.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Èxit',
          detail: 'Client eliminat correctament',
        });
        this.loadClients();
      },
      error: (error) => {
        console.error('Error deleting client:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en eliminar el client',
        });
      },
    });
  }
}

