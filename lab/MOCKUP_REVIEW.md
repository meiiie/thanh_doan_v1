# Visual review — Mockup set v1

Review date: 12/08/2026  
Scope: information architecture, hierarchy, density and task flow. Generated text is not an approved content contract.

## 1. Campaign command center

File: `mockups/01-campaign-command-center.png` — 1536×1024.

Decision: **accept as layout direction**.

What works:

- attention queue is the first object and maps every number to an action;
- phase is compact in the topbar while the single workflow visualization is contextual;
- operational table dominates the lower half and carries owner/blocker/update data;
- role navigation is grouped and scannable; no decorative dashboard card wall.

Corrections for coded prototype:

- standardize the generated phrase “im lặng trên 48 giờ” and all exact content from the glossary;
- remove fake email/identity examples not backed by fixtures;
- test the table at 1024px; convert non-essential columns to row detail instead of horizontal overflow.

## 2. Reviewer workbench

File: `mockups/02-reviewer-workbench.png` — 1586×992.

Decision: **accept after one image edit**.

What works:

- work queue, evidence and decision stay visible at the same time;
- variance between self score and reviewer score is explicit;
- broken evidence is a persistent inline state;
- next-criterion flow and draft/complete actions are correctly separated.

Rejected first-generation traits:

- copied official youth-union emblem;
- dark navy sidebar inconsistent with the canonical system.

The saved version replaces both. Coded prototype still needs responsive behavior: at widths below 1180px, queue becomes a drawer; below 900px, decision becomes an accessible side sheet or sequential review step. Never shrink all three panes to unreadable widths.

## 3. Unit self-assessment

File: `mockups/03-unit-self-assessment.png` — 1586×992.

Decision: **accept as layout direction**.

What works:

- one criterion at a time reduces cognitive load;
- navigator reveals group progress and the exact criterion with missing evidence;
- score, description and evidence form a single work unit;
- summary pane gives a reason submission is blocked and a direct route to the error;
- sticky footer creates a predictable previous/save/next rhythm.

Corrections for coded prototype:

- the mockup illustrates a deliberate data inconsistency: two evidence items appear while the section says mandatory evidence is missing. In code this must be explained as a missing required evidence type, or the error must disappear;
- sidebar and criterion navigator must have independent labels and landmarks for screen readers;
- autosave must expose success/failure without relying only on a green icon.

## 4. Cross-screen gate

| Gate | Result | Note |
|---|---|---|
| Role-specific navigation | Pass | owner/reviewer/unit have different task models |
| One clear primary action | Pass | secondary actions remain visually subordinate |
| No gradient/glass/card mosaic | Pass | panels use border and spacing |
| Canonical blue/neutral tokens | Pass | reviewer required one correction |
| Real operational density | Pass | all three use Vietnamese domain data |
| Accessibility proven | Not yet | image cannot prove semantics, focus, zoom or screen reader behavior |
| Responsive flow proven | Not yet | requires coded local prototype |
| Exact Vietnamese content | Provisional | image text is illustrative only |

## 5. Next design slice

Before broad page production, implement only a local interactive shell plus the reviewer workbench vertical slice. It exercises the hardest concerns at once: role navigation, queue, evidence, scoring, conflict handling, audit and responsive panes. The owner command center and unit workspace follow only after this slice passes keyboard, responsive and workflow tests.

## 6. Reviewer workbench v2 — Calm Precision

File: `mockups/04-reviewer-workbench-v2.png` — 1586×992.  
Normative redline: `DESIGN_SPEC_V2.md`.  
Interactive proof: `specimen/index.html`.

Decision: **accept as the flagship visual direction, not as implementation source**.

Improvements over v1:

- the eye path is more deliberate: selected case → criterion/evidence → numeric decision;
- neutral surface area dominates and blue is restricted to interaction/selection/current progress;
- rows and panes share a more consistent baseline and density;
- the decision score is visually central without becoming a decorative KPI;
- border/radius use is quieter and the abstract product mark remains neutral.

Known limitation: generated Vietnamese contains small typographic errors. Exact copy, geometry, contrast and interaction are governed by the coded specimen and redline document, not pixels or text in the generated image.
