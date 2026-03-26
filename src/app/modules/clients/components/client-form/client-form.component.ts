import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ClientsService } from '../../services/clients.service';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  providers: [MessageService],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.css',
})
export class ClientFormComponent implements OnInit {
  form: FormGroup;
  clientId: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private clientsService: ClientsService,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      surname: ['', [Validators.required, Validators.maxLength(255)]],
      mobilePhone: ['', [Validators.maxLength(20)]],
      landlinePhone: ['', [Validators.maxLength(20)]],
    });
  }

  ngOnInit() {
    this.clientId = this.route.snapshot.paramMap.get('id');
    if (this.clientId && this.clientId !== 'new') {
      this.loadClient();
    }
  }

  loadClient() {
    if (!this.clientId) return;

    this.loading = true;
    this.clientsService.getById(this.clientId).subscribe({
      next: (client) => {
        this.form.patchValue(client);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading client:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar el client',
        });
        this.loading = false;
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    if (this.clientId && this.clientId !== 'new') {
      // Update
      this.clientsService.update(this.clientId, formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Client actualitzat correctament',
          });
          this.router.navigate(['/clients']);
        },
        error: (error) => {
          console.error('Error updating client:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error en actualitzar el client',
          });
          this.loading = false;
        },
      });
    } else {
      // Create
      this.clientsService.create(formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Client creat correctament',
          });
          this.router.navigate(['/clients']);
        },
        error: (error) => {
          console.error('Error creating client:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error en crear el client',
          });
          this.loading = false;
        },
      });
    }
  }

  cancel() {
    this.router.navigate(['/clients']);
  }
}

