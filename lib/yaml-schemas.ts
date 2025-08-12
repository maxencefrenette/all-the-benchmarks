import { z } from "zod"

export const MappingFileSchema = z.record(z.string(), z.string().nullable())
export type MappingFile = z.infer<typeof MappingFileSchema>

export const ModelFileSchema = z.object({
  provider: z.string(),
  reasoning_efforts: z.record(z.string(), z.string()),
  deprecated: z.boolean().optional(),
  release_date: z.iso
    .date()
    .transform((str) => new Date(str))
    .optional(),
})
export type ModelFile = z.infer<typeof ModelFileSchema>

export const BenchmarkFileSchema = z.object({
  benchmark: z.string(),
  description: z.string(),
  website: z.string().url().nullable(),
  github: z.string().url().nullable(),
  score_weight: z.number(),
  cost_weight: z.number(),
  results: z.record(z.string(), z.number()),
  model_name_mapping_file: z.string(),
  private_holdout: z.boolean(),
  cost_per_task: z.record(z.string(), z.number()).optional(),
})
export type BenchmarkFile = z.infer<typeof BenchmarkFileSchema>

const BenchmarkResultSchema = z.object({
  score: z.number(),
  normalized_score: z.number().optional(),
  cost: z.number().optional(),
  normalized_cost: z.number().optional(),
})

export const ProcessedBenchmarkFileSchema = z
  .object({
    sigmoid: z
      .object({
        min: z.number(),
        max: z.number(),
        midpoint: z.number(),
        slope: z.number(),
      })
      .optional(),
  })
  .catchall(BenchmarkResultSchema)
export type ProcessedBenchmarkFile = z.infer<
  typeof ProcessedBenchmarkFileSchema
>
