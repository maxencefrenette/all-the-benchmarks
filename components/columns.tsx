"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

import type { TableRow } from "@/lib/data-loader"

const ScoreCell = ({ score }: { score: number }) => (
  <Badge variant="secondary">{score.toFixed(1)}</Badge>
)

const CostCell = ({ cost }: { cost: number | null }) => {
  if (cost === null || Number.isNaN(cost)) return null
  return <Badge variant="secondary">{cost.toFixed(2)}</Badge>
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
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("provider")}</Badge>
    ),
  },
  {
    accessorKey: "averageScore",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Average Normalized Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const score = row.getValue("averageScore") as number
      return (
        <div className="font-semibold">
          <ScoreCell score={score} />
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
          Cost Per Task (z-score)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const cost = row.getValue("costPerTask") as number | null
      return (
        <div className="font-semibold">
          <CostCell cost={cost} />
        </div>
      )
    },
  },
]
