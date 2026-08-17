import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type AppIconName =
  | 'overview'
  | 'campaign'
  | 'spreadsheet'
  | 'organization'
  | 'accounts'
  | 'integration'
  | 'security'
  | 'backup'
  | 'menu'
  | 'search'
  | 'help'
  | 'bell'
  | 'chevron'
  | 'plus'
  | 'close'
  | 'filter'
  | 'check'
  | 'warning'
  | 'database'
  | 'arrow'
  | 'document'
  | 'upload';

@Component({
  selector: 'app-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('overview') {
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
        }
        @case ('campaign') {
          <path d="M5 4v16M5 5h11l-2 3 2 3H5" />
        }
        @case ('spreadsheet') {
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M4 8h16M9 8v13M15 8v13M4 13h16M4 17h16" />
        }
        @case ('organization') {
          <path d="M12 5a2 2 0 1 0 0 .1M6 19v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M4 9h4M16 9h4" />
        }
        @case ('accounts') {
          <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19a5.5 5.5 0 0 1 11 0M17 10v6M14 13h6" />
        }
        @case ('integration') {
          <path d="M8 12h8M7 8l-3 4 3 4M17 8l3 4-3 4M10 5h4M10 19h4" />
        }
        @case ('security') {
          <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        }
        @case ('backup') {
          <path d="M4 7h16v12H4zM7 4h10v3M8 11h8M8 15h5" />
        }
        @case ('document') {
          <path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6M9 16h6" />
        }
        @case ('upload') {
          <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
        }
        @case ('menu') {
          <path d="M4 7h16M4 12h16M4 17h16" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="6" />
          <path d="m16 16 4 4" />
        }
        @case ('help') {
          <circle cx="12" cy="12" r="9" />
          <path d="M9.8 9a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1.2.9-1.2 1.8M12 17h.01" />
        }
        @case ('bell') {
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        }
        @case ('chevron') {
          <path d="m9 6 6 6-6 6" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('close') {
          <path d="m6 6 12 12M18 6 6 18" />
        }
        @case ('filter') {
          <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
        }
        @case ('check') {
          <path d="m5 12 4 4L19 6" />
        }
        @case ('warning') {
          <path d="M12 4 3 20h18L12 4Z" />
          <path d="M12 9v4M12 17h.01" />
        }
        @case ('database') {
          <ellipse cx="12" cy="5" rx="7" ry="3" />
          <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" />
        }
        @case ('arrow') {
          <path d="M5 12h14M14 7l5 5-5 5" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-grid;
      width: 1.25rem;
      height: 1.25rem;
      place-items: center;
      flex: 0 0 auto;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppIconComponent {
  readonly name = input.required<AppIconName>();
}
