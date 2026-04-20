"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, GripVertical, Users, User,
  Settings2, ChevronRight, Shield, CircleDot, Palette,
  Moon, Sun,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface UserProfile {
  id: string
  email: string
  full_name: string
  group_id: string | null
  group_name: string | null
}

type Section = "perfil" | "status" | "administracao"

interface NavItem {
  id: Section
  label: string
  icon: React.ElementType
  adminOnly?: boolean
  description: string
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "perfil",
    label: "Meu Perfil",
    icon: User,
    description: "Nome, email e grupo",
  },
  {
    id: "status",
    label: "Status de Projetos",
    icon: CircleDot,
    description: "Gerencie os status disponíveis",
  },
  {
    id: "administracao",
    label: "Administração",
    icon: Shield,
    adminOnly: true,
    description: "Usuários, grupos e permissões",
  },
]

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const { hasPermission, currentUser } = usePermissions()
  const [activeSection, setActiveSection] = useState<Section>("perfil")

  // Status
  const [statuses, setStatuses] = useState<ProjectStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null)
  const [formData, setFormData] = useState({ name: "", color: "#3B82F6", description: "" })

  // Perfil
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileName, setProfileName] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

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

  useEffect(() => { void loadUserProfile() }, [loadUserProfile])

  const loadStatuses = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listProjectStatuses(false)
      setStatuses(data)
    } catch (error) {
      console.error("Erro ao carregar status:", error)
      toast({ title: "Erro", description: "Não foi possível carregar os status", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { void loadStatuses() }, [loadStatuses])

  const handleOpenDialog = (status?: ProjectStatus) => {
    if (status) {
      setEditingStatus(status)
      setFormData({ name: status.name, color: status.color, description: status.description || "" })
    } else {
      setEditingStatus(null)
      setFormData({ name: "", color: "#3B82F6", description: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Erro", description: "O nome do status é obrigatório", variant: "destructive" })
      return
    }
    try {
      if (editingStatus) {
        await updateProjectStatus(editingStatus.id, {
          name: formData.name, color: formData.color, description: formData.description || null,
        })
        toast({ title: "Sucesso", description: "Status atualizado com sucesso" })
      } else {
        await createProjectStatus({ name: formData.name, color: formData.color, description: formData.description })
        toast({ title: "Sucesso", description: "Status criado com sucesso" })
      }
      setIsDialogOpen(false)
      await loadStatuses()
    } catch (error) {
      console.error("Erro ao salvar status:", error)
      toast({ title: "Erro", description: "Não foi possível salvar o status", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este status?")) return
    try {
      await deleteProjectStatus(id)
      toast({ title: "Sucesso", description: "Status excluído com sucesso" })
      await loadStatuses()
    } catch (error) {
      console.error("Erro ao excluir status:", error)
      toast({ title: "Erro", description: "Não foi possível excluir o status. Pode haver projetos usando este status.", variant: "destructive" })
    }
  }

  const handleToggleActive = async (status: ProjectStatus) => {
    try {
      await updateProjectStatus(status.id, { isActive: !status.isActive })
      await loadStatuses()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast({ title: "Erro", description: "O nome não pode ser vazio", variant: "destructive" })
      return
    }
    try {
      setProfileSaving(true)
      const supabase = createClient()
      const { error } = await supabase.rpc("update_current_user_profile", { p_full_name: profileName.trim() })
      if (error) throw error
      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso" })
      await loadUserProfile()
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      toast({ title: "Erro", description: "Não foi possível salvar as alterações", variant: "destructive" })
    } finally {
      setProfileSaving(false)
    }
  }

  const visibleNavItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

  return (
    <AppMainBleed className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e as configurações do sistema
        </p>
      </div>

      <div className="flex min-h-0 w-full gap-8">
        {/* Sidebar nav */}
        <nav className="w-52 shrink-0">
          <div className="space-y-0.5">
            {/* Minha Conta group */}
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-3 pb-1.5 pt-0.5">
              Minha Conta
            </p>
            {visibleNavItems
              .filter(i => !i.adminOnly)
              .map(item => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={activeSection === item.id}
                  onClick={() => setActiveSection(item.id)}
                />
              ))}

            {/* Administração group — only if admin */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-3">
                    Administração
                  </p>
                </div>
                {visibleNavItems
                  .filter(i => i.adminOnly)
                  .map(item => (
                    <NavButton
                      key={item.id}
                      item={item}
                      active={activeSection === item.id}
                      onClick={() => setActiveSection(item.id)}
                    />
                  ))}
              </>
            )}
          </div>
        </nav>

        {/* Divider */}
        <div className="w-px bg-border shrink-0" />

        {/* Content area */}
        <div className="min-w-0 flex-1">
          {activeSection === "perfil" && (
            <SectionPerfil
              userProfile={userProfile}
              profileLoading={profileLoading}
              profileSaving={profileSaving}
              profileName={profileName}
              setProfileName={setProfileName}
              onSave={handleSaveProfile}
            />
          )}

          {activeSection === "status" && (
            <SectionStatus
              statuses={statuses}
              loading={loading}
              onOpenDialog={handleOpenDialog}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          )}

          {activeSection === "administracao" && isAdmin && (
            <SectionAdministracao />
          )}
        </div>
      </div>

      {/* Dialog de Criação/Edição de Status */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStatus ? "Editar Status" : "Novo Status"}</DialogTitle>
            <DialogDescription>
              {editingStatus ? "Edite as informações do status" : "Crie um novo status de projeto"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status-name">Nome *</Label>
              <Input
                id="status-name"
                placeholder="Ex: Em desenvolvimento"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="status-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 font-mono"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-description">Descrição</Label>
              <Textarea
                id="status-description"
                placeholder="Descrição opcional do status"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppMainBleed>
  )
}

/* ─── Nav button ─────────────────────────────────────────────────────────── */

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left",
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </button>
  )
}

/* ─── Section: Perfil ────────────────────────────────────────────────────── */

function SectionPerfil({
  userProfile,
  profileLoading,
  profileSaving,
  profileName,
  setProfileName,
  onSave,
}: {
  userProfile: UserProfile | null
  profileLoading: boolean
  profileSaving: boolean
  profileName: string
  setProfileName: (v: string) => void
  onSave: () => void
}) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Meu Perfil</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Informações da sua conta
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Sun className="h-3.5 w-3.5 text-muted-foreground" />
          <Switch
            checked={isDark}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Alternar tema escuro"
          />
          <Moon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {profileLoading ? (
        <div className="space-y-3">
          <div className="h-9 rounded-md bg-muted animate-pulse" />
          <div className="h-9 rounded-md bg-muted animate-pulse" />
          <div className="h-9 rounded-md bg-muted animate-pulse" />
        </div>
      ) : (
        <>
          {/* Avatar placeholder + nome */}
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-primary font-semibold text-base">
                {userProfile?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{userProfile?.full_name}</p>
              <p className="text-sm text-muted-foreground truncate">{userProfile?.email}</p>
            </div>
            {userProfile?.group_name && (
              <Badge variant="secondary" className="ml-auto shrink-0">
                {userProfile.group_name}
              </Badge>
            )}
          </div>

          <Separator />

          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nome</Label>
              <Input
                id="profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                disabled={profileSaving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-email">
                Email
                <span className="ml-2 text-xs text-muted-foreground font-normal">somente leitura</span>
              </Label>
              <Input
                id="profile-email"
                type="email"
                value={userProfile?.email ?? ""}
                disabled
                className="opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-group">
                Grupo
                <span className="ml-2 text-xs text-muted-foreground font-normal">somente leitura</span>
              </Label>
              <Input
                id="profile-group"
                value={userProfile?.group_name ?? "Sem grupo"}
                disabled
                className="opacity-60"
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button onClick={onSave} disabled={profileSaving}>
                {profileSaving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Section: Status de Projetos ────────────────────────────────────────── */

function SectionStatus({
  statuses,
  loading,
  onOpenDialog,
  onToggleActive,
  onDelete,
}: {
  statuses: ProjectStatus[]
  loading: boolean
  onOpenDialog: (status?: ProjectStatus) => void
  onToggleActive: (status: ProjectStatus) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Status de Projetos</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure os status disponíveis para os projetos
          </p>
        </div>
        <Button onClick={() => onOpenDialog()} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Status
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : statuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed">
          <CircleDot className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum status cadastrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Crie o primeiro status para começar</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden divide-y divide-border">
          {statuses.map((status) => (
            <div
              key={status.id}
              className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-accent/30 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-move shrink-0" />
              <div
                className="h-3 w-3 rounded-full shrink-0 ring-1 ring-black/10"
                style={{ backgroundColor: status.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{status.name}</span>
                  {!status.isActive && (
                    <Badge variant="outline" className="text-xs h-4 px-1.5">Inativo</Badge>
                  )}
                </div>
                {status.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{status.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => onToggleActive(status)}
                >
                  {status.isActive ? "Desativar" : "Ativar"}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenDialog(status)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(status.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Section: Administração ─────────────────────────────────────────────── */

function SectionAdministracao() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-base font-semibold">Administração</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Ferramentas disponíveis apenas para administradores
        </p>
      </div>

      <Link href="/configuracoes/usuarios" className="block group">
        <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Gestão de Usuários</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Grupos, permissões e convites de novos membros
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        </div>
      </Link>
    </div>
  )
}
