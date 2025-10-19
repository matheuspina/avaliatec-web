"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Upload,
  Search,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  FolderOpen,
} from "lucide-react"

type FileItem = {
  id: string
  name: string
  type: "pdf" | "image" | "doc" | "other"
  size: string
  uploadDate: string
  project: string
}

export default function ArquivosPage() {
  const [files] = useState<FileItem[]>([
    {
      id: "1",
      name: "Laudo_Tecnico_AV-2024-001.pdf",
      type: "pdf",
      size: "2.4 MB",
      uploadDate: "2024-11-10",
      project: "AV-2024-001",
    },
    {
      id: "2",
      name: "Fotos_Vistoria.zip",
      type: "image",
      size: "15.8 MB",
      uploadDate: "2024-11-09",
      project: "AV-2024-002",
    },
    {
      id: "3",
      name: "Relatorio_Final.docx",
      type: "doc",
      size: "1.2 MB",
      uploadDate: "2024-11-08",
      project: "AV-2024-001",
    },
    {
      id: "4",
      name: "Planilha_Calculos.xlsx",
      type: "other",
      size: "856 KB",
      uploadDate: "2024-11-07",
      project: "AV-2024-003",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [uploading, setUploading] = useState(false)

  const filteredFiles = files.filter(
    (file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.project.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getFileIcon = (type: FileItem["type"]) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />
      case "image":
        return <Image className="h-4 w-4 text-blue-500" />
      case "doc":
        return <FileText className="h-4 w-4 text-blue-600" />
      default:
        return <File className="h-4 w-4 text-muted-foreground" />
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploading(true)
      // Simular upload
      setTimeout(() => {
        setUploading(false)
        alert(`Arquivo "${file.name}" enviado com sucesso (mock)`)
      }, 1500)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Arquivos</h1>
          <p className="text-muted-foreground">
            Gerencie documentos e arquivos do sistema
          </p>
        </div>
        <div>
          <Input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Enviando..." : "Enviar Arquivo"}
            </label>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Arquivos
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
            <p className="text-xs text-muted-foreground">
              Armazenados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PDFs</CardTitle>
            <FileText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.filter((f) => f.type === "pdf").length}
            </div>
            <p className="text-xs text-muted-foreground">Documentos PDF</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imagens</CardTitle>
            <Image className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.filter((f) => f.type === "image").length}
            </div>
            <p className="text-xs text-muted-foreground">Fotos e imagens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outros</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.filter((f) => f.type === "other" || f.type === "doc").length}
            </div>
            <p className="text-xs text-muted-foreground">Diversos formatos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Arquivos</CardTitle>
          <CardDescription>
            Armazenamento simulado (mock - sem backend)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Arquivo</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data de Upload</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.type)}
                      <span className="font-medium">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{file.project}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {file.size}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(file.uploadDate).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Integração com Cloud Storage</CardTitle>
          <CardDescription>
            Simula integração com serviço de storage S3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Interface mockada - sem conexão real com backend
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Os arquivos não serão realmente enviados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
