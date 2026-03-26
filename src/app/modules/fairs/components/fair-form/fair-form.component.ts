import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { FairsService } from '../../services/fairs.service';

@Component({
  selector: 'app-fair-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  providers: [MessageService],
  templateUrl: './fair-form.component.html',
  styleUrl: './fair-form.component.css',
})
export class FairFormComponent implements OnInit {
  form: FormGroup;
  fairId: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private fairsService: FairsService,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.fairId = this.route.snapshot.paramMap.get('id');
    if (this.fairId && this.fairId !== 'new') {
      this.loadFair();
    }
  }

  loadFair() {
    if (!this.fairId) return;
    this.loading = true;
    this.fairsService.getById(this.fairId).subscribe({
      next: (fair) => {
        this.form.patchValue({
          name: fair.name,
          startDate: fair.startDate.split('T')[0],
          endDate: fair.endDate.split('T')[0],
        });
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: "Error en carregar la fira",
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
    const val = this.form.value;
    if (this.fairId && this.fairId !== 'new') {
      this.fairsService.update(this.fairId, val).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Fira actualitzada',
          });
          this.router.navigate(['/fairs']);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Error',
          });
          this.loading = false;
        },
      });
    } else {
      this.fairsService.create(val).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Fira creada',
          });
          this.router.navigate(['/fairs']);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Error',
          });
          this.loading = false;
        },
      });
    }
  }
}
