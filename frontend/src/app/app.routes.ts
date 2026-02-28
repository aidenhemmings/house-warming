import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./pages/home/home.component").then((m) => m.HomeComponent),
  },
  {
    path: "registry/:sessionId",
    loadComponent: () =>
      import("./pages/registry/registry.component").then(
        (m) => m.RegistryComponent,
      ),
  },
  {
    path: "register/:sessionId",
    loadComponent: () =>
      import("./pages/register/register.component").then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: "admin/login",
    loadComponent: () =>
      import("./pages/admin/login/login.component").then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: "admin",
    loadComponent: () =>
      import("./pages/admin/layout/admin-layout.component").then(
        (m) => m.AdminLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./pages/admin/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: "sessions",
        loadComponent: () =>
          import("./pages/admin/sessions/sessions.component").then(
            (m) => m.SessionsComponent,
          ),
      },
      {
        path: "sessions/:sessionId/items",
        loadComponent: () =>
          import("./pages/admin/items/items.component").then(
            (m) => m.ItemsComponent,
          ),
      },
      {
        path: "sessions/:sessionId/guests",
        loadComponent: () =>
          import("./pages/admin/guests/guests.component").then(
            (m) => m.GuestsComponent,
          ),
      },
    ],
  },
  {
    path: "**",
    redirectTo: "",
  },
];
