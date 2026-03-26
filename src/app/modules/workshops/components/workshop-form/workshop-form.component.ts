import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { WorkshopsService } from '../../services/workshops.service';
import { Workshop } from '../../models/workshop.model';

@Component({
  selector: 'app-workshop-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  providers: [MessageService],
  templateUrl: './workshop-form.component.html',
  styleUrl: './workshop-form.component.css',
})
export class WorkshopFormComponent implements OnInit {
  form: FormGroup;
  workshopId: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private workshopsService: WorkshopsService,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      phone: ['', [Validators.maxLength(20)]],
    });
  }

  ngOnInit() {
    this.workshopId = this.route.snapshot.paramMap.get('id');
    if (this.workshopId && this.workshopId !== 'new') {
      this.loadWorkshop();
    }
  }

  loadWorkshop() {
    if (!this.workshopId) return;

    this.loading = true;
    this.workshopsService.getById(this.workshopId).subscribe({
      next: (workshop) => {
        this.form.patchValue(workshop);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading workshop:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar el taller',
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

    if (this.workshopId && this.workshopId !== 'new') {
      // Update
      this.workshopsService.update(this.workshopId, formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Taller actualitzat correctament',
          });
          this.router.navigate(['/workshops']);
        },
        error: (error) => {
          console.error('Error updating workshop:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error en actualitzar el taller',
          });
          this.loading = false;
        },
      });
    } else {
      // Create
      this.workshopsService.create(formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Taller creat correctament',
          });
          this.router.navigate(['/workshops']);
        },
        error: (error) => {
          console.error('Error creating workshop:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Error en crear el taller',
          });
          this.loading = false;
        },
      });
    }
  }

  cancel() {
    this.router.navigate(['/workshops']);
  }
}

