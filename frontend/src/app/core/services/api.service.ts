import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface CategoryDef {
  name: string;
  icon?: string;
}

export interface Session {
  id: number;
  name: string;
  description: string;
  event_date: string;
  is_active: boolean;
  categories: CategoryDef[];
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: number;
  session_id: number;
  name: string;
  description: string;
  category: string;
  quantity: number | null;
  icon: string;
  image_url: string;
  reserved_quantity: number;
  available_quantity: number | null;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: number;
  session_id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  reservations: {
    reservation_id: number;
    item_id: number;
    item_name: string;
    item_category: string;
    quantity: number;
  }[];
}

export interface SessionStats {
  total_items: string;
  total_quantity: string;
  reserved_quantity: string;
  total_guests: string;
}

export interface GuestLookup {
  guest: { first_name: string; last_name: string; email: string } | null;
  reservations: {
    reservation_id: number;
    item_id: number;
    item_name: string;
    item_category: string;
    quantity: number;
  }[];
}

export interface Reservation {
  item_id: number;
  quantity: number;
}

export interface GuestRegistration {
  session_id: number;
  first_name: string;
  last_name: string;
  email: string;
  reservations: Reservation[];
}

@Injectable({ providedIn: "root" })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Auth
  login(
    username: string,
    password: string,
  ): Observable<{ token: string; admin: any }> {
    return this.http.post<{ token: string; admin: any }>(
      `${this.baseUrl}/auth/login`,
      {
        username,
        password,
      },
    );
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/me`);
  }

  // Sessions
  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.baseUrl}/sessions`);
  }

  getSession(id: number): Observable<Session> {
    return this.http.get<Session>(`${this.baseUrl}/sessions/${id}`);
  }

  createSession(session: Partial<Session>): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions`, session);
  }

  updateSession(id: number, session: Partial<Session>): Observable<Session> {
    return this.http.put<Session>(`${this.baseUrl}/sessions/${id}`, session);
  }

  deleteSession(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/sessions/${id}`);
  }

  getSessionStats(id: number): Observable<SessionStats> {
    return this.http.get<SessionStats>(`${this.baseUrl}/sessions/${id}/stats`);
  }

  // Items
  getItems(sessionId: number): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.baseUrl}/items`, {
      params: { session_id: sessionId.toString() },
    });
  }

  getItem(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.baseUrl}/items/${id}`);
  }

  createItem(item: Partial<Item>): Observable<Item> {
    return this.http.post<Item>(`${this.baseUrl}/items`, item);
  }

  updateItem(id: number, item: Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.baseUrl}/items/${id}`, item);
  }

  deleteItem(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/items/${id}`);
  }

  // Guests
  getGuests(sessionId: number): Observable<Guest[]> {
    return this.http.get<Guest[]>(`${this.baseUrl}/guests`, {
      params: { session_id: sessionId.toString() },
    });
  }

  registerGuest(registration: GuestRegistration): Observable<any> {
    return this.http.post(`${this.baseUrl}/guests`, registration);
  }

  lookupGuest(email: string, sessionId: number): Observable<GuestLookup> {
    return this.http.get<GuestLookup>(`${this.baseUrl}/guests/lookup`, {
      params: { email, session_id: sessionId.toString() },
    });
  }

  cancelReservation(reservationId: number, email: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/guests/reservations/${reservationId}`,
      {
        params: { email },
      },
    );
  }

  deleteGuest(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/guests/${id}`);
  }
}
