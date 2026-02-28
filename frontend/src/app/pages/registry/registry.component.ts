import { Component, OnInit, OnDestroy, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatChipsModule } from "@angular/material/chips";
import { MatBadgeModule } from "@angular/material/badge";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatToolbarModule } from "@angular/material/toolbar";
import { Subscription } from "rxjs";
import { ApiService, Item, Session } from "../../core/services/api.service";
import { SocketService } from "../../core/services/socket.service";

@Component({
  selector: "app-registry",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
  ],
  template: `
    <!-- Elegant top nav -->
    <nav class="top-nav">
      <a routerLink="/" class="nav-back">
        <mat-icon>arrow_back</mat-icon>
        <span>Home</span>
      </a>
      <span class="nav-title">{{ session()?.name || "Registry" }}</span>
      <a class="nav-cta" [routerLink]="['/register', sessionId]">
        <mat-icon>card_giftcard</mat-icon>
        <span>Reserve Gifts</span>
      </a>
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
            <span class="hero-emoji">🎁</span>
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

        <!-- Category Filter -->
        @if (categories().length > 1) {
          <div class="category-bar">
            <div class="container">
              <div class="category-scroll">
                <button
                  class="cat-chip"
                  [class.active]="selectedCategory() === ''"
                  (click)="selectCategory('')">
                  ✨ All
                </button>
                @for (cat of categories(); track cat) {
                  <button
                    class="cat-chip"
                    [class.active]="selectedCategory() === cat"
                    (click)="selectCategory(cat)">
                    {{ getCategoryEmoji(cat) }} {{ cat }}
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
                <div class="empty-emoji">📦</div>
                <h3>No items here yet</h3>
                <p>Check back soon — we're still adding things!</p>
              </div>
            } @else {
              <div class="items-grid">
                @for (item of filteredItems(); track item.id; let i = $index) {
                  <div
                    class="item-card fade-in"
                    [class.fully-reserved]="item.available_quantity <= 0"
                    [style.animation-delay]="i * 0.06 + 's'">
                    <!-- Availability ribbon -->
                    @if (item.available_quantity <= 0) {
                      <div class="ribbon">
                        <span>Claimed!</span>
                      </div>
                    }

                    <div class="item-card-inner">
                      <div class="item-top-row">
                        <span class="item-emoji">{{
                          getItemEmoji(item.category)
                        }}</span>
                        @if (item.category) {
                          <span class="item-category">{{ item.category }}</span>
                        }
                      </div>

                      <h3 class="item-name">{{ item.name }}</h3>

                      @if (item.description) {
                        <p class="item-desc">{{ item.description }}</p>
                      }

                      <!-- Progress visualization -->
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

                      <!-- Action -->
                      <div class="item-action">
                        @if (item.available_quantity > 0) {
                          <a
                            class="btn-reserve"
                            [routerLink]="['/register', sessionId]"
                            [queryParams]="{ item: item.id }">
                            <mat-icon>add_shopping_cart</mat-icon>
                            Reserve This
                          </a>
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
  `,
  styles: [
    `
      /* ── Top Navigation ── */
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
        font-family: var(--font-display);
        font-weight: 600;
        color: var(--navy);
        font-size: 1.1rem;
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
    this.items().reduce((sum, i) => sum + i.quantity, 0),
  );
  totalReserved = computed(() =>
    this.items().reduce((sum, i) => sum + i.reserved_quantity, 0),
  );
  totalAvailable = computed(() =>
    this.items().reduce((sum, i) => sum + i.available_quantity, 0),
  );

  private categoryEmojis: Record<string, string> = {
    Kitchen: "🍳",
    "Living Room": "🛋️",
    Bedroom: "🛏️",
    Bathroom: "🛁",
    Garden: "🌱",
    Outdoor: "☀️",
    Decor: "🖼️",
    Electronics: "📱",
    Cleaning: "🧹",
    Storage: "📦",
    Dining: "🍽️",
    Entertainment: "🎮",
  };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private socketService: SocketService,
  ) {}

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
    return this.categoryEmojis[category] || "📌";
  }

  getItemEmoji(category: string | undefined): string {
    if (!category) return "🎁";
    return this.categoryEmojis[category] || "🎁";
  }
}
