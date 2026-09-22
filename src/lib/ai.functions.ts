import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * AI abstraction layer.
 * The rest of the app calls `generateAiCoaching` and never talks to a provider
 * directly, so the model/provider can be swapped in this one file.
 */

const subjectSchema = z.object({
  name: z.string().max(120),
  attended: z.number().int().min(0).max(10000),
  total: z.number().int().min(0).max(10000),
  percentage: z.number().min(0).max(100),
  target: z.number().min(0).max(100),
  safeSkips: z.number().min(0).max(10000),
  classesNeeded: z.number().min(0).max(10000),
});

const inputSchema = z.object({
  minimum: z.number().min(0).max(100),
  target: z.number().min(0).max(100),
  overallPercentage: z.number().min(0).max(100),
  subjects: z.array(subjectSchema).max(20),
  question: z.string().trim().max(500).optional(),
});

export type AiCoachingInput = z.infer<typeof inputSchema>;

export interface AiCoachingResult {
  summary: string;
  actions: string[];
  source: "ai" | "fallback";
}

export const generateAiCoaching = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<AiCoachingResult> => {
    const apiKey = process.env["AI_API_KEY"];
    const apiUrl = process.env["AI_API_URL"] ?? "https://api.openai.com/v1/chat/completions";
    const model = process.env["AI_MODEL"] ?? "gpt-4o-mini";
    const facts = data.subjects
      .map(
        (s) =>
          `${s.name}: ${s.attended}/${s.total} attended (${s.percentage}%), target ${s.target}%, safe skips ${s.safeSkips}, classes needed to reach target ${s.classesNeeded}`,
      )
      .join("\n");

    if (!apiKey) {
      return fallback(data);
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are AttendMate's academic attendance coach. Use ONLY the numbers provided; never invent data or make claims you cannot derive from them. Reply with strict JSON: {\"summary\": string (max 3 sentences), \"actions\": string[] (2-4 short imperative items)}. Be calm, precise and encouraging.",
            },
            {
              role: "user",
              content: `Minimum requirement: ${data.minimum}%. Personal target: ${data.target}%. Overall attendance: ${data.overallPercentage}%.\nSubjects:\n${facts}\n${data.question ? `Student question: ${data.question}` : ""}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error("AI gateway error", response.status);
        return fallback(data);
      }

      const json = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = json.choices?.[0]?.message?.content ?? "";
      const parsed = JSON.parse(content.replace(/```json|```/g, "").trim()) as {
        summary?: string;
        actions?: string[];
      };
      if (!parsed.summary) return fallback(data);
      return {
        summary: parsed.summary,
        actions: (parsed.actions ?? []).slice(0, 4),
        source: "ai",
      };
    } catch (error) {
      console.error("AI coaching failed", error);
      return fallback(data);
    }
  });

function fallback(data: AiCoachingInput): AiCoachingResult {
  const risky = data.subjects.filter((s) => s.percentage < data.minimum);
  const strong = data.subjects.filter((s) => s.percentage >= s.target);
  const summary = risky.length
    ? `${risky.length} subject${risky.length > 1 ? "s are" : " is"} below the ${data.minimum}% requirement. Overall attendance is ${data.overallPercentage}%.`
    : `All subjects are above the ${data.minimum}% requirement, with overall attendance at ${data.overallPercentage}%.`;
  const actions = [
    ...risky.map(
      (s) => `Attend the next ${s.classesNeeded} ${s.name} classes without absence to reach ${s.target}%.`,
    ),
    ...strong
      .slice(0, 2)
      .map((s) => `${s.name} allows about ${s.safeSkips} safe skips at your ${s.target}% target.`),
  ].slice(0, 4);
  return { summary, actions, source: "fallback" };
}
