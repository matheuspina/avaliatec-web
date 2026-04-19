import type { ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/utils"

/** Compensa o padding do `(app)/layout` para a área útil ir até as bordas da coluna principal (como em /email). */
export const appMainBleedClassName =
  "-mx-4 -my-6 min-h-0 min-w-0 w-auto max-w-none sm:-mx-6 sm:-my-8 lg:-mx-8 lg:-my-10"

/** Mesmo ritmo de padding do `(app)/layout` — reaplicado por dentro após o bleed. */
export const appMainBleedPaddingClassName =
  "px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"

interface AppMainBleedProps extends ComponentPropsWithoutRef<"div"> {
  /** Preenche a altura útil da coluna e permite filhos com scroll interno (ex.: email, atendimento) */
  fillHeight?: boolean
  /**
   * Se true (padrão), reaplica o padding do layout por dentro, para o conteúdo não ficar colado nas bordas.
   * Use false em /email, onde pastas/lista/viewer devem encostar nas divisórias internas.
   */
  padContent?: boolean
}

export function AppMainBleed({
  children,
  className,
  fillHeight,
  padContent = true,
  ...props
}: AppMainBleedProps) {
  const outerClassName = cn(
    appMainBleedClassName,
    "flex min-h-0 flex-1 flex-col",
    fillHeight && "basis-0 overflow-hidden",
    !padContent && className
  )

  if (!padContent) {
    return (
      <div className={outerClassName} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div className={outerClassName} {...props}>
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          appMainBleedPaddingClassName,
          fillHeight && "min-h-0 overflow-hidden",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
