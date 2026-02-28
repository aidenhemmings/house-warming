import { Component, OnInit, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ApiService, Session } from "../../../core/services/api.service";

@Component({
  selector: "app-sessions",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  template: `
    <div class="sessions-page">
      <div class="page-hero">
        <div class="hero-text">
          <h1>🗓️ Sessions</h1>
          <p>Manage your housewarming event sessions</p>
        </div>
        <button class="action-btn primary-btn" (click)="openForm()">
          <mat-icon>add</mat-icon>
          New Session
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (sessions().length === 0) {
        <div class="empty-card">
          <div class="empty-icon">📋</div>
          <h3>No Sessions Yet</h3>
          <p>Create your first session to start building a registry</p>
          <button
            class="action-btn primary-btn"
            style="margin-top:16px"
            (click)="openForm()">
            <mat-icon>add</mat-icon>
            Create Session
          </button>
        </div>
      } @else {
        <div class="sessions-list">
          @for (session of sessions(); track session.id) {
            <div class="session-row">
              <div class="session-main">
                <div class="session-name-row">
                  <h3>{{ session.name }}</h3>
                  @if (session.is_active) {
                    <span class="badge active">Active</span>
                  } @else {
                    <span class="badge inactive">Inactive</span>
                  }
                </div>
                @if (session.description) {
                  <p class="session-desc">{{ session.description }}</p>
                }
                @if (session.event_date) {
                  <span class="session-date">
                    <mat-icon>calendar_today</mat-icon>
                    {{ formatDate(session.event_date) }}
                  </span>
                }
              </div>

              <div class="session-actions">
                <a
                  [routerLink]="['/admin/sessions', session.id, 'items']"
                  class="pill-link">
                  <mat-icon>list</mat-icon> Items
                </a>
                <a
                  [routerLink]="['/admin/sessions', session.id, 'guests']"
                  class="pill-link">
                  <mat-icon>people</mat-icon> Guests
                </a>
                <button class="icon-btn" [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="openForm(session)">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </button>
                  <button mat-menu-item (click)="toggleActive(session)">
                    <mat-icon>{{
                      session.is_active ? "visibility_off" : "visibility"
                    }}</mat-icon>
                    <span>{{
                      session.is_active ? "Deactivate" : "Activate"
                    }}</span>
                  </button>
                  <button
                    mat-menu-item
                    class="delete-action"
                    (click)="deleteSession(session)">
                    <mat-icon>delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </div>
            </div>
          }
        </div>
      }

      <!-- Inline Form Overlay -->
      @if (showForm()) {
        <div class="form-overlay" (click)="closeForm()">
          <div class="form-card" (click)="$event.stopPropagation()">
            <div class="form-header">
              <h2>{{ editingSession() ? "✏️ Edit" : "✨ New" }} Session</h2>
              <button class="icon-btn" (click)="closeForm()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <form [formGroup]="sessionForm" class="form-body">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Session Name</mat-label>
                <input
                  matInput
                  formControlName="name"
                  placeholder="Friends Housewarming" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea
                  matInput
                  formControlName="description"
                  rows="3"
                  placeholder="A brief description"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Event Date</mat-label>
                <input matInput formControlName="event_date" type="date" />
              </mat-form-field>

              <mat-slide-toggle formControlName="is_active" color="primary">
                Active (visible to guests)
              </mat-slide-toggle>
            </form>

            <div class="form-actions">
              <button class="action-btn outline-btn" (click)="closeForm()">
                Cancel
              </button>
              <button
                class="action-btn primary-btn"
                (click)="saveSession()"
                [disabled]="!sessionForm.valid || saving()">
                @if (saving()) {
                  <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
                }
                {{ editingSession() ? "Update" : "Create" }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .sessions-page {
        width: 100%;
      }

      /* ─── Hero ─── */
      .page-hero {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 28px;
        flex-wrap: wrap;
      }

      .hero-text h1 {
        font-family: var(--font-display);
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--navy);
        margin-bottom: 4px;
      }

      .hero-text p {
        color: var(--text-secondary);
        font-size: 0.95rem;
      }

      /* ─── Buttons ─── */
      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 20px;
        border-radius: 999px;
        font-size: 0.9rem;
        font-weight: 600;
        text-decoration: none;
        border: none;
        cursor: pointer;
        transition: all var(--transition);
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
      .primary-btn {
        background: var(--primary);
        color: white;
        box-shadow: 0 4px 12px rgba(224, 122, 95, 0.25);
        &:hover:not(:disabled) {
          background: var(--primary-dark);
          transform: translateY(-1px);
        }
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
      .outline-btn {
        background: white;
        color: var(--navy);
        border: 1.5px solid var(--border);
        &:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
      }

      .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all var(--transition);
        &:hover {
          background: rgba(0, 0, 0, 0.06);
        }
      }

      /* ─── Empty / Loading ─── */
      .loading-state {
        display: flex;
        justify-content: center;
        padding: 64px;
      }

      .empty-card {
        text-align: center;
        background: white;
        border-radius: var(--radius-lg);
        padding: 56px 24px;
        box-shadow: var(--shadow);
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }
        h3 {
          font-family: var(--font-display);
          font-size: 1.3rem;
          color: var(--navy);
          margin-bottom: 6px;
        }
        p {
          color: var(--text-secondary);
        }
      }

      /* ─── Session list ─── */
      .sessions-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .session-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px 24px;
        background: white;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        transition: all var(--transition);

        &:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-1px);
        }
      }

      .session-main {
        flex: 1;
      }

      .session-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        h3 {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--navy);
        }
      }

      .badge {
        font-size: 0.65rem;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .badge.active {
        background: #d1fae5;
        color: #065f46;
      }
      .badge.inactive {
        background: #f3f4f6;
        color: #6b7280;
      }

      .session-desc {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-bottom: 4px;
      }

      .session-date {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8rem;
        color: var(--text-light);
        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      .session-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .pill-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 7px 14px;
        border-radius: 999px;
        font-size: 0.82rem;
        font-weight: 600;
        text-decoration: none;
        color: var(--primary);
        background: rgba(224, 122, 95, 0.08);
        transition: all var(--transition);
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
        &:hover {
          background: rgba(224, 122, 95, 0.15);
        }
      }

      .delete-action {
        color: var(--error) !important;
      }

      /* ─── Form Overlay ─── */
      .form-overlay {
        position: fixed;
        inset: 0;
        background: rgba(61, 64, 91, 0.45);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 24px;
        animation: fadeInUp 0.2s ease-out;
      }

      .form-card {
        width: 100%;
        max-width: 540px;
        background: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        overflow: hidden;
      }

      .form-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 28px 0;
        h2 {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--navy);
        }
      }

      .form-body {
        padding: 20px 28px;
      }

      .full-width {
        width: 100%;
        margin-bottom: 4px;
      }

      mat-slide-toggle {
        margin-bottom: 8px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 0 28px 24px;
      }

      .btn-spinner {
        display: inline-block;
        margin-right: 8px;
      }

      @media (max-width: 768px) {
        .session-row {
          flex-direction: column;
          align-items: flex-start;
        }
        .session-actions {
          width: 100%;
          justify-content: flex-end;
          margin-top: 8px;
        }
        .page-hero {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class SessionsComponent implements OnInit {
  sessions = signal<Session[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  editingSession = signal<Session | null>(null);

  sessionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snackBar: MatSnackBar,
  ) {
    this.sessionForm = this.fb.group({
      name: ["", Validators.required],
      description: [""],
      event_date: [""],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.api.getSessions().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm(session?: Session): void {
    if (session) {
      this.editingSession.set(session);
      this.sessionForm.patchValue({
        name: session.name,
        description: session.description || "",
        event_date: session.event_date ? session.event_date.split("T")[0] : "",
        is_active: session.is_active,
      });
    } else {
      this.editingSession.set(null);
      this.sessionForm.reset({ is_active: true });
    }
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingSession.set(null);
    this.sessionForm.reset({ is_active: true });
  }

  saveSession(): void {
    if (!this.sessionForm.valid) return;

    this.saving.set(true);
    const data = this.sessionForm.value;
    const editing = this.editingSession();

    const request = editing
      ? this.api.updateSession(editing.id, data)
      : this.api.createSession(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadSessions();
        this.snackBar.open(
          `Session ${editing ? "updated" : "created"} successfully`,
          "OK",
          { duration: 3000 },
        );
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(
          err.error?.error || "Something went wrong",
          "Dismiss",
          {
            duration: 4000,
          },
        );
      },
    });
  }

  toggleActive(session: Session): void {
    this.api
      .updateSession(session.id, { is_active: !session.is_active })
      .subscribe({
        next: () => {
          this.loadSessions();
          this.snackBar.open(
            `Session ${session.is_active ? "deactivated" : "activated"}`,
            "OK",
            { duration: 3000 },
          );
        },
      });
  }

  deleteSession(session: Session): void {
    if (
      !confirm(
        `Delete "${session.name}"? This will remove all items and reservations.`,
      )
    ) {
      return;
    }

    this.api.deleteSession(session.id).subscribe({
      next: () => {
        this.loadSessions();
        this.snackBar.open("Session deleted", "OK", { duration: 3000 });
      },
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}
