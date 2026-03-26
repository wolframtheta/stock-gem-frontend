import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { UsersService } from '../../services/users.service';
import { FairsService } from '../../../fairs/services/fairs.service';
import { USER_ROLE_LABELS, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SelectModule],
  providers: [MessageService],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
})
export class UserFormComponent implements OnInit {
  form: FormGroup;
  userId: string | null = null;
  loading = false;
  fairs: { id: string; name: string }[] = [];
  readonly roles: UserRole[] = ['admin', 'botiga'];
  readonly roleLabels = USER_ROLE_LABELS;
  get fairOptions(): { id: string; label: string }[] {
    return this.fairs.map((f) => ({ id: f.id, label: f.name }));
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private usersService: UsersService,
    private fairsService: FairsService,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', []],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      role: ['botiga' as UserRole, [Validators.required]],
      fairId: [null as string | null],
    });
  }

  ngOnInit() {
    this.fairsService.getAll().subscribe({
      next: (f) => (this.fairs = f),
    });
    this.form.get('role')?.valueChanges.subscribe((role) => {
      if (role === 'admin') {
        this.form.patchValue({ fairId: null });
      }
    });
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.userId = id || 'new';
          if (!id || id === 'new') {
            this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
            this.form.get('password')?.updateValueAndValidity();
            return of(null);
          }
          this.form.get('password')?.clearValidators();
          this.form.get('password')?.updateValueAndValidity();
          this.loading = true;
          return this.usersService.getById(id);
        }),
      )
      .subscribe({
        next: (user) => {
          if (user) {
            this.form.patchValue({
              email: user.email,
              name: user.name,
              role: user.role,
              fairId: user.fairId ?? null,
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading user:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: "Error en carregar l'usuari",
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
    const payload: Record<string, unknown> = {
      email: formValue.email,
      name: formValue.name,
      role: formValue.role,
      fairId: formValue.role === 'botiga' ? (formValue.fairId || null) : null,
    };
    if (formValue.password) {
      payload['password'] = formValue.password;
    }

    if (this.userId && this.userId !== 'new') {
      this.usersService.update(this.userId, payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Usuari actualitzat correctament',
          });
          this.router.navigate(['/users']);
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || "Error en actualitzar l'usuari",
          });
          this.loading = false;
        },
      });
    } else {
      this.usersService.create({
        email: formValue.email,
        password: formValue.password,
        name: formValue.name,
        role: formValue.role,
        fairId: formValue.role === 'botiga' ? (formValue.fairId || null) : null,
      }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Usuari creat correctament',
          });
          this.router.navigate(['/users']);
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || "Error en crear l'usuari",
          });
          this.loading = false;
        },
      });
    }
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
