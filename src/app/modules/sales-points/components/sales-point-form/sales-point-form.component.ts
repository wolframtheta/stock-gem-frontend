import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { filter, of, switchMap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SalesPointsService } from '../../services/sales-points.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sales-point-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToggleSwitchModule,
  ],
  providers: [MessageService],
  templateUrl: './sales-point-form.component.html',
  styleUrl: './sales-point-form.component.css',
})
export class SalesPointFormComponent implements OnInit {
  form: FormGroup;
  salesPointId: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private salesPointsService: SalesPointsService,
    private messageService: MessageService,
    public auth: AuthService,
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      address: ['', [Validators.maxLength(500)]],
      isDefaultWarehouse: [false],
    });
  }

  get isAdmin(): boolean {
    return this.auth.currentUser()?.role === 'admin';
  }

  ngOnInit() {
    this.route.paramMap
      .pipe(
        filter((params) => params.has('id')),
        switchMap((params) => {
          const id = params.get('id')!;
          this.salesPointId = id;
          if (id === 'new') {
            this.loading = false;
            return of(null);
          }
          this.loading = true;
          return this.salesPointsService.getById(id);
        }),
      )
      .subscribe({
        next: (sp) => {
          if (sp) {
            this.form.patchValue({
              code: sp.code,
              name: sp.name,
              address: sp.address ?? '',
              isDefaultWarehouse: sp.isDefaultWarehouse ?? false,
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading sales point:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: "Error en carregar el punt de venta",
          });
          this.loading = false;
        },
      });
  }

  loadSalesPoint() {
    if (!this.salesPointId || this.salesPointId === 'new') return;

    this.loading = true;
    this.salesPointsService.getById(this.salesPointId).subscribe({
      next: (sp) => {
        this.form.patchValue({
          code: sp.code,
          name: sp.name,
          address: sp.address ?? '',
          isDefaultWarehouse: sp.isDefaultWarehouse ?? false,
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sales point:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: "Error en carregar el punt de venta",
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

    if (this.salesPointId && this.salesPointId !== 'new') {
      this.salesPointsService.update(this.salesPointId, formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Punt de venta actualitzat correctament',
          });
          this.router.navigate(['/sales-points']);
        },
        error: (error) => {
          console.error('Error updating sales point:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || "Error en actualitzar el punt de venta",
          });
          this.loading = false;
        },
      });
    } else {
      this.salesPointsService.create(formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Punt de venta creat correctament',
          });
          this.router.navigate(['/sales-points']);
        },
        error: (error) => {
          console.error('Error creating sales point:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || "Error en crear el punt de venta",
          });
          this.loading = false;
        },
      });
    }
  }

  cancel() {
    this.router.navigate(['/sales-points']);
  }
}
