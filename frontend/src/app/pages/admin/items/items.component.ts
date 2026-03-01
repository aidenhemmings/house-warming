import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
} from "@angular/core";
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
import {
  ApiService,
  Item,
  Session,
  CategoryDef,
} from "../../../core/services/api.service";
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="items-page">
      <!-- Hero -->
      <div class="page-hero">
        <div class="hero-text">
          <a routerLink="/admin/sessions" class="back-link">
            <iconify-icon icon="tabler:arrow-left"></iconify-icon> Sessions
          </a>
          <h1>
            <iconify-icon icon="tabler:package"></iconify-icon>
            {{ session()?.name || "Items" }}
          </h1>
          <p>Manage registry items for this session</p>
        </div>
        <button class="action-btn primary-btn" (click)="openForm()">
          <iconify-icon icon="tabler:plus"></iconify-icon>
          Add Item
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="loading-dots">
            <span></span><span></span><span></span>
          </div>
          <p>Loading items...</p>
        </div>
      } @else if (items().length === 0) {
        <div class="empty-card">
          <div class="empty-icon">
            <iconify-icon icon="tabler:gift"></iconify-icon>
          </div>
          <h3>No Items Yet</h3>
          <p>Add items people can bring for the housewarming</p>
          <button
            class="action-btn primary-btn"
            style="margin-top:16px"
            (click)="openForm()">
            <iconify-icon icon="tabler:plus"></iconify-icon>
            Add First Item
          </button>
        </div>
      } @else {
        <!-- Summary -->
        <div class="summary-bar">
          <div class="summary-pill">
            <iconify-icon icon="tabler:list-numbers"></iconify-icon>
            <strong>{{ items().length }}</strong> items
          </div>
          <div class="summary-pill">
            <iconify-icon icon="tabler:stack-2"></iconify-icon>
            <strong>{{ totalQuantity() }}</strong> total
          </div>
          <div class="summary-pill reserved-pill">
            <iconify-icon icon="tabler:bookmark"></iconify-icon>
            <strong>{{ totalReserved() }}</strong> reserved
          </div>
          <div class="summary-pill available-pill">
            <iconify-icon icon="tabler:shopping-bag"></iconify-icon>
            <strong>{{ totalAvailable() }}</strong> available
          </div>
        </div>

        <!-- Category Filter Bar -->
        @if (itemCategories().length > 1) {
          <div class="category-bar">
            <div class="category-scroll">
              <button
                class="cat-chip"
                [class.active]="selectedCategory() === ''"
                (click)="selectCategory('')">
                <iconify-icon icon="tabler:sparkles"></iconify-icon> All
              </button>
              @for (cat of itemCategories(); track cat) {
                <button
                  class="cat-chip"
                  [class.active]="selectedCategory() === cat"
                  (click)="selectCategory(cat)">
                  <iconify-icon [icon]="getCategoryIcon(cat)"></iconify-icon>
                  {{ cat }}
                  <span class="cat-count">{{ getCategoryCount(cat) }}</span>
                </button>
              }
            </div>
          </div>
        }

        <!-- Item Cards Grid -->
        <div class="items-grid">
          @for (item of filteredItems(); track item.id; let i = $index) {
            <div
              class="item-card fade-in"
              [class.fully-reserved]="item.available_quantity <= 0"
              [style.animation-delay]="i * 0.04 + 's'">
              <!-- Ribbon -->
              @if (item.available_quantity <= 0) {
                <div class="ribbon"><span>Claimed!</span></div>
              }

              <!-- Menu button -->
              <button class="card-menu-btn" [matMenuTriggerFor]="menu">
                <iconify-icon icon="tabler:dots-vertical"></iconify-icon>
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

              <div class="item-card-inner">
                <div class="item-top-row">
                  <span class="item-emoji">
                    <iconify-icon
                      [icon]="
                        item.icon || getCategoryIcon(item.category)
                      "></iconify-icon>
                  </span>
                  @if (item.category) {
                    <span class="item-category">{{ item.category }}</span>
                  }
                </div>

                <h3 class="item-name">{{ item.name }}</h3>

                @if (item.description) {
                  <p class="item-desc">{{ item.description }}</p>
                }

                <!-- Progress -->
                <div class="progress-wrap">
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      [class.complete]="item.available_quantity <= 0"
                      [style.width.%]="getProgress(item)"></div>
                  </div>
                  <div class="progress-info">
                    <span class="progress-claimed">
                      {{ item.reserved_quantity }}/{{ item.quantity }} claimed
                    </span>
                    <span
                      class="progress-left"
                      [class.zero]="item.available_quantity <= 0">
                      {{ item.available_quantity }} left
                    </span>
                  </div>
                </div>

                <!-- Status badge -->
                <div class="item-status-row">
                  @if (item.available_quantity <= 0) {
                    <span class="status-badge claimed-badge">
                      <iconify-icon icon="tabler:circle-check"></iconify-icon>
                      All Claimed
                    </span>
                  } @else {
                    <span class="status-badge available-badge">
                      <iconify-icon icon="tabler:shopping-bag"></iconify-icon>
                      {{ item.available_quantity }} Available
                    </span>
                  }
                </div>
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
              <h2>
                <iconify-icon
                  [icon]="
                    editingItem() ? 'tabler:edit' : 'tabler:plus'
                  "></iconify-icon>
                {{ editingItem() ? "Edit" : "New" }} Item
              </h2>
              <button class="icon-btn" (click)="closeForm()">
                <iconify-icon icon="tabler:x"></iconify-icon>
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

              <!-- Icon Picker -->
              <div class="icon-picker-section">
                <label class="picker-label">Item Icon</label>
                <div class="icon-preview-row">
                  <div class="icon-preview" (click)="toggleIconPicker()">
                    @if (selectedIcon()) {
                      <iconify-icon [icon]="selectedIcon()!"></iconify-icon>
                    } @else {
                      <iconify-icon
                        icon="tabler:mood-plus"
                        class="placeholder-icon"></iconify-icon>
                    }
                  </div>
                  <div class="icon-preview-info">
                    @if (selectedIcon()) {
                      <span class="icon-name">{{ selectedIcon() }}</span>
                      <button class="clear-icon-btn" (click)="clearIcon()">
                        <iconify-icon icon="tabler:x"></iconify-icon> Remove
                      </button>
                    } @else {
                      <span class="icon-hint">Click to choose an icon</span>
                    }
                  </div>
                </div>

                @if (showIconPicker()) {
                  <div class="icon-picker-panel">
                    <div class="icon-search">
                      <iconify-icon icon="tabler:search"></iconify-icon>
                      <input
                        type="text"
                        placeholder="Search icons..."
                        [value]="iconSearch()"
                        (input)="iconSearch.set($any($event.target).value)" />
                    </div>
                    <div class="icon-grid">
                      @for (ic of filteredIcons(); track ic.icon) {
                        <button
                          class="icon-grid-item"
                          [class.selected]="selectedIcon() === ic.icon"
                          [title]="ic.label"
                          (click)="pickIcon(ic.icon)">
                          <iconify-icon [icon]="ic.icon"></iconify-icon>
                        </button>
                      }
                      @if (filteredIcons().length === 0) {
                        <div class="icon-empty">
                          No icons match &ldquo;{{ iconSearch() }}&rdquo;
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

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
        margin-bottom: 24px;
        flex-wrap: wrap;
      }

      .hero-text h1 {
        font-family: var(--font-display);
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--navy);
        margin-bottom: 4px;
        iconify-icon {
          font-size: 1.5rem;
          vertical-align: -2px;
        }
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
        iconify-icon {
          font-size: 16px;
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
        iconify-icon {
          font-size: 18px;
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
        iconify-icon {
          font-size: 20px;
        }
      }

      /* ─── Loading ─── */
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 120px 0;
        color: var(--text-secondary);
      }
      .loading-dots {
        display: flex;
        gap: 6px;
        span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--primary);
          animation: pulse-soft 1.2s ease-in-out infinite;
          &:nth-child(2) {
            animation-delay: 0.15s;
          }
          &:nth-child(3) {
            animation-delay: 0.3s;
          }
        }
      }
      @keyframes pulse-soft {
        0%,
        100% {
          opacity: 0.3;
          transform: scale(0.8);
        }
        50% {
          opacity: 1;
          transform: scale(1);
        }
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
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      .summary-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: white;
        border-radius: 999px;
        font-size: 0.85rem;
        color: var(--text-secondary);
        box-shadow: var(--shadow-sm);
        iconify-icon {
          font-size: 15px;
          opacity: 0.6;
        }
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

      /* ─── Category Bar ─── */
      .category-bar {
        margin-bottom: 24px;
        background: white;
        border-radius: var(--radius);
        padding: 12px 16px;
        box-shadow: var(--shadow-sm);
      }
      .category-scroll {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        &::-webkit-scrollbar {
          display: none;
        }
      }
      .cat-chip {
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 18px;
        border-radius: 999px;
        border: 1.5px solid var(--border);
        background: var(--surface);
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all var(--transition);
        iconify-icon {
          font-size: 16px;
        }
        &:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        &.active {
          background: var(--navy);
          border-color: var(--navy);
          color: white;
          box-shadow: var(--shadow);
          .cat-count {
            background: rgba(255, 255, 255, 0.25);
            color: white;
          }
        }
      }
      .cat-count {
        font-size: 0.7rem;
        font-weight: 700;
        background: rgba(0, 0, 0, 0.07);
        color: var(--text-light);
        padding: 1px 7px;
        border-radius: 999px;
        min-width: 18px;
        text-align: center;
      }

      /* ─── Grid ─── */
      .items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }

      .item-card {
        position: relative;
        background: var(--surface);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
        overflow: hidden;
        transition: all var(--transition);
        animation: fadeInUp 0.35s ease-out both;

        &:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: transparent;
        }

        &.fully-reserved {
          opacity: 0.6;
          &:hover {
            transform: none;
            box-shadow: none;
          }
        }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .ribbon {
        position: absolute;
        top: 16px;
        right: -32px;
        background: var(--secondary);
        color: white;
        padding: 4px 40px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        transform: rotate(45deg);
        z-index: 2;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .card-menu-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(4px);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all var(--transition);
        opacity: 0;
        iconify-icon {
          font-size: 18px;
        }
        &:hover {
          background: white;
          color: var(--primary);
        }
      }
      .item-card:hover .card-menu-btn {
        opacity: 1;
      }

      .item-card-inner {
        padding: 24px;
      }

      .item-top-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }

      .item-emoji {
        font-size: 1.75rem;
        color: var(--navy);
      }

      .item-category {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--primary);
        background: var(--primary-light);
        padding: 4px 12px;
        border-radius: 999px;
      }

      .item-name {
        font-family: var(--font-display);
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--navy);
        margin-bottom: 6px;
      }

      .item-desc {
        font-size: 0.88rem;
        color: var(--text-secondary);
        line-height: 1.5;
        margin-bottom: 16px;
      }

      /* ─── Progress ─── */
      .progress-wrap {
        margin-bottom: 16px;
      }
      .progress-track {
        height: 6px;
        background: var(--border);
        border-radius: 999px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--primary), var(--accent));
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        &.complete {
          background: linear-gradient(
            90deg,
            var(--secondary),
            var(--secondary-dark)
          );
        }
      }
      .progress-info {
        display: flex;
        justify-content: space-between;
        margin-top: 6px;
        font-size: 0.78rem;
      }
      .progress-claimed {
        color: var(--text-secondary);
        font-weight: 500;
      }
      .progress-left {
        color: var(--secondary-dark);
        font-weight: 600;
      }
      .progress-left.zero {
        color: var(--text-light);
      }

      /* ─── Status Badge ─── */
      .item-status-row {
        display: flex;
      }
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 600;
        iconify-icon {
          font-size: 14px;
        }
      }
      .claimed-badge {
        background: rgba(129, 178, 154, 0.12);
        color: var(--secondary-dark);
      }
      .available-badge {
        background: rgba(129, 178, 154, 0.12);
        color: var(--secondary-dark);
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
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--navy);
          iconify-icon {
            font-size: 1.2rem;
          }
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

      /* ─── Icon Picker ─── */
      .icon-picker-section {
        margin-bottom: 16px;
      }
      .picker-label {
        display: block;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 10px;
      }
      .icon-preview-row {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .icon-preview {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        border: 2px dashed var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        color: var(--navy);
        cursor: pointer;
        transition: all var(--transition);
        background: var(--surface);
        &:hover {
          border-color: var(--primary);
          background: rgba(224, 122, 95, 0.04);
        }
        .placeholder-icon {
          color: var(--text-light);
          opacity: 0.5;
        }
      }
      .icon-preview-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .icon-name {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-family: monospace;
      }
      .icon-hint {
        font-size: 0.85rem;
        color: var(--text-light);
      }
      .clear-icon-btn {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        border: none;
        background: none;
        color: var(--error);
        font-size: 0.78rem;
        font-weight: 500;
        cursor: pointer;
        padding: 0;
        &:hover {
          text-decoration: underline;
        }
        iconify-icon {
          font-size: 13px;
        }
      }

      .icon-picker-panel {
        margin-top: 12px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: white;
        overflow: hidden;
      }
      .icon-search {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-bottom: 1px solid var(--border);
        background: var(--surface);
        iconify-icon {
          font-size: 18px;
          color: var(--text-light);
        }
        input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.88rem;
          color: var(--navy);
          &::placeholder {
            color: var(--text-light);
          }
        }
      }
      .icon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
        gap: 4px;
        padding: 12px;
        max-height: 240px;
        overflow-y: auto;
      }
      .icon-grid-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border: 1.5px solid transparent;
        border-radius: 10px;
        background: transparent;
        color: var(--navy);
        font-size: 1.3rem;
        cursor: pointer;
        transition: all 0.15s ease;
        &:hover {
          background: rgba(224, 122, 95, 0.08);
          border-color: var(--primary);
          color: var(--primary);
        }
        &.selected {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          box-shadow: 0 2px 8px rgba(224, 122, 95, 0.3);
        }
      }
      .icon-empty {
        grid-column: 1 / -1;
        text-align: center;
        color: var(--text-light);
        font-size: 0.85rem;
        padding: 20px;
      }

      @media (max-width: 768px) {
        .items-grid {
          grid-template-columns: 1fr;
        }
        .form-row {
          grid-template-columns: 1fr;
        }
        .page-hero {
          flex-direction: column;
        }
        .summary-bar {
          gap: 6px;
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
  selectedCategory = signal("");
  showIconPicker = signal(false);
  selectedIcon = signal<string | null>(null);
  iconSearch = signal("");

  itemForm: FormGroup;
  private subscriptions: Subscription[] = [];

  private categoryIcons: Record<string, string> = {
    Kitchen: "tabler:tools-kitchen-2",
    "Living Room": "tabler:armchair",
    Bedroom: "tabler:bed",
    Bathroom: "tabler:bath",
    Garden: "tabler:plant",
    Outdoor: "tabler:sun",
    Decor: "tabler:photo",
    Electronics: "tabler:device-mobile",
    Cleaning: "tabler:brush",
    Storage: "tabler:box",
    Dining: "tabler:tools-kitchen",
    Entertainment: "tabler:device-gamepad-2",
    Entrance: "tabler:gift",
  };

  readonly availableIcons: { icon: string; label: string; tags: string }[] = [
    // Kitchen & Dining
    {
      icon: "tabler:tools-kitchen-2",
      label: "Kitchen Tools",
      tags: "kitchen cook utensil",
    },
    {
      icon: "tabler:tools-kitchen",
      label: "Dining",
      tags: "dining fork knife eat",
    },
    { icon: "tabler:cup", label: "Cup", tags: "cup mug drink coffee tea" },
    { icon: "tabler:coffee", label: "Coffee", tags: "coffee drink brew" },
    { icon: "tabler:soup", label: "Soup Bowl", tags: "soup bowl food" },
    { icon: "tabler:salt", label: "Salt", tags: "salt pepper seasoning" },
    { icon: "tabler:grill", label: "Grill", tags: "grill bbq cook outdoor" },
    {
      icon: "tabler:fridge",
      label: "Fridge",
      tags: "fridge refrigerator kitchen appliance",
    },
    {
      icon: "tabler:microwave",
      label: "Microwave",
      tags: "microwave heat kitchen appliance",
    },
    { icon: "tabler:blender", label: "Blender", tags: "blender mixer kitchen" },
    // Living Room & Furniture
    {
      icon: "tabler:armchair",
      label: "Armchair",
      tags: "armchair sofa couch living room",
    },
    { icon: "tabler:lamp", label: "Lamp", tags: "lamp light lit" },
    { icon: "tabler:lamp-2", label: "Table Lamp", tags: "lamp table light" },
    { icon: "tabler:sofa", label: "Sofa", tags: "sofa couch living room" },
    // Bedroom & Bath
    { icon: "tabler:bed", label: "Bed", tags: "bed bedroom sleep" },
    { icon: "tabler:bath", label: "Bath", tags: "bath bathroom tub" },
    {
      icon: "tabler:air-conditioning",
      label: "AC",
      tags: "air conditioner cooling",
    },
    // Decor & Home
    {
      icon: "tabler:photo",
      label: "Photo Frame",
      tags: "photo picture frame decor",
    },
    { icon: "tabler:plant", label: "Plant", tags: "plant garden indoor green" },
    { icon: "tabler:plant-2", label: "Flower", tags: "flower plant vase" },
    { icon: "tabler:candle", label: "Candle", tags: "candle scent wax decor" },
    { icon: "tabler:paint", label: "Paint", tags: "paint decor art color" },
    {
      icon: "tabler:palette",
      label: "Palette",
      tags: "palette art color decor",
    },
    { icon: "tabler:clock", label: "Clock", tags: "clock time wall" },
    {
      icon: "tabler:flip-horizontal",
      label: "Mirror",
      tags: "mirror decor reflect",
    },
    // Cleaning & Storage
    { icon: "tabler:brush", label: "Brush", tags: "brush clean sweep" },
    { icon: "tabler:spray", label: "Spray Bottle", tags: "spray clean" },
    { icon: "tabler:bucket", label: "Bucket", tags: "bucket clean mop" },
    { icon: "tabler:box", label: "Box", tags: "box storage container" },
    {
      icon: "tabler:archive",
      label: "Archive",
      tags: "archive storage organize",
    },
    { icon: "tabler:basket", label: "Basket", tags: "basket storage laundry" },
    // Electronics & Tech
    {
      icon: "tabler:device-mobile",
      label: "Mobile",
      tags: "phone mobile device",
    },
    { icon: "tabler:device-tv", label: "TV", tags: "tv television screen" },
    {
      icon: "tabler:device-speaker",
      label: "Speaker",
      tags: "speaker audio sound music",
    },
    { icon: "tabler:device-laptop", label: "Laptop", tags: "laptop computer" },
    {
      icon: "tabler:device-gamepad-2",
      label: "Game Controller",
      tags: "game controller play entertainment",
    },
    { icon: "tabler:wifi", label: "WiFi", tags: "wifi internet router" },
    { icon: "tabler:plug", label: "Plug", tags: "plug power electric" },
    { icon: "tabler:bulb", label: "Light Bulb", tags: "bulb light smart" },
    // Outdoor & Garden
    { icon: "tabler:sun", label: "Sun", tags: "sun outdoor bright" },
    {
      icon: "tabler:umbrella",
      label: "Umbrella",
      tags: "umbrella rain outdoor",
    },
    { icon: "tabler:trowel", label: "Trowel", tags: "trowel garden dig" },
    { icon: "tabler:fence", label: "Fence", tags: "fence garden yard" },
    // Gifts & Party
    { icon: "tabler:gift", label: "Gift", tags: "gift present wrap box" },
    {
      icon: "tabler:confetti",
      label: "Confetti",
      tags: "confetti party celebrate",
    },
    { icon: "tabler:balloon", label: "Balloon", tags: "balloon party" },
    { icon: "tabler:cake", label: "Cake", tags: "cake dessert party birthday" },
    {
      icon: "tabler:glass-full",
      label: "Wine Glass",
      tags: "wine glass drink",
    },
    { icon: "tabler:bottle", label: "Bottle", tags: "bottle wine drink" },
    // Textiles & Linens
    { icon: "tabler:shirt", label: "Shirt", tags: "shirt textile clothing" },
    { icon: "tabler:scissors", label: "Scissors", tags: "scissors cut craft" },
    { icon: "tabler:needle", label: "Needle", tags: "needle sew thread" },
    // Misc Household
    { icon: "tabler:key", label: "Key", tags: "key lock door entrance" },
    { icon: "tabler:door", label: "Door", tags: "door entrance entry" },
    { icon: "tabler:window", label: "Window", tags: "window curtain" },
    { icon: "tabler:tool", label: "Wrench", tags: "tool wrench fix repair" },
    { icon: "tabler:hammer", label: "Hammer", tags: "hammer tool fix build" },
    { icon: "tabler:ruler", label: "Ruler", tags: "ruler measure" },
    { icon: "tabler:home", label: "Home", tags: "home house" },
    { icon: "tabler:heart", label: "Heart", tags: "heart love favorite" },
    { icon: "tabler:star", label: "Star", tags: "star favorite" },
    {
      icon: "tabler:flame",
      label: "Flame",
      tags: "flame fire candle fireplace",
    },
    { icon: "tabler:droplet", label: "Water Drop", tags: "water drop clean" },
    { icon: "tabler:leaf", label: "Leaf", tags: "leaf nature eco green" },
    { icon: "tabler:paw", label: "Paw", tags: "paw pet dog cat animal" },
    { icon: "tabler:music", label: "Music", tags: "music note song" },
    { icon: "tabler:book", label: "Book", tags: "book read shelf" },
    {
      icon: "tabler:bookmarks",
      label: "Bookmarks",
      tags: "bookmark shelf organize",
    },
    { icon: "tabler:ironing", label: "Iron", tags: "iron press laundry" },
    {
      icon: "tabler:wash-machine",
      label: "Washing Machine",
      tags: "washing machine laundry clean",
    },
    {
      icon: "tabler:vacuum-cleaner",
      label: "Vacuum",
      tags: "vacuum cleaner floor",
    },
  ];

  existingCategories = computed(() => {
    const sessionCats = this.session()?.categories;
    if (sessionCats && sessionCats.length > 0) {
      return sessionCats
        .map((c) => (typeof c === "string" ? c : c.name))
        .sort();
    }
    const cats = [
      ...new Set(
        this.items()
          .map((i) => i.category)
          .filter(Boolean),
      ),
    ];
    return cats.sort();
  });

  itemCategories = computed(() => {
    const cats = [
      ...new Set(
        this.items()
          .map((i) => i.category)
          .filter(Boolean),
      ),
    ];
    return cats.sort();
  });

  filteredItems = computed(() => {
    const cat = this.selectedCategory();
    if (!cat) return this.items();
    return this.items().filter((i) => i.category === cat);
  });

  filteredIcons = computed(() => {
    const q = this.iconSearch().toLowerCase().trim();
    if (!q) return this.availableIcons;
    return this.availableIcons.filter(
      (ic) =>
        ic.label.toLowerCase().includes(q) ||
        ic.tags.toLowerCase().includes(q) ||
        ic.icon.toLowerCase().includes(q),
    );
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

  selectCategory(cat: string): void {
    this.selectedCategory.set(cat);
  }

  getCategoryIcon(category: string | undefined): string {
    if (!category) return "tabler:gift";
    // Check session category definitions first
    const sessionCat = this.session()?.categories?.find(
      (c) => (typeof c === "string" ? c : c.name) === category,
    );
    if (sessionCat && typeof sessionCat !== "string" && sessionCat.icon) {
      return sessionCat.icon;
    }
    return this.categoryIcons[category] || "tabler:gift";
  }

  getCategoryCount(cat: string): number {
    return this.items().filter((i) => i.category === cat).length;
  }

  openForm(item?: Item): void {
    if (item) {
      this.editingItem.set(item);
      this.selectedIcon.set(item.icon || null);
      this.itemForm.patchValue({
        name: item.name,
        description: item.description || "",
        category: item.category || "",
        quantity: item.quantity,
        image_url: item.image_url || "",
      });
    } else {
      this.editingItem.set(null);
      this.selectedIcon.set(null);
      this.itemForm.reset({ quantity: 1, category: "" });
    }
    this.showIconPicker.set(false);
    this.iconSearch.set("");
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingItem.set(null);
    this.selectedIcon.set(null);
    this.showIconPicker.set(false);
    this.iconSearch.set("");
    this.itemForm.reset({ quantity: 1, category: "" });
  }

  toggleIconPicker(): void {
    this.showIconPicker.update((v) => !v);
    if (this.showIconPicker()) {
      this.iconSearch.set("");
    }
  }

  pickIcon(icon: string): void {
    this.selectedIcon.set(icon);
    this.showIconPicker.set(false);
  }

  clearIcon(): void {
    this.selectedIcon.set(null);
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
      icon: this.selectedIcon() || null,
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
