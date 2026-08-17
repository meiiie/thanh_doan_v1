# Product specification

## Objective

Replace spreadsheet exchange with one traceable scoring workflow for 134 Youth
Union units and five specialist teams.

## Actors

- `SUPER_ADMIN`: system and campaign owner.
- `ADMIN`: campaign configuration, publication, reopening, finalization, export.
- `TEAM_LEAD`: sees and coordinates work for one specialist team.
- `REVIEWER`: scores assigned criteria for all applicable units.
- `UNIT`: self-scores and explains only its own record.
- `AUDITOR`: read-only results and audit access.

Authorization combines role with campaign, team, criterion, unit, and phase.

## Required flow

1. Admin publishes a versioned scorecard and deadline.
2. Unit saves self-scores, reports, and evidence URLs, then submits.
3. Reviewer scores assigned criteria. A lower score requires a reason.
4. Admin releases round one; the unit can now see differences.
5. Unit submits criterion-level explanations and additional evidence.
6. Reviewer records round two; admin finalizes an immutable result snapshot.
7. Authorized users can export and reconstruct the result from audit history.

## Scoring baseline

- University/college core maximum: `83`.
- Bonus cap: `25`.
- Bonus II.1 is treated as max `9` (three activities × three points), recorded as
  an explicit assumption until the customer signs a golden case.
- `total = coreFinal + min(bonusRaw, 25)`.
- `rate = total / applicableCoreMaximum × 100`.
- Classification: `>=90 excellent-candidate`, `>=70 advanced`, `>=50 completed`,
  otherwise `not-completed`.

## Observable acceptance criteria

- An unknown or out-of-scope identity receives no private data.
- Double submission cannot duplicate a state change.
- Invalid scores, schemes, empty deduction reasons, and wrong phases return a
  Vietnamese validation error and preserve prior data.
- A unit sees only its own scorecard and no unreleased reviewer score.
- A reviewer sees only criteria assigned to its team.
- Admin can advance only along the allowed campaign state machine.
- Admin can change the self-assessment deadline or a unit-level applicability
  exception only before the relevant record is locked; both actions are audited.
- Every mutation records actor, action, target, timestamp, and safe metadata.
- Export totals match the witnessed scoring calculation, including >100% cases.
- Super admin can download a complete, versioned JSON backup without secrets.
- Core screens work at 360px, keyboard-only, 200% zoom, and reduced motion.

## Explicitly deferred

- Native mobile apps, AI evidence scoring, realtime co-editing, public ranking,
  general-purpose workflow building, and direct file uploads. Evidence uses
  organization-owned URLs until retention and malware controls are approved.
