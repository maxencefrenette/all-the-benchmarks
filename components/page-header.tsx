import Image from "next/image"
import type { ReactNode } from "react"

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  iconSrc?: string
}

export default function PageHeader({
  title,
  subtitle,
  iconSrc,
}: PageHeaderProps) {
  return (
    <div className="text-center space-y-2 min-h-28 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
        {iconSrc && (
          <Image
            src={iconSrc}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9"
          />
        )}
        <span>{title}</span>
      </h1>
      {subtitle && <p className="text-muted-foreground text-lg">{subtitle}</p>}
    </div>
  )
}
