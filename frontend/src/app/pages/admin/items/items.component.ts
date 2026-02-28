import { Component, OnInit, OnDestroy, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
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
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatMenuModule } from "@angular/material/menu";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Subscription } from "rxjs";
import { ApiService, Item, Session } from "../../../core/services/api.service";
import { SocketService } from "../../../core/services/socket.service";

@Component({
  selector: "app-items",
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
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="items-page">
      <div class="page-hero">
        <div class="hero-text">
          <a routerLink="/admin/sessions" class="back-link">
            <mat-icon>arrow_back</mat-icon> Sessions
          </a>
          <h1>📦 {{ session()?.name || "Items" }}</h1>
          <p>Manage registry items for this session</p>
        </div>
        <button class="action-btn primary-btn" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Add Item
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (items().length === 0) {
        <div class="empty-card">
          <div class="empty-icon">🎁</div>
          <h3>No Items Yet</h3>
          <p>Add items people can bring for the housewarming</p>
          <button
            class="action-btn primary-btn"
            style="margin-top:16px"
            (click)="openForm()">
            <mat-icon>add</mat-icon>
            Add First Item
          </button>
        </div>
      } @else {
        <!-- Summary -->
        <div class="summary-bar">
          <div class="summary-pill">
            <strong>{{ items().length }}</strong> items
          </div>
          <div class="summary-pill">
            <strong>{{ totalQuantity() }}</strong> total
          </div>
          <div class="summary-pill reserved-pill">
            <strong>{{ totalReserved() }}</strong> reserved
          </div>
          <div class="summary-pill available-pill">
            <strong>{{ totalAvailable() }}</strong> available
          </div>
        </div>

        <div class="items-list">
          @for (item of items(); track item.id) {
            <div
              class="item-row"
              [class.fully-reserved]="item.available_quantity <= 0">
              <div class="item-main">
                <div class="item-name-row">
                  <h3>{{ item.name }}</h3>
                  @if (item.category) {
                    <span class="category-badge">{{ item.category }}</span>
                  }
                </div>
                @if (item.description) {
                  <p class="item-desc">{{ item.description }}</p>
                }
                <div class="item-progress">
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      [style.width.%]="getProgress(item)"
                      [class.full]="item.available_quantity <= 0"></div>
                  </div>
                  <span class="progress-text">
                    {{ item.reserved_quantity }}/{{ item.quantity }} reserved
                  </span>
                </div>
              </div>

              <div class="item-meta">
                <div
                  class="qty-badge"
                  [class.full]="item.available_quantity <= 0">
                  <span class="qty-num">{{ item.available_quantity }}</span>
                  <span class="qty-label">available</span>
                </div>
              </div>

              <div class="item-actions">
                <button class="icon-btn" [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="openForm(item)">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </button>
                  <button
                    mat-menu-item
                    class="delete-action"
                    (click)="deleteItem(item)">
                    <mat-icon>delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </div>
            </div>
          }
        </div>
      }

      <!-- Form Overlay -->
      @if (showForm()) {
        <div class="form-overlay" (click)="closeForm()">
          <div class="form-card" (click)="$event.stopPropagation()">
            <div class="form-header">
              <h2>{{ editingItem() ? "✏️ Edit" : "✨ New" }} Item</h2>
              <button class="icon-btn" (click)="closeForm()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <form [formGroup]="itemForm" class="form-body">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Item Name</mat-label>
                <input
                  matInput
                  formControlName="name"
                  placeholder="Wine Glasses Set" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea
                  matInput
                  formControlName="description"
                  rows="2"
                  placeholder="Set of 6 crystal wine glasses"></textarea>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Category</mat-label>
                  <mat-select formControlName="category">
                    <mat-option value="">None</mat-option>
                    @for (cat of existingCategories(); track cat) {
                      <mat-option [value]="cat">{{ cat }}</mat-option>
                    }
                    <mat-option value="__new">+ New Category</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Quantity</mat-label>
                  <input
                    matInput
                    formControlName="quantity"
                    type="number"
                    min="1" />
                </mat-form-field>
              </div>

              @if (itemForm.get("category")?.value === "__new") {
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>New Category Name</mat-label>
                  <input
                    matInput
                    formControlName="newCategory"
                    placeholder="Kitchen" />
                </mat-form-field>
              }

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Image URL (optional)</mat-label>
                <input
                  matInput
                  formControlName="image_url"
                  placeholder="https://..." />
              </mat-form-field>
            </form>

            <div class="form-actions">
              <button class="action-btn outline-btn" (click)="closeForm()">
                Cancel
              </button>
              <button
                class="action-btn primary-btn"
                (click)="saveItem()"
                [disabled]="!itemForm.valid || saving()">
                @if (saving()) {
                  <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
                }
                {{ editingItem() ? "Update" : "Add" }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .items-page {
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

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 500;
        margin-bottom: 6px;
        transition: color var(--transition);
        &:hover {
          color: var(--primary);
        }
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
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

      /* ─── Summary Bar ─── */
      .summary-bar {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .summary-pill {
        padding: 8px 16px;
        background: white;
        border-radius: 999px;
        font-size: 0.85rem;
        color: var(--text-secondary);
        box-shadow: var(--shadow-sm);

        strong {
          color: var(--navy);
          margin-right: 2px;
        }
      }

      .reserved-pill strong {
        color: var(--primary);
      }
      .available-pill strong {
        color: var(--secondary);
      }

      /* ─── List ─── */
      .items-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .item-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 18px 24px;
        background: white;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        transition: all var(--transition);
        &:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-1px);
        }
        &.fully-reserved {
          opacity: 0.65;
        }
      }

      .item-main {
        flex: 1;
      }

      .item-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        h3 {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 600;
          color: var(--navy);
        }
      }

      .category-badge {
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--primary);
        background: rgba(224, 122, 95, 0.1);
        padding: 3px 10px;
        border-radius: 999px;
      }

      .item-desc {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .item-progress {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .progress-track {
        flex: 1;
        max-width: 200px;
        height: 6px;
        border-radius: 99px;
        background: #eee;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        border-radius: 99px;
        background: var(--secondary);
        transition: width 0.4s ease;
        &.full {
          background: var(--primary);
        }
      }

      .progress-text {
        font-size: 0.75rem;
        color: var(--text-light);
        white-space: nowrap;
      }

      .item-meta {
        text-align: center;
      }

      .qty-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 16px;
        border-radius: 12px;
        background: rgba(129, 178, 154, 0.1);
        &.full {
          background: #f3f4f6;
        }
      }

      .qty-num {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--secondary);
        .full & {
          color: var(--text-light);
        }
      }

      .qty-label {
        font-size: 0.65rem;
        text-transform: uppercase;
        color: var(--text-secondary);
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

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
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
        .item-row {
          flex-wrap: wrap;
        }
        .form-row {
          grid-template-columns: 1fr;
        }
        .page-hero {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class ItemsComponent implements OnInit, OnDestroy {
  sessionId!: number;
  session = signal<Session | null>(null);
  items = signal<Item[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  editingItem = signal<Item | null>(null);

  itemForm: FormGroup;
  private subscriptions: Subscription[] = [];

  existingCategories = computed(() => {
    const cats = [
      ...new Set(
        this.items()
          .map((i) => i.category)
          .filter(Boolean),
      ),
    ];
    return cats.sort();
  });

  totalQuantity = computed(() =>
    this.items().reduce((s, i) => s + i.quantity, 0),
  );
  totalReserved = computed(() =>
    this.items().reduce((s, i) => s + i.reserved_quantity, 0),
  );
  totalAvailable = computed(() =>
    this.items().reduce((s, i) => s + i.available_quantity, 0),
  );

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private api: ApiService,
    private socketService: SocketService,
    private snackBar: MatSnackBar,
  ) {
    this.itemForm = this.fb.group({
      name: ["", Validators.required],
      description: [""],
      category: [""],
      quantity: [1, [Validators.required, Validators.min(1)]],
      image_url: [""],
      newCategory: [""],
    });
  }

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get("sessionId"));

    this.socketService.joinSession(this.sessionId);

    this.api.getSession(this.sessionId).subscribe((session) => {
      this.session.set(session);
    });

    this.loadItems();

    // Real-time updates
    this.subscriptions.push(
      this.socketService.on<Item[]>("items-updated").subscribe((items) => {
        this.items.set(items);
      }),
      this.socketService.on<Item>("item-created").subscribe(() => {
        this.loadItems();
      }),
      this.socketService.on<Item>("item-updated").subscribe((updated) => {
        this.items.update((items) =>
          items.map((i) => (i.id === updated.id ? updated : i)),
        );
      }),
      this.socketService
        .on<{ id: number }>("item-deleted")
        .subscribe(({ id }) => {
          this.items.update((items) => items.filter((i) => i.id !== id));
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.socketService.leaveSession(this.sessionId);
  }

  loadItems(): void {
    this.api.getItems(this.sessionId).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getProgress(item: Item): number {
    if (item.quantity === 0) return 0;
    return (item.reserved_quantity / item.quantity) * 100;
  }

  openForm(item?: Item): void {
    if (item) {
      this.editingItem.set(item);
      this.itemForm.patchValue({
        name: item.name,
        description: item.description || "",
        category: item.category || "",
        quantity: item.quantity,
        image_url: item.image_url || "",
      });
    } else {
      this.editingItem.set(null);
      this.itemForm.reset({ quantity: 1, category: "" });
    }
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingItem.set(null);
    this.itemForm.reset({ quantity: 1, category: "" });
  }

  saveItem(): void {
    if (!this.itemForm.valid) return;

    this.saving.set(true);
    const formValue = this.itemForm.value;

    const data: any = {
      session_id: this.sessionId,
      name: formValue.name,
      description: formValue.description || null,
      category:
        formValue.category === "__new"
          ? formValue.newCategory
          : formValue.category || null,
      quantity: formValue.quantity,
      image_url: formValue.image_url || null,
    };

    const editing = this.editingItem();
    const request = editing
      ? this.api.updateItem(editing.id, data)
      : this.api.createItem(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadItems();
        this.snackBar.open(
          `Item ${editing ? "updated" : "added"} successfully`,
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

  deleteItem(item: Item): void {
    if (
      !confirm(
        `Delete "${item.name}"? This will also remove all reservations for this item.`,
      )
    ) {
      return;
    }

    this.api.deleteItem(item.id).subscribe({
      next: () => {
        this.loadItems();
        this.snackBar.open("Item deleted", "OK", { duration: 3000 });
      },
    });
  }
}
