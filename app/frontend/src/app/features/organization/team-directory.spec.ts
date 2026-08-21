import type { AssignmentWorkbench, ScorecardCatalog } from '../../api/models';
import { buildTeamDirectory } from './team-directory';

describe('buildTeamDirectory', () => {
  const workbench = {
    campaignId: 'campaign-summer-2026',
    campaignName: 'Chiến dịch 2026',
    phase: 'PREPARATION',
    campaignVersion: 1,
    scorecardStatus: 'DRAFT',
    unitGroups: [
      { code: 'UNIVERSITY', name: 'ĐH/CĐ', documentedUnitCount: 16 },
      { code: 'COMMUNE', name: 'Xã/phường', documentedUnitCount: 114 },
    ],
    teams: [
      {
        id: 'team-pt',
        name: 'Tổ Phong trào',
        monitorId: 'monitor-pt',
        monitorName: 'Vũ Nguyên Đức',
        availableAssessorCount: 2,
        lockedAssessorCount: 1,
      },
    ],
    reviewers: [
      {
        id: 'reviewer-locked',
        displayName: 'Trần Thị Thu Hà',
        teamId: 'team-pt',
        enabled: false,
        teamMonitor: false,
      },
      {
        id: 'reviewer-minh-anh',
        displayName: 'Nguyễn Minh Anh',
        teamId: 'team-pt',
        enabled: true,
        teamMonitor: false,
      },
      {
        id: 'monitor-pt',
        displayName: 'Vũ Nguyên Đức',
        teamId: 'team-pt',
        enabled: true,
        teamMonitor: true,
      },
    ],
    plans: [
      plan('group-1', ['UNIVERSITY', 'COMMUNE'], 'reviewer-minh-anh'),
      plan('group-2', ['UNIVERSITY'], 'reviewer-minh-anh'),
      plan('group-3', ['COMMUNE'], 'monitor-pt'),
      plan('group-4', ['COMMUNE'], null),
    ],
    progress: {
      totalGroups: 4,
      readyGroups: 3,
      expectedTasks: 0,
      submittedTasks: 0,
      reviewedTasks: 0,
    },
  } satisfies AssignmentWorkbench;

  const catalog = {
    id: 'scorecard',
    campaignId: 'campaign-summer-2026',
    campaignName: 'Chiến dịch 2026',
    title: 'Bảng Tổng',
    audience: 'Hải Phòng',
    status: 'DRAFT',
    source: {
      fileName: 'source.xlsx',
      sha256: 'hash',
      receivedScope: 'A1:Z99',
      importedAt: '2026-08-21T00:00:00Z',
    },
    policy: {
      coreMaximum: 83,
      bonusRawMaximum: 69,
      bonusCap: 25,
      overallMaximum: 108,
      groupCount: 3,
      lineCount: 3,
    },
    unitGroups: [],
    groups: [
      group('group-1', 'I.01', 'Trồng mới cây xanh'),
      group('group-2', 'I.02', 'Bình dân học vụ số'),
      group('group-3', 'I.03', 'Ngày Chủ nhật xanh'),
      group('group-4', 'I.04', 'Chuyển đổi số'),
    ],
  } satisfies ScorecardCatalog;

  it('keeps the team hierarchy and account eligibility explicit', () => {
    const directory = buildTeamDirectory(workbench, catalog);
    const team = directory.teams[0];

    expect(team?.members).toHaveLength(3);
    expect(team?.monitor?.displayName).toBe('Vũ Nguyên Đức');
    expect(team?.members[0]?.teamMonitor).toBe(true);
    expect(team?.assessors).toHaveLength(2);
    expect(
      directory.members.find((member) => member.id === 'monitor-pt')?.eligibleForAssignment,
    ).toBe(true);
    expect(
      directory.members.find((member) => member.id === 'reviewer-locked')?.eligibleForAssignment,
    ).toBe(false);
  });

  it('calculates reviewer workload from criteria and applicable unit counts', () => {
    const member = buildTeamDirectory(workbench, catalog).members.find(
      (candidate) => candidate.id === 'reviewer-minh-anh',
    );

    expect(member?.initials).toBe('MA');
    expect(member?.assignmentCount).toBe(2);
    expect(member?.estimatedUnits).toBe(146);
    expect(member?.assignments.map((assignment) => assignment.code)).toEqual(['I.01', 'I.02']);
  });

  it('gives the team monitor scoring workload only when explicitly assigned', () => {
    const monitor = buildTeamDirectory(workbench, catalog).members.find(
      (candidate) => candidate.id === 'monitor-pt',
    );

    expect(monitor?.teamMonitor).toBe(true);
    expect(monitor?.assignmentCount).toBe(1);
    expect(monitor?.estimatedUnits).toBe(114);
    expect(monitor?.assignments.map((assignment) => assignment.code)).toEqual(['I.03']);
  });

  it('includes team-level assignments that still lack a reviewer', () => {
    const team = buildTeamDirectory(workbench, catalog).teams[0];

    expect(team?.assignmentCount).toBe(4);
    expect(team?.estimatedUnits).toBe(374);
  });
});

function plan(groupId: string, unitGroupCodes: string[], reviewerId: string | null) {
  return {
    groupId,
    unitGroupCodes,
    teamId: 'team-pt',
    reviewerId,
    version: 1,
    expectedTasks: 0,
    submittedTasks: 0,
    reviewedTasks: 0,
    lastReviewedBy: null,
    lastReviewedAt: null,
  };
}

function group(id: string, code: string, title: string) {
  return { id, code, title, section: 'CORE' as const, displayOrder: 1, lines: [] };
}
