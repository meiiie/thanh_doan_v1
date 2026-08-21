import type {
  AssignmentPlan,
  CampaignPhase,
  EvidencePolicy,
  ScorecardCatalog,
  ScorecardLine,
} from '../../api/models';

export type ScorecardSection = 'ALL' | 'CORE' | 'BONUS';
export type AdvanceEndpoint = 'release' | 'start-review' | 'open-explanation' | 'start-round-two';

export interface ScorecardTableRow {
  readonly groupId: string;
  readonly groupCode: string;
  readonly groupTitle: string;
  readonly section: 'CORE' | 'BONUS';
  readonly firstInGroup: boolean;
  readonly visibleLineCount: number;
  readonly line: ScorecardLine;
}

export interface ScorecardGroupRow {
  readonly groupId: string;
  readonly code: string;
  readonly title: string;
  readonly section: 'CORE' | 'BONUS';
  readonly lineCount: number;
  readonly maximumScore: number;
  readonly ruleSummary: string;
}

function scoringClauses(requirement: string): readonly string[] {
  return requirement
    .split(/\r?\n/)
    .map((part) => part.trim().replace(/^[-•]\s*/, ''))
    .filter((part) => part.length > 0)
    .filter((part) => /điểm/i.test(part));
}

const ADVANCE_ENDPOINTS = new Map<CampaignPhase, AdvanceEndpoint>([
  ['PREPARATION', 'release'],
  ['SELF_ASSESSMENT', 'start-review'],
  ['ROUND_1', 'open-explanation'],
  ['EXPLANATION', 'start-round-two'],
]);

const PHASE_LABELS = {
  PREPARATION: 'Đang cấu hình',
  SELF_ASSESSMENT: 'Đơn vị đang nhập',
  ROUND_1: 'Đang thẩm định vòng 1',
  EXPLANATION: 'Đang giải trình',
  ROUND_2: 'Đang thẩm định vòng 2',
  FINAL_REVIEW: 'Đang chốt kết quả',
  PUBLISHED: 'Đã công bố',
  CLOSED: 'Đã đóng chiến dịch',
} satisfies Readonly<Record<CampaignPhase, string>>;

const EVIDENCE_LABELS = {
  LINK: 'Nhập liên kết',
  DOCUMENT: 'Văn bản/danh sách',
  INTERNAL: 'Tổ chủ động theo dõi',
  GUIDED: 'Theo hướng dẫn',
} satisfies Readonly<Record<EvidencePolicy, string>>;

export function scorecardRows(
  catalog: ScorecardCatalog | null,
  queryText: string,
  section: ScorecardSection,
): readonly ScorecardTableRow[] {
  if (!catalog) return [];
  const query = queryText.trim().toLocaleLowerCase('vi');
  return catalog.groups
    .filter((group) => section === 'ALL' || group.section === section)
    .flatMap((group) => {
      const visibleLines = group.lines.filter((line) =>
        !query
          ? true
          : `${group.code} ${group.title} ${line.code} ${line.title} ${line.requirement}`
              .toLocaleLowerCase('vi')
              .includes(query),
      );
      return visibleLines.map((line, index) => ({
        groupId: group.id,
        groupCode: group.code,
        groupTitle: group.title,
        section: group.section,
        firstInGroup: index === 0,
        visibleLineCount: visibleLines.length,
        line,
      }));
    });
}

export function scorecardGroupRows(
  catalog: ScorecardCatalog | null,
  queryText: string,
  section: ScorecardSection,
): readonly ScorecardGroupRow[] {
  if (!catalog) return [];
  const query = queryText.trim().toLocaleLowerCase('vi');
  return catalog.groups
    .filter((group) => section === 'ALL' || group.section === section)
    .filter((group) => {
      if (!query) return true;
      return `${group.code} ${group.title} ${group.lines
        .map((line) => `${line.code} ${line.title} ${line.requirement}`)
        .join(' ')}`
        .toLocaleLowerCase('vi')
        .includes(query);
    })
    .map((group) => {
      const scoreRules = group.lines
        .flatMap((line) => scoringClauses(line.requirement))
        .filter((rule, index, values) => values.indexOf(rule) === index);
      const fallbackRules = group.lines
        .map((line) => line.requirement.trim().replace(/\s+/g, ' '))
        .filter((rule) => rule && rule !== group.title)
        .filter((rule, index, values) => values.indexOf(rule) === index);
      const rules = scoreRules.length ? scoreRules : fallbackRules;
      return {
        groupId: group.id,
        code: group.code,
        title: group.title,
        section: group.section,
        lineCount: group.lines.length,
        maximumScore: group.lines.reduce((total, line) => total + line.maximumScore, 0),
        ruleSummary:
          rules.slice(0, 3).join(' · ') || `${group.lines.length} dòng chấm trong hạng mục`,
      };
    });
}

export function evidencePolicyLabel(policy: EvidencePolicy): string {
  return EVIDENCE_LABELS[policy];
}

export function campaignPhaseLabel(phase: CampaignPhase): string {
  return PHASE_LABELS[phase];
}

export function assignmentIsReady(plan: AssignmentPlan | undefined): boolean {
  return !!plan?.unitGroupCodes.length && !!plan.teamId && !!plan.reviewerId;
}

export function advanceEndpoint(phase: CampaignPhase): AdvanceEndpoint | undefined {
  return ADVANCE_ENDPOINTS.get(phase);
}
