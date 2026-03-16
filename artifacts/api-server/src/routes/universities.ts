import { Router, type IRouter } from "express";
import {
  universities,
  budgetRanges,
  ieltsEquivalent,
  type UniversityData,
} from "../data/universities";
import {
  ListUniversitiesQueryParams,
  RecommendUniversitiesBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/universities", (req, res) => {
  const query = ListUniversitiesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  let filtered = [...universities];
  if (query.data.country) {
    filtered = filtered.filter(
      (u) => u.country.toLowerCase() === query.data.country!.toLowerCase()
    );
  }
  if (query.data.minCgpa !== undefined) {
    filtered = filtered.filter((u) => u.minCgpa <= query.data.minCgpa!);
  }
  if (query.data.maxBudgetInr !== undefined) {
    filtered = filtered.filter(
      (u) => u.tuitionEstimateInr <= query.data.maxBudgetInr!
    );
  }

  res.json(filtered);
});

router.post("/universities/recommend", (req, res) => {
  const body = RecommendUniversitiesBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body", details: body.error });
    return;
  }

  const { cgpa, englishTest, englishScore, budgetInr, country } = body.data;
  const percentage = cgpa * 9.5;

  const budgetRange = budgetRanges[budgetInr];
  const ieltsScore = ieltsEquivalent(englishTest, englishScore ?? null);

  const countryUniversities = universities.filter(
    (u) => u.country.toLowerCase() === country.toLowerCase()
  );

  const safe: ReturnType<typeof scoreUniversity>[] = [];
  const moderate: ReturnType<typeof scoreUniversity>[] = [];
  const ambitious: ReturnType<typeof scoreUniversity>[] = [];

  for (const uni of countryUniversities) {
    if (budgetRange && uni.tuitionEstimateInr > budgetRange.max) continue;

    const scored = scoreUniversity(uni, cgpa, ieltsScore, budgetRange);
    if (!scored) continue;

    if (scored.category === "Safe") safe.push(scored);
    else if (scored.category === "Moderate") moderate.push(scored);
    else if (scored.category === "Ambitious") ambitious.push(scored);
  }

  safe.sort((a, b) => b.matchScore - a.matchScore);
  moderate.sort((a, b) => b.matchScore - a.matchScore);
  ambitious.sort((a, b) => b.matchScore - a.matchScore);

  res.json({
    safe: safe.slice(0, 4),
    moderate: moderate.slice(0, 4),
    ambitious: ambitious.slice(0, 4),
    studentProfile: body.data,
    percentageEquivalent: Math.round(percentage * 10) / 10,
  });
});

function scoreUniversity(
  uni: UniversityData,
  cgpa: number,
  ieltsScore: number | null,
  budgetRange: { min: number; max: number } | undefined
): {
  university: UniversityData;
  category: "Safe" | "Moderate" | "Ambitious";
  matchScore: number;
  admissionProbability: number;
} | null {
  const cgpaDiff = cgpa - uni.minCgpa;
  const ieltsOk = ieltsScore === null || ieltsScore >= uni.minIelts;

  if (!ieltsOk && ieltsScore !== null && ieltsScore < uni.minIelts - 1.5) {
    return null;
  }

  let category: "Safe" | "Moderate" | "Ambitious";
  let admissionProbability: number;
  let matchScore: number;

  if (cgpaDiff >= 1.5) {
    category = "Safe";
    admissionProbability = 80 + Math.min(15, Math.floor(cgpaDiff * 5));
    matchScore = 85 + Math.min(10, Math.floor(cgpaDiff * 3));
  } else if (cgpaDiff >= 0.5) {
    category = "Moderate";
    admissionProbability = 50 + Math.floor(cgpaDiff * 20);
    matchScore = 65 + Math.floor(cgpaDiff * 15);
  } else if (cgpaDiff >= -0.5) {
    category = "Moderate";
    admissionProbability = 40 + Math.floor((cgpaDiff + 0.5) * 20);
    matchScore = 55 + Math.floor((cgpaDiff + 0.5) * 15);
  } else if (cgpaDiff >= -1.5) {
    category = "Ambitious";
    admissionProbability = 15 + Math.floor((cgpaDiff + 1.5) * 15);
    matchScore = 35 + Math.floor((cgpaDiff + 1.5) * 12);
  } else {
    return null;
  }

  if (!ieltsOk && ieltsScore !== null) {
    admissionProbability = Math.max(5, admissionProbability - 20);
    matchScore = Math.max(10, matchScore - 15);
  }

  if (budgetRange && uni.tuitionEstimateInr <= budgetRange.max * 0.7) {
    matchScore = Math.min(98, matchScore + 5);
  }

  admissionProbability = Math.min(95, Math.max(5, admissionProbability));
  matchScore = Math.min(98, Math.max(10, matchScore));

  return {
    university: uni,
    category,
    matchScore,
    admissionProbability,
  };
}

export default router;
