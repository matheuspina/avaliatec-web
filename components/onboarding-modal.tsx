"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Camera, Loader2, User } from "lucide-react"

interface OnboardingModalProps {
  open: boolean
  initialName: string
  userId: string
  onComplete: (fullName: string, avatarUrl: string | null) => void
}

export function OnboardingModal({ open, initialName, userId, onComplete }: OnboardingModalProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(initialName)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A foto deve ter no máximo 5 MB.",
        variant: "destructive",
      })
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome completo.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      let avatarUrl: string | null = null

      // Upload avatar to Supabase Storage if a file was selected
      if (avatarFile) {
        const supabase = createClient()
        const ext = avatarFile.name.split(".").pop()
        const filePath = `${userId}/avatar.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) {
          throw new Error("Falha ao enviar a foto")
        }

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath)

        avatarUrl = urlData.publicUrl
      }

      // Save profile via API
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          avatar_url: avatarUrl,
          onboarding_completed: true,
        }),
      })

      if (!res.ok) {
        throw new Error("Falha ao salvar perfil")
      }

      onComplete(fullName.trim(), avatarUrl)
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar seu perfil. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        // Prevent closing by clicking outside or pressing Escape
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Bem-vindo ao AvaliaTec!</DialogTitle>
          <DialogDescription>
            Confirme seus dados para continuar. A foto de perfil é opcional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarImage src={avatarPreview ?? undefined} />
                <AvatarFallback className="text-2xl bg-muted">
                  {fullName ? getInitials(fullName) : <User className="h-10 w-10 text-muted-foreground" />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                aria-label="Alterar foto de perfil"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {avatarFile ? avatarFile.name : "Clique para adicionar uma foto"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Full name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              required
              disabled={saving}
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving || !fullName.trim()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Confirmar e entrar"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
