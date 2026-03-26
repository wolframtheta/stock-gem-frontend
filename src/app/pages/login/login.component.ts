import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  loading = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        const msg =
          err.error?.message ||
          (err.status === 0
            ? 'No es pot connectar al servidor. Comprova que el backend està en marxa (port 3500).'
            : 'Credencials invàlides');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg,
        });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
