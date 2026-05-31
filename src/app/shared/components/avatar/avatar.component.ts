import { Component, Input } from '@angular/core';
import { UserId } from '../../models/transaction.model';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    <span class="avatar" [class.partner-two]="userId === 'partner2'">
      {{ initials }}
    </span>
  `,
  styles: `
    .avatar {
      display: inline-grid;
      width: 38px;
      height: 38px;
      place-items: center;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      font-size: 0.8rem;
      font-weight: 800;
      flex: 0 0 auto;
    }

    .partner-two {
      background: var(--coral);
    }
  `,
})
export class AvatarComponent {
  @Input({ required: true }) initials = '';
  @Input({ required: true }) userId: UserId = 'partner1';
}
