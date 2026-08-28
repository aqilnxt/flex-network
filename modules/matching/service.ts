export type MatchClassification =
  | "STRONG_MATCH"
  | "GOOD_MATCH"
  | "WEAK_MATCH"
  | "NO_MATCH";

export type MatchResult = {
  skillMatchScore: number;
  interestMatchScore: number;
  finalMatchScore: number;
  matchedSkills: string[];
  matchedInterests: string[];
  classification: MatchClassification;
};

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function skillMatchScore(matched: number, required: number): number {
  if (required <= 0) return 100;
  return (matched / required) * 100;
}

export function interestMatchScore(matched: number, relevant: number): number {
  if (relevant <= 0) return 100;
  return (matched / relevant) * 100;
}

export function finalMatchScore(
  skillScore: number,
  interestScore: number,
): number {
  return round2(skillScore * 0.7 + interestScore * 0.3);
}

export function classifyMatchScore(score: number): MatchClassification {
  if (score >= 80) return "STRONG_MATCH";
  if (score >= 60) return "GOOD_MATCH";
  if (score >= 30) return "WEAK_MATCH";
  return "NO_MATCH";
}

export function scoreOpportunity(
  talentSkillIds: string[],
  talentInterestIds: string[],
  oppSkillIds: string[],
  oppInterestIds: string[],
): MatchResult {
  const talentSkills = new Set(talentSkillIds);
  const talentInterests = new Set(talentInterestIds);

  const matchedSkills = oppSkillIds.filter((s) => talentSkills.has(s));
  const matchedInterests = oppInterestIds.filter((i) => talentInterests.has(i));

  const skillScore = skillMatchScore(matchedSkills.length, oppSkillIds.length);
  const interestScore = interestMatchScore(
    matchedInterests.length,
    oppInterestIds.length,
  );
  const score = finalMatchScore(skillScore, interestScore);

  return {
    skillMatchScore: round2(skillScore),
    interestMatchScore: round2(interestScore),
    finalMatchScore: score,
    matchedSkills,
    matchedInterests,
    classification: classifyMatchScore(score),
  };
}

export type Recommendation = {
  opportunity: {
    id: string;
    title: string;
    work_mode: string | null;
    location: string | null;
    compensation: number | null;
    compensation_type: string | null;
  };
} & MatchResult;
