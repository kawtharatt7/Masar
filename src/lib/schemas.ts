import { z } from 'zod';

const pct = z.coerce
  .number()
  .transform((n) => Math.max(0, Math.min(100, Math.round(n))));

export const AnalysisSchema = z.object({
  summary: z.string(),
  marketInsight: z.string().default(''),
  matchScore: pct,
  strengths: z
    .array(z.object({ skill: z.string(), evidence: z.string().default('') }))
    .default([]),
  gaps: z
    .array(
      z.object({
        skill: z.string(),
        importance: z.enum(['high', 'medium', 'low']).catch('medium'),
        reason: z.string().default(''),
      }),
    )
    .default([]),
  skills: z.array(z.object({ name: z.string(), have: pct, need: pct })).default([]),
  roadmap: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
        duration: z.string().default(''),
        description: z.string().default(''),
        topics: z.array(z.string()).default([]),
        actions: z.array(z.string()).default([]),
        projectIdea: z.string().default(''),
      }),
    )
    .default([]),
  courses: z
    .array(
      z.object({
        title: z.string(),
        provider: z.string().default(''),
        skill: z.string().default(''),
        level: z.string().default(''),
      }),
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().default(''),
        why: z.string().default(''),
      }),
    )
    .default([]),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

// The analysis is generated in two parallel calls to cut waiting time.
export const CoreSchema = AnalysisSchema.pick({
  summary: true,
  marketInsight: true,
  matchScore: true,
  strengths: true,
  gaps: true,
  skills: true,
});
export const PlanSchema = AnalysisSchema.pick({ roadmap: true, courses: true, certifications: true });

export const RolesSchema = z.object({
  roles: z
    .array(
      z.object({
        title: z.string(),
        why: z.string().default(''),
        demand: z.enum(['high', 'medium', 'low']).catch('medium'),
        skills: z.array(z.string()).default([]),
      }),
    )
    .min(1),
});
