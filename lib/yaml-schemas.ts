import { z } from "zod/v4"

export const MappingFileSchema = z.record(z.string(), z.string().nullable())
export type MappingFile = z.infer<typeof MappingFileSchema>

export const ModelFileSchema = z.object({
  provider: z.string(),
  models: z.record(z.string(), z.string()),
  deprecated: z.boolean().optional(),
})
export type ModelFile = z.infer<typeof ModelFileSchema>

export const BenchmarkFileSchema = z.object({
  benchmark: z.string(),
  description: z.string(),
  results: z.record(z.string(), z.number()),
  model_name_mapping_file: z.string(),
  cost_per_task: z.record(z.string(), z.number()).optional(),
})
export type BenchmarkFile = z.infer<typeof BenchmarkFileSchema>
