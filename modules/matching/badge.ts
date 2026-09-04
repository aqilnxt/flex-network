import type { MatchClassification } from "./service";

export function classificationBadgeClass(c: MatchClassification): string {
  switch (c) {
    case "STRONG_MATCH":
      return "bg-[#EAFBF1] text-[#15803D] border-[#BBF7D0]";
    case "GOOD_MATCH":
      return "bg-tint text-primary border-[#C7D3FC]";
    case "WEAK_MATCH":
      return "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]";
    default:
      return "bg-tint-2 text-ink-2";
  }
}

export function classificationLabel(c: MatchClassification): string {
  return c.replace("_MATCH", "");
}
