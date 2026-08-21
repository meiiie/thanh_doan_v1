import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ReviewQueue } from '../../api/models';
import { ReviewQueuePage } from './review-queue.page';

describe('ReviewQueuePage', () => {
  let fixture: ComponentFixture<ReviewQueuePage>;
  let host: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewQueuePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ReviewQueuePage);
    const nativeElement: unknown = fixture.nativeElement;
    if (!(nativeElement instanceof HTMLElement)) throw new Error('Missing review queue host');
    host = nativeElement;
  });

  afterEach(() => http.verify());

  it('shows a read-only team overview for SubAdmin1 without widening the personal queue', async () => {
    fixture.detectChanges();
    http.expectOne('/api/reviewer/queue').flush(queueWithTeamOverview);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.team-monitor')).not.toBeNull();
    expect(host.textContent).toContain('Theo dõi Tổ');
    expect(host.textContent).toContain('Cán bộ chấm');
    expect(host.textContent).toContain('Nguyễn Minh Anh');
    expect(host.textContent).toContain('Không có tiêu chí ở trạng thái này');
    expect(host.querySelectorAll('textarea, .assessment-form')).toHaveLength(0);
  });
});

const queueWithTeamOverview = {
  campaignId: 'campaign-summer-2026',
  campaignName: 'Chiến dịch TNTN Hè 2026',
  phase: 'ROUND_1',
  teamId: 'team-pt',
  teamName: 'Tổ Phong trào',
  teamOverview: {
    assignedCriteria: 6,
    expectedCases: 24,
    pendingCases: 8,
    completedCases: 16,
    members: [
      {
        id: 'monitor-pt',
        displayName: 'Vũ Nguyên Đức',
        teamMonitor: true,
        assignedCriteria: 0,
        expectedCases: 0,
        pendingCases: 0,
        completedCases: 0,
      },
      {
        id: 'reviewer-ma',
        displayName: 'Nguyễn Minh Anh',
        teamMonitor: false,
        assignedCriteria: 6,
        expectedCases: 24,
        pendingCases: 8,
        completedCases: 16,
      },
    ],
  },
  criteria: [],
  cases: [],
} satisfies ReviewQueue;
