import type { ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/utils"

/** Compensa o padding do `(app)/layout` para o conteúdo usar toda a largura da coluna principal, como em /email */
export const appMainBleedClassName =
  "-mx-4 -my-6 min-h-0 min-w-0 w-auto max-w-none sm:-mx-6 sm:-my-8 lg:-mx-8 lg:-my-10"

interface AppMainBleedProps extends ComponentPropsWithoutRef<"div"> {
  /** Preenche a altura útil da coluna e permite filhos com scroll interno (ex.: email, atendimento) */
  fillHeight?: boolean
}

export function AppMainBleed({
  children,
  className,
  fillHeight,
  ...props
}: AppMainBleedProps) {
  return (
    <div
      className={cn(
        appMainBleedClassName,
        "flex min-h-0 flex-1 flex-col",
        fillHeight && "basis-0 overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
