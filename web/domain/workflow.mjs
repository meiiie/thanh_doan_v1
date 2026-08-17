export const PHASES = [
  "DRAFT",
  "SELF_ASSESSMENT",
  "ROUND1",
  "ROUND1_RELEASED",
  "EXPLANATION",
  "ROUND2",
  "FINALIZED",
  "ARCHIVED",
];

const transitions = new Map([
  ["DRAFT", new Set(["SELF_ASSESSMENT"])],
  ["SELF_ASSESSMENT", new Set(["ROUND1"])],
  ["ROUND1", new Set(["ROUND1_RELEASED"])],
  ["ROUND1_RELEASED", new Set(["EXPLANATION"])],
  ["EXPLANATION", new Set(["ROUND2"])],
  ["ROUND2", new Set(["FINALIZED"])],
  ["FINALIZED", new Set(["ARCHIVED", "ROUND2"])],
  ["ARCHIVED", new Set()],
]);

export function canTransition(from, to) {
  return transitions.get(from)?.has(to) ?? false;
}

export function requireTransition(from, to) {
  if (!canTransition(from, to)) throw new Error("INVALID_TRANSITION");
}

export function phaseIndex(phase) {
  const index = PHASES.indexOf(phase);
  if (index < 0) throw new Error("INVALID_PHASE");
  return index;
}
