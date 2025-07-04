import { execSync } from "child_process"

export function curl(url: string): string {
  return execSync(`curl -sL ${url}`, { encoding: "utf8" })
}
