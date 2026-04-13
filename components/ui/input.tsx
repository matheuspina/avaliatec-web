import * as React from "react"
import { Calendar, Clock } from "lucide-react"

import { cn } from "@/lib/utils"

function isNativeTemporalInput(type: string | undefined) {
  return (
    type === "date" ||
    type === "datetime-local" ||
    type === "time" ||
    type === "month" ||
    type === "week"
  )
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => {
    const temporal = isNativeTemporalInput(type)

    if (type === "file") {
      return (
        <input
          type={type}
          className={cn(
            "flex h-10 w-full cursor-pointer items-center rounded-md border border-input bg-muted px-3.5 py-2 text-base text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
      )
    }

    const input = (
      <input
        type={type}
        className={cn(
          "h-10 w-full rounded-md border border-input bg-muted py-2 text-base text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "block min-h-10 leading-normal",
          temporal ? "native-temporal-pick relative pl-3.5 pr-10" : "px-3.5",
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (!temporal) return input

    return (
      <div className="relative w-full">
        {input}
        <span
          className="pointer-events-none absolute inset-y-0 end-2.5 z-0 flex items-center text-muted-foreground"
          aria-hidden
        >
          {type === "time" ? (
            <Clock className="h-4 w-4 shrink-0 opacity-90" />
          ) : (
            <Calendar className="h-4 w-4 shrink-0 opacity-90" />
          )}
        </span>
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
