import { Component, EventEmitter, Output } from '@angular/core';
import { LucideHistory, LucideHome, LucideSettings, LucideTarget } from '@lucide/angular';

export type BottomNavAction = 'home' | 'goals' | 'history' | 'settings';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [LucideHistory, LucideHome, LucideSettings, LucideTarget],
  template: `
    <nav class="bottom-nav" aria-label="Primary">
      <button class="active" type="button" (click)="navigate.emit('home')" aria-label="Home">
        <svg lucideHome size="20" aria-hidden="true"></svg>
        <i aria-hidden="true"></i>
      </button>
      <button type="button" (click)="navigate.emit('goals')" aria-label="Goals">
        <svg lucideTarget size="20" aria-hidden="true"></svg>
      </button>
      <button type="button" (click)="navigate.emit('history')" aria-label="History">
        <svg lucideHistory size="20" aria-hidden="true"></svg>
      </button>
      <button type="button" (click)="navigate.emit('settings')" aria-label="Settings">
        <svg lucideSettings size="20" aria-hidden="true"></svg>
      </button>
    </nav>
  `,
  styles: `
    .bottom-nav {
      position: fixed;
      right: max(0px, calc((100vw - 430px) / 2));
      bottom: 0;
      left: max(0px, calc((100vw - 430px) / 2));
      z-index: 15;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-top: 1px solid var(--line-light);
      background: white;
      padding: 8px 20px calc(12px + env(safe-area-inset-bottom));
    }

    button {
      position: relative;
      display: grid;
      min-height: 44px;
      place-items: center;
      border: 0;
      background: transparent;
      color: var(--muted-light);
    }

    .active {
      color: var(--teal-strong);
    }

    i {
      position: absolute;
      bottom: 0;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--teal-strong);
    }
  `,
})
export class BottomNavComponent {
  @Output() navigate = new EventEmitter<BottomNavAction>();
}
