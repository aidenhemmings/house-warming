import { Injectable, signal } from "@angular/core";

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
}

const STORAGE_KEY = "hw_guest_info";

@Injectable({ providedIn: "root" })
export class GuestSessionService {
  private _guest = signal<GuestInfo | null>(null);

  constructor() {
    this.load();
  }

  /** Current saved guest (reactive signal) */
  get guest() {
    return this._guest;
  }

  /** Whether we have a returning guest */
  hasGuest(): boolean {
    return this._guest() !== null;
  }

  /** Save guest info to memory + localStorage */
  save(info: GuestInfo): void {
    this._guest.set(info);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    } catch {
      // storage unavailable — memory-only is fine
    }
  }

  /** Clear saved guest info */
  clear(): void {
    this._guest.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  }

  /** Load from localStorage on startup */
  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GuestInfo;
        if (parsed.firstName && parsed.lastName && parsed.email) {
          this._guest.set(parsed);
        }
      }
    } catch {
      // corrupt data — ignore
    }
  }
}
