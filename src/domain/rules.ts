import { z } from 'zod'

export const sessionSetSchema = z.object({
  reps: z.number().int().min(1).max(999),
  weight: z.number().min(0).max(9999),
  weight_unit: z.enum(['kg', 'lb']),
  notes: z.string().max(500).nullable(),
})

export const templateExerciseSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  target_sets: z.number().int().min(1).max(99),
  target_reps_min: z.number().int().min(1).max(999),
  target_reps_max: z.number().int().min(1).max(999),
  rest_seconds: z.number().int().min(0).max(600),
  notes: z.string().max(500).nullable(),
})

export const workoutTemplateSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(500).nullable(),
})

export const workoutSessionSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  notes: z.string().max(500).nullable(),
})
