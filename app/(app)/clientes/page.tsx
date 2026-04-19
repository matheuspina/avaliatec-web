"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import type { Client, ClientListMetrics } from "@/lib/types"
import {
  listClients,
  createClientRecord,
  updateClientRecord,
  deleteClientRecord,
  getClientsListMetrics,
} from "@/lib/data/clients"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AppMainBleed } from "@/components/app-main-bleed"

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

const formatCurrency = (value: number | null | undefined) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)

export default function ClientesPage() {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [metrics, setMetrics] = useState<Record<string, ClientListMetrics>>({})
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
    const [clientsResult, metricsResult] = await Promise.all([
      listClients(searchTerm),
      getClientsListMetrics(),
    ])
    if (clientsResult.error) {
      toast({ title: "Erro ao carregar clientes", description: clientsResult.error, variant: "destructive" })
    } else {
      setClients(clientsResult.data)
    }
    if (!metricsResult.error) {
      setMetrics(metricsResult.data)
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
    <AppMainBleed className="space-y-6">
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
                <TableHead>Cliente desde</TableHead>
                <TableHead>Total vendido</TableHead>
                <TableHead>Última venda</TableHead>
                <TableHead className="w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const m = metrics[client.id]
                return (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.document ? formatDocument(client.document) : "—"}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone ? formatPhone(client.phone) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {m ? formatDate(m.client_since) : "—"}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {m ? formatCurrency(m.total_completed_revenue) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {m?.last_sale_date ? formatDate(m.last_sale_date) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/clientes/${client.id}`)} aria-label="Ver perfil CRM do cliente">
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
              )})}
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
    </AppMainBleed>
  )
}
