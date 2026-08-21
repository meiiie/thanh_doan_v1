import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UnitFinalResultsPage } from './unit-final-results.page';

describe('UnitFinalResultsPage', () => {
  let fixture: ComponentFixture<UnitFinalResultsPage>;
  let host: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitFinalResultsPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UnitFinalResultsPage);
    const nativeElement: unknown = fixture.nativeElement;
    if (!(nativeElement instanceof HTMLElement)) throw new Error('Missing final result host');
    host = nativeElement;
  });

  afterEach(() => http.verify());

  it('renders an omitted round-two score as absent instead of throwing', async () => {
    fixture.detectChanges();
    http.expectOne('/api/unit/results/final').flush({
      campaignId: 'campaign-summer-2026',
      campaignName: 'Chiến dịch TNTN Hè 2026',
      phase: 'PUBLISHED',
      published: true,
      resultVersion: 1,
      publishedAt: '2026-08-22T08:00:00+07:00',
      organizationId: 'organization-01',
      organizationName: 'Đại học Hải Phòng',
      unitGroupCode: 'UNIVERSITY',
      applicableCoreMaximum: 3,
      coreScore: 3,
      bonusScore: 0,
      totalScore: 3,
      completionRate: 1,
      lines: [
        {
          lineId: 'line-01',
          groupCode: 'I.01',
          lineCode: 'I.01.1',
          title: 'Ngày Chủ nhật xanh',
          section: 'CORE',
          maximumScore: 3,
          selfScore: 3,
          roundOneScore: 3,
          finalScore: 3,
        },
      ],
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.final-row')?.textContent).toContain('—');
    expect(host.textContent).toContain('Ngày Chủ nhật xanh');
  });
});
