"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ProjectTag } from "@/components/ui/project-tag"

interface ProjectColorPickerProps {
  projectName: string
  projectCode?: string
  currentColor: string | null
  onColorChange: (color: string) => void
  className?: string
}

// Paleta de cores pré-definidas
const PRESET_COLORS = [
  { name: "Vermelho", value: "#EF4444" },
  { name: "Laranja", value: "#F97316" },
  { name: "Amarelo", value: "#EAB308" },
  { name: "Lima", value: "#84CC16" },
  { name: "Verde", value: "#22C55E" },
  { name: "Esmeralda", value: "#10B981" },
  { name: "Ciano", value: "#06B6D4" },
  { name: "Azul", value: "#3B82F6" },
  { name: "Índigo", value: "#6366F1" },
  { name: "Roxo", value: "#A855F7" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Cinza", value: "#6B7280" },
]

export function ProjectColorPicker({
  projectName,
  projectCode,
  currentColor,
  onColorChange,
  className,
}: ProjectColorPickerProps) {
  const [customColor, setCustomColor] = useState(currentColor || "#3B82F6")

  const handlePresetColorClick = (color: string) => {
    setCustomColor(color)
    onColorChange(color)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    onColorChange(color)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Preview da tag */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Preview</Label>
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/20">
          <ProjectTag
            projectName={projectName}
            projectCode={projectCode}
            projectColor={customColor}
            size="md"
            showTooltip={false}
          />
          <span className="text-sm text-muted-foreground">
            {projectName}
          </span>
        </div>
      </div>

      {/* Paleta pré-definida */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Cores Pré-definidas
        </Label>
        <div className="grid grid-cols-6 gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handlePresetColorClick(preset.value)}
              className={cn(
                "relative h-10 w-full rounded-md border-2 transition-all hover:scale-110",
                customColor === preset.value
                  ? "border-foreground ring-2 ring-foreground ring-offset-2"
                  : "border-transparent hover:border-muted-foreground"
              )}
              style={{ backgroundColor: preset.value }}
              title={preset.name}
            >
              {customColor === preset.value && (
                <Check className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Seletor customizado */}
      <div>
        <Label htmlFor="custom-color" className="text-sm font-medium mb-2 block">
          Cor Personalizada
        </Label>
        <div className="flex gap-2">
          <Input
            id="custom-color"
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            className="h-10 w-20 cursor-pointer"
          />
          <Input
            type="text"
            value={customColor}
            onChange={(e) => {
              const value = e.target.value
              if (/^#[0-9A-F]{6}$/i.test(value)) {
                setCustomColor(value)
                onColorChange(value)
              }
            }}
            placeholder="#3B82F6"
            className="flex-1 font-mono"
            maxLength={7}
          />
        </div>
      </div>
    </div>
  )
}
