"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Search, ChevronRight, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PROVIDER_COLORS } from "@/lib/provider-colors"
import { formatSigFig } from "@/lib/utils"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { TableRow } from "@/lib/data-loader"

const CostCell = ({ cost }: { cost: number | null }) => {
  if (cost === null || Number.isNaN(cost)) return null
  return <Badge variant="secondary">{formatSigFig(cost)}</Badge>
}

export const columns: ColumnDef<TableRow>[] = [
  {
    accessorKey: "model",
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Model
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4">
                <Search className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2">
              <Input
                placeholder="Filter..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("model")}</div>
    ),
  },
  {
    accessorKey: "provider",
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Provider
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4">
                <Search className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2">
              <Input
                placeholder="Filter..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      )
    },
    cell: ({ row }) => {
      const provider = row.getValue("provider") as string
      const color = PROVIDER_COLORS[provider]
      return (
        <Badge
          variant="outline"
          style={{
            backgroundColor: color,
            color: color ? "white" : undefined,
            borderColor: color,
          }}
        >
          {provider}
        </Badge>
      )
    },
  },
  {
    accessorKey: "averageScore",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ability Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const score = row.getValue("averageScore") as number
      const count = row.original.benchmarkCount
      return (
        <div className="font-semibold flex items-center gap-1">
          <Badge variant="secondary" className="cursor-default">
            {score.toFixed(1)}
          </Badge>
          {count < 5 && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  {`This model has only been evaluated on ${count.toFixed(1)} out of ${row.original.totalBenchmarks.toFixed(1)} benchmarks`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "costPerTask",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cost Per Task (normalized)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const cost = row.getValue("costPerTask") as number | null
      const count = row.original.costBenchmarkCount
      return (
        <div className="font-semibold flex items-center gap-1">
          <CostCell cost={cost} />
          {cost !== null && count < 3 && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  {`This model's cost has only been evaluated on ${count.toFixed(1)} out of ${row.original.totalCostBenchmarks.toFixed(1)} benchmarks with cost data`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )
    },
  },
  {
    id: "details",
    header: "Details",
    cell: ({ row }) => (
      <Link
        href={`/models/${row.original.slug}`}
        className="text-primary underline flex"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    ),
  },
]
