"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Github } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type NavLink = {
  href: string
  label: string
  icon?: LucideIcon
}

const links: NavLink[] = [
  { href: "/", label: "Leaderboard" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/about", label: "About" },
  {
    href: "https://github.com/maxencefrenette/all-the-benchmarks",
    label: "GitHub",
    icon: Github,
  },
]

export default function NavigationPills() {
  const pathname = usePathname()

  return (
    <nav className="flex justify-center gap-2">
      {links.map((link) => {
        const Icon = link.icon
        return link.href.startsWith("http") ? (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1 px-4 py-1 rounded-full border text-sm hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {link.label}
          </a>
        ) : (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-1 px-4 py-1 rounded-full border text-sm",
              pathname === link.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
