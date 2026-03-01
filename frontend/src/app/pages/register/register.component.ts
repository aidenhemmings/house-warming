import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
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
import { MatStepper, MatStepperModule } from "@angular/material/stepper";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatSelectModule } from "@angular/material/select";
import { Subscription } from "rxjs";
import { ApiService, Item, Session } from "../../core/services/api.service";
import { SocketService } from "../../core/services/socket.service";
import { GuestSessionService } from "../../core/services/guest-session.service";

interface SelectedItem {
  item: Item;
  quantity: number;
}

@Component({
  selector: "app-register",
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
    MatStepperModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatSelectModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- Top nav -->
    <nav class="top-nav">
      <a [routerLink]="['/registry', sessionId]" class="nav-back">
        <mat-icon>arrow_back</mat-icon>
        <span>Back to Registry</span>
      </a>
      <span class="nav-title">{{ session()?.name || "" }}</span>
      <span class="nav-spacer"></span>
    </nav>

    <div class="register-page">
      @if (submitted()) {
        <!-- ✅ Success State -->
        <div class="success-container fade-in">
          <div class="confetti-bg" aria-hidden="true">
            <span class="conf conf-1"
              ><iconify-icon icon="tabler:confetti"></iconify-icon
            ></span>
            <span class="conf conf-2"
              ><iconify-icon icon="tabler:sparkles"></iconify-icon
            ></span>
            <span class="conf conf-3"
              ><iconify-icon icon="tabler:balloon"></iconify-icon
            ></span>
            <span class="conf conf-4"
              ><iconify-icon icon="tabler:heart-filled"></iconify-icon
            ></span>
            <span class="conf conf-5"
              ><iconify-icon icon="tabler:star-filled"></iconify-icon
            ></span>
          </div>
          <div class="success-card">
            <div class="success-emoji">
              <iconify-icon icon="tabler:party-popper"></iconify-icon>
            </div>
            <h2>You're All Set!</h2>
            <p class="success-msg">
              Thank you for reserving
              {{ selectedItems().length }} item{{
                selectedItems().length !== 1 ? "s" : ""
              }}
              for our housewarming!
            </p>
            <div class="success-name-badge">
              <mat-icon>person</mat-icon>
              <strong>{{ submittedName() }}</strong>
            </div>
            <div class="success-items-list">
              @for (sel of selectedItems(); track sel.item.id) {
                <div class="success-item-row">
                  <span>{{ sel.item.name }}</span>
                  <span class="qty-badge">× {{ sel.quantity }}</span>
                </div>
              }
            </div>
            <div class="success-actions">
              <button class="btn-solid" (click)="reserveMore()">
                <mat-icon>add_shopping_cart</mat-icon>
                Reserve More Gifts
              </button>
              <a class="btn-outline" [routerLink]="['/registry', sessionId]">
                <mat-icon>visibility</mat-icon>
                View Registry
              </a>
              <a class="btn-outline" routerLink="/">
                <mat-icon>home</mat-icon>
                Back Home
              </a>
            </div>
          </div>
        </div>
      } @else {
        <!-- Header -->
        <header class="page-hero">
          <div class="container">
            <span class="hero-emoji"
              ><iconify-icon icon="tabler:gift"></iconify-icon
            ></span>
            <h1>Reserve Your Gifts</h1>
            <p>
              Three quick steps and you're done — let us know what you're
              bringing!
            </p>
          </div>
        </header>

        <div class="stepper-container container">
          <mat-stepper #stepper linear class="register-stepper">
            <!-- Step 1: Personal Info -->
            <mat-step [stepControl]="personalForm" label="About You">
              <div class="step-content">
                @if (isReturningGuest()) {
                  <div class="welcome-back-banner">
                    <div class="wb-icon">
                      <iconify-icon icon="tabler:user-check"></iconify-icon>
                    </div>
                    <div class="wb-text">
                      <strong
                        >Welcome back,
                        {{ personalForm.get("firstName")?.value }}!</strong
                      >
                      <span>Your info is saved from last time.</span>
                    </div>
                    <button class="wb-change" (click)="clearSavedGuest()">
                      Not you?
                    </button>
                  </div>
                }
                <div class="step-header">
                  <span class="step-emoji"
                    ><iconify-icon icon="tabler:hand-stop"></iconify-icon
                  ></span>
                  <div>
                    <h2>Tell us about yourself</h2>
                    <p>We'd love to know who's bringing the gifts!</p>
                  </div>
                </div>

                <form [formGroup]="personalForm" class="personal-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>First Name</mat-label>
                    <input
                      matInput
                      formControlName="firstName"
                      placeholder="Jane" />
                    <mat-icon matPrefix>person</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Last Name</mat-label>
                    <input
                      matInput
                      formControlName="lastName"
                      placeholder="Smith" />
                    <mat-icon matPrefix>badge</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Email Address</mat-label>
                    <input
                      matInput
                      formControlName="email"
                      type="email"
                      placeholder="jane&#64;example.com" />
                    <mat-icon matPrefix>email</mat-icon>
                  </mat-form-field>

                  <div class="step-actions">
                    <button
                      mat-flat-button
                      color="primary"
                      matStepperNext
                      [disabled]="!personalForm.valid"
                      class="action-btn">
                      Continue
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </form>
              </div>
            </mat-step>

            <!-- Step 2: Select Items -->
            <mat-step label="Choose Gifts">
              <div class="step-content">
                <div class="step-header">
                  <span class="step-emoji"
                    ><iconify-icon icon="tabler:shopping-bag"></iconify-icon
                  ></span>
                  <div>
                    <h2>Pick your gifts</h2>
                    <p>Select what you'd like to bring to the celebration</p>
                  </div>
                </div>

                @if (loading()) {
                  <div class="loading-state">
                    <div class="loading-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                } @else {
                  <!-- Category filter chips -->
                  @if (categories().length > 1) {
                    <div class="category-chips">
                      <button
                        class="cat-chip"
                        [class.active]="selectedCategory() === ''"
                        (click)="selectCategory('')">
                        <iconify-icon icon="tabler:sparkles"></iconify-icon> All
                      </button>
                      @for (cat of categories(); track cat) {
                        <button
                          class="cat-chip"
                          [class.active]="selectedCategory() === cat"
                          (click)="selectCategory(cat)">
                          <iconify-icon
                            [icon]="getCategoryEmoji(cat)"></iconify-icon>
                          {{ cat }}
                        </button>
                      }
                    </div>
                  }

                  <div class="items-grid">
                    @for (
                      item of filteredAvailableItems();
                      track item.id;
                      let i = $index
                    ) {
                      <div
                        class="gift-card fade-in"
                        [class.selected]="isSelected(item)"
                        [class.fully-reserved]="item.available_quantity <= 0"
                        [style.animation-delay]="i * 0.06 + 's'"
                        (click)="toggleItem(item)">
                        <!-- Selection check indicator -->
                        <div class="card-check">
                          @if (isSelected(item)) {
                            <div class="check-active">
                              <mat-icon>check</mat-icon>
                            </div>
                          } @else if (item.available_quantity > 0) {
                            <div class="check-empty"></div>
                          } @else {
                            <div class="check-disabled">
                              <mat-icon>block</mat-icon>
                            </div>
                          }
                        </div>

                        <!-- Claimed ribbon -->
                        @if (item.available_quantity <= 0) {
                          <div class="ribbon">
                            <span>Claimed!</span>
                          </div>
                        }

                        <div class="gift-card-inner">
                          <div class="gift-top-row">
                            <span class="gift-emoji"
                              ><iconify-icon
                                [icon]="
                                  getItemEmoji(item.category)
                                "></iconify-icon
                            ></span>
                            @if (item.category) {
                              <span class="gift-category">{{
                                item.category
                              }}</span>
                            }
                          </div>

                          <h3 class="gift-name">{{ item.name }}</h3>

                          @if (item.description) {
                            <p class="gift-desc">{{ item.description }}</p>
                          }

                          <!-- Progress bar -->
                          <div class="progress-wrap">
                            <div class="progress-track">
                              <div
                                class="progress-fill"
                                [class.complete]="item.available_quantity <= 0"
                                [style.width.%]="getProgressValue(item)"></div>
                            </div>
                            <div class="progress-info">
                              <span class="progress-claimed"
                                >{{ item.reserved_quantity }}/{{
                                  item.quantity
                                }}
                                claimed</span
                              >
                              @if (item.available_quantity > 0) {
                                <span class="progress-left"
                                  >{{ item.available_quantity }} left</span
                                >
                              }
                            </div>
                          </div>

                          <!-- Quantity selector (when selected & multiple available) -->
                          @if (
                            isSelected(item) && item.available_quantity > 1
                          ) {
                            <div
                              class="qty-row"
                              (click)="$event.stopPropagation()">
                              <span class="qty-label">How many?</span>
                              <mat-form-field
                                appearance="outline"
                                class="qty-field">
                                <mat-select
                                  [value]="getSelectedQuantity(item)"
                                  (selectionChange)="
                                    setQuantity(item, $event.value)
                                  ">
                                  @for (
                                    n of getQuantityOptions(item);
                                    track n
                                  ) {
                                    <mat-option [value]="n">{{ n }}</mat-option>
                                  }
                                </mat-select>
                              </mat-form-field>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  @if (selectedItems().length > 0) {
                    <div class="selection-summary">
                      <span
                        ><iconify-icon icon="tabler:gift"></iconify-icon>
                        {{ selectedItems().length }} item{{
                          selectedItems().length !== 1 ? "s" : ""
                        }}
                        selected</span
                      >
                    </div>
                  }

                  <div class="step-actions">
                    <button mat-button matStepperPrevious class="back-btn">
                      <mat-icon>arrow_back</mat-icon>
                      Back
                    </button>
                    <button
                      mat-flat-button
                      color="primary"
                      matStepperNext
                      [disabled]="selectedItems().length === 0"
                      class="action-btn">
                      Review
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                }
              </div>
            </mat-step>

            <!-- Step 3: Review & Submit -->
            <mat-step label="Confirm">
              <div class="step-content">
                <div class="step-header">
                  <span class="step-emoji"
                    ><iconify-icon
                      icon="tabler:circle-check-filled"></iconify-icon
                  ></span>
                  <div>
                    <h2>Review & confirm</h2>
                    <p>Make sure everything looks good before submitting</p>
                  </div>
                </div>

                <div class="review-card">
                  <div class="review-section">
                    <div class="review-label">
                      <mat-icon>person</mat-icon>
                      Your Details
                    </div>
                    <div class="review-value">
                      <strong
                        >{{ personalForm.get("firstName")?.value }}
                        {{ personalForm.get("lastName")?.value }}</strong
                      >
                      <br />
                      <span class="review-email">{{
                        personalForm.get("email")?.value
                      }}</span>
                    </div>
                  </div>

                  <div class="review-divider"></div>

                  <div class="review-section">
                    <div class="review-label">
                      <mat-icon>card_giftcard</mat-icon>
                      Items You're Bringing
                    </div>
                    <div class="review-items">
                      @for (sel of selectedItems(); track sel.item.id) {
                        <div class="review-item-row">
                          <span class="review-item-name">{{
                            sel.item.name
                          }}</span>
                          <span class="review-item-qty"
                            >× {{ sel.quantity }}</span
                          >
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <div class="step-actions">
                  <button mat-button matStepperPrevious class="back-btn">
                    <mat-icon>arrow_back</mat-icon>
                    Back
                  </button>
                  <button
                    class="submit-btn"
                    (click)="submit()"
                    [disabled]="submitting()">
                    @if (submitting()) {
                      <mat-spinner
                        diameter="20"
                        class="btn-spinner"></mat-spinner>
                      <span>Submitting...</span>
                    } @else {
                      <mat-icon>check_circle</mat-icon>
                      <span>Confirm Reservation</span>
                    }
                  </button>
                </div>
              </div>
            </mat-step>
          </mat-stepper>
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* ── Top Nav ── */
      iconify-icon {
        display: inline-flex;
        vertical-align: middle;
      }

      .top-nav {
        position: sticky;
        top: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 24px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--border);
      }

      .nav-back {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--navy);
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9rem;
        transition: color var(--transition);

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
        &:hover {
          color: var(--primary);
        }
      }

      .nav-title {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        font-family: var(--font-display);
        font-weight: 600;
        color: var(--navy);
        font-size: 1rem;
        pointer-events: none;
        white-space: nowrap;
      }

      .nav-spacer {
        width: 0;
      }

      /* ── Page Hero ── */
      .page-hero {
        text-align: center;
        padding: 48px 24px 32px;
        background: linear-gradient(
          180deg,
          var(--surface-warm) 0%,
          var(--background) 100%
        );
      }

      .hero-emoji {
        display: inline-block;
        font-size: 2.5rem;
        margin-bottom: 8px;
        animation: float 3s ease-in-out infinite;
      }

      .page-hero h1 {
        font-family: var(--font-display);
        font-size: 2rem;
        font-weight: 700;
        color: var(--navy);
        margin-bottom: 8px;
      }

      .page-hero p {
        color: var(--text-secondary);
        font-size: 1rem;
        max-width: 440px;
        margin: 0 auto;
      }

      /* ── Stepper ── */
      .stepper-container {
        max-width: 960px;
        padding-top: 32px;
        padding-bottom: 80px;
      }

      .register-stepper {
        background: transparent !important;
      }

      .step-content {
        padding: 28px 0;
      }

      /* ── Welcome Back Banner ── */
      .welcome-back-banner {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 20px;
        background: var(--secondary-light);
        border: 1px solid rgba(129, 178, 154, 0.3);
        border-radius: var(--radius);
        margin-bottom: 24px;
        animation: fadeInUp 0.4s ease-out;
      }

      .wb-icon {
        font-size: 1.5rem;
        color: var(--secondary-dark);
        flex-shrink: 0;
      }

      .wb-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;

        strong {
          color: var(--navy);
          font-size: 0.95rem;
        }

        span {
          color: var(--text-secondary);
          font-size: 0.82rem;
        }
      }

      .wb-change {
        background: none;
        border: none;
        color: var(--primary);
        font-weight: 600;
        font-size: 0.82rem;
        cursor: pointer;
        white-space: nowrap;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        transition: all var(--transition);

        &:hover {
          background: var(--primary-light);
          color: var(--primary-dark);
        }
      }

      .step-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 28px;
      }

      .step-emoji {
        font-size: 2rem;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .step-header h2 {
        font-family: var(--font-display);
        font-size: 1.4rem;
        font-weight: 600;
        color: var(--navy);
        margin-bottom: 4px;
      }

      .step-header p {
        color: var(--text-secondary);
        font-size: 0.95rem;
      }

      .personal-form {
        max-width: 100%;
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

      .step-actions {
        display: flex;
        gap: 12px;
        margin-top: 28px;
        justify-content: flex-end;
      }

      .action-btn {
        border-radius: 999px !important;
        padding: 0 28px !important;
        height: 44px !important;
        font-weight: 600 !important;
      }

      .back-btn {
        color: var(--text-secondary) !important;
        font-weight: 500 !important;
      }

      /* ── Loading ── */
      .loading-state {
        display: flex;
        justify-content: center;
        padding: 48px;
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

      /* ── Item Selection Cards (Grid) ── */
      .category-chips {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding: 0 2px 16px;
        margin-bottom: 8px;

        &::-webkit-scrollbar {
          display: none;
        }
      }

      .cat-chip {
        white-space: nowrap;
        padding: 8px 18px;
        border-radius: 999px;
        border: 1.5px solid var(--border);
        background: var(--surface);
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all var(--transition);

        &:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        &.active {
          background: var(--navy);
          border-color: var(--navy);
          color: white;
          box-shadow: var(--shadow);
        }
      }

      .items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 18px;
      }

      .gift-card {
        position: relative;
        background: var(--surface);
        border-radius: var(--radius-lg);
        border: 2px solid var(--border);
        overflow: hidden;
        cursor: pointer;
        transition: all var(--transition);

        &:hover:not(.fully-reserved) {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: rgba(var(--primary-rgb), 0.3);
        }

        &.selected {
          border-color: var(--primary);
          box-shadow:
            0 0 0 3px rgba(var(--primary-rgb), 0.12),
            var(--shadow-lg);

          .card-check .check-empty {
            border-color: var(--primary);
          }
        }

        &.fully-reserved {
          opacity: 0.55;
          cursor: not-allowed;

          &:hover {
            transform: none;
            box-shadow: none;
          }
        }
      }

      .card-check {
        position: absolute;
        top: 16px;
        left: 16px;
        z-index: 3;
      }

      .check-empty {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: 2.5px solid var(--border-strong);
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(4px);
        transition: all var(--transition);
      }

      .check-active {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: scale-in 0.2s ease-out;
        box-shadow: 0 2px 8px rgba(224, 122, 95, 0.35);

        mat-icon {
          color: white;
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .check-disabled {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: var(--border);
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          color: var(--text-light);
          font-size: 16px;
          width: 16px;
          height: 16px;
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

      .gift-card-inner {
        padding: 24px;
        padding-top: 20px;
      }

      .gift-top-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
        margin-left: 36px;
      }

      .gift-emoji {
        font-size: 1.75rem;
      }

      .gift-category {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--primary);
        background: var(--primary-light);
        padding: 4px 12px;
        border-radius: 999px;
      }

      .gift-name {
        font-family: var(--font-display);
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--navy);
        margin-bottom: 6px;
      }

      .gift-desc {
        font-size: 0.88rem;
        color: var(--text-secondary);
        line-height: 1.5;
        margin-bottom: 16px;
      }

      /* ── Progress Bar ── */
      .progress-wrap {
        margin-bottom: 8px;
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

      /* ── Quantity Row ── */
      .qty-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border);
      }

      .qty-label {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-secondary);
        line-height: 1;
      }

      .qty-field {
        width: 72px;

        ::ng-deep .mat-mdc-form-field-subscript-wrapper {
          display: none;
        }

        ::ng-deep .mat-mdc-form-field-infix {
          min-height: 40px;
          padding: 8px 0 !important;
        }
      }

      .selection-summary {
        text-align: center;
        padding: 14px;
        background: var(--secondary-light);
        color: var(--secondary-dark);
        border-radius: var(--radius);
        font-weight: 600;
        font-size: 0.9rem;
        margin-top: 20px;
      }

      /* ── Review Card ── */
      .review-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        overflow: hidden;
      }

      .review-section {
        padding: 24px;
      }

      .review-divider {
        height: 1px;
        background: var(--border);
      }

      .review-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-secondary);
        margin-bottom: 12px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: var(--primary);
        }
      }

      .review-value {
        font-size: 1rem;
        color: var(--navy);
        line-height: 1.6;
      }

      .review-email {
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .review-items {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .review-item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
        background: var(--accent-light);
        border-radius: var(--radius-sm);
      }

      .review-item-name {
        font-weight: 500;
        color: var(--navy);
      }

      .review-item-qty {
        font-weight: 700;
        color: var(--primary);
        font-family: var(--font-display);
      }

      /* ── Submit Button ── */
      .submit-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 28px;
        background: var(--secondary);
        color: white;
        border: none;
        border-radius: 999px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition);
        box-shadow: 0 4px 16px rgba(129, 178, 154, 0.3);

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        &:hover:not(:disabled) {
          background: var(--secondary-dark);
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(129, 178, 154, 0.4);
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

      /* ── Success State ── */
      .success-container {
        min-height: calc(100vh - 54px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 24px;
        position: relative;
        overflow: hidden;
      }

      .confetti-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .conf {
        position: absolute;
        font-size: 1.5rem;
        animation: confetti-fall 4s linear infinite;
        opacity: 0;
      }
      .conf-1 {
        left: 10%;
        animation-delay: 0s;
      }
      .conf-2 {
        left: 30%;
        animation-delay: 0.5s;
      }
      .conf-3 {
        left: 50%;
        animation-delay: 1s;
      }
      .conf-4 {
        left: 70%;
        animation-delay: 1.5s;
      }
      .conf-5 {
        left: 85%;
        animation-delay: 2s;
      }

      .success-card {
        text-align: center;
        max-width: 480px;
        background: var(--surface);
        padding: 48px 40px;
        border-radius: var(--radius-xl);
        border: 1px solid var(--border);
        box-shadow: var(--shadow-lg);
        position: relative;
        z-index: 1;
        animation: scale-in 0.5s ease-out;
      }

      .success-emoji {
        font-size: 3.5rem;
        margin-bottom: 16px;
      }

      .success-card h2 {
        font-family: var(--font-display);
        font-size: 2rem;
        font-weight: 700;
        color: var(--navy);
        margin-bottom: 8px;
      }

      .success-msg {
        color: var(--text-secondary);
        font-size: 1rem;
        margin-bottom: 20px;
        line-height: 1.5;
      }

      .success-name-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: var(--secondary-light);
        color: var(--secondary-dark);
        padding: 8px 20px;
        border-radius: 999px;
        font-size: 0.9rem;
        margin-bottom: 20px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .success-items-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 28px;
      }

      .success-item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        background: var(--accent-light);
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
      }

      .qty-badge {
        font-weight: 700;
        color: var(--primary);
        font-family: var(--font-display);
      }

      .success-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .btn-solid,
      .btn-outline {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 24px;
        border-radius: 999px;
        font-size: 0.9rem;
        font-weight: 600;
        text-decoration: none;
        transition: all var(--transition);
        cursor: pointer;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .btn-solid {
        background: var(--primary);
        color: white;
        border: 1.5px solid var(--primary);
        box-shadow: 0 2px 8px rgba(224, 122, 95, 0.25);

        &:hover {
          background: var(--primary-dark);
          transform: translateY(-1px);
        }
      }

      .btn-outline {
        background: transparent;
        color: var(--navy);
        border: 1.5px solid var(--border-strong);

        &:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--primary-light);
        }
      }

      /* ── Responsive ── */
      @media (max-width: 768px) {
        .top-nav {
          padding: 10px 16px;
        }

        .nav-back span {
          display: none;
        }

        .page-hero {
          padding: 36px 16px 24px;
        }

        .page-hero h1 {
          font-size: 1.5rem;
        }

        .items-grid {
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .gift-card-inner {
          padding: 18px 16px;
        }

        .category-chips {
          padding-bottom: 12px;
        }

        .success-card {
          padding: 36px 24px;
        }

        .success-actions {
          flex-direction: column;
        }

        .btn-solid,
        .btn-outline {
          justify-content: center;
        }
      }
    `,
  ],
})
export class RegisterComponent implements OnInit, OnDestroy {
  @ViewChild("stepper") stepper!: MatStepper;

  sessionId!: number;
  session = signal<Session | null>(null);
  items = signal<Item[]>([]);
  loading = signal(true);
  submitted = signal(false);
  submitting = signal(false);
  submittedName = signal("");
  selectedItems = signal<SelectedItem[]>([]);
  isReturningGuest = signal(false);

  personalForm: FormGroup;
  private subscriptions: Subscription[] = [];
  selectedCategory = signal("");

  private categoryEmojis: Record<string, string> = {
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
  };

  categories = computed(() => {
    const cats = [
      ...new Set(
        this.items()
          .map((i) => i.category)
          .filter(Boolean),
      ),
    ];
    return cats.sort();
  });

  filteredAvailableItems = computed(() => {
    const cat = this.selectedCategory();
    const all = this.items();
    if (!cat) return all;
    return all.filter((i) => i.category === cat);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private api: ApiService,
    private socketService: SocketService,
    private snackBar: MatSnackBar,
    private guestSession: GuestSessionService,
  ) {
    this.personalForm = this.fb.group({
      firstName: ["", [Validators.required, Validators.minLength(2)]],
      lastName: ["", [Validators.required, Validators.minLength(2)]],
      email: ["", [Validators.required, Validators.email]],
    });

    // Pre-fill from saved guest info
    const saved = this.guestSession.guest();
    if (saved) {
      this.personalForm.patchValue({
        firstName: saved.firstName,
        lastName: saved.lastName,
        email: saved.email,
      });
      this.isReturningGuest.set(true);
    }
  }

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get("sessionId"));

    this.socketService.joinSession(this.sessionId);

    this.api.getSession(this.sessionId).subscribe((session) => {
      this.session.set(session);
    });

    this.api.getItems(this.sessionId).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);

        // Pre-select item if specified in query params
        const preSelectId = this.route.snapshot.queryParamMap.get("item");
        if (preSelectId) {
          const item = items.find((i) => i.id === Number(preSelectId));
          if (item && item.available_quantity > 0) {
            this.selectedItems.set([{ item, quantity: 1 }]);
          }
        }

        // Auto-advance to Step 2 for returning guests
        if (this.isReturningGuest() && this.personalForm.valid) {
          setTimeout(() => {
            this.stepper?.next();
          });
        }
      },
      error: () => this.loading.set(false),
    });

    // Listen for real-time item updates
    this.subscriptions.push(
      this.socketService.on<Item[]>("items-updated").subscribe((items) => {
        this.items.set(items);
        // Update selected items availability
        this.selectedItems.update((selected) =>
          selected.filter((s) => {
            const updated = items.find((i) => i.id === s.item.id);
            return updated && updated.available_quantity > 0;
          }),
        );
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.socketService.leaveSession(this.sessionId);
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  getProgressValue(item: Item): number {
    if (item.quantity === 0) return 0;
    return (item.reserved_quantity / item.quantity) * 100;
  }

  getCategoryEmoji(category: string): string {
    return this.categoryEmojis[category] || "tabler:pin";
  }

  getItemEmoji(category: string | undefined): string {
    if (!category) return "tabler:gift";
    return this.categoryEmojis[category] || "tabler:gift";
  }

  isSelected(item: Item): boolean {
    return this.selectedItems().some((s) => s.item.id === item.id);
  }

  getSelectedQuantity(item: Item): number {
    const found = this.selectedItems().find((s) => s.item.id === item.id);
    return found?.quantity || 1;
  }

  getQuantityOptions(item: Item): number[] {
    return Array.from({ length: item.available_quantity }, (_, i) => i + 1);
  }

  toggleItem(item: Item): void {
    if (item.available_quantity <= 0) return;

    if (this.isSelected(item)) {
      this.selectedItems.update((items) =>
        items.filter((s) => s.item.id !== item.id),
      );
    } else {
      this.selectedItems.update((items) => [...items, { item, quantity: 1 }]);
    }
  }

  setQuantity(item: Item, quantity: number): void {
    this.selectedItems.update((items) =>
      items.map((s) => (s.item.id === item.id ? { ...s, quantity } : s)),
    );
  }

  submit(): void {
    if (!this.personalForm.valid || this.selectedItems().length === 0) return;

    this.submitting.set(true);

    const registration = {
      session_id: this.sessionId,
      first_name: this.personalForm.get("firstName")!.value,
      last_name: this.personalForm.get("lastName")!.value,
      email: this.personalForm.get("email")!.value,
      reservations: this.selectedItems().map((s) => ({
        item_id: s.item.id,
        quantity: s.quantity,
      })),
    };

    this.api.registerGuest(registration).subscribe({
      next: () => {
        // Save guest info for next time
        this.guestSession.save({
          firstName: registration.first_name,
          lastName: registration.last_name,
          email: registration.email,
        });

        this.submittedName.set(
          `${registration.first_name} ${registration.last_name}`,
        );
        this.submitted.set(true);
        this.submitting.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        const message =
          err.error?.error || "Something went wrong. Please try again.";
        this.snackBar.open(message, "Dismiss", {
          duration: 5000,
          panelClass: "error-snackbar",
        });
      },
    });
  }

  /** Reset to gift selection for another reservation (same guest) */
  reserveMore(): void {
    this.submitted.set(false);
    this.selectedItems.set([]);
    this.selectedCategory.set("");
    this.isReturningGuest.set(true);

    // Re-fetch items to get updated availability
    this.loading.set(true);
    this.api.getItems(this.sessionId).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Jump stepper to Step 2 (gift selection)
    setTimeout(() => {
      this.stepper?.reset();
      // Patch form again since reset clears it
      const saved = this.guestSession.guest();
      if (saved) {
        this.personalForm.patchValue({
          firstName: saved.firstName,
          lastName: saved.lastName,
          email: saved.email,
        });
      }
      setTimeout(() => this.stepper?.next());
    });
  }

  /** Let user re-enter their info */
  clearSavedGuest(): void {
    this.guestSession.clear();
    this.isReturningGuest.set(false);
    this.personalForm.reset();
  }
}
