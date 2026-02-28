import { Injectable, signal, computed } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({ providedIn: "root" })
export class AuthService {
  private tokenSignal = signal<string | null>(this.getStoredToken());

  isAuthenticated = computed(() => !!this.tokenSignal());

  constructor(private router: Router) {}

  private getStoredToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_token");
    }
    return null;
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  setToken(token: string): void {
    localStorage.setItem("admin_token", token);
    this.tokenSignal.set(token);
  }

  logout(): void {
    localStorage.removeItem("admin_token");
    this.tokenSignal.set(null);
    this.router.navigate(["/admin/login"]);
  }
}
