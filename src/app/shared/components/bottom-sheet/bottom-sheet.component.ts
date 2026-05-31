import { animate, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideX } from '@lucide/angular';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [LucideX],
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('160ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('130ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('300ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('170ms ease-in', style({ transform: 'translateY(100%)' })),
      ]),
    ]),
  ],
  template: `
    @if (open) {
      <div class="sheet-backdrop" @fade (click)="close.emit()"></div>
      <section class="sheet" @slideUp role="dialog" aria-modal="true" [attr.aria-label]="title">
        <div class="sheet-handle"></div>
        <header>
          <h2>{{ title }}</h2>
          <button class="icon-button" type="button" (click)="close.emit()" aria-label="Close modal">
            <svg lucideX size="18" aria-hidden="true"></svg>
          </button>
        </header>
        <ng-content />
      </section>
    }
  `,
  styles: `
    .sheet-backdrop {
      position: fixed;
      inset: 0;
      z-index: 20;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(3px);
    }

    .sheet {
      position: fixed;
      right: max(0px, calc((100vw - 430px) / 2));
      bottom: 0;
      left: max(0px, calc((100vw - 430px) / 2));
      z-index: 21;
      display: grid;
      gap: 20px;
      max-height: min(86vh, 620px);
      overflow: auto;
      border-radius: 24px 24px 0 0;
      background: white;
      padding: 10px 20px calc(20px + env(safe-area-inset-bottom));
      box-shadow: 0 -24px 50px rgba(19, 35, 31, 0.16);
    }

    .sheet-handle {
      width: 48px;
      height: 5px;
      margin: 2px auto 0;
      border-radius: 999px;
      background: #d7e1dd;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    h2 {
      margin: 0;
      font-size: 1.25rem;
      letter-spacing: 0;
    }
  `,
})
export class BottomSheetComponent {
  @Input() open = false;
  @Input({ required: true }) title = '';
  @Output() close = new EventEmitter<void>();
}
