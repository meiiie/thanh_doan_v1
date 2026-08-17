/** Giai đoạn vòng đời chiến dịch theo hợp đồng API của backend. */
export type CampaignPhase =
  | 'PREPARATION'
  | 'SELF_ASSESSMENT'
  | 'ROUND_1'
  | 'EXPLANATION'
  | 'ROUND_2'
  | 'FINAL_REVIEW'
  | 'PUBLISHED'
  | 'CLOSED';

/** Chính sách minh chứng của một dòng chấm theo catalog bảng điểm. */
export type EvidencePolicy = 'LINK' | 'DOCUMENT' | 'INTERNAL' | 'GUIDED';
