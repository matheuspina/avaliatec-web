"use client"

import { useEffect, useState } from "react"
import { Plus, Mail, Trash2, RefreshCw } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { UserInvite, UserGroup } from "@/lib/types"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface InviteWithGroup extends UserInvite {
  user_groups?: UserGroup | null
}

export function InviteUsers() {
  const { toast } = useToast()
  const [invites, setInvites] = useState<InviteWithGroup[]>([])
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [inviteToDelete, setInviteToDelete] = useState<UserInvite | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    groupId: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const supabase = createClient()

      // Load pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from("user_invites")
        .select(`
          *,
          user_groups (*)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (invitesError) throw invitesError

      setInvites(invitesData || [])

      // Load all groups for the dropdown
      const { data: groupsData, error: groupsError } = await supabase
        .from("user_groups")
        .select("*")
        .order("name")

      if (groupsError) throw groupsError

      setGroups(groupsData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os convites",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog() {
    setFormData({
      email: "",
      groupId: "",
    })
    setIsDialogOpen(true)
  }

  async function handleSendInvite() {
    if (!formData.email.trim()) {
      toast({
        title: "Erro",
        description: "O email é obrigatório",
        variant: "destructive",
      })
      return
    }

    if (!formData.groupId) {
      toast({
        title: "Erro",
        description: "Selecione um grupo",
        variant: "destructive",
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erro",
        description: "Email inválido",
        variant: "destructive",
      })
      return
    }

    try {
      setSending(true)

      const response = await fetch("/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          groupId: formData.groupId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar convite")
      }

      toast({
        title: "Sucesso",
        description: "Convite enviado com sucesso",
      })

      setIsDialogOpen(false)
      await loadData()
    } catch (error: any) {
      console.error("Error sending invite:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o convite",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  async function handleResendInvite(inviteId: string) {
    try {
      // For now, we'll just show a message
      // In a full implementation, you'd have a resend endpoint
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A funcionalidade de reenviar convite será implementada em breve",
      })
    } catch (error: any) {
      console.error("Error resending invite:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível reenviar o convite",
        variant: "destructive",
      })
    }
  }

  function handleDeleteClick(invite: UserInvite) {
    setInviteToDelete(invite)
    setDeleteConfirmOpen(true)
  }

  async function handleDelete() {
    if (!inviteToDelete) return

    try {
      const response = await fetch(`/api/invites/${inviteToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao cancelar convite")
      }

      toast({
        title: "Sucesso",
        description: "Convite cancelado com sucesso",
      })

      await loadData()
    } catch (error: any) {
      console.error("Error deleting invite:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cancelar o convite",
        variant: "destructive",
      })
    } finally {
      setDeleteConfirmOpen(false)
      setInviteToDelete(null)
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  function isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Convites</CardTitle>
          <CardDescription>Carregando convites...</CardDescription>
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
              <CardTitle>Convites Pendentes</CardTitle>
              <CardDescription>
                Gerencie os convites enviados para novos usuários
              </CardDescription>
            </div>
            <Button onClick={handleOpenDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Enviar Convite
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                Nenhum convite pendente
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Envie convites para adicionar novos usuários ao sistema
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => {
                const expired = isExpired(invite.expires_at)
                
                return (
                  <div
                    key={invite.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invite.email}</p>
                        {expired && (
                          <Badge variant="destructive" className="text-xs">
                            Expirado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>Grupo: {invite.user_groups?.name}</span>
                        <span>•</span>
                        <span>Expira em: {formatDate(invite.expires_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enviado em: {formatDate(invite.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResendInvite(invite.id)}
                        disabled={expired}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reenviar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(invite)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Invite Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Convite</DialogTitle>
            <DialogDescription>
              Convide um novo usuário para o sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Grupo *</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) =>
                  setFormData({ ...formData, groupId: value })
                }
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              O convite será válido por 7 dias. O usuário receberá um email com
              instruções para completar o cadastro.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSendInvite} disabled={sending}>
              {sending ? "Enviando..." : "Enviar Convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="Cancelar Convite"
        description={`Tem certeza que deseja cancelar o convite para "${inviteToDelete?.email}"?`}
        confirmText="Cancelar Convite"
        cancelText="Voltar"
      />
    </>
  )
}
