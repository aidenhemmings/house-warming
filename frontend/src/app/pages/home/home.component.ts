import {
  Component,
  OnInit,
  signal,
  CUSTOM_ELEMENTS_SCHEMA,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ApiService, Session } from "../../core/services/api.service";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="home-page">
      <!-- Floating decorative elements -->
      <div class="decorations" aria-hidden="true">
        <span class="deco deco-1"
          ><iconify-icon icon="tabler:home-heart"></iconify-icon
        ></span>
        <span class="deco deco-2"
          ><iconify-icon icon="tabler:leaf"></iconify-icon
        ></span>
        <span class="deco deco-3"
          ><iconify-icon icon="tabler:sparkles"></iconify-icon
        ></span>
        <span class="deco deco-4"
          ><iconify-icon icon="tabler:confetti"></iconify-icon
        ></span>
        <span class="deco deco-5"
          ><iconify-icon icon="tabler:plant-2"></iconify-icon
        ></span>
        <span class="deco deco-6"
          ><iconify-icon icon="tabler:balloon"></iconify-icon
        ></span>
      </div>

      <!-- Hero Section -->
      <header class="hero">
        <div class="hero-bg-shapes" aria-hidden="true">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>

        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-emoji"
              ><iconify-icon icon="tabler:home"></iconify-icon
            ></span>
            <span class="badge-text">You're Invited!</span>
          </div>

          <h1>Welcome to Our<br /><em>Housewarming</em></h1>

          <p class="hero-subtitle">
            We're so excited to open the doors to our new home — and even more
            thrilled to celebrate with <strong>you</strong>. Browse our
            registry, pick something special, and let's make memories together!
          </p>

          <div class="hero-cta">
            <a class="btn-primary" (click)="scrollToEvents()">
              <span>Browse Events</span>
              <mat-icon>arrow_downward</mat-icon>
            </a>
          </div>

          <div class="hero-stats" aria-label="Quick stats">
            <div class="hero-stat">
              <span class="hero-stat-num">{{ sessions().length }}</span>
              <span class="hero-stat-label">{{
                sessions().length === 1 ? "Event" : "Events"
              }}</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <span class="hero-stat-num"
                ><iconify-icon icon="tabler:gift"></iconify-icon
              ></span>
              <span class="hero-stat-label">Gifts to Choose</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <span class="hero-stat-num"
                ><iconify-icon icon="tabler:heart-filled"></iconify-icon
              ></span>
              <span class="hero-stat-label">Lots of Love</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Events Section -->
      <main class="events-section" id="events">
        <div class="container">
          @if (loading()) {
            <div class="loading-state">
              <div class="loading-shimmer"></div>
              <p>Finding upcoming celebrations...</p>
            </div>
          } @else if (sessions().length === 0) {
            <div class="empty-state">
              <div class="empty-illustration">
                <iconify-icon icon="tabler:crane"></iconify-icon>
              </div>
              <h2>Still Setting Up!</h2>
              <p>
                We're getting everything ready. Check back soon for our
                housewarming event details!
              </p>
            </div>
          } @else {
            <div class="section-header">
              <span class="section-tag">Upcoming Celebrations</span>
              <h2 class="section-title">Choose Your Event</h2>
              <p class="section-subtitle">
                Pick the housewarming party you'll be attending and explore the
                registry.
              </p>
            </div>

            <div class="events-grid">
              @for (session of sessions(); track session.id; let i = $index) {
                <div
                  class="event-card fade-in"
                  [style.animation-delay]="i * 0.1 + 's'">
                  <div class="event-card-accent"></div>
                  <div class="event-card-body">
                    <div class="event-card-top">
                      <div class="event-emoji">
                        <iconify-icon icon="tabler:confetti"></iconify-icon>
                      </div>
                      @if (session.event_date) {
                        <div class="event-date-badge">
                          <span class="date-month">{{
                            getMonth(session.event_date)
                          }}</span>
                          <span class="date-day">{{
                            getDay(session.event_date)
                          }}</span>
                        </div>
                      }
                    </div>

                    <h3 class="event-name">{{ session.name }}</h3>

                    @if (session.event_date) {
                      <p class="event-date-full">
                        <iconify-icon icon="tabler:calendar"></iconify-icon>
                        {{ formatDate(session.event_date) }}
                      </p>
                    }

                    @if (session.description) {
                      <p class="event-description">{{ session.description }}</p>
                    }

                    <div class="event-card-actions">
                      <a
                        class="btn-outline"
                        [routerLink]="['/registry', session.id]">
                        <mat-icon>auto_awesome</mat-icon>
                        <span>View Registry</span>
                      </a>
                      <a
                        class="btn-solid"
                        [routerLink]="['/register', session.id]">
                        <mat-icon>card_giftcard</mat-icon>
                        <span>Reserve Gifts</span>
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </main>

      <!-- How It Works -->
      <section class="how-it-works">
        <div class="container">
          <div class="section-header">
            <span class="section-tag">Simple & Easy</span>
            <h2 class="section-title">How It Works</h2>
          </div>
          <div class="steps-grid">
            <div class="step-card">
              <div class="step-number">1</div>
              <div class="step-emoji">
                <iconify-icon icon="tabler:eye"></iconify-icon>
              </div>
              <h3>Browse</h3>
              <p>Check out our curated wish list of items for the new home</p>
            </div>
            <div class="step-connector" aria-hidden="true">
              <mat-icon>arrow_forward</mat-icon>
            </div>
            <div class="step-card">
              <div class="step-number">2</div>
              <div class="step-emoji">
                <iconify-icon icon="tabler:gift"></iconify-icon>
              </div>
              <h3>Reserve</h3>
              <p>Claim the items you'd like to gift — no duplicates!</p>
            </div>
            <div class="step-connector" aria-hidden="true">
              <mat-icon>arrow_forward</mat-icon>
            </div>
            <div class="step-card">
              <div class="step-number">3</div>
              <div class="step-emoji">
                <iconify-icon icon="tabler:mood-happy"></iconify-icon>
              </div>
              <h3>Celebrate</h3>
              <p>Bring your gift to the party and let's have a great time!</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
          <div class="footer-emoji">
            <iconify-icon icon="tabler:home-heart"></iconify-icon>
          </div>
          <p class="footer-tagline">Made with love for our new beginning</p>
          <a routerLink="/admin/login" class="admin-link">Admin</a>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      .home-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        overflow-x: hidden;
        position: relative;
      }

      /* ── Iconify base styling ── */
      iconify-icon {
        display: inline-flex;
        vertical-align: middle;
      }

      /* ── Floating decorations ── */
      .decorations {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
      }

      .deco {
        position: absolute;
        font-size: 1.5rem;
        opacity: 0.15;
        animation: float 6s ease-in-out infinite;
      }
      .deco-1 {
        top: 10%;
        left: 5%;
        animation-delay: 0s;
      }
      .deco-2 {
        top: 25%;
        right: 8%;
        animation-delay: 1.5s;
        font-size: 1.2rem;
      }
      .deco-3 {
        top: 60%;
        left: 3%;
        animation-delay: 3s;
        font-size: 1rem;
      }
      .deco-4 {
        top: 75%;
        right: 5%;
        animation-delay: 0.5s;
      }
      .deco-5 {
        top: 45%;
        left: 92%;
        animation-delay: 2s;
        font-size: 1.3rem;
      }
      .deco-6 {
        top: 85%;
        left: 15%;
        animation-delay: 4s;
        font-size: 1.1rem;
      }

      /* ── Hero ── */
      .hero {
        position: relative;
        background: linear-gradient(
          160deg,
          #3d405b 0%,
          #5c5f7a 40%,
          #81b29a 100%
        );
        color: white;
        padding: 100px 24px 80px;
        text-align: center;
        overflow: hidden;
      }

      .hero-bg-shapes {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }

      .shape {
        position: absolute;
        border-radius: 50%;
        opacity: 0.08;
        background: white;
      }
      .shape-1 {
        width: 400px;
        height: 400px;
        top: -100px;
        right: -80px;
        animation: float 8s ease-in-out infinite;
      }
      .shape-2 {
        width: 250px;
        height: 250px;
        bottom: -60px;
        left: -40px;
        animation: float 10s ease-in-out infinite reverse;
      }
      .shape-3 {
        width: 150px;
        height: 150px;
        top: 40%;
        left: 20%;
        animation: float 7s ease-in-out infinite;
        animation-delay: 2s;
      }

      .hero-content {
        position: relative;
        z-index: 1;
        max-width: 720px;
        margin: 0 auto;
      }

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 8px 20px;
        border-radius: 999px;
        margin-bottom: 28px;
        animation: scale-in 0.6s ease-out;
      }

      .badge-emoji {
        font-size: 1.25rem;
      }

      .badge-text {
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .hero h1 {
        font-family: var(--font-display);
        font-size: 3.5rem;
        font-weight: 700;
        line-height: 1.15;
        margin-bottom: 20px;
        animation: fadeInUp 0.7s ease-out 0.15s both;
      }

      .hero h1 em {
        font-style: italic;
        color: var(--accent);
      }

      .hero-subtitle {
        font-size: 1.15rem;
        line-height: 1.7;
        opacity: 0.9;
        max-width: 560px;
        margin: 0 auto 32px;
        animation: fadeInUp 0.7s ease-out 0.3s both;
      }

      .hero-cta {
        animation: fadeInUp 0.7s ease-out 0.45s both;
        margin-bottom: 48px;
      }

      .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 14px 32px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 999px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition);
        text-decoration: none;
        box-shadow: 0 4px 16px rgba(224, 122, 95, 0.3);

        &:hover {
          background: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(224, 122, 95, 0.4);
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .hero-stats {
        display: inline-flex;
        align-items: center;
        gap: 24px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 16px 32px;
        border-radius: var(--radius-lg);
        animation: fadeInUp 0.7s ease-out 0.6s both;
      }

      .hero-stat {
        text-align: center;
      }

      .hero-stat-num {
        display: block;
        font-size: 1.4rem;
        font-weight: 700;
        font-family: var(--font-display);
      }

      .hero-stat-label {
        font-size: 0.75rem;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: 2px;
        display: block;
      }

      .hero-stat-divider {
        width: 1px;
        height: 32px;
        background: rgba(255, 255, 255, 0.2);
      }

      /* ── Events Section ── */
      .events-section {
        flex: 1;
        padding: 72px 0 80px;
        position: relative;
        z-index: 1;
      }

      .section-header {
        text-align: center;
        margin-bottom: 48px;
      }

      .section-tag {
        display: inline-block;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--primary);
        background: var(--primary-light);
        padding: 6px 16px;
        border-radius: 999px;
        margin-bottom: 16px;
      }

      .section-title {
        font-family: var(--font-display);
        font-size: 2.25rem;
        font-weight: 700;
        color: var(--navy);
        margin-bottom: 12px;
      }

      .section-subtitle {
        font-size: 1.05rem;
        color: var(--text-secondary);
        max-width: 500px;
        margin: 0 auto;
        line-height: 1.6;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 80px 0;
        color: var(--text-secondary);
      }

      .loading-shimmer {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(
          90deg,
          var(--primary-light),
          var(--accent-light),
          var(--primary-light)
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }

      .empty-state {
        text-align: center;
        padding: 80px 24px;

        .empty-illustration {
          font-size: 4rem;
          margin-bottom: 20px;
          animation: float 4s ease-in-out infinite;
        }

        h2 {
          font-family: var(--font-display);
          font-size: 1.75rem;
          color: var(--navy);
          margin-bottom: 8px;
        }

        p {
          color: var(--text-secondary);
          max-width: 400px;
          margin: 0 auto;
          line-height: 1.6;
        }
      }

      /* ── Event Cards ── */
      .events-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 28px;
      }

      .event-card {
        background: var(--surface);
        border-radius: var(--radius-lg);
        overflow: hidden;
        border: 1px solid var(--border);
        transition: all var(--transition);
        position: relative;

        &:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-xl);
          border-color: transparent;
        }

        &:hover .event-card-accent {
          height: 6px;
        }
      }

      .event-card-accent {
        height: 4px;
        background: linear-gradient(
          90deg,
          var(--primary),
          var(--accent),
          var(--secondary)
        );
        transition: height var(--transition);
      }

      .event-card-body {
        padding: 28px;
      }

      .event-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .event-emoji {
        font-size: 2.5rem;
        animation: float 3s ease-in-out infinite;
      }

      .event-date-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: var(--navy);
        color: white;
        border-radius: var(--radius-sm);
        padding: 8px 14px;
        min-width: 56px;
      }

      .date-month {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        opacity: 0.8;
      }

      .date-day {
        font-size: 1.5rem;
        font-weight: 700;
        font-family: var(--font-display);
        line-height: 1;
      }

      .event-name {
        font-family: var(--font-display);
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--navy);
        margin-bottom: 6px;
      }

      .event-date-full {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 6px;

        iconify-icon {
          font-size: 16px;
          color: var(--primary);
        }
      }

      .event-description {
        font-size: 0.95rem;
        color: var(--text-secondary);
        line-height: 1.6;
        margin-bottom: 24px;
      }

      .event-card-actions {
        display: flex;
        gap: 12px;
      }

      .btn-outline,
      .btn-solid {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 20px;
        border-radius: 999px;
        font-size: 0.875rem;
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

      .btn-solid {
        background: var(--primary);
        color: white;
        border: 1.5px solid var(--primary);
        box-shadow: 0 2px 8px rgba(224, 122, 95, 0.25);

        &:hover {
          background: var(--primary-dark);
          border-color: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(224, 122, 95, 0.35);
        }
      }

      /* ── How It Works ── */
      .how-it-works {
        background: var(--surface-warm);
        padding: 72px 0;
        position: relative;
        z-index: 1;
      }

      .steps-grid {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .step-card {
        text-align: center;
        padding: 32px 24px;
        max-width: 220px;
        position: relative;
      }

      .step-number {
        position: absolute;
        top: 12px;
        right: 16px;
        font-family: var(--font-display);
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--primary);
        opacity: 0.12;
        line-height: 1;
      }

      .step-emoji {
        font-size: 2.5rem;
        margin-bottom: 16px;
        display: block;
      }

      .step-card h3 {
        font-family: var(--font-display);
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--navy);
        margin-bottom: 8px;
      }

      .step-card p {
        font-size: 0.9rem;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      .step-connector {
        color: var(--primary);
        opacity: 0.3;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      /* ── Footer ── */
      .footer {
        text-align: center;
        padding: 40px 24px;
        background: var(--navy);
        color: rgba(255, 255, 255, 0.7);
        position: relative;
        z-index: 1;
      }

      .footer-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .footer-emoji {
        font-size: 1.5rem;
        margin-bottom: 4px;
      }

      .footer-tagline {
        font-size: 0.9rem;
        font-style: italic;
        font-family: var(--font-display);
      }

      .admin-link {
        color: rgba(255, 255, 255, 0.3);
        text-decoration: none;
        font-size: 0.75rem;
        margin-top: 8px;
        transition: color var(--transition);

        &:hover {
          color: rgba(255, 255, 255, 0.6);
        }
      }

      /* ── Responsive ── */
      @media (max-width: 768px) {
        .hero {
          padding: 72px 20px 56px;
        }

        .hero h1 {
          font-size: 2.25rem;
        }

        .hero-subtitle {
          font-size: 1rem;
        }

        .hero-stats {
          flex-direction: column;
          gap: 12px;
          padding: 16px 24px;
        }

        .hero-stat-divider {
          width: 40px;
          height: 1px;
        }

        .events-grid {
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .event-card-actions {
          flex-direction: column;
        }

        .btn-outline,
        .btn-solid {
          justify-content: center;
        }

        .section-title {
          font-size: 1.75rem;
        }

        .steps-grid {
          flex-direction: column;
          gap: 0;
        }

        .step-connector {
          transform: rotate(90deg);
        }

        .deco {
          display: none;
        }
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  sessions = signal<Session[]>([]);
  loading = signal(true);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getSessions().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions.filter((s) => s.is_active));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  scrollToEvents(): void {
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  getMonth(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  }

  getDay(dateStr: string): string {
    const date = new Date(dateStr);
    return date.getDate().toString();
  }
}
