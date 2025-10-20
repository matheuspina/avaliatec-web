"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { UserGroup } from "@/lib/types"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { GroupPermissionsDialog } from "./group-permissions-dialog"

interface GroupFormData {
  name: string
  description: string
}

export function GroupsManagement() {
  const { toast } = useToast()
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [userCounts, setUserCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<UserGroup | null>(null)
  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    description: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    try {
      setLoading(true)
      const supabase = createClient()

      // Load groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("user_groups")
        .select("*")
        .order("name")

      if (groupsError) throw groupsError

      setGroups(groupsData || [])

      // Load user counts for each group
      const counts: Record<string, number> = {}
      for (const group of groupsData || []) {
        const { count, error: countError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("group_id", group.id)

        if (!countError) {
          counts[group.id] = count || 0
        }
      }
      setUserCounts(counts)
    } catch (error) {
      console.error("Error loading groups:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os grupos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(group?: UserGroup) {
    if (group) {
      setEditingGroup(group)
      setFormData({
        name: group.name,
        description: group.description || "",
      })
    } else {
      setEditingGroup(null)
      setFormData({
        name: "",
        description: "",
      })
    }
    setIsDialogOpen(true)
  }

  function handleOpenPermissionsDialog(group: UserGroup) {
    setSelectedGroup(group)
    setIsPermissionsDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do grupo é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const supabase = createClient()

      if (editingGroup) {
        // Update existing group
        const { error } = await supabase
          .from("user_groups")
          .update({
            name: formData.name,
            description: formData.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingGroup.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Grupo atualizado com sucesso",
        })
      } else {
        // Create new group
        const { data: { user } } = await supabase.auth.getUser()
        
        const { data: currentUser } = await supabase
          .from("users")
          .select("id")
          .eq("auth_user_id", user?.id)
          .single()

        const { error } = await supabase
          .from("user_groups")
          .insert({
            name: formData.name,
            description: formData.description || null,
            is_default: false,
            created_by: currentUser?.id || null,
          })

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Grupo criado com sucesso",
        })
      }

      setIsDialogOpen(false)
      await loadGroups()
    } catch (error: any) {
      console.error("Error saving group:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o grupo",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteClick(group: UserGroup) {
    setGroupToDelete(group)
    setDeleteConfirmOpen(true)
  }

  async function handleDelete() {
    if (!groupToDelete) return

    try {
      const supabase = createClient()

      // Check if group has users
      const userCount = userCounts[groupToDelete.id] || 0
      if (userCount > 0) {
        toast({
          title: "Erro",
          description: `Este grupo possui ${userCount} usuário(s). Reatribua os usuários antes de excluir.`,
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("user_groups")
        .delete()
        .eq("id", groupToDelete.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Grupo excluído com sucesso",
      })

      await loadGroups()
    } catch (error: any) {
      console.error("Error deleting group:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o grupo",
        variant: "destructive",
      })
    } finally {
      setDeleteConfirmOpen(false)
      setGroupToDelete(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grupos de Usuários</CardTitle>
          <CardDescription>Carregando grupos...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Grupos de Usuários</CardTitle>
              <CardDescription>
                Gerencie os grupos e suas permissões
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Grupo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nenhum grupo cadastrado
            </p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{group.name}</p>
                      {group.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Padrão
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{userCounts[group.id] || 0} usuário(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPermissionsDialog(group)}
                    >
                      Permissões
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(group)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(group)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Group Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Editar Grupo" : "Novo Grupo"}
            </DialogTitle>
            <DialogDescription>
              {editingGroup
                ? "Edite as informações do grupo"
                : "Crie um novo grupo de usuários"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Ex: Gerentes"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição opcional do grupo"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <GroupPermissionsDialog
        group={selectedGroup}
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="Excluir Grupo"
        description={`Tem certeza que deseja excluir o grupo "${groupToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </>
  )
}
