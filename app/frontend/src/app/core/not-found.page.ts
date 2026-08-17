import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <main class="not-found" aria-labelledby="not-found-title">
      <p>404</p>
      <h1 id="not-found-title">Không tìm thấy trang</h1>
      <span>Đường dẫn không tồn tại hoặc tài nguyên đã được chuyển sang phân hệ khác.</span>
      <a routerLink="/">Về không gian làm việc</a>
    </main>
  `,
  styles: `
    :host {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: var(--space-6);
    }
    .not-found {
      width: min(100%, 480px);
      text-align: center;
    }
    p {
      margin: 0 0 var(--space-2);
      color: var(--brand);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
    }
    h1 {
      margin-bottom: var(--space-2);
    }
    span {
      display: block;
      color: var(--muted);
      line-height: 24px;
    }
    a {
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      margin-top: var(--space-6);
      padding: 0 var(--space-4);
      color: white;
      background: var(--brand);
      border-radius: var(--radius-control);
      font-weight: 600;
      text-decoration: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
