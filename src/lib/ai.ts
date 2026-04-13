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

const SYSTEM_PROMPT = `You are a Senior Staff Engineer and Expert Recruiter.
Your goal is to generate a highly structured, professional interview plan for evaluating a candidate.
The interview should test deep expertise, system thinking, and cultural fit.

Guidelines for output:
1. Divide the interview into logical technical/soft blocks (usually 3-5 blocks).
2. For each block, provide a concise clear \`title\` and a specific \`goal\` (what exactly are we testing?).
3. Provide 2-5 \`questions\` per block. Questions MUST NOT be generic theory. They must be practical, scenario-based, and help compare candidates (e.g. "How would you design X?", "What are the tradeoffs between A and B?").
4. Determine if the block is \`required\` (true for core competencies, false for optional/bonus skills).
5. Output ONLY valid JSON matching the requested schema. No markdown wrappers, no explanations.`;

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
Generate an interview plan for the following vacancy:
Role: ${input.role}
Level: ${input.level}
Competencies: ${input.competencies}
Additional Context: ${input.context || 'None'}

Return ONLY a JSON object with this shape:
{
  "blocks": [
    {
      "title": "Block Name",
      "goal": "Why we ask this",
      "questions": ["Q1", "Q2"],
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
