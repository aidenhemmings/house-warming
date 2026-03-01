import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ApiService } from "../../../core/services/api.service";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="login-page">
      <div class="login-bg-shapes" aria-hidden="true">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="login-container">
        <a routerLink="/" class="back-link">
          <mat-icon>arrow_back</mat-icon>
          Back to Home
        </a>

        <div class="login-card">
          <div class="login-header">
            <img
              src="assets/logo-large.png"
              alt="House Warming"
              class="login-logo" />
            <h1>Admin Portal</h1>
            <p>Manage your housewarming registry</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="login()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input
                matInput
                formControlName="username"
                autocomplete="username" />
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                formControlName="password"
                [type]="hidePassword() ? 'password' : 'text'"
                autocomplete="current-password" />
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{
                  hidePassword() ? "visibility_off" : "visibility"
                }}</mat-icon>
              </button>
            </mat-form-field>

            <button
              type="submit"
              class="login-btn"
              [disabled]="!loginForm.valid || loading()">
              @if (loading()) {
                <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
                <span>Signing in...</span>
              } @else {
                <mat-icon>login</mat-icon>
                <span>Sign In</span>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
          160deg,
          #3d405b 0%,
          #5c5f7a 40%,
          #81b29a 100%
        );
        padding: 24px;
        position: relative;
        overflow: hidden;
      }

      .login-bg-shapes {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }

      .shape {
        position: absolute;
        border-radius: 50%;
        opacity: 0.06;
        background: white;
      }
      .shape-1 {
        width: 500px;
        height: 500px;
        top: -150px;
        right: -100px;
      }
      .shape-2 {
        width: 300px;
        height: 300px;
        bottom: -80px;
        left: -60px;
      }
      .shape-3 {
        width: 180px;
        height: 180px;
        top: 50%;
        left: 30%;
      }

      .login-container {
        width: 100%;
        max-width: 420px;
        position: relative;
        z-index: 1;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
        margin-bottom: 20px;
        transition: color var(--transition);

        &:hover {
          color: white;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .login-card {
        background: var(--surface);
        border-radius: var(--radius-xl);
        padding: 40px 36px;
        box-shadow: var(--shadow-xl);
        animation: scale-in 0.4s ease-out;
      }

      .login-header {
        text-align: center;
        margin-bottom: 32px;

        .login-logo {
          width: 100px;
          height: auto;
          margin-bottom: 16px;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
        }

        h1 {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--navy);
          margin-bottom: 6px;
        }

        p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
      }

      .full-width {
        width: 100%;
        margin-bottom: 4px;
      }

      mat-icon[matPrefix] {
        margin-right: 8px;
        color: var(--text-light);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .login-btn {
        width: 100%;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 999px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition);
        margin-top: 12px;
        box-shadow: 0 4px 16px rgba(224, 122, 95, 0.3);

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        &:hover:not(:disabled) {
          background: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(224, 122, 95, 0.4);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .btn-spinner {
        display: inline-block;
        margin-right: 4px;
      }
    `,
  ],
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  hidePassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.loginForm = this.fb.group({
      username: ["", Validators.required],
      password: ["", Validators.required],
    });

    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(["/admin/dashboard"]);
    }
  }

  login(): void {
    if (!this.loginForm.valid) return;

    this.loading.set(true);
    const { username, password } = this.loginForm.value;

    this.api.login(username, password).subscribe({
      next: (result) => {
        this.authService.setToken(result.token);
        this.router.navigate(["/admin/dashboard"]);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err.error?.error || "Login failed. Please try again.";
        this.snackBar.open(message, "Dismiss", { duration: 4000 });
      },
    });
  }
}
