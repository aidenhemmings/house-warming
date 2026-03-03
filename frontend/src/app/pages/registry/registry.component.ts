import {
  Component,
  OnInit,
  OnDestroy,
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
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatChipsModule } from "@angular/material/chips";
import { MatBadgeModule } from "@angular/material/badge";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { Subscription } from "rxjs";
import {
  ApiService,
  Item,
  Session,
  GuestLookup,
} from "../../core/services/api.service";
import { SocketService } from "../../core/services/socket.service";
import { GuestSessionService } from "../../core/services/guest-session.service";

@Component({
  selector: "app-registry",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- Elegant top nav -->
    <nav class="top-nav">
      <a routerLink="/" class="nav-back">
        <mat-icon>arrow_back</mat-icon>
        <span>Home</span>
      </a>
      <span class="nav-title">{{ session()?.name || "Registry" }}</span>
      @if (!guestSession.hasGuest()) {
        <a class="nav-cta" [routerLink]="['/register', sessionId]">
          <mat-icon>card_giftcard</mat-icon>
          <span>Reserve Gifts</span>
        </a>
      } @else {
        <span class="nav-spacer"></span>
      }
    </nav>

    <div class="registry-page">
      @if (loading()) {
        <div class="loading-state">
          <div class="loading-dots">
            <span></span><span></span><span></span>
          </div>
          <p>Loading your registry...</p>
        </div>
      } @else {
        <!-- Page Hero -->
        <header class="registry-hero">
          <div class="container">
            <img src="assets/logo-small.png" alt="Logo" class="registry-logo" />
            <h1>Gift Registry</h1>
            <p class="hero-desc">
              Here's what we'd love for our new home. Pick something that speaks
              to you — every gift means the world!
            </p>

            <!-- Stats Pills -->
            <div class="stats-pills">
              <div class="pill">
                <span class="pill-num">{{ totalItems() }}</span>
                <span class="pill-label">Items</span>
              </div>
              <div class="pill pill-success">
                <span class="pill-num">{{ totalAvailable() }}</span>
                <span class="pill-label">Available</span>
              </div>
              <div class="pill pill-warm">
                <span class="pill-num">{{ totalReserved() }}</span>
                <span class="pill-label">Claimed</span>
              </div>
            </div>
          </div>
        </header>

        <!-- My Reservations -->
        @if (guestSession.hasGuest() && myReservations().length > 0) {
          <section class="my-reservations">
            <div class="container">
              <div class="my-res-header">
                <iconify-icon icon="tabler:clipboard-list"></iconify-icon>
                <h2>Your Reservations</h2>
                <span class="my-res-count"
                  >{{ myReservations().length }} item{{
                    myReservations().length === 1 ? "" : "s"
                  }}</span
                >
              </div>
              <div class="my-res-grid">
                @for (res of myReservations(); track res.reservation_id) {
                  <div
                    class="my-res-card"
                    [class.cancelling]="cancellingId() === res.reservation_id">
                    <div class="my-res-info">
                      <span class="my-res-emoji">
                        <iconify-icon
                          [icon]="
                            getItemEmoji(res.item_category)
                          "></iconify-icon>
                      </span>
                      <div class="my-res-details">
                        <span class="my-res-name">{{ res.item_name }}</span>
                        @if (res.item_category) {
                          <span class="my-res-cat">{{
                            res.item_category
                          }}</span>
                        }
                        <span class="my-res-qty">Qty: {{ res.quantity }}</span>
                      </div>
                    </div>
                    <button
                      class="my-res-remove"
                      (click)="cancelReservation(res.reservation_id)"
                      [disabled]="cancellingId() === res.reservation_id">
                      @if (cancellingId() === res.reservation_id) {
                        <mat-icon>hourglass_empty</mat-icon>
                      } @else {
                        <iconify-icon icon="tabler:trash"></iconify-icon>
                      }
                      <span>{{
                        cancellingId() === res.reservation_id
                          ? "Removing…"
                          : "Remove"
                      }}</span>
                    </button>
                  </div>
                }
              </div>
            </div>
          </section>
        }

        <!-- Category Filter -->
        @if (categories().length > 1) {
          <div class="category-bar">
            <div class="container">
              <div class="category-scroll">
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
                    <iconify-icon [icon]="getCategoryEmoji(cat)"></iconify-icon>
                    {{ cat }}
                  </button>
                }
              </div>
            </div>
          </div>
        }

        <!-- Items -->
        <main class="items-section">
          <div class="container">
            @if (filteredItems().length === 0) {
              <div class="empty-state">
                <div class="empty-emoji">
                  <iconify-icon icon="tabler:package"></iconify-icon>
                </div>
                <h3>No items here yet</h3>
                <p>Check back soon — we're still adding things!</p>
              </div>
            } @else {
              <div class="items-grid">
                @for (item of filteredItems(); track item.id; let i = $index) {
                  <div
                    class="item-card fade-in"
                    [class.fully-reserved]="
                      item.available_quantity !== null &&
                      item.available_quantity <= 0
                    "
                    [style.animation-delay]="i * 0.06 + 's'">
                    <!-- Availability ribbon -->
                    @if (
                      item.available_quantity !== null &&
                      item.available_quantity <= 0
                    ) {
                      <div class="ribbon">
                        <span>Claimed!</span>
                      </div>
                    }

                    <div class="item-card-inner">
                      <div class="item-top-row">
                        <span class="item-emoji"
                          ><iconify-icon
                            [icon]="
                              item.icon || getItemEmoji(item.category)
                            "></iconify-icon
                        ></span>
                        @if (item.category) {
                          <span class="item-category">{{ item.category }}</span>
                        }
                      </div>

                      <h3 class="item-name">{{ item.name }}</h3>

                      @if (item.description) {
                        <p class="item-desc">{{ item.description }}</p>
                      }

                      <!-- Progress visualization -->
                      @if (item.quantity !== null) {
                        <div class="progress-wrap">
                          <div class="progress-track">
                            <div
                              class="progress-fill"
                              [class.complete]="
                                item.available_quantity !== null &&
                                item.available_quantity <= 0
                              "
                              [style.width.%]="getProgressValue(item)"></div>
                          </div>
                          <div class="progress-info">
                            <span class="progress-claimed"
                              >{{ item.reserved_quantity }}/{{
                                item.quantity
                              }}
                              claimed</span
                            >
                            @if (
                              item.available_quantity !== null &&
                              item.available_quantity > 0
                            ) {
                              <span class="progress-left"
                                >{{ item.available_quantity }} left</span
                              >
                            }
                          </div>
                        </div>
                      } @else {
                        <div class="progress-wrap">
                          <div class="progress-info">
                            <span class="progress-claimed unlimited-label">
                              <iconify-icon
                                icon="tabler:infinity"></iconify-icon>
                              Unlimited
                            </span>
                            @if (item.reserved_quantity > 0) {
                              <span class="progress-left"
                                >{{ item.reserved_quantity }} claimed</span
                              >
                            }
                          </div>
                        </div>
                      }

                      <!-- Action -->
                      <div class="item-action">
                        @if (
                          item.available_quantity === null ||
                          item.available_quantity > 0
                        ) {
                          @if (guestSession.hasGuest()) {
                            <div class="inline-reserve-row">
                              @if (
                                item.available_quantity === null ||
                                item.available_quantity > 1
                              ) {
                                <select
                                  class="qty-select"
                                  [value]="getReserveQty(item.id)"
                                  (change)="
                                    setReserveQty(
                                      item.id,
                                      +$any($event.target).value
                                    )
                                  ">
                                  @for (
                                    n of getQuantityOptions(item);
                                    track n
                                  ) {
                                    <option [value]="n">{{ n }}</option>
                                  }
                                </select>
                              }
                              <button
                                class="btn-reserve"
                                (click)="reserveItem(item)"
                                [disabled]="reservingItemId() === item.id">
                                @if (reservingItemId() === item.id) {
                                  <mat-spinner diameter="16"></mat-spinner>
                                } @else {
                                  <mat-icon>add_shopping_cart</mat-icon>
                                }
                                Reserve
                              </button>
                            </div>
                          } @else {
                            <button
                              class="btn-reserve"
                              (click)="goToRegisterWithItem(item)">
                              <mat-icon>add_shopping_cart</mat-icon>
                              Reserve This
                            </button>
                          }
                        } @else {
                          <span class="btn-claimed">
                            <mat-icon>check_circle</mat-icon>
                            All Claimed
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </main>
      }
    </div>

    <!-- Quick Reserve Modal (new guests) -->
    @if (quickReserveItem()) {
      <div class="qr-overlay" (click)="closeQuickReserve()">
        <div class="qr-card" (click)="$event.stopPropagation()">
          <div class="qr-header">
            <h2>Quick Reserve</h2>
            <button class="qr-close" (click)="closeQuickReserve()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <p class="qr-item-name">
            <iconify-icon
              [icon]="
                getItemEmoji(quickReserveItem()!.category)
              "></iconify-icon>
            {{ quickReserveItem()!.name }}
          </p>
          <form [formGroup]="quickReserveForm" class="qr-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="firstName" placeholder="Jane" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="lastName" placeholder="Smith" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input
                matInput
                formControlName="email"
                placeholder="jane@example.com"
                type="email" />
            </mat-form-field>
            @if (
              quickReserveItem()!.available_quantity === null ||
              quickReserveItem()!.available_quantity! > 1
            ) {
              <div class="qr-qty-row">
                <span>How many?</span>
                <select class="qty-select" formControlName="quantity">
                  @for (n of getQuantityOptions(quickReserveItem()!); track n) {
                    <option [value]="n">{{ n }}</option>
                  }
                </select>
              </div>
            }
          </form>
          <div class="qr-actions">
            <button class="qr-cancel" (click)="closeQuickReserve()">
              Cancel
            </button>
            <button
              class="qr-confirm"
              (click)="submitQuickReserve()"
              [disabled]="!quickReserveForm.valid || reservingItemId()">
              @if (reservingItemId()) {
                <mat-spinner diameter="16"></mat-spinner>
              } @else {
                <mat-icon>add_shopping_cart</mat-icon>
              }
              Reserve
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      /* ── Top Navigation ── */
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
        min-width: 0;
        flex-shrink: 0;

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
        font-size: 1.1rem;
        pointer-events: none;
        white-space: nowrap;
      }

      .nav-cta {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--primary);
        color: white;
        padding: 8px 20px;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all var(--transition);
        box-shadow: 0 2px 8px rgba(224, 122, 95, 0.25);

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover {
          background: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(224, 122, 95, 0.35);
        }
      }

      /* ── Hero ── */
      .registry-hero {
        text-align: center;
        padding: 56px 24px 40px;
        background: linear-gradient(
          180deg,
          var(--surface-warm) 0%,
          var(--background) 100%
        );
      }

      .registry-logo {
        width: 72px;
        height: auto;
        margin-bottom: 12px;
        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
        animation: float 3s ease-in-out infinite;
      }

      .hero-emoji {
        display: inline-block;
        font-size: 3rem;
        margin-bottom: 12px;
        animation: float 3s ease-in-out infinite;
      }

      .registry-hero h1 {
        font-family: var(--font-display);
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--navy);
        margin-bottom: 12px;
      }

      .hero-desc {
        font-size: 1.05rem;
        color: var(--text-secondary);
        max-width: 500px;
        margin: 0 auto 28px;
        line-height: 1.6;
      }

      .stats-pills {
        display: inline-flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--surface);
        border: 1px solid var(--border);
        padding: 8px 18px;
        border-radius: 999px;
        box-shadow: var(--shadow-xs);
      }

      .pill-num {
        font-weight: 700;
        font-family: var(--font-display);
        font-size: 1.1rem;
        color: var(--navy);
      }

      .pill-success .pill-num {
        color: var(--secondary-dark);
      }

      .pill-warm .pill-num {
        color: var(--primary);
      }

      .pill-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      /* ── Category Bar ── */
      .category-bar {
        position: sticky;
        top: 53px;
        z-index: 99;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border);
        padding: 12px 0;
      }

      .category-scroll {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding: 0 4px;

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

      /* ── Loading ── */
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

      .empty-state {
        text-align: center;
        padding: 80px 24px;

        .empty-emoji {
          font-size: 3.5rem;
          margin-bottom: 16px;
        }

        h3 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          color: var(--navy);
          margin-bottom: 8px;
        }

        p {
          color: var(--text-secondary);
        }
      }

      /* ── Items Section ── */
      .items-section {
        padding: 40px 0 80px;
      }

      .items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }

      .item-card {
        background: var(--surface);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
        overflow: hidden;
        transition: all var(--transition);
        position: relative;

        &:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: transparent;
        }

        &.fully-reserved {
          opacity: 0.65;

          &:hover {
            transform: none;
            box-shadow: none;
          }
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
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--navy);
        margin-bottom: 6px;
      }

      .item-desc {
        font-size: 0.9rem;
        color: var(--text-secondary);
        line-height: 1.5;
        margin-bottom: 18px;
      }

      /* ── Progress Bar ── */
      .progress-wrap {
        margin-bottom: 20px;
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

      .unlimited-label {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--primary);
        font-weight: 600;
      }

      .progress-left {
        color: var(--secondary-dark);
        font-weight: 600;
      }

      /* ── Actions ── */
      .item-action {
        display: flex;
      }

      .btn-reserve {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 22px;
        background: var(--primary);
        color: white;
        border-radius: 999px;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 600;
        transition: all var(--transition);
        box-shadow: 0 2px 8px rgba(224, 122, 95, 0.2);

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover {
          background: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(224, 122, 95, 0.3);
        }
      }

      .btn-claimed {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 22px;
        background: var(--secondary-light);
        color: var(--secondary-dark);
        border-radius: 999px;
        font-size: 0.875rem;
        font-weight: 600;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      /* ── My Reservations ── */
      .my-reservations {
        padding: 32px 0 0;
        background: var(--surface-warm);
        border-bottom: 1px solid var(--border);
      }

      .my-res-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;

        iconify-icon {
          font-size: 1.5rem;
          color: var(--primary);
        }

        h2 {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--navy);
          margin: 0;
        }
      }

      .my-res-count {
        font-size: 0.78rem;
        font-weight: 600;
        background: var(--primary-light);
        color: var(--primary);
        padding: 3px 12px;
        border-radius: 999px;
        margin-left: auto;
      }

      .my-res-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-bottom: 28px;
      }

      .my-res-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        transition: all var(--transition);

        &:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-xs);
        }

        &.cancelling {
          opacity: 0.5;
          pointer-events: none;
        }
      }

      .my-res-info {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
      }

      .my-res-emoji {
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .my-res-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .my-res-name {
        font-weight: 600;
        color: var(--navy);
        font-size: 0.95rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .my-res-cat {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--primary);
      }

      .my-res-qty {
        font-size: 0.78rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .my-res-remove {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 7px 14px;
        border: 1.5px solid var(--border);
        border-radius: 999px;
        background: var(--surface);
        color: var(--text-secondary);
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition);
        flex-shrink: 0;

        iconify-icon {
          font-size: 1rem;
        }

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }

        &:hover:not(:disabled) {
          border-color: #e74c3c;
          color: #e74c3c;
          background: rgba(231, 76, 60, 0.06);
        }

        &:disabled {
          cursor: wait;
          opacity: 0.6;
        }
      }

      /* ── Inline Reserve ── */
      .nav-spacer {
        width: 120px;
        flex-shrink: 0;
      }

      .btn-reserve {
        border: none;
        cursor: pointer;
      }

      .inline-reserve-row {
        display: flex;
        align-items: stretch;
        gap: 0;
      }

      .qty-select {
        appearance: none;
        -webkit-appearance: none;
        padding: 10px 30px 10px 16px;
        border: 2px solid var(--primary);
        border-right: none;
        border-radius: 999px 0 0 999px;
        font-size: 0.875rem;
        font-weight: 700;
        font-family: var(--font-display);
        color: var(--primary);
        background: white
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23E07A5F' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")
          no-repeat right 10px center;
        cursor: pointer;
        outline: none;
        min-width: 56px;
        text-align: center;
        transition: all var(--transition);
        &:focus {
          border-color: var(--primary-dark);
        }
        &:hover {
          background-color: rgba(224, 122, 95, 0.04);
        }
      }

      .inline-reserve-row .btn-reserve {
        border-radius: 0 999px 999px 0;
      }

      .inline-reserve-row:hover {
        transform: translateY(-1px);
      }

      .inline-reserve-row .btn-reserve:hover {
        transform: none;
      }

      /* When no qty select, keep full pill shape */
      .item-action > .inline-reserve-row > .btn-reserve:first-child {
        border-radius: 999px;
      }

      .btn-reserve:disabled {
        opacity: 0.6;
        cursor: wait;
      }

      .full-width {
        width: 100%;
      }

      /* ── Quick Reserve Modal ── */
      .qr-overlay {
        position: fixed;
        inset: 0;
        background: rgba(61, 64, 91, 0.45);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 24px;
        animation: fadeIn 0.2s ease-out;
      }

      .qr-card {
        width: 100%;
        max-width: 420px;
        background: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        overflow: hidden;
        padding: 28px;
      }

      .qr-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        h2 {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--navy);
          margin: 0;
        }
      }

      .qr-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        &:hover {
          background: rgba(0, 0, 0, 0.06);
        }
      }

      .qr-item-name {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: var(--navy);
        font-size: 1rem;
        margin-bottom: 20px;
        padding: 10px 14px;
        background: var(--surface-warm);
        border-radius: var(--radius);

        iconify-icon {
          font-size: 1.3rem;
        }
      }

      .qr-form {
        display: flex;
        flex-direction: column;
      }

      .qr-qty-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        font-weight: 500;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .qr-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 8px;
      }

      .qr-cancel {
        padding: 10px 20px;
        border-radius: 999px;
        border: 1.5px solid var(--border);
        background: white;
        color: var(--navy);
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        transition: all var(--transition);
        &:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
      }

      .qr-confirm {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 22px;
        border-radius: 999px;
        border: none;
        background: var(--primary);
        color: white;
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        transition: all var(--transition);
        box-shadow: 0 2px 8px rgba(224, 122, 95, 0.25);

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover:not(:disabled) {
          background: var(--primary-dark);
          transform: translateY(-1px);
        }
        &:disabled {
          opacity: 0.6;
          cursor: wait;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      /* ── Responsive ── */
      @media (max-width: 768px) {
        .top-nav {
          padding: 10px 16px;
        }

        .nav-cta span {
          display: none;
        }

        .registry-hero {
          padding: 40px 16px 32px;
        }

        .registry-hero h1 {
          font-size: 1.75rem;
        }

        .stats-pills {
          gap: 8px;
        }

        .pill {
          padding: 6px 14px;
        }

        .items-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
      }
    `,
  ],
})
export class RegistryComponent implements OnInit, OnDestroy {
  sessionId!: number;
  session = signal<Session | null>(null);
  items = signal<Item[]>([]);
  loading = signal(true);
  selectedCategory = signal("");
  myReservations = signal<GuestLookup["reservations"]>([]);
  cancellingId = signal<number | null>(null);
  reservingItemId = signal<number | null>(null);
  quickReserveItem = signal<Item | null>(null);
  reserveQuantities: Record<number, number> = {};

  quickReserveForm: FormGroup;
  private subscriptions: Subscription[] = [];

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

  filteredItems = computed(() => {
    const category = this.selectedCategory();
    if (!category) return this.items();
    return this.items().filter((i) => i.category === category);
  });

  totalItems = computed(() =>
    this.items().reduce((sum, i) => sum + (i.quantity ?? 0), 0),
  );
  totalReserved = computed(() =>
    this.items().reduce((sum, i) => sum + i.reserved_quantity, 0),
  );
  totalAvailable = computed(() =>
    this.items().reduce((sum, i) => sum + (i.available_quantity ?? 0), 0),
  );

  private categoryEmojis: Record<string, string> = {
    Kitchen: "tabler:tools-kitchen-2",
    "Living Room": "tabler:armchair",
    Bedroom: "tabler:bed",
    "Bedroom / Lounge": "tabler:bed",
    Bathroom: "tabler:bath",
    Garden: "tabler:plant",
    Outdoor: "tabler:sun",
    Decor: "tabler:photo",
    Electronics: "tabler:device-mobile",
    Cleaning: "tabler:brush",
    Storage: "tabler:box",
    Dining: "tabler:tools-kitchen",
    Entertainment: "tabler:device-gamepad-2",
    "Gift Cards": "tabler:gift-card",
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private api: ApiService,
    private socketService: SocketService,
    private snackBar: MatSnackBar,
    public guestSession: GuestSessionService,
  ) {
    this.quickReserveForm = this.fb.group({
      firstName: ["", [Validators.required, Validators.minLength(2)]],
      lastName: ["", [Validators.required, Validators.minLength(2)]],
      email: ["", [Validators.required, Validators.email]],
      quantity: [1],
    });
  }

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get("sessionId"));

    // Join socket room
    this.socketService.joinSession(this.sessionId);

    // Load data
    this.api.getSession(this.sessionId).subscribe((session) => {
      this.session.set(session);
    });

    this.api.getItems(this.sessionId).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Real-time updates
    this.subscriptions.push(
      this.socketService.on<Item[]>("items-updated").subscribe((items) => {
        this.items.set(items);
      }),
      this.socketService.on<Item>("item-created").subscribe((item) => {
        this.items.update((items) => [...items, item]);
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
      this.socketService
        .on<{ reservation_id: number }>("reservation-cancelled")
        .subscribe(() => {
          this.loadMyReservations();
        }),
      this.socketService.on<any>("guest-registered").subscribe(() => {
        this.loadMyReservations();
      }),
    );

    // Load guest's existing reservations
    this.loadMyReservations();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.socketService.leaveSession(this.sessionId);
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  loadMyReservations(): void {
    const guest = this.guestSession.guest();
    if (!guest) return;
    this.api.lookupGuest(guest.email, this.sessionId).subscribe({
      next: (data) => this.myReservations.set(data.reservations || []),
      error: () => this.myReservations.set([]),
    });
  }

  cancelReservation(reservationId: number): void {
    const guest = this.guestSession.guest();
    if (!guest) return;
    this.cancellingId.set(reservationId);
    this.api.cancelReservation(reservationId, guest.email).subscribe({
      next: () => {
        this.myReservations.update((res) =>
          res.filter((r) => r.reservation_id !== reservationId),
        );
        this.cancellingId.set(null);
        // Refresh items immediately so availability updates without waiting for socket
        this.api
          .getItems(this.sessionId)
          .subscribe((items) => this.items.set(items));
      },
      error: () => {
        this.cancellingId.set(null);
      },
    });
  }

  getProgressValue(item: Item): number {
    if (item.quantity === null || item.quantity === 0) return 0;
    return (item.reserved_quantity / item.quantity) * 100;
  }

  getCategoryEmoji(category: string): string {
    const sessionCat = this.session()?.categories?.find(
      (c: any) => (typeof c === "string" ? c : c.name) === category,
    );
    if (sessionCat && typeof sessionCat !== "string" && sessionCat.icon)
      return sessionCat.icon;
    return this.categoryEmojis[category] || "tabler:pin";
  }

  getItemEmoji(category: string | undefined): string {
    if (!category) return "tabler:gift";
    const sessionCat = this.session()?.categories?.find(
      (c: any) => (typeof c === "string" ? c : c.name) === category,
    );
    if (sessionCat && typeof sessionCat !== "string" && sessionCat.icon)
      return sessionCat.icon;
    return this.categoryEmojis[category] || "tabler:gift";
  }

  // ── Inline reserve (returning guests) ──

  getReserveQty(itemId: number): number {
    return this.reserveQuantities[itemId] || 1;
  }

  setReserveQty(itemId: number, qty: number): void {
    this.reserveQuantities[itemId] = qty;
  }

  getQuantityOptions(item: Item): number[] {
    if (item.available_quantity === null) {
      // Unlimited item — offer 1-10
      return Array.from({ length: 10 }, (_, i) => i + 1);
    }
    return Array.from({ length: item.available_quantity }, (_, i) => i + 1);
  }

  reserveItem(item: Item): void {
    const guest = this.guestSession.guest();
    if (!guest) return;
    this.reservingItemId.set(item.id);
    const qty = this.getReserveQty(item.id);

    this.api
      .registerGuest({
        session_id: this.sessionId,
        first_name: guest.firstName,
        last_name: guest.lastName,
        email: guest.email,
        reservations: [{ item_id: item.id, quantity: qty }],
      })
      .subscribe({
        next: () => {
          this.reservingItemId.set(null);
          delete this.reserveQuantities[item.id];
          this.snackBar.open(`Reserved ${qty} × ${item.name}`, "OK", {
            duration: 3000,
          });
          // Refresh items & reservations immediately so UI updates without waiting for socket
          this.api
            .getItems(this.sessionId)
            .subscribe((items) => this.items.set(items));
          this.loadMyReservations();
        },
        error: (err) => {
          this.reservingItemId.set(null);
          this.snackBar.open(
            err.error?.error || "Could not reserve — try again",
            "Dismiss",
            { duration: 4000 },
          );
        },
      });
  }

  // ── Navigate to register stepper with item pre-selected ──

  goToRegisterWithItem(item: Item): void {
    this.router.navigate(["/register", this.sessionId], {
      queryParams: { item: item.id },
    });
  }

  // ── Quick reserve modal (new guests) ──

  openQuickReserve(item: Item): void {
    this.quickReserveItem.set(item);
    this.quickReserveForm.reset({ quantity: 1 });
  }

  closeQuickReserve(): void {
    this.quickReserveItem.set(null);
  }

  submitQuickReserve(): void {
    if (!this.quickReserveForm.valid || !this.quickReserveItem()) return;

    const item = this.quickReserveItem()!;
    const { firstName, lastName, email, quantity } =
      this.quickReserveForm.value;
    this.reservingItemId.set(item.id);

    this.api
      .registerGuest({
        session_id: this.sessionId,
        first_name: firstName,
        last_name: lastName,
        email,
        reservations: [{ item_id: item.id, quantity: quantity || 1 }],
      })
      .subscribe({
        next: () => {
          // Save guest for future inline reserves
          this.guestSession.save({ firstName, lastName, email });
          this.reservingItemId.set(null);
          this.closeQuickReserve();
          this.snackBar.open(
            `Reserved ${quantity || 1} × ${item.name} — welcome!`,
            "OK",
            { duration: 3000 },
          );
          // Refresh items & reservations immediately so UI updates without waiting for socket
          this.api
            .getItems(this.sessionId)
            .subscribe((items) => this.items.set(items));
          this.loadMyReservations();
        },
        error: (err) => {
          this.reservingItemId.set(null);
          this.snackBar.open(
            err.error?.error || "Could not reserve — try again",
            "Dismiss",
            { duration: 4000 },
          );
        },
      });
  }
}
