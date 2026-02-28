import { Component, OnInit, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Subscription } from "rxjs";
import { ApiService, Guest, Session } from "../../../core/services/api.service";
import { SocketService } from "../../../core/services/socket.service";

@Component({
  selector: "app-guests",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTooltipModule,
  ],
  template: `
    <div class="guests-page">
      <div class="page-hero">
        <div class="hero-text">
          <a routerLink="/admin/sessions" class="back-link">
            <mat-icon>arrow_back</mat-icon> Sessions
          </a>
          <h1>👥 Guests — {{ session()?.name }}</h1>
          <p>View registered guests and their reserved items</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (guests().length === 0) {
        <div class="empty-card">
          <div class="empty-icon">🙋</div>
          <h3>No Guests Yet</h3>
          <p>
            No one has registered for this session yet. Share the registry link!
          </p>
          <button
            class="action-btn primary-btn"
            style="margin-top:16px"
            (click)="copyLink()">
            <mat-icon>content_copy</mat-icon>
            Copy Registry Link
          </button>
        </div>
      } @else {
        <div class="summary-bar">
          <div class="summary-pill">
            <strong>{{ guests().length }}</strong> guests
          </div>
          <div class="summary-pill reserved-pill">
            <strong>{{ totalReservations() }}</strong> items reserved
          </div>
          <span class="spacer"></span>
          <button class="action-btn outline-btn" (click)="copyLink()">
            <mat-icon>content_copy</mat-icon>
            Copy Link
          </button>
        </div>

        <div class="guests-list">
          @for (guest of guests(); track guest.id) {
            <div
              class="guest-card"
              [class.expanded]="expandedGuestId === guest.id">
              <div class="guest-header" (click)="toggleExpand(guest.id)">
                <div class="guest-avatar">{{ getInitials(guest) }}</div>
                <div class="guest-info-brief">
                  <span class="guest-name"
                    >{{ guest.first_name }} {{ guest.last_name }}</span
                  >
                  <span class="guest-email">{{ guest.email }}</span>
                </div>
                <span class="items-pill">
                  {{ guest.reservations ? guest.reservations.length : 0 }} items
                </span>
                <mat-icon class="expand-icon">
                  {{
                    expandedGuestId === guest.id ? "expand_less" : "expand_more"
                  }}
                </mat-icon>
              </div>

              @if (expandedGuestId === guest.id) {
                <div class="guest-body">
                  <div class="guest-meta">
                    <div class="meta-row">
                      <mat-icon>email</mat-icon>
                      <span>{{ guest.email }}</span>
                    </div>
                    <div class="meta-row">
                      <mat-icon>calendar_today</mat-icon>
                      <span>Registered {{ formatDate(guest.created_at) }}</span>
                    </div>
                  </div>

                  @if (guest.reservations && guest.reservations.length > 0) {
                    <h4 class="reserved-title">Reserved Items</h4>
                    <div class="reserved-items">
                      @for (
                        res of guest.reservations;
                        track res.reservation_id
                      ) {
                        <div class="reserved-item">
                          <div class="reserved-item-info">
                            <span class="reserved-item-name">{{
                              res.item_name
                            }}</span>
                            @if (res.item_category) {
                              <span class="reserved-item-cat">{{
                                res.item_category
                              }}</span>
                            }
                          </div>
                          <span class="reserved-item-qty"
                            >× {{ res.quantity }}</span
                          >
                        </div>
                      }
                    </div>
                  }

                  <div class="guest-actions">
                    <button
                      class="action-btn danger-btn"
                      (click)="deleteGuest(guest)">
                      <mat-icon>delete</mat-icon>
                      Remove Guest & Reservations
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .guests-page {
        width: 100%;
      }

      /* ─── Hero ─── */
      .page-hero {
        margin-bottom: 28px;
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
      .danger-btn {
        background: rgba(239, 68, 68, 0.08);
        color: #dc2626;
        &:hover {
          background: rgba(239, 68, 68, 0.15);
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

      /* ─── Summary ─── */
      .summary-bar {
        display: flex;
        align-items: center;
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

      .spacer {
        flex: 1;
      }

      /* ─── Guest Cards ─── */
      .guests-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .guest-card {
        background: white;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        overflow: hidden;
        transition: all var(--transition);
        &:hover {
          box-shadow: var(--shadow-lg);
        }
      }

      .guest-header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 20px;
        cursor: pointer;
        transition: background var(--transition);
        &:hover {
          background: rgba(0, 0, 0, 0.02);
        }
      }

      .guest-avatar {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.85rem;
        flex-shrink: 0;
      }

      .guest-info-brief {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .guest-name {
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 1rem;
        color: var(--navy);
      }

      .guest-email {
        font-size: 0.82rem;
        color: var(--text-secondary);
      }

      .items-pill {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--primary);
        background: rgba(224, 122, 95, 0.1);
        padding: 4px 12px;
        border-radius: 999px;
        white-space: nowrap;
      }

      .expand-icon {
        color: var(--text-light);
        transition: transform 0.2s;
      }

      /* ─── Expanded Body ─── */
      .guest-body {
        padding: 0 20px 20px;
        border-top: 1px solid var(--border);
        animation: fadeInUp 0.2s ease-out;
      }

      .guest-meta {
        padding: 16px 0;
      }

      .meta-row {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-bottom: 6px;
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: var(--text-light);
        }
      }

      .reserved-title {
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .reserved-items {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .reserved-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: rgba(224, 122, 95, 0.06);
        border-radius: 12px;
      }

      .reserved-item-name {
        font-weight: 500;
        color: var(--navy);
        margin-right: 8px;
      }

      .reserved-item-cat {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--primary);
        opacity: 0.7;
      }

      .reserved-item-qty {
        font-weight: 700;
        color: var(--primary);
      }

      .guest-actions {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
})
export class GuestsComponent implements OnInit, OnDestroy {
  sessionId!: number;
  session = signal<Session | null>(null);
  guests = signal<Guest[]>([]);
  loading = signal(true);
  expandedGuestId: number | null = null;

  private subscriptions: Subscription[] = [];

  totalReservations = () =>
    this.guests().reduce((sum, g) => sum + (g.reservations?.length || 0), 0);

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private socketService: SocketService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get("sessionId"));

    this.socketService.joinSession(this.sessionId);

    this.api.getSession(this.sessionId).subscribe((session) => {
      this.session.set(session);
    });

    this.loadGuests();

    // Real-time updates
    this.subscriptions.push(
      this.socketService.on<any>("guest-registered").subscribe(() => {
        this.loadGuests();
      }),
      this.socketService.on<any>("guest-removed").subscribe(() => {
        this.loadGuests();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.socketService.leaveSession(this.sessionId);
  }

  loadGuests(): void {
    this.api.getGuests(this.sessionId).subscribe({
      next: (guests) => {
        this.guests.set(guests);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleExpand(guestId: number): void {
    this.expandedGuestId = this.expandedGuestId === guestId ? null : guestId;
  }

  getInitials(guest: Guest): string {
    return (guest.first_name[0] + guest.last_name[0]).toUpperCase();
  }

  deleteGuest(guest: Guest): void {
    if (
      !confirm(
        `Remove ${guest.first_name} ${guest.last_name}? This will free up their reserved items.`,
      )
    ) {
      return;
    }

    this.api.deleteGuest(guest.id).subscribe({
      next: () => {
        this.loadGuests();
        this.snackBar.open("Guest removed successfully", "OK", {
          duration: 3000,
        });
      },
    });
  }

  copyLink(): void {
    const url = `${window.location.origin}/register/${this.sessionId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open("Registry link copied to clipboard!", "OK", {
        duration: 3000,
      });
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
