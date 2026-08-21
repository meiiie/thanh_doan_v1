import type { AssignmentWorkbench, ScorecardCatalog } from '../../api/models';

export interface MemberAssignment {
  readonly groupId: string;
  readonly code: string;
  readonly title: string;
  readonly estimatedUnits: number;
}

export interface RosterMember {
  readonly id: string;
  readonly displayName: string;
  readonly initials: string;
  readonly teamId: string;
  readonly teamName: string;
  readonly teamMonitor: boolean;
  readonly enabled: boolean;
  readonly eligibleForAssignment: boolean;
  readonly assignments: readonly MemberAssignment[];
  readonly assignmentCount: number;
  readonly estimatedUnits: number;
}

export interface RosterTeam {
  readonly id: string;
  readonly name: string;
  readonly members: readonly RosterMember[];
  readonly monitor: RosterMember | null;
  readonly assessors: readonly RosterMember[];
  readonly assignmentCount: number;
  readonly estimatedUnits: number;
}

export interface TeamDirectory {
  readonly teams: readonly RosterTeam[];
  readonly members: readonly RosterMember[];
}

export function buildTeamDirectory(
  workbench: AssignmentWorkbench,
  catalog: ScorecardCatalog,
): TeamDirectory {
  const groupById = new Map(catalog.groups.map((group) => [group.id, group]));
  const unitsByCode = new Map(
    workbench.unitGroups.map((group) => [group.code, group.documentedUnitCount]),
  );
  const teamNameById = new Map(workbench.teams.map((team) => [team.id, team.name]));

  const members = workbench.reviewers.map<RosterMember>((reviewer) => {
    const assignments = workbench.plans
      .filter((plan) => plan.reviewerId === reviewer.id)
      .map<MemberAssignment>((plan) => {
        const group = groupById.get(plan.groupId);
        return {
          groupId: plan.groupId,
          code: group?.code ?? plan.groupId,
          title: group?.title ?? 'Tiêu chí trong Bảng Tổng',
          estimatedUnits: plan.unitGroupCodes.reduce(
            (total, code) => total + (unitsByCode.get(code) ?? 0),
            0,
          ),
        };
      });
    return {
      id: reviewer.id,
      displayName: reviewer.displayName,
      initials: initials(reviewer.displayName),
      teamId: reviewer.teamId,
      teamName: teamNameById.get(reviewer.teamId) ?? 'Chưa xác định Tổ',
      teamMonitor: reviewer.teamMonitor,
      enabled: reviewer.enabled,
      eligibleForAssignment: reviewer.enabled,
      assignments,
      assignmentCount: assignments.length,
      estimatedUnits: assignments.reduce(
        (total, assignment) => total + assignment.estimatedUnits,
        0,
      ),
    };
  });

  const teams = workbench.teams.map<RosterTeam>((team) => {
    const teamMembers = members
      .filter((member) => member.teamId === team.id)
      .sort((left, right) => {
        if (left.teamMonitor !== right.teamMonitor) return left.teamMonitor ? -1 : 1;
        return left.displayName.localeCompare(right.displayName, 'vi');
      });
    const plans = workbench.plans.filter((plan) => plan.teamId === team.id);
    return {
      id: team.id,
      name: team.name,
      members: teamMembers,
      monitor: teamMembers.find((member) => member.teamMonitor) ?? null,
      assessors: teamMembers.filter((member) => !member.teamMonitor),
      assignmentCount: plans.length,
      estimatedUnits: plans.reduce(
        (total, plan) =>
          total +
          plan.unitGroupCodes.reduce(
            (planTotal, code) => planTotal + (unitsByCode.get(code) ?? 0),
            0,
          ),
        0,
      ),
    };
  });

  return { teams, members };
}

function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(-2)
      .map((part) => part[0]?.toLocaleUpperCase('vi'))
      .join('') || 'CB'
  );
}
