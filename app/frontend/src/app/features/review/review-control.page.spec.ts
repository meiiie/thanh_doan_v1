import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ReviewControl, ReviewControlCriterionCases } from '../../api/models';
import { ReviewControlPage } from './review-control.page';

describe('ReviewControlPage', () => {
  let fixture: ComponentFixture<ReviewControlPage>;
  let host: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewControlPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ReviewControlPage);
    const nativeElement: unknown = fixture.nativeElement;
    if (!(nativeElement instanceof HTMLElement)) throw new Error('Missing review control host');
    host = nativeElement;
  });

  afterEach(() => http.verify());

  it('opens evidence and read-only decision provenance from a criterion row', async () => {
    fixture.detectChanges();
    http.expectOne('/api/admin/review-control').flush(controlView);
    await fixture.whenStable();
    fixture.detectChanges();

    const criterion = host.querySelector<HTMLButtonElement>('.control-table__row');
    if (!criterion) throw new Error('Missing criterion row');
    criterion.click();
    fixture.detectChanges();

    http.expectOne('/api/admin/review-control/criteria/group-01/cases').flush(criterionCases);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('Hồ sơ tiêu chí');
    expect(host.textContent).toContain('Đại học Hải Phòng');
    expect(host.textContent).toContain('Nguyễn Minh Anh');
    expect(host.textContent).toContain('Trần Thị Thu Hà');
    expect(host.textContent).toContain('Minh chứng chưa đáp ứng đầy đủ phạm vi.');
    expect(host.textContent).toContain('Chế độ giám sát');
    const evidence = host.querySelector<HTMLAnchorElement>('.evidence-link');
    expect(evidence?.href).toBe('https://minhchung.example/ho-so-01');
    expect(evidence?.rel).toContain('noopener');
  });
});

const controlView = {
  campaignId: 'campaign-summer-2026',
  campaignName: 'Chiến dịch TNTN Hè 2026',
  phase: 'ROUND_1',
  campaignVersion: 3,
  roundNumber: 1,
  expectedCases: 1,
  submittedCases: 1,
  completedCases: 1,
  pendingCases: 0,
  missingSubmissions: 0,
  reductionsWithoutReason: 0,
  assessorsWithPending: 0,
  outOfRangeCases: 0,
  canOpenExplanation: true,
  criteria: [
    {
      groupId: 'group-01',
      code: 'I.01',
      title: 'Ngày Chủ nhật xanh',
      assessorId: 'assessor-01',
      assessorName: 'Nguyễn Minh Anh',
      teamName: 'Tổ Phong trào',
      expectedCases: 1,
      submittedCases: 1,
      completedCases: 1,
      remainingCases: 0,
      completionRate: 1,
    },
  ],
  assessors: [],
} satisfies ReviewControl;

const criterionCases = {
  groupId: 'group-01',
  code: 'I.01',
  title: 'Ngày Chủ nhật xanh',
  assessorId: 'assessor-01',
  assessorName: 'Nguyễn Minh Anh',
  teamName: 'Tổ Phong trào',
  roundNumber: 1,
  expectedCases: 1,
  submittedCases: 1,
  completedCases: 1,
  cases: [
    {
      caseId: 'case-01',
      organizationId: 'organization-01',
      organizationName: 'Đại học Hải Phòng',
      unitGroupCode: 'UNIVERSITY',
      lineId: 'line-01',
      lineCode: 'I.01.1',
      lineTitle: 'Tổ chức hoạt động trồng mới cây xanh',
      maximumScore: 3,
      assessorId: 'assessor-01',
      assessorName: 'Nguyễn Minh Anh',
      teamName: 'Tổ Phong trào',
      submissionStatus: 'SUBMITTED',
      submissionRevision: 1,
      selfScore: 3,
      evidenceUrl: 'https://minhchung.example/ho-so-01',
      summary: 'Đơn vị đã triển khai hoạt động.',
      roundNumber: 1,
      reviewStatus: 'COMPLETED',
      awardedScore: 2,
      reason: 'Minh chứng chưa đáp ứng đầy đủ phạm vi.',
      evidenceChecked: true,
      decidedByName: 'Trần Thị Thu Hà',
      decidedAt: '2026-08-21T14:32:00+07:00',
      roundOneScore: 2,
      roundOneReason: 'Minh chứng chưa đáp ứng đầy đủ phạm vi.',
      roundOneDecidedByName: 'Trần Thị Thu Hà',
      roundOneDecidedAt: '2026-08-21T14:32:00+07:00',
      explanationBody: null,
      explanationEvidenceUrl: null,
      explanationRevision: 0,
      roundTwoScore: null,
      roundTwoReason: null,
      roundTwoDecidedByName: null,
      roundTwoDecidedAt: null,
    },
  ],
} satisfies ReviewControlCriterionCases;
