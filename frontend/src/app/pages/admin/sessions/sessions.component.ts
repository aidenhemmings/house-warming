import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from "@angular/core";
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
import { MatChipsModule } from "@angular/material/chips";
import { ApiService, Session, CategoryDef } from "../../../core/services/api.service";

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
    MatChipsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="sessions-page">
      <div class="page-hero">
        <div class="hero-text">
          <h1>
            <iconify-icon icon="tabler:calendar-event"></iconify-icon> Sessions
          </h1>
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
          <div class="empty-icon">
            <iconify-icon icon="tabler:clipboard-list"></iconify-icon>
          </div>
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
              <h2>{{ editingSession() ? "Edit" : "New" }} Session</h2>
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

              <!-- Category Management -->
              <div class="categories-section">
                <label class="cat-label">Categories</label>

                @if (sessionCategories().length === 0) {
                  <p class="cat-empty-hint">No categories yet. Add one below.</p>
                }

                <div class="cat-list">
                  @for (cat of sessionCategories(); track cat.name; let idx = $index) {
                    <div class="cat-row">
                      <button class="cat-icon-btn" (click)="toggleCatIconPicker(idx)" [title]="cat.icon || 'Choose icon'">
                        <iconify-icon [icon]="cat.icon || 'tabler:tag'"></iconify-icon>
                      </button>
                      <span class="cat-name">{{ cat.name }}</span>
                      <button class="cat-remove" (click)="removeCategory(cat.name)">
                        <iconify-icon icon="tabler:x"></iconify-icon>
                      </button>

                      @if (editingCatIconIdx() === idx) {
                        <div class="cat-icon-picker">
                          <div class="cat-icon-search">
                            <iconify-icon icon="tabler:search"></iconify-icon>
                            <input
                              type="text"
                              placeholder="Search icons..."
                              [value]="catIconSearch()"
                              (input)="catIconSearch.set($any($event.target).value)" />
                          </div>
                          <div class="cat-icon-grid">
                            <button
                              class="cat-icon-option"
                              [class.selected]="!cat.icon"
                              (click)="setCatIcon(idx, '')">
                              <iconify-icon icon="tabler:tag"></iconify-icon>
                            </button>
                            @for (ic of filteredCatIcons(); track ic.icon) {
                              <button
                                class="cat-icon-option"
                                [class.selected]="cat.icon === ic.icon"
                                [title]="ic.label"
                                (click)="setCatIcon(idx, ic.icon)">
                                <iconify-icon [icon]="ic.icon"></iconify-icon>
                              </button>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="cat-add-row">
                  <input
                    class="cat-input"
                    placeholder="New category name"
                    #catInput
                    (keydown.enter)="addCategory(catInput); $event.preventDefault()" />
                  <button class="action-btn outline-btn cat-add-btn" (click)="addCategory(catInput)">
                    <iconify-icon icon="tabler:plus"></iconify-icon> Add
                  </button>
                </div>
              </div>
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
        align-items: flex-start;
        justify-content: center;
        z-index: 1000;
        padding: 24px;
        overflow-y: auto;
        animation: fadeInUp 0.2s ease-out;
      }

      .form-card {
        width: 100%;
        max-width: 540px;
        margin: auto 0;
        background: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        overflow: visible;
        flex-shrink: 0;
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

      /* ─── Categories ─── */
      .categories-section {
        margin-top: 12px;
        padding-top: 16px;
        border-top: 1px solid var(--border);
      }

      .cat-label {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--navy);
        display: block;
        margin-bottom: 10px;
      }

      .cat-empty-hint {
        font-size: 0.85rem;
        color: var(--text-light);
        margin-bottom: 12px;
      }

      .cat-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 14px;
      }

      .cat-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        transition: all var(--transition);
        &:hover { border-color: var(--primary-light); }
      }

      .cat-icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: 2px dashed var(--border);
        border-radius: 10px;
        background: white;
        color: var(--navy);
        font-size: 1.2rem;
        cursor: pointer;
        transition: all var(--transition);
        flex-shrink: 0;
        &:hover { border-color: var(--primary); background: rgba(224,122,95,0.04); }
      }

      .cat-name {
        flex: 1;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--navy);
      }

      .cat-remove {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--text-light);
        cursor: pointer;
        padding: 0;
        transition: all var(--transition);
        flex-shrink: 0;
        iconify-icon { font-size: 15px; }
        &:hover { background: rgba(224, 122, 95, 0.12); color: var(--error); }
      }

      .cat-icon-picker {
        width: 100%;
        margin-top: 4px;
        background: white;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        overflow: hidden;
      }

      .cat-icon-search {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-bottom: 1px solid var(--border);
        background: var(--surface);
        iconify-icon { font-size: 16px; color: var(--text-light); }
        input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.85rem;
          color: var(--navy);
          &::placeholder { color: var(--text-light); }
        }
      }

      .cat-icon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
        gap: 3px;
        padding: 10px;
        max-height: 200px;
        overflow-y: auto;
      }

      .cat-icon-option {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border: 1.5px solid transparent;
        border-radius: 8px;
        background: transparent;
        color: var(--navy);
        font-size: 1.15rem;
        cursor: pointer;
        transition: all 0.15s ease;
        &:hover { background: rgba(224,122,95,0.08); border-color: var(--primary); color: var(--primary); }
        &.selected { background: var(--primary); border-color: var(--primary); color: white; }
      }

      .cat-add-row {
        display: flex;
        gap: 8px;
      }

      .cat-input {
        flex: 1;
        padding: 8px 14px;
        border: 1.5px solid var(--border);
        border-radius: 999px;
        font-size: 0.88rem;
        outline: none;
        transition: border-color var(--transition);
        &:focus {
          border-color: var(--primary);
        }
      }

      .cat-add-btn {
        padding: 7px 14px;
        font-size: 0.82rem;
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
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
  sessionCategories = signal<CategoryDef[]>([]);
  editingCatIconIdx = signal<number | null>(null);
  catIconSearch = signal("");

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
      this.sessionCategories.set(
        (session.categories || []).map((c: any) =>
          typeof c === 'string' ? { name: c } : c
        )
      );
    } else {
      this.editingSession.set(null);
      this.sessionForm.reset({ is_active: true });
      this.sessionCategories.set([]);
    }
    this.editingCatIconIdx.set(null);
    this.catIconSearch.set("");
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingSession.set(null);
    this.sessionForm.reset({ is_active: true });
    this.sessionCategories.set([]);
    this.editingCatIconIdx.set(null);
    this.catIconSearch.set("");
  }

  saveSession(): void {
    if (!this.sessionForm.valid) return;

    this.saving.set(true);
    const data = { ...this.sessionForm.value, categories: this.sessionCategories() };
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

  addCategory(input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value && !this.sessionCategories().some((c) => c.name === value)) {
      this.sessionCategories.update((cats) => [...cats, { name: value }]);
    }
    input.value = "";
  }

  removeCategory(name: string): void {
    this.sessionCategories.update((cats) => cats.filter((c) => c.name !== name));
    this.editingCatIconIdx.set(null);
  }

  toggleCatIconPicker(idx: number): void {
    if (this.editingCatIconIdx() === idx) {
      this.editingCatIconIdx.set(null);
    } else {
      this.editingCatIconIdx.set(idx);
      this.catIconSearch.set("");
    }
  }

  setCatIcon(idx: number, icon: string): void {
    this.sessionCategories.update((cats) =>
      cats.map((c, i) => (i === idx ? { ...c, icon: icon || undefined } : c))
    );
    this.editingCatIconIdx.set(null);
  }

  readonly catAvailableIcons: { icon: string; label: string; tags: string }[] = [
    { icon: "tabler:tools-kitchen-2", label: "Kitchen Tools", tags: "kitchen cook utensil" },
    { icon: "tabler:tools-kitchen", label: "Dining", tags: "dining fork knife eat" },
    { icon: "tabler:cup", label: "Cup", tags: "cup mug drink coffee tea" },
    { icon: "tabler:coffee", label: "Coffee", tags: "coffee drink brew" },
    { icon: "tabler:fridge", label: "Fridge", tags: "fridge refrigerator kitchen" },
    { icon: "tabler:armchair", label: "Armchair", tags: "armchair sofa living room" },
    { icon: "tabler:lamp", label: "Lamp", tags: "lamp light" },
    { icon: "tabler:sofa", label: "Sofa", tags: "sofa couch living room" },
    { icon: "tabler:bed", label: "Bed", tags: "bed bedroom sleep" },
    { icon: "tabler:bath", label: "Bath", tags: "bath bathroom" },
    { icon: "tabler:photo", label: "Photo Frame", tags: "photo picture decor" },
    { icon: "tabler:plant", label: "Plant", tags: "plant garden green" },
    { icon: "tabler:candle", label: "Candle", tags: "candle scent decor" },
    { icon: "tabler:clock", label: "Clock", tags: "clock time wall" },
    { icon: "tabler:brush", label: "Brush", tags: "brush clean" },
    { icon: "tabler:box", label: "Box", tags: "box storage" },
    { icon: "tabler:basket", label: "Basket", tags: "basket laundry" },
    { icon: "tabler:device-tv", label: "TV", tags: "tv screen" },
    { icon: "tabler:device-speaker", label: "Speaker", tags: "speaker audio" },
    { icon: "tabler:wifi", label: "WiFi", tags: "wifi router" },
    { icon: "tabler:bulb", label: "Light Bulb", tags: "bulb light" },
    { icon: "tabler:sun", label: "Sun", tags: "sun outdoor" },
    { icon: "tabler:umbrella", label: "Umbrella", tags: "umbrella outdoor" },
    { icon: "tabler:gift", label: "Gift", tags: "gift present" },
    { icon: "tabler:confetti", label: "Confetti", tags: "confetti party" },
    { icon: "tabler:cake", label: "Cake", tags: "cake dessert" },
    { icon: "tabler:glass-full", label: "Wine Glass", tags: "wine glass drink" },
    { icon: "tabler:key", label: "Key", tags: "key door entrance" },
    { icon: "tabler:door", label: "Door", tags: "door entrance" },
    { icon: "tabler:home", label: "Home", tags: "home house" },
    { icon: "tabler:heart", label: "Heart", tags: "heart love" },
    { icon: "tabler:star", label: "Star", tags: "star favorite" },
    { icon: "tabler:flame", label: "Flame", tags: "flame fire" },
    { icon: "tabler:leaf", label: "Leaf", tags: "leaf nature" },
    { icon: "tabler:paw", label: "Paw", tags: "paw pet animal" },
    { icon: "tabler:book", label: "Book", tags: "book read" },
    { icon: "tabler:music", label: "Music", tags: "music note" },
    { icon: "tabler:hammer", label: "Hammer", tags: "hammer tool" },
    { icon: "tabler:tag", label: "Tag", tags: "tag label" },
    { icon: "tabler:wash-machine", label: "Washing Machine", tags: "washing laundry" },
    { icon: "tabler:vacuum-cleaner", label: "Vacuum", tags: "vacuum cleaner" },
  ];

  filteredCatIcons = computed(() => {
    const q = this.catIconSearch().toLowerCase().trim();
    if (!q) return this.catAvailableIcons;
    return this.catAvailableIcons.filter(
      (ic) =>
        ic.label.toLowerCase().includes(q) ||
        ic.tags.toLowerCase().includes(q) ||
        ic.icon.toLowerCase().includes(q),
    );
  });
}
