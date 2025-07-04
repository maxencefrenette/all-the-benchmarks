import { cn } from "../utils"
import { expect, test } from "vitest"

test("cn merges class names following tailwind rules", () => {
  expect(cn("p-2", "p-4")).toBe("p-4")
  expect(cn("text-left", "text-right", "text-center")).toBe("text-center")
})

test("cn filters out falsy values", () => {
  expect(cn("foo", null, undefined, false && "bar")).toBe("foo")
})
