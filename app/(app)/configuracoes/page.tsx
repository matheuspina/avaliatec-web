"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, GripVertical, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Protected } from "@/components/protected"
import { usePermissions } from "@/contexts/permission-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  listProjectStatuses,
  createProjectStatus,
  updateProjectStatus,
  deleteProjectStatus,
  type ProjectStatus,
} from "@/lib/data/project-statuses"
import { useToast } from "@/hooks/use-toast"
import { AppMainBleed } from "@/components/app-main-bleed"
import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  email: string
  full_name: string
  group_id: string | null
  group_name: string | null
}

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const { hasPermission, currentUser } = usePermissions()
  const [statuses, setStatuses] = useState<ProjectStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6",
    description: "",
  })

  // Perfil do usuário logado
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileName, setProfileName] = useState("")

  // Check if user is admin (has a group named "Administrador")
  const [isAdmin, setIsAdmin] = useState(false)

  // Carrega o perfil real via RPC
  const loadUserProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase.rpc("get_current_user_profile")
      if (error) throw error
      const profile = data as UserProfile
      setUserProfile(profile)
      setProfileName(profile.full_name)
      setIsAdmin(profile.group_name === "Administrador")
    } catch (error) {
      console.error("Erro ao carregar perfil:", error)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUserProfile()
  }, [])

  const loadStatuses = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listProjectStatuses(false)
      setStatuses(data)
    } catch (error) {
      console.error("Erro ao carregar status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os status de projetos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadStatuses()
  }, [loadStatuses])

  const handleOpenDialog = (status?: ProjectStatus) => {
    if (status) {
      setEditingStatus(status)
      setFormData({
        name: status.name,
        color: status.color,
        description: status.description || "",
      })
    } else {
      setEditingStatus(null)
      setFormData({
        name: "",
        color: "#3B82F6",
        description: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: "Erro",
          description: "O nome do status é obrigatório",
          variant: "destructive",
        })
        return
      }

      if (editingStatus) {
        await updateProjectStatus(editingStatus.id, {
          name: formData.name,
          color: formData.color,
          description: formData.description || null,
        })
        toast({
          title: "Sucesso",
          description: "Status atualizado com sucesso",
        })
      } else {
        await createProjectStatus({
          name: formData.name,
          color: formData.color,
          description: formData.description,
        })
        toast({
          title: "Sucesso",
          description: "Status criado com sucesso",
        })
      }

      setIsDialogOpen(false)
      await loadStatuses()
    } catch (error) {
      console.error("Erro ao salvar status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este status?")) return

    try {
      await deleteProjectStatus(id)
      toast({
        title: "Sucesso",
        description: "Status excluído com sucesso",
      })
      await loadStatuses()
    } catch (error) {
      console.error("Erro ao excluir status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o status. Pode haver projetos usando este status.",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (status: ProjectStatus) => {
    try {
      await updateProjectStatus(status.id, {
        isActive: !status.isActive,
      })
      await loadStatuses()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast({
        title: "Erro",
        description: "O nome não pode ser vazio",
        variant: "destructive",
      })
      return
    }
    try {
      setProfileSaving(true)
      const supabase = createClient()
      const { error } = await supabase.rpc("update_current_user_profile", {
        p_full_name: profileName.trim(),
      })
      if (error) throw error
      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso" })
      await loadUserProfile()
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      })
    } finally {
      setProfileSaving(false)
    }
  }

  return (
    <AppMainBleed className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>

      <div className="grid gap-6">
        {/* User Management - Admin Only */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestão de Usuários
                  </CardTitle>
                  <CardDescription>
                    Gerencie grupos, permissões e convites de usuários
                  </CardDescription>
                </div>
                <Link href="/configuracoes/usuarios">
                  <Button>
                    Acessar Gestão de Usuários
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure grupos de usuários, defina permissões granulares e envie convites para novos membros da equipe.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Status de Projetos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status de Projetos</CardTitle>
                <CardDescription>
                  Configure os status disponíveis para os projetos
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Status
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : statuses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum status cadastrado
              </p>
            ) : (
              <div className="space-y-2">
                {statuses.map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="cursor-move">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div
                      className="h-4 w-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{status.name}</p>
                        {!status.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      {status.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {status.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(status)}
                      >
                        {status.isActive ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(status)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(status.id)}
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
        <Card>
          <CardHeader>
            <CardTitle>Perfil do Usuário</CardTitle>
            <CardDescription>
              Informações do usuário logado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileLoading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="profile-name">Nome</Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    disabled={profileSaving}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={userProfile?.email ?? ""}
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-group">Grupo</Label>
                  <Input
                    id="profile-group"
                    value={userProfile?.group_name ?? "Sem grupo"}
                    disabled
                  />
                </div>
                <Button onClick={handleSaveProfile} disabled={profileSaving}>
                  {profileSaving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferências do Sistema</CardTitle>
            <CardDescription>
              Configure as preferências de exibição
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tema Escuro</Label>
                <p className="text-sm text-muted-foreground">
                  Dark mode está ativo por padrão
                </p>
              </div>
              <Badge>Ativo</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cor Primária</Label>
                <p className="text-sm text-muted-foreground">
                  Cor principal do sistema
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary" />
                <span className="text-sm font-mono">#25C961</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações de prazos
                </p>
              </div>
              <Badge variant="outline">Habilitado</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Criação/Edição de Status */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? "Editar Status" : "Novo Status"}
            </DialogTitle>
            <DialogDescription>
              {editingStatus
                ? "Edite as informações do status"
                : "Crie um novo status de projeto"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Ex: Em desenvolvimento"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="h-10 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="flex-1 font-mono"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição opcional do status"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppMainBleed>
  )
}
