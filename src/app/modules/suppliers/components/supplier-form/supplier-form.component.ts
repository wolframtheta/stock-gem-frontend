import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SuppliersService } from '../../services/suppliers.service';
import { Supplier } from '../../models/supplier.model';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  providers: [MessageService],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.css',
})
export class SupplierFormComponent implements OnInit {
  form: FormGroup;
  supplierId: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private suppliersService: SuppliersService,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      surname: ['', [Validators.required, Validators.maxLength(255)]],
      nif: ['', [Validators.required, Validators.maxLength(20)]],
      address: [''],
      phones: [''],
      email: ['', [Validators.email, Validators.maxLength(255)]],
    });
  }

  ngOnInit() {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    if (this.supplierId && this.supplierId !== 'new') {
      this.loadSupplier();
    }
  }

  loadSupplier() {
    if (!this.supplierId) return;

    this.loading = true;
    this.suppliersService.getById(this.supplierId).subscribe({
      next: (supplier) => {
        this.form.patchValue(supplier);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading supplier:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar el proveïdor',
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

    if (this.supplierId && this.supplierId !== 'new') {
      // Update
      this.suppliersService.update(this.supplierId, formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Proveïdor actualitzat correctament',
          });
          this.router.navigate(['/suppliers']);
        },
        error: (error) => {
          console.error('Error updating supplier:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error en actualitzar el proveïdor',
          });
          this.loading = false;
        },
      });
    } else {
      // Create
      this.suppliersService.create(formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Proveïdor creat correctament',
          });
          this.router.navigate(['/suppliers']);
        },
        error: (error) => {
          console.error('Error creating supplier:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error en crear el proveïdor',
          });
          this.loading = false;
        },
      });
    }
  }

  cancel() {
    this.router.navigate(['/suppliers']);
  }
}

