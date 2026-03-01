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
import { forkJoin } from "rxjs";
import {
  ApiService,
  Session,
  SessionStats,
} from "../../../core/services/api.service";

interface SessionWithStats extends Session {
  stats?: SessionStats;
}

@Component({
  selector: "app-dashboard",
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
    <div class="dashboard">
      <div class="page-hero">
        <div class="hero-text">
          <h1>
            <iconify-icon icon="tabler:chart-bar"></iconify-icon> Dashboard
          </h1>
          <p>Overview of your housewarming registry sessions</p>
        </div>
        <div class="quick-actions">
          <a routerLink="/admin/sessions" class="action-btn primary-btn">
            <mat-icon>add</mat-icon>
            Manage Sessions
          </a>
          <a routerLink="/" target="_blank" class="action-btn outline-btn">
            <mat-icon>visibility</mat-icon>
            View Public Page
          </a>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (sessions().length === 0) {
        <div class="empty-card">
          <div class="empty-icon">
            <iconify-icon icon="tabler:calendar"></iconify-icon>
          </div>
          <h3>No Sessions Yet</h3>
          <p>Create your first housewarming session to get started</p>
          <a
            routerLink="/admin/sessions"
            class="action-btn primary-btn"
            style="margin-top:16px">
            <mat-icon>add</mat-icon>
            Create Session
          </a>
        </div>
      } @else {
        <div class="sessions-grid">
          @for (session of sessions(); track session.id) {
            <div class="session-card">
              <div class="card-head">
                <div>
                  <h2>{{ session.name }}</h2>
                  @if (session.event_date) {
                    <span class="card-date">{{
                      formatDate(session.event_date)
                    }}</span>
                  }
                </div>
                @if (session.is_active) {
                  <span class="badge active">Active</span>
                } @else {
                  <span class="badge inactive">Inactive</span>
                }
              </div>

              @if (session.stats) {
                <div class="stats-row">
                  <div class="mini-stat">
                    <div class="stat-icon items-bg">
                      <mat-icon>inventory_2</mat-icon>
                    </div>
                    <div>
                      <span class="stat-val">{{
                        session.stats.total_items
                      }}</span>
                      <span class="stat-lbl">Items</span>
                    </div>
                  </div>
                  <div class="mini-stat">
                    <div class="stat-icon guests-bg">
                      <mat-icon>people</mat-icon>
                    </div>
                    <div>
                      <span class="stat-val">{{
                        session.stats.total_guests
                      }}</span>
                      <span class="stat-lbl">Guests</span>
                    </div>
                  </div>
                  <div class="mini-stat">
                    <div class="stat-icon reserved-bg">
                      <mat-icon>check_circle</mat-icon>
                    </div>
                    <div>
                      <span class="stat-val">{{
                        session.stats.reserved_quantity
                      }}</span>
                      <span class="stat-lbl">Reserved</span>
                    </div>
                  </div>
                  <div class="mini-stat">
                    <div class="stat-icon avail-bg">
                      <mat-icon>hourglass_empty</mat-icon>
                    </div>
                    <div>
                      <span class="stat-val">{{
                        +session.stats.total_quantity -
                          +session.stats.reserved_quantity
                      }}</span>
                      <span class="stat-lbl">Available</span>
                    </div>
                  </div>
                </div>
              }

              <div class="card-actions">
                <a
                  [routerLink]="['/admin/sessions', session.id, 'items']"
                  class="card-link">
                  <mat-icon>list</mat-icon> Items
                </a>
                <a
                  [routerLink]="['/admin/sessions', session.id, 'guests']"
                  class="card-link">
                  <mat-icon>people</mat-icon> Guests
                </a>
                <a
                  [routerLink]="['/registry', session.id]"
                  target="_blank"
                  class="card-link muted">
                  <mat-icon>open_in_new</mat-icon> Public View
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .dashboard {
        width: 100%;
      }

      /* ─── Hero ─── */
      .page-hero {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 32px;
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

      .quick-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

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

        &:hover {
          background: var(--primary-dark);
          transform: translateY(-1px);
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

      /* ─── Loading / Empty ─── */
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
          font-weight: 700;
          color: var(--navy);
          margin-bottom: 6px;
        }

        p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
      }

      /* ─── Session Grid ─── */
      .sessions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
        gap: 20px;
      }

      .session-card {
        background: white;
        border-radius: var(--radius-lg);
        padding: 24px;
        box-shadow: var(--shadow);
        transition: all var(--transition);

        &:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }
      }

      .card-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;

        h2 {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--navy);
          margin-bottom: 4px;
        }
      }

      .card-date {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }

      .badge {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        flex-shrink: 0;
      }

      .badge.active {
        background: #d1fae5;
        color: #065f46;
      }
      .badge.inactive {
        background: #f3f4f6;
        color: #6b7280;
      }

      /* ─── Stats ─── */
      .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-bottom: 16px;
      }

      .mini-stat {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 8px;
        border-radius: 12px;
        background: #f9f9f7;
      }

      .stat-icon {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: white;
        }
      }

      .items-bg {
        background: var(--primary);
      }
      .guests-bg {
        background: var(--secondary);
      }
      .reserved-bg {
        background: var(--navy);
      }
      .avail-bg {
        background: var(--accent);
      }
      .avail-bg mat-icon {
        color: var(--navy) !important;
      }

      .stat-val {
        display: block;
        font-size: 1.1rem;
        font-weight: 700;
        line-height: 1.2;
        color: var(--text-primary);
      }

      .stat-lbl {
        font-size: 0.65rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      /* ─── Actions ─── */
      .card-actions {
        display: flex;
        gap: 6px;
        padding-top: 14px;
        border-top: 1px solid var(--border);
      }

      .card-link {
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

        &.muted {
          color: var(--text-secondary);
          background: rgba(0, 0, 0, 0.04);
          &:hover {
            background: rgba(0, 0, 0, 0.08);
          }
        }
      }

      @media (max-width: 768px) {
        .sessions-grid {
          grid-template-columns: 1fr;
        }
        .stats-row {
          grid-template-columns: repeat(2, 1fr);
        }
        .page-hero {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  sessions = signal<SessionWithStats[]>([]);
  loading = signal(true);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getSessions().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loading.set(false);

        // Fetch stats for each session
        sessions.forEach((session, index) => {
          this.api.getSessionStats(session.id).subscribe({
            next: (stats) => {
              this.sessions.update((current) =>
                current.map((s) => (s.id === session.id ? { ...s, stats } : s)),
              );
            },
          });
        });
      },
      error: () => this.loading.set(false),
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}
