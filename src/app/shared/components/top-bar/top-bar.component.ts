import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { LucideBell, LucideSignal, LucideWifi } from '@lucide/angular';

type ConnectionKind = 'wifi' | 'cellular';

interface NavigatorConnection extends EventTarget {
  type?: string;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NavigatorConnection;
  mozConnection?: NavigatorConnection;
  webkitConnection?: NavigatorConnection;
}

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [LucideBell, LucideSignal, LucideWifi],
  template: `
    <header class="top-shell">
      <div class="status-bar" aria-hidden="true">
        <span>{{ time() }}</span>
        <span class="network-icons">
          <svg
            lucideWifi
            size="16"
            [class.active-wifi]="connection() === 'wifi'"
            aria-hidden="true"
          ></svg>
          <svg
            lucideSignal
            size="16"
            [class.active-mobile]="connection() === 'cellular'"
            aria-hidden="true"
          ></svg>
        </span>
      </div>

      @if (!compact) {
        <div class="topbar">
          <div>
            <p>Good morning,</p>
            <h1>{{ title }}</h1>
          </div>

          <div class="actions">
            <button class="bell" type="button" (click)="notifications.emit()" aria-label="Notifications">
              <svg lucideBell size="17" aria-hidden="true"></svg>
              <i aria-hidden="true"></i>
            </button>
            <button class="avatar" type="button" (click)="settings.emit()" aria-label="Settings">
              {{ initials }}
            </button>
          </div>
        </div>
      }
    </header>
  `,
  styles: `
    .top-shell {
      display: grid;
      gap: 10px;
      background: transparent;
    }

    .status-bar,
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .status-bar {
      min-height: 24px;
      color: var(--ink);
      font-size: 0.78rem;
      font-weight: 800;
    }

    .network-icons {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--muted-light);
    }

    .network-icons svg {
      color: var(--muted-light);
    }

    .network-icons .active-wifi {
      color: var(--teal-strong);
    }

    .network-icons .active-mobile {
      color: var(--violet-strong);
    }

    .topbar {
      gap: 12px;
    }

    p,
    h1 {
      margin: 0;
      letter-spacing: 0;
    }

    p {
      color: var(--muted-light);
      font-size: 0.72rem;
      font-weight: 700;
      margin-bottom: 3px;
    }

    h1 {
      color: var(--ink);
      font-size: 1.25rem;
      font-weight: 800;
      line-height: 1.08;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    button {
      min-width: 44px;
      min-height: 44px;
      border-radius: 50%;
    }

    .bell {
      position: relative;
      display: grid;
      place-items: center;
      border: 1px solid var(--line);
      background: var(--muted-bg);
      color: var(--muted);
    }

    .bell i {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      border: 1.5px solid white;
      border-radius: 50%;
      background: var(--rose-mid);
    }

    .avatar {
      border: 1px solid var(--teal-soft);
      background: var(--teal-wash);
      color: var(--teal-strong);
      font-size: 0.88rem;
      font-weight: 900;
    }
  `,
})
export class TopBarComponent {
  @Input() title = 'Ana & Ben';
  @Input() initials = 'AB';
  @Input() compact = false;
  @Output() notifications = new EventEmitter<void>();
  @Output() settings = new EventEmitter<void>();

  readonly time = signal('');
  readonly connection = signal<ConnectionKind>('wifi');

  private timerId = 0;
  private readonly connectionInfo = this.getConnection();
  private readonly updateConnection = () => {
    this.connection.set(this.connectionInfo?.type === 'cellular' ? 'cellular' : 'wifi');
  };

  ngOnInit(): void {
    this.updateTime();
    this.updateConnection();
    this.timerId = window.setInterval(() => this.updateTime(), 1000);
    this.connectionInfo?.addEventListener('change', this.updateConnection);
    window.addEventListener('online', this.updateConnection);
  }

  ngOnDestroy(): void {
    window.clearInterval(this.timerId);
    this.connectionInfo?.removeEventListener('change', this.updateConnection);
    window.removeEventListener('online', this.updateConnection);
  }

  private updateTime(): void {
    this.time.set(new Intl.DateTimeFormat('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    }).format(new Date()));
  }

  private getConnection(): NavigatorConnection | undefined {
    const typedNavigator = navigator as NavigatorWithConnection;
    return typedNavigator.connection ?? typedNavigator.mozConnection ?? typedNavigator.webkitConnection;
  }
}
