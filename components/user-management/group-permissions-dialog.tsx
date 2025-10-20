"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { UserGroup, GroupPermission, SectionKey } from "@/lib/types"
import { SECTIONS } from "@/lib/types"

interface GroupPermissionsDialogProps {
  group: UserGroup | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PermissionState {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

type PermissionsMap = Record<SectionKey, PermissionState>

export function GroupPermissionsDialog({
  group,
  open,
  onOpenChange,
}: GroupPermissionsDialogProps) {
  const { toast } = useToast()
  const [permissions, setPermissions] = useState<PermissionsMap>({} as PermissionsMap)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (group && open) {
      loadPermissions()
    }
  }, [group, open])

  async function loadPermissions() {
    if (!group) return

    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("group_permissions")
        .select("*")
        .eq("group_id", group.id)

      if (error) throw error

      // Initialize permissions map with all sections
      const permissionsMap: PermissionsMap = {} as PermissionsMap
      
      Object.keys(SECTIONS).forEach((key) => {
        const sectionKey = key as SectionKey
        const existing = data?.find((p) => p.section_key === sectionKey)
        
        permissionsMap[sectionKey] = {
          view: existing?.can_view || false,
          create: existing?.can_create || false,
          edit: existing?.can_edit || false,
          delete: existing?.can_delete || false,
        }
      })

      setPermissions(permissionsMap)
    } catch (error) {
      console.error("Error loading permissions:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as permissões",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handlePermissionChange(
    section: SectionKey,
    permission: keyof PermissionState,
    checked: boolean
  ) {
    setPermissions((prev) => {
      const newPermissions = { ...prev }
      const sectionPerms = { ...newPermissions[section] }

      // Update the specific permission
      sectionPerms[permission] = checked

      // Auto-check "view" when other permissions are checked
      if (checked && permission !== "view") {
        sectionPerms.view = true
      }

      // Auto-uncheck other permissions when "view" is unchecked
      if (!checked && permission === "view") {
        sectionPerms.create = false
        sectionPerms.edit = false
        sectionPerms.delete = false
      }

      newPermissions[section] = sectionPerms
      return newPermissions
    })
  }

  async function handleSave() {
    if (!group) return

    try {
      setSaving(true)
      const supabase = createClient()

      // Check if at least one section has view permission
      const hasAnyPermission = Object.values(permissions).some((p) => p.view)
      
      if (!hasAnyPermission) {
        toast({
          title: "Erro",
          description: "Pelo menos uma seção deve ter permissão de visualização",
          variant: "destructive",
        })
        return
      }

      // Delete existing permissions
      await supabase
        .from("group_permissions")
        .delete()
        .eq("group_id", group.id)

      // Insert new permissions
      const permissionsToInsert: Omit<GroupPermission, "id" | "created_at">[] = []

      Object.entries(permissions).forEach(([sectionKey, perms]) => {
        // Only insert if at least view permission is granted
        if (perms.view) {
          permissionsToInsert.push({
            group_id: group.id,
            section_key: sectionKey,
            can_view: perms.view,
            can_create: perms.create,
            can_edit: perms.edit,
            can_delete: perms.delete,
          })
        }
      })

      if (permissionsToInsert.length > 0) {
        const { error } = await supabase
          .from("group_permissions")
          .insert(permissionsToInsert)

        if (error) throw error
      }

      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso",
      })

      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving permissions:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar as permissões",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!group) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permissões: {group.name}</DialogTitle>
          <DialogDescription>
            Configure as permissões de acesso para este grupo
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando permissões...
          </div>
        ) : (
          <div className="py-4">
            <div className="rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Seção</th>
                    <th className="text-center p-3 font-medium w-24">Visualizar</th>
                    <th className="text-center p-3 font-medium w-24">Criar</th>
                    <th className="text-center p-3 font-medium w-24">Editar</th>
                    <th className="text-center p-3 font-medium w-24">Excluir</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(SECTIONS).map(([key, section]) => {
                    const sectionKey = key as SectionKey
                    const sectionPerms = permissions[sectionKey] || {
                      view: false,
                      create: false,
                      edit: false,
                      delete: false,
                    }

                    return (
                      <tr key={sectionKey} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3">
                          <div className="font-medium">{section.label}</div>
                          <div className="text-xs text-muted-foreground">{section.path}</div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={sectionPerms.view}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(sectionKey, "view", checked as boolean)
                              }
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={sectionPerms.create}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(sectionKey, "create", checked as boolean)
                              }
                              disabled={!sectionPerms.view}
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={sectionPerms.edit}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(sectionKey, "edit", checked as boolean)
                              }
                              disabled={!sectionPerms.view}
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={sectionPerms.delete}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(sectionKey, "delete", checked as boolean)
                              }
                              disabled={!sectionPerms.view}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * Ao marcar permissões de criar, editar ou excluir, a permissão de visualizar será automaticamente marcada
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Salvando..." : "Salvar Permissões"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
