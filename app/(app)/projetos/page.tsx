"use client"

import { useCallback, useEffect, useState, type ComponentProps, type CSSProperties } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Search, LayoutGrid, List, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { listProjects, createProject, type ProjectStatusUI } from "@/lib/data/projects"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { listClients } from "@/lib/data/clients"
import { useToast } from "@/hooks/use-toast"

type ProjectStatus = ProjectStatusUI

type Project = {
  id: string
  code: string
  name: string
  clientName: string
  status: ProjectStatus
  statusId: string | null
  statusColor: string | null
  endDate: string | null
  color: string | null
}

type ClientOption = { id: string; name: string }

export default function ProjetosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newCode, setNewCode] = useState("")
  const [newName, setNewName] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [newEndDate, setNewEndDate] = useState("")
  const [clients, setClients] = useState<ClientOption[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listProjects()
      setProjects(
        data.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          clientName: p.clientName,
          status: p.status,
          statusId: p.statusId ?? null,
          statusColor: p.statusColor ?? null,
          endDate: p.endDate,
          color: p.color ?? null,
        }))
      )
    } catch (err) {
      console.error("Erro ao carregar projetos:", err)
      toast({
        title: "Erro ao carregar projetos",
        description: "Não foi possível carregar a lista de projetos. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    (async () => {
      const { data, error } = await listClients()
      if (error) {
        console.error("Erro ao carregar clientes:", error)
        toast({
          title: "Erro ao carregar clientes",
          description: error,
          variant: "destructive",
        })
        return
      }
      setClients((data ?? []).map((c) => ({ id: c.id, name: c.name })))
    })()
  }, [toast])

  const [searchTerm, setSearchTerm] = useState("")
  const [view, setView] = useState<"list" | "grid">("grid")

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredProjects = projects.filter((project) => {
    if (!normalizedSearch) return true
    return (
      project.name.toLowerCase().includes(normalizedSearch) ||
      project.code.toLowerCase().includes(normalizedSearch) ||
      project.clientName.toLowerCase().includes(normalizedSearch)
    )
  })

  const getStatusBadgeConfig = (status: string, statusColor?: string | null): {
    variant: ComponentProps<typeof Badge>["variant"]
    style?: CSSProperties
  } => {
    if (statusColor) {
      return {
        variant: "outline",
        style: {
          borderColor: statusColor,
          color: statusColor,
        },
      }
    }

    switch (status) {
      case "Planejamento":
        return { variant: "secondary" }
      case "Em andamento":
        return { variant: "default" }
      case "Em espera":
        return { variant: "outline" }
      case "Concluído":
        return { variant: "outline" }
      case "Cancelado":
        return { variant: "destructive" }
      default:
        return { variant: "outline" }
    }
  }

  const resetForm = () => {
    setNewCode("")
    setNewName("")
    setSelectedClientId("")
    setNewEndDate("")
  }

  async function handleSaveProject() {
    const code = newCode.trim()
    const name = newName.trim()

    if (!code || !name || !selectedClientId || !newEndDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha código, nome, cliente e prazo do projeto.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await createProject({
        code,
        name,
        clientId: selectedClientId,
        endDate: newEndDate,
      })
      toast({
        title: "Projeto criado",
        description: "O projeto foi criado com sucesso.",
      })
      resetForm()
      setCreateDialogOpen(false)
      await loadProjects()
    } catch (err) {
      console.error("Erro ao salvar projeto:", err)
      toast({
        title: "Erro ao salvar projeto",
        description: err instanceof Error ? err.message : "Não foi possível criar o projeto.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const formatEndDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString("pt-BR") : "—"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground">
            Gerencie seus projetos e demandas
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Novo Projeto</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo projeto
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Código</Label>
                <Input id="code" placeholder="AV-2024-XXX" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Nome do projeto" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client">Cliente</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Prazo</Label>
                <Input id="endDate" type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleSaveProject} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Salvando..." : "Salvar Projeto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Projetos</CardTitle>
              <CardDescription>
                {loading ? "Carregando projetos..." : `Total de ${projects.length} projetos cadastrados`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={view === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, nome ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {view === "list" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prazo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/projetos/${project.id}`)}
                  >
                    <TableCell className="font-medium">{project.code}</TableCell>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.clientName}</TableCell>
                    <TableCell>
                      {(() => {
                        const badgeConfig = getStatusBadgeConfig(project.status, project.statusColor)
                        return (
                          <Badge variant={badgeConfig.variant} style={badgeConfig.style}>
                            {project.status}
                          </Badge>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {formatEndDate(project.endDate)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Link key={project.id} href={`/projetos/${project.id}`}>
                  <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
                    <CardHeader>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>{project.code} • {project.clientName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="flex items-center justify-between">
                      {(() => {
                        const badgeConfig = getStatusBadgeConfig(project.status, project.statusColor)
                        return (
                          <Badge variant={badgeConfig.variant} style={badgeConfig.style}>
                            {project.status}
                          </Badge>
                        )
                      })()}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          {formatEndDate(project.endDate)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
