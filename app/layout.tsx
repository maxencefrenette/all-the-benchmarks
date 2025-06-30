import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "All the Benchmarks!",
  description:
    "Sortable and filterable comparison of LLM performance across key benchmarks",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
