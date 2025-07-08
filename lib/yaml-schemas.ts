import { z } from "zod"

export const MappingFileSchema = z.record(z.string().nullable())
export type MappingFile = z.infer<typeof MappingFileSchema>

export const ModelFileSchema = z.object({
  provider: z.string(),
  models: z.record(z.string()),
  deprecated: z.boolean().optional(),
})
export type ModelFile = z.infer<typeof ModelFileSchema>

export const BenchmarkFileSchema = z.object({
  benchmark: z.string(),
  description: z.string(),
  results: z.record(z.number()),
  model_name_mapping_file: z.string(),
  cost_per_task: z.record(z.number()).optional(),
})
export type BenchmarkFile = z.infer<typeof BenchmarkFileSchema>
