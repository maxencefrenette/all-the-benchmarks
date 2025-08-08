"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function LeaderboardToggles() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const showDeprecated = searchParams.get("deprecated") === "true"
  const showIncomplete = searchParams.get("incomplete") === "true"
  const linearScale = searchParams.get("linear") === "true"

  const updateParam = (key: string, value: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, "true")
    } else {
      params.delete(key)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <Switch
          id="linear-toggle"
          checked={linearScale}
          onCheckedChange={(checked) => updateParam("linear", checked)}
        />
        <Label htmlFor="linear-toggle">Linear cost scale</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="deprecated-toggle"
          checked={showDeprecated}
          onCheckedChange={(checked) => updateParam("deprecated", checked)}
        />
        <Label htmlFor="deprecated-toggle">Show deprecated models</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="incomplete-toggle"
          checked={showIncomplete}
          onCheckedChange={(checked) => updateParam("incomplete", checked)}
        />
        <Label htmlFor="incomplete-toggle">Show models with limited data</Label>
      </div>
    </div>
  )
}
