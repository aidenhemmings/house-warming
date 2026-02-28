import { Injectable, OnDestroy } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { io, Socket } from "socket.io-client";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class SocketService implements OnDestroy {
  private socket: Socket;
  private currentSessionId: number | null = null;

  constructor() {
    this.socket = io(environment.socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
      // Rejoin session if we were in one
      if (this.currentSessionId) {
        this.joinSession(this.currentSessionId);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  }

  joinSession(sessionId: number): void {
    if (this.currentSessionId && this.currentSessionId !== sessionId) {
      this.leaveSession(this.currentSessionId);
    }
    this.currentSessionId = sessionId;
    this.socket.emit("join-session", sessionId);
  }

  leaveSession(sessionId: number): void {
    this.socket.emit("leave-session", sessionId);
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
  }

  on<T>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      this.socket.on(event, (data: T) => {
        observer.next(data);
      });

      return () => {
        this.socket.off(event);
      };
    });
  }

  ngOnDestroy(): void {
    if (this.currentSessionId) {
      this.leaveSession(this.currentSessionId);
    }
    this.socket.disconnect();
  }
}
