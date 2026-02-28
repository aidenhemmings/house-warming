import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet, RouterLink, RouterLinkActive } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-admin-layout",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
  ],
  template: `
    <div class="admin-layout">
      <header class="admin-toolbar">
        <button class="menu-toggle" (click)="sidenavOpen = !sidenavOpen">
          <mat-icon>{{ sidenavOpen ? "menu_open" : "menu" }}</mat-icon>
        </button>
        <span class="brand"
          >🏠 <span class="brand-text">Registry Admin</span></span
        >
        <span class="spacer"></span>
        <a routerLink="/" class="toolbar-btn" title="View Public Site">
          <mat-icon>open_in_new</mat-icon>
        </a>
        <button
          class="toolbar-btn logout-btn"
          (click)="logout()"
          title="Logout">
          <mat-icon>logout</mat-icon>
        </button>
      </header>

      <div class="admin-body" [class.sidenav-open]="sidenavOpen">
        <aside class="admin-sidenav" [class.open]="sidenavOpen">
          <nav>
            <a
              routerLink="/admin/dashboard"
              routerLinkActive="active-link"
              class="nav-item">
              <mat-icon>dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            <a
              routerLink="/admin/sessions"
              routerLinkActive="active-link"
              class="nav-item">
              <mat-icon>event</mat-icon>
              <span>Sessions</span>
            </a>
          </nav>
        </aside>

        <main class="admin-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-layout {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f5f3f0;
      }

      /* ─── Toolbar ─── */
      .admin-toolbar {
        display: flex;
        align-items: center;
        height: 60px;
        padding: 0 20px;
        background: var(--navy);
        color: white;
        position: sticky;
        top: 0;
        z-index: 200;
        box-shadow: 0 2px 12px rgba(61, 64, 91, 0.18);
      }

      .menu-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border: none;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        cursor: pointer;
        transition: all var(--transition);
        margin-right: 12px;

        &:hover {
          background: rgba(255, 255, 255, 0.18);
        }
      }

      .brand {
        font-size: 1.3rem;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .brand-text {
        font-family: var(--font-display);
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .spacer {
        flex: 1;
      }

      .toolbar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        text-decoration: none;
        transition: all var(--transition);

        &:hover {
          background: rgba(255, 255, 255, 0.12);
          color: white;
        }
      }

      .logout-btn {
        margin-left: 4px;
      }

      /* ─── Body ─── */
      .admin-body {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      /* ─── Sidenav ─── */
      .admin-sidenav {
        width: 0;
        overflow: hidden;
        background: white;
        border-right: 1px solid var(--border);
        transition: width 0.25s ease;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;

        &.open {
          width: 220px;
        }
      }

      .admin-sidenav nav {
        padding: 16px 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 16px;
        border-radius: 12px;
        text-decoration: none;
        color: var(--text-secondary);
        font-weight: 500;
        font-size: 0.95rem;
        transition: all var(--transition);
        white-space: nowrap;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        &:hover {
          background: rgba(129, 178, 154, 0.08);
          color: var(--navy);
        }
      }

      .active-link {
        background: rgba(224, 122, 95, 0.1) !important;
        color: var(--primary) !important;
        font-weight: 600;
      }

      /* ─── Content ─── */
      .admin-content {
        flex: 1;
        overflow-y: auto;
        padding: 32px;
      }

      @media (max-width: 768px) {
        .admin-sidenav.open {
          width: 180px;
        }
        .admin-content {
          padding: 16px;
        }
        .brand-text {
          display: none;
        }
      }
    `,
  ],
})
export class AdminLayoutComponent {
  sidenavOpen = true;

  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
