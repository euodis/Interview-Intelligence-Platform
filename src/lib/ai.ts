"use server";

import OpenAI from "openai";
import { z } from "zod";

// Schema for resilient parsing
const InterviewPlanSchema = z.object({
  blocks: z.array(
    z.object({
      title: z.string(),
      goal: z.string(),
      questions: z.array(z.string()),
      required: z.boolean(),
    })
  )
});

export type GeneratedPlanBlock = z.infer<typeof InterviewPlanSchema>['blocks'][0] & { id: string };

const CandidateSummaryZodSchema = z.object({
  overallScore: z.number(),
  recommendation: z.enum(['НАЗНАЧИТЬ_ОФФЕР', 'ОТКАЗ', 'ДОП_ИНТЕРВЬЮ', 'СИНХРОНИЗАЦИЯ']),
  rationale: z.string(),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
  notableEvidence: z.array(z.string()),
  discrepancies: z.string().nullable(),
  nextStepSuggestion: z.string()
});

export type GeneratedCandidateSummary = z.infer<typeof CandidateSummaryZodSchema>;

const DisagreementInterpretationSchema = z.object({
  disagreements: z.array(
    z.object({
      blockTitle: z.string(),
      reason: z.string(),
      isRisk: z.boolean(),
      recommendedAction: z.enum(['CALIBRATION', 'EXTRA_INTERVIEW', 'FOCUS_AREA']),
      actionDescription: z.string(),
    })
  )
});

export type DisagreementInterpretation = z.infer<typeof DisagreementInterpretationSchema>['disagreements'][0];

const SYSTEM_PROMPT = `You are a Senior Staff Engineer and Expert Recruiter.
Your goal is to generate a highly structured, professional interview plan for evaluating a candidate.
The interview should test deep expertise, system thinking, and cultural fit.

Guidelines for output:
1. Divide the interview into logical technical/soft blocks (usually 3-5 blocks).
2. For each block, provide a concise clear \`title\` and a specific \`goal\` (what exactly are we testing?).
3. Provide 2-5 \`questions\` per block. Questions MUST NOT be generic theory. They must be practical, scenario-based, and help compare candidates.
4. ALL internal strings (titles, goals, questions) MUST BE IN RUSSIAN language.
5. Determine if the block is \`required\` (true for core competencies, false for optional/bonus skills).
6. Output ONLY valid JSON matching the requested schema. No markdown wrappers, no explanations.`;

/**
 * Generates an Interview Plan using OpenRouter (OpenAI SDK compatible).
 * Contains a fallback to mock data if no key is provided or API fails.
 */
export async function generateInterviewPlan(input: {
  role: string;
  level: string;
  competencies: string;
  context: string;
}): Promise<GeneratedPlanBlock[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ OPENROUTER_API_KEY not found. Using local fallback.");
    return getLocalMockPlan();
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    // By default server side env vars are not exposed
  });

  const userPrompt = `
Generate an interview plan for the following vacancy in RUSSIAN:
Role: ${input.role}
Level: ${input.level}
Competencies: ${input.competencies}
Additional Context: ${input.context || 'None'}

Return ONLY a JSON object with this shape:
{
  "blocks": [
    {
      "title": "Название блока на русском",
      "goal": "Цель блока на русском",
      "questions": ["Вопрос 1 на русском", "Вопрос 2 на русском"],
      "required": true
    }
  ]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Very fast and reliable json-producer on OpenRouter
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }, // Ensures JSON array
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No content received from specific LLM");

    // Defensive parsing
    const parsedJson = JSON.parse(content);
    const validData = InterviewPlanSchema.parse(parsedJson);

    // Map adding unique IDs
    return validData.blocks.map((block) => ({
      ...block,
      id: `block-${Math.random().toString(36).substr(2, 9)}`,
    }));

  } catch (error) {
    console.error("AI Generation failed. Falling back to local mock.", error);
    return getLocalMockPlan();
  }
}

/**
 * Fallback AI Mock if network or key fails
 */
async function getLocalMockPlan(): Promise<GeneratedPlanBlock[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return [
    {
      id: "mock-1",
      title: "React Under The Hood",
      goal: "Check if Candidate understands internal mechanisms, not just syntax.",
      questions: [
        "Explain Fiber architecture and how concurrent mode affects rendering.",
        "How would you debug massive unnecessary re-renders in a 100-component deep tree?"
      ],
      required: true,
    },
    {
      id: "mock-2",
      title: "Scale & System Design",
      goal: "Evaluate architectural decisions, caching, and CI/CD awareness.",
      questions: [
        "Design a scalable frontend architecture for a real-time trading app.",
        "What caching strategies would you use for heavily dynamic data?"
      ],
      required: true,
    },
    {
      id: "mock-3",
      title: "Soft Skills & Leadership",
      goal: "Determine cultural fit and potential to elevate the team.",
      questions: [
        "Tell me about a time you made a huge deploy mistake. How did you react?",
        "How do you push back against PMs demanding unrealistic deadlines?"
      ],
      required: false,
    }
  ];
}

const SUMMARY_SYSTEM_PROMPT = `You are an unbiased Expert HR and Tech Lead reviewing interview feedback.
Your goal is to aggregate notes and scores from multiple interviewers into a data-driven, objective final summary.

Guidelines:
1. Synthesize all provided evaluations into a single coherent report in RUSSIAN.
2. Calculate overallScore (1.0 to 5.0 scale).
3. Base strengths and risks STRICTLY on the provided "notes". Do not hallucinate.
4. "notableEvidence" must cite specific things the interviewers mentioned (in Russian).
5. If there is a massive gap in scores between interviewers for similar blocks, set recommendation to "СИНХРОНИЗАЦИЯ" and write it in "discrepancies".
6. The "rationale" must clearly explain WHY this recommendation was chosen in RUSSIAN.
7. Tone: Professional, non-biased, HR-friendly, transparent.
8. Output ONLY valid JSON matching the schema. NO Markdown wrappers.`;

export async function generateCandidateSummary(input: {
  candidateName: string;
  role: string;
  level: string;
  evaluations: Array<{
    interviewer: string;
    interviewerRole: string;
    blockTitle: string;
    score: number | null;
    notes: string;
    signal?: string | null;
  }>;
}): Promise<GeneratedCandidateSummary> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ OPENROUTER_API_KEY not found. Using local fallback for summary.");
    return getLocalMockSummary();
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
  });

  const userPrompt = `
Generate an interview summary for the following candidate in RUSSIAN:
Candidate: ${input.candidateName}
Role: ${input.role} (${input.level})

Provided Evaluations Data:
${JSON.stringify(input.evaluations, null, 2)}

Return ONLY a JSON object matching this schema exactly (all strings in Russian):
{
  "overallScore": number, // average, up to 1 decimal
  "recommendation": "НАЗНАЧИТЬ_ОФФЕР" | "ОТКАЗ" | "ДОП_ИНТЕРВЬЮ" | "СИНХРОНИЗАЦИЯ",
  "rationale": "High-level reason for recommendation (Russian)",
  "strengths": ["string in Russian"],
  "risks": ["string in Russian"],
  "notableEvidence": ["Evidence from notes in Russian"],
  "discrepancies": "string in Russian or null if none",
  "nextStepSuggestion": "Specific actionable next step in Russian"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Low temperature for consistent factual summaries
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No content received");

    const parsedJson = JSON.parse(content);
    return CandidateSummaryZodSchema.parse(parsedJson);

  } catch (error) {
    console.error("AI Summary generation failed. Falling back.", error);
    return getLocalMockSummary();
  }
}

async function getLocalMockSummary(): Promise<GeneratedCandidateSummary> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    overallScore: 3.8,
    recommendation: "СИНХРОНИЗАЦИЯ",
    rationale: "Кандидат обладает сильным потенциалом и знаниями React, однако мнения команды критически разошлись по компетенции System Design.",
    strengths: [
      "Глубокое понимание монолитной архитектуры и SSR",
      "Уверенные знания Event Loop и JS Core",
      "Хороший React базис"
    ],
    risks: [
      "Слабое понимание современных микрофронтендов",
      "Склонность к монолитным решениям в ситуациях, требующих масштабирования"
    ],
    notableEvidence: [
      "Дмитрий отметил: 'Предложила строить всё через iframes. Архитектурное мышление хромает.' (Оценка 2)",
      "Елена высоко оценила опыт SSR: 'Гениально расписала монолитную платформу...' (Оценка 5)"
    ],
    discrepancies: "Разница в 3 балла по System Design. Дмитрий оценивал знания микрофронтэндов (2 балла), а Елена оценивала опыт SSR (5 баллов).",
    nextStepSuggestion: "Организовать 15-минутный синк между Дмитрием и Еленой для выработки единой позиции. При необходимости назначить короткий доп. этап по архитектуре."
  };
}

const DISAGREEMENT_SYSTEM_PROMPT = `You are an internal HR Calibration Expert.
You are given a case where interviewers evaluated the same candidate on the same competency but gave wildly different scores (difference >= 2).
Your job is to read their notes and determine WHY they disagreed.
Do not summarize. Interpret the core conflict in RUSSIAN.
Was it because one interviewer asked a harder question? Or one focused on theory while the other focused on practice? Or are they evaluating different aspects of the same block?
Assess if this is a systemic risk for hiring, and recommend an action.
Output MUST be valid JSON (all strings in Russian).`;

export async function analyzeDisagreements(payload: {
  candidateName: string;
  conflicts: Array<{
    blockTitle: string;
    evaluations: Array<{ interviewer: string; score: number; notes: string }>;
  }>;
}): Promise<DisagreementInterpretation[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    // Fallback Mock
    await new Promise(resolve => setTimeout(resolve, 1500));
    return payload.conflicts.map(c => ({
      blockTitle: c.blockTitle,
      reason: "Интервьюеры оценивали разные аспекты. Один сфокусировался на микрофронтендах (которых кандидат не знает), другой — на монолитном SSR (где кандидат силен).",
      isRisk: false,
      recommendedAction: "CALIBRATION",
      actionDescription: "Провести 10-минутный синк (Calibration), чтобы решить, нужны ли проекту именно микрофронтенды или SSR-монолита достаточно."
    }));
  }

  const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey });

  const userPrompt = `
Analyze these specific disagreements for candidate ${payload.candidateName} in RUSSIAN:
${JSON.stringify(payload.conflicts, null, 2)}

Return JSON matching this schema (all strings in Russian):
{
  "disagreements": [
    {
      "blockTitle": "string",
      "reason": "Deep interpretation of why their notes/perspective differed (Russian)",
      "isRisk": boolean,
      "recommendedAction": "CALIBRATION" | "EXTRA_INTERVIEW" | "FOCUS_AREA",
      "actionDescription": "Actionable advice for the hiring manager (Russian)"
    }
  ]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: DISAGREEMENT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");
    
    const parsedJson = JSON.parse(content);
    return DisagreementInterpretationSchema.parse(parsedJson).disagreements;
  } catch (e) {
    console.error("Disagreement AI failed", e);
    // Silent fallback
    return payload.conflicts.map(c => ({
      blockTitle: c.blockTitle,
      reason: "Ошибка парсинга. Вероятно, интервьюеры смотрели на компетенцию под разным углом.",
      isRisk: true,
      recommendedAction: "CALIBRATION",
      actionDescription: "Собраться и обсудить оценки."
    }));
  }
}

