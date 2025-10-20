"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Protected } from "@/components/protected"
import { usePermissions } from "@/contexts/permission-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Eye, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Client } from "@/lib/types"
import {
  listClients,
  createClientRecord,
  updateClientRecord,
  deleteClientRecord,
  getClientSummary,
  type ClientSummary,
} from "@/lib/data/clients"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

const sanitizeDigits = (value: string) => value.replace(/\D/g, "")

const applyMask = (digits: string, mask: string) => {
  let formatted = ""
  let digitIndex = 0
  for (const char of mask) {
    if (char === "#") {
      if (digitIndex < digits.length) {
        formatted += digits[digitIndex]
        digitIndex += 1
      } else {
        break
      }
    } else {
      if (digitIndex < digits.length) {
        formatted += char
      } else {
        break
      }
    }
  }
  return formatted
}

const formatDocument = (value: string) => {
  const digits = sanitizeDigits(value)
  if (digits.length === 0) return ""
  if (digits.length <= 11) {
    return applyMask(digits, "###.###.###-##")
  }
  return applyMask(digits, "##.###.###/####-##")
}

const formatPhone = (value: string) => {
  const digits = sanitizeDigits(value)
  if (digits.length === 0) return ""
  if (digits.length <= 10) {
    return applyMask(digits, "(##) ####-####")
  }
  return applyMask(digits, "(##) #####-####")
}

type AddressSuggestion = {
  id: string
  full: string
  label: string
  description?: string
}

export default function ClientesPage() {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDocument, setNewDocument] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [createAddressSuggestions, setCreateAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [createAddressLoading, setCreateAddressLoading] = useState(false)

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editName, setEditName] = useState("")
  const [editDocument, setEditDocument] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editAddressSuggestions, setEditAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [editAddressLoading, setEditAddressLoading] = useState(false)

  // View dialog state
  const [viewOpen, setViewOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewSummary, setViewSummary] = useState<ClientSummary | null>(null)
  const [viewClient, setViewClient] = useState<Client | null>(null)

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  const getStatusBadgeStyle = (color?: string | null) =>
    color
      ? {
          borderColor: color,
          color,
        }
      : undefined

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString("pt-BR") : "—"

  async function fetchClients() {
    setLoading(true)
    const { data, error } = await listClients(searchTerm)
    if (error) {
      toast({ title: "Erro ao carregar clientes", description: error, variant: "destructive" })
    } else {
      setClients(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  useEffect(() => {
    if (!createOpen) {
      setCreateAddressSuggestions([])
      setCreateAddressLoading(false)
      return
    }
    const query = newAddress.trim()
    if (!mapboxAccessToken || query.length < 3) {
      setCreateAddressSuggestions([])
      setCreateAddressLoading(false)
      return
    }
    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        setCreateAddressLoading(true)
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?autocomplete=true&language=pt-BR&limit=5&types=address&access_token=${mapboxAccessToken}`,
          {
            signal: controller.signal,
            headers: {
              accept: "application/json",
            },
            cache: "no-store",
            method: "GET",
            credentials: "omit",
          }
        )
        if (!response.ok) throw new Error("Erro ao buscar endereço")
        const data = await response.json()
        const suggestions: AddressSuggestion[] = (data?.features ?? []).map((feature: any) => {
          const placeName: string = feature?.place_name ?? ""
          const parts = placeName.split(", ")
          const [firstPart, ...restParts] = parts
          return {
            id: feature?.id ?? placeName,
            full: placeName,
            label: firstPart ?? placeName,
            description: restParts.join(", "),
          }
        })
        setCreateAddressSuggestions(suggestions)
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Erro ao buscar sugestões de endereço:", err)
        }
      } finally {
        setCreateAddressLoading(false)
      }
    }, 400)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [newAddress, createOpen, mapboxAccessToken])

  useEffect(() => {
    if (!editOpen) {
      setEditAddressSuggestions([])
      setEditAddressLoading(false)
      return
    }
    const query = editAddress.trim()
    if (!mapboxAccessToken || query.length < 3) {
      setEditAddressSuggestions([])
      setEditAddressLoading(false)
      return
    }
    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        setEditAddressLoading(true)
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?autocomplete=true&language=pt-BR&limit=5&types=address&access_token=${mapboxAccessToken}`,
          {
            signal: controller.signal,
            headers: {
              accept: "application/json",
            },
            cache: "no-store",
            method: "GET",
            credentials: "omit",
          }
        )
        if (!response.ok) throw new Error("Erro ao buscar endereço")
        const data = await response.json()
        const suggestions: AddressSuggestion[] = (data?.features ?? []).map((feature: any) => {
          const placeName: string = feature?.place_name ?? ""
          const parts = placeName.split(", ")
          const [firstPart, ...restParts] = parts
          return {
            id: feature?.id ?? placeName,
            full: placeName,
            label: firstPart ?? placeName,
            description: restParts.join(", "),
          }
        })
        setEditAddressSuggestions(suggestions)
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Erro ao buscar sugestões de endereço:", err)
        }
      } finally {
        setEditAddressLoading(false)
      }
    }, 400)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [editAddress, editOpen, mapboxAccessToken])

  const filteredClients = clients

  async function handleCreateClient() {
    const documentDigits = sanitizeDigits(newDocument)
    const phoneDigits = sanitizeDigits(newPhone)
    const { error } = await createClientRecord({
      name: newName,
      document: documentDigits,
      email: newEmail,
      phone: phoneDigits,
      address: newAddress,
    })
    if (error) {
      toast({ title: "Erro ao salvar cliente", description: error, variant: "destructive" })
      return
    }
    toast({ title: "Cliente criado", description: "O cliente foi salvo com sucesso." })
    setCreateOpen(false)
    setNewName("")
    setNewDocument("")
    setNewEmail("")
    setNewPhone("")
    setNewAddress("")
    setCreateAddressSuggestions([])
    fetchClients()
  }

  function openEdit(client: Client) {
    setEditingClient(client)
    setEditName(client.name)
    setEditDocument(formatDocument(client.document ?? ""))
    setEditEmail(client.email)
    setEditPhone(formatPhone(client.phone ?? ""))
    setEditAddress(client.address)
    setEditAddressSuggestions([])
    setEditOpen(true)
  }

  async function handleUpdateClient() {
    if (!editingClient) return
    const documentDigits = sanitizeDigits(editDocument)
    const phoneDigits = sanitizeDigits(editPhone)
    const { error } = await updateClientRecord(editingClient.id, {
      name: editName,
      document: documentDigits,
      email: editEmail,
      phone: phoneDigits,
      address: editAddress,
    })
    if (error) {
      toast({ title: "Erro ao atualizar cliente", description: error, variant: "destructive" })
      return
    }
    toast({ title: "Cliente atualizado", description: "As alterações foram salvas." })
    setEditOpen(false)
    setEditingClient(null)
    fetchClients()
  }

  async function openViewClient(client: Client) {
    setViewClient(client)
    setViewOpen(true)
    setViewSummary(null)
    setViewLoading(true)
    const { data, error } = await getClientSummary(client.id)
    if (error) {
      toast({ title: "Erro ao carregar resumo", description: error, variant: "destructive" })
    } else if (data) {
      setViewSummary(data)
    }
    setViewLoading(false)
  }

  const handleViewOpenChange = (openDialog: boolean) => {
    setViewOpen(openDialog)
    if (!openDialog) {
      setViewSummary(null)
      setViewClient(null)
      setViewLoading(false)
    }
  }

  function requestDeleteClient(client: Client) {
    setClientToDelete(client)
    setDeleteDialogOpen(true)
  }

  async function handleConfirmDeleteClient() {
    if (!clientToDelete) return
    const clientId = clientToDelete.id
    setDeleteDialogOpen(false)
    setClientToDelete(null)
    const { error } = await deleteClientRecord(clientId)
    if (error) {
      toast({ title: "Não foi possível excluir", description: error, variant: "destructive" })
      return
    }
    toast({ title: "Cliente excluído" })
    fetchClients()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes cadastrados
          </p>
        </div>
        <Protected section="clientes" action="create">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo cliente
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome / Razão Social</Label>
                <Input id="name" placeholder="Nome do cliente" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="document">CNPJ / CPF</Label>
                  <Input
                    id="document"
                    placeholder="00.000.000/0000-00"
                    value={newDocument}
                    onChange={(e) => setNewDocument(formatDocument(e.target.value))}
                    inputMode="numeric"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(formatPhone(e.target.value))}
                    inputMode="tel"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@exemplo.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Endereço completo"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  autoComplete="off"
                />
                {createAddressLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Buscando sugestões...
                  </div>
                )}
                {createAddressSuggestions.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow">
                    {createAddressSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          setNewAddress(suggestion.full)
                          setCreateAddressSuggestions([])
                        }}
                      >
                        <div className="font-medium">{suggestion.label}</div>
                        {suggestion.description && (
                          <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleCreateClient}>Salvar Cliente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </Protected>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {loading ? 'Carregando...' : `Total de ${clients.length} clientes cadastrados`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, documento ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome / Razão Social</TableHead>
                <TableHead>CNPJ / CPF</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.document ? formatDocument(client.document) : "—"}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone ? formatPhone(client.phone) : "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openViewClient(client)} aria-label="Ver detalhes do cliente">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Protected section="clientes" action="edit">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(client)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Protected>
                      <Protected section="clientes" action="delete">
                        <Button variant="ghost" size="icon" onClick={() => requestDeleteClient(client)} aria-label="Excluir cliente">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Protected>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize os dados do cliente</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_name">Nome / Razão Social</Label>
              <Input id="edit_name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_document">CNPJ / CPF</Label>
                <Input
                  id="edit_document"
                  value={editDocument}
                  onChange={(e) => setEditDocument(formatDocument(e.target.value))}
                  inputMode="numeric"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_phone">Telefone</Label>
                <Input
                  id="edit_phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                  inputMode="tel"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input id="edit_email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_address">Endereço</Label>
              <Input
                id="edit_address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                autoComplete="off"
              />
              {editAddressLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Buscando sugestões...
                </div>
              )}
              {editAddressSuggestions.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow">
                  {editAddressSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => {
                        setEditAddress(suggestion.full)
                        setEditAddressSuggestions([])
                      }}
                    >
                      <div className="font-medium">{suggestion.label}</div>
                      {suggestion.description && (
                        <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleUpdateClient}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={handleViewOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{viewClient?.name ?? "Resumo do cliente"}</DialogTitle>
            <DialogDescription>
              Veja os dados de cadastro, projetos e tarefas vinculadas a este cliente.
            </DialogDescription>
          </DialogHeader>

          {viewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : viewSummary ? (
            <div className="space-y-6">
              <section className="rounded-xl border border-border/50 bg-card/40 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    Dados do cliente
                  </h4>
                  <Badge variant="outline" className="capitalize">
                    {viewSummary.client.type === "company" ? "Empresa" : "Pessoa Física"}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CNPJ / CPF</p>
                    <p>{viewSummary.client.document ? formatDocument(viewSummary.client.document) : "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Telefone</p>
                    <p>{viewSummary.client.phone ? formatPhone(viewSummary.client.phone) : "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="break-all">{viewSummary.client.email || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo</p>
                    <p>{viewSummary.client.type === "company" ? "Empresa" : "Pessoa Física"}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Endereço</p>
                    <p>{viewSummary.client.address || "—"}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border/50 bg-card/40 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                      Projetos vinculados
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {viewSummary.projects.length} {viewSummary.projects.length === 1 ? "projeto" : "projetos"}
                    </p>
                  </div>
                </div>
                {viewSummary.projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum projeto cadastrado para este cliente.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {viewSummary.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projetos/${project.id}`}
                        className="block rounded-lg border border-border/40 bg-background/60 p-4 transition hover:border-primary/60 hover:bg-background/80"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-semibold leading-tight line-clamp-2">
                              {project.title || "Projeto sem título"}
                            </p>
                            <p className="text-xs text-muted-foreground">Código: {project.code ?? "—"}</p>
                          </div>
                          {project.status && (
                            <Badge
                              variant="outline"
                              className="capitalize"
                              style={getStatusBadgeStyle(project.statusColor)}
                            >
                              {project.status}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Prazo: {formatDate(project.deadline)}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-border/50 bg-card/40 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                      Tarefas relacionadas
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {viewSummary.tasks.length} {viewSummary.tasks.length === 1 ? "tarefa" : "tarefas"}
                    </p>
                  </div>
                </div>
                {viewSummary.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma tarefa vinculada aos projetos deste cliente.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarefa</TableHead>
                        <TableHead>Projeto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prazo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewSummary.tasks.map((task) => {
                        const taskLink = task.project_id ? `/projetos/${task.project_id}` : undefined
                        return (
                          <TableRow key={task.id} className={taskLink ? "cursor-pointer hover:bg-accent/40" : undefined}>
                            <TableCell className="font-medium">
                              {taskLink ? (
                                <Link href={taskLink} className="text-foreground underline-offset-4 hover:underline">
                                  {task.title}
                                </Link>
                              ) : (
                                task.title
                              )}
                            </TableCell>
                            <TableCell>
                              {task.project_id ? (
                                <Link href={`/projetos/${task.project_id}`} className="text-muted-foreground underline-offset-4 hover:underline">
                                  {task.project_title ?? "—"}
                                </Link>
                              ) : (
                                task.project_title ?? "—"
                              )}
                            </TableCell>
                            <TableCell>
                              {task.status ? (
                                <Badge
                                  variant="outline"
                                  className="capitalize"
                                  style={getStatusBadgeStyle(task.statusColor)}
                                >
                                  {task.status}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>{formatDate(task.deadline)}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </section>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os dados do cliente. Tente novamente.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => handleViewOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(openDialog) => {
          setDeleteDialogOpen(openDialog)
          if (!openDialog) {
            setClientToDelete(null)
          }
        }}
        onConfirm={handleConfirmDeleteClient}
        title="Excluir cliente"
        description={
          clientToDelete
            ? `Tem certeza que deseja excluir o cliente "${clientToDelete.name}"? Essa ação é permanente.`
            : "Tem certeza que deseja excluir este cliente?"
        }
        confirmText="Excluir"
        variant="destructive"
      />
    </div>
  )
}
