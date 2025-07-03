"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Leaderboard" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/about", label: "About" },
  {
    href: "https://github.com/maxencefrenette/all-the-benchmarks",
    label: "GitHub",
  },
]

export default function NavigationPills() {
  const pathname = usePathname()

  return (
    <nav className="flex justify-center gap-2">
      {links.map((link) =>
        link.href.startsWith("http") ? (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "px-4 py-1 rounded-full border text-sm hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-4 py-1 rounded-full border text-sm",
              pathname === link.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {link.label}
          </Link>
        ),
      )}
    </nav>
  )
}
