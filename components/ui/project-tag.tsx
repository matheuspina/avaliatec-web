import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ProjectTagProps {
  projectName: string
  projectCode?: string
  projectColor: string | null
  size?: "sm" | "md" | "lg"
  className?: string
  showTooltip?: boolean
}

export function ProjectTag({
  projectName,
  projectCode,
  projectColor,
  size = "md",
  className,
  showTooltip = true,
}: ProjectTagProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  }

  const defaultColor = "#6B7280" // gray-500
  const color = projectColor || defaultColor

  // Calcular luminosidade para determinar cor do texto
  const getLuminance = (hexColor: string): number => {
    const hex = hexColor.replace("#", "")
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255
  }

  const luminance = getLuminance(color)
  const textColor = luminance > 0.5 ? "#000000" : "#FFFFFF"

  const badge = (
    <Badge
      className={cn(
        "font-medium border-none",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: color,
        color: textColor,
      }}
    >
      {projectCode || projectName}
    </Badge>
  )

  if (showTooltip && projectCode) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{projectName}</p>
            <p className="text-xs text-muted-foreground">{projectCode}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}
