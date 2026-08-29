import type { MatchClassification } from "./service";

export function classificationBadgeClass(c: MatchClassification): string {
  switch (c) {
    case "STRONG_MATCH":
      return "bg-green-100 text-green-700";
    case "GOOD_MATCH":
      return "bg-blue-100 text-blue-700";
    case "WEAK_MATCH":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function classificationLabel(c: MatchClassification): string {
  return c.replace("_MATCH", "");
}
