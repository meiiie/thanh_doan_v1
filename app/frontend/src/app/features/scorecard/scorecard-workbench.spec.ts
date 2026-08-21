import type { AssignmentPlan, ScorecardCatalog, ScorecardLine } from '../../api/models';
import {
  advanceEndpoint,
  assignmentIsReady,
  campaignPhaseLabel,
  evidencePolicyLabel,
  scorecardGroupRows,
  scorecardRows,
} from './scorecard-workbench';

const line = (id: string, code: string, title: string): ScorecardLine => ({
  id,
  code,
  title,
  requirement: `Yêu cầu ${title}`,
  evidenceHint: '',
  reportTemplate: '',
  evidencePolicy: 'LINK',
  maximumScore: 10,
  sourceSheet: 'Bảng cần điền',
  sourceRow: 10,
  displayOrder: 1,
});

const catalog: ScorecardCatalog = {
  id: 'scorecard-1',
  campaignId: 'campaign-1',
  campaignName: 'Chiến dịch TNTN Hè 2026',
  title: 'Bảng điểm',
  audience: 'Hải Phòng',
  status: 'DRAFT',
  source: {
    fileName: 'bang-diem.xlsx',
    sha256: 'sha256',
    receivedScope: 'Khối Đại học/Cao đẳng',
    importedAt: '2026-08-20T00:00:00Z',
  },
  policy: {
    coreMaximum: 100,
    bonusRawMaximum: 20,
    bonusCap: 10,
    overallMaximum: 100,
    groupCount: 2,
    lineCount: 3,
  },
  unitGroups: [],
  groups: [
    {
      id: 'core-1',
      code: 'I',
      title: 'Nội dung trọng tâm',
      section: 'CORE',
      displayOrder: 1,
      lines: [line('line-1', 'I.1', 'Tuyên truyền'), line('line-2', 'I.2', 'Tập huấn')],
    },
    {
      id: 'bonus-1',
      code: 'II',
      title: 'Điểm cộng',
      section: 'BONUS',
      displayOrder: 2,
      lines: [line('line-3', 'II.1', 'Sáng tạo')],
    },
  ],
};

describe('scorecard workbench rules', () => {
  it('keeps group row spans correct after a Vietnamese text search', () => {
    const rows = scorecardRows(catalog, 'tập huấn', 'ALL');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      groupId: 'core-1',
      firstInGroup: true,
      visibleLineCount: 1,
      line: { code: 'I.2' },
    });
  });

  it('filters bonus and core sections without mixing them', () => {
    expect(scorecardRows(catalog, '', 'CORE').map((row) => row.line.code)).toEqual(['I.1', 'I.2']);
    expect(scorecardRows(catalog, '', 'BONUS').map((row) => row.line.code)).toEqual(['II.1']);
  });

  it('builds one master-table row per business criterion', () => {
    const rows = scorecardGroupRows(catalog, 'tập huấn', 'ALL');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      groupId: 'core-1',
      code: 'I',
      lineCount: 2,
      maximumScore: 20,
      section: 'CORE',
    });
  });

  it('prioritizes scoring clauses over evidence instructions in the table summary', () => {
    const sourceLine = line('line-score', 'I.01', 'Trồng cây');
    const sourceGroup = catalog.groups[0];
    if (!sourceGroup) throw new Error('Thiếu nhóm kiểm thử');
    const scoreCatalog: ScorecardCatalog = {
      ...catalog,
      groups: [
        {
          ...sourceGroup,
          lines: [
            {
              ...sourceLine,
              requirement:
                'Link minh chứng tổ chức hoạt động\n- Có hoạt động: 03 điểm\n- Không có hoạt động: 0 điểm',
            },
          ],
        },
      ],
    };
    const rows = scorecardGroupRows(scoreCatalog, '', 'ALL');

    expect(rows).toHaveLength(1);
    expect(rows[0]?.ruleSummary).toBe('Có hoạt động: 03 điểm · Không có hoạt động: 0 điểm');
  });

  it('only marks a plan ready when scope, team and reviewer all exist', () => {
    const plan: AssignmentPlan = {
      groupId: 'core-1',
      unitGroupCodes: ['DH-CD'],
      teamId: 'team-1',
      reviewerId: 'reviewer-1',
      version: 1,
      expectedTasks: 1,
      submittedTasks: 0,
      reviewedTasks: 0,
      lastReviewedBy: null,
      lastReviewedAt: null,
    };

    expect(assignmentIsReady(plan)).toBe(true);
    expect(assignmentIsReady({ ...plan, reviewerId: null })).toBe(false);
    expect(assignmentIsReady({ ...plan, unitGroupCodes: [] })).toBe(false);
  });

  it('keeps labels and lifecycle commands deterministic', () => {
    expect(evidencePolicyLabel('INTERNAL')).toBe('Tổ chủ động theo dõi');
    expect(campaignPhaseLabel('ROUND_2')).toBe('Đang thẩm định vòng 2');
    expect(advanceEndpoint('EXPLANATION')).toBe('start-round-two');
    expect(advanceEndpoint('PUBLISHED')).toBeUndefined();
  });
});
