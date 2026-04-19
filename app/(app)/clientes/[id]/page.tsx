"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Clock,
  Edit,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AppMainBleed } from "@/components/app-main-bleed";
import { Protected } from "@/components/protected";
import { usePermissions } from "@/contexts/permission-context";
import type { Client, ClientCrmDetail, ClientCrmProject } from "@/lib/types";
import {
  getClientById,
  getClientCrmDetail,
  updateClientRecord,
} from "@/lib/data/clients";

// ── Helpers ────────────────────────────────────────────────────────────────

const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

const applyMask = (digits: string, mask: string) => {
  let formatted = "";
  let di = 0;
  for (const char of mask) {
    if (char === "#") {
      if (di < digits.length) { formatted += digits[di]; di++; }
      else break;
    } else {
      if (di < digits.length) formatted += char;
      else break;
    }
  }
  return formatted;
};

const formatDocument = (value: string) => {
  const d = sanitizeDigits(value);
  if (!d) return "—";
  return d.length <= 11 ? applyMask(d, "###.###.###-##") : applyMask(d, "##.###.###/####-##");
};

const formatPhone = (value: string) => {
  const d = sanitizeDigits(value);
  if (!d) return "—";
  return d.length <= 10 ? applyMask(d, "(##) ####-####") : applyMask(d, "(##) #####-####");
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("pt-BR") : "—";

const formatCurrency = (value: number | null | undefined) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }).format(value);

// ── Period helpers ─────────────────────────────────────────────────────────

type Period = "all" | "this_year" | "last_12m" | "last_year";

function getDateRange(period: Period): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (period === "all") return { from: null, to: null };

  if (period === "this_year") {
    return {
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
    };
  }
  if (period === "last_12m") {
    const from = new Date(now);
    from.setFullYear(from.getFullYear() - 1);
    return { from, to: now };
  }
  if (period === "last_year") {
    const y = now.getFullYear() - 1;
    return {
      from: new Date(y, 0, 1),
      to: new Date(y, 11, 31, 23, 59, 59),
    };
  }
  return { from: null, to: null };
}

function filterSales(projects: ClientCrmProject[], period: Period): ClientCrmProject[] {
  const sales = projects.filter(
    (p) => p.status === "done" && p.actual_value != null
  );
  if (period === "all") return sales;
  const { from, to } = getDateRange(period);
  return sales.filter((p) => {
    const d = new Date(p.completed_at ?? p.created_at);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ project }: { project: ClientCrmProject }) {
  const style = project.status_color
    ? { borderColor: project.status_color, color: project.status_color }
    : undefined;
  return (
    <Badge variant="outline" style={style}>
      {project.status_name}
    </Badge>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-muted p-2 shrink-0">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-semibold leading-tight mt-0.5 truncate">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [crm, setCrm] = useState<ClientCrmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDocument, setEditDocument] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const [clientResult, crmResult] = await Promise.all([
        getClientById(clientId),
        getClientCrmDetail(clientId),
      ]);
      if (clientResult.error || !clientResult.data) {
        setError(clientResult.error ?? "Cliente não encontrado.");
      } else {
        setClient(clientResult.data);
      }
      if (!crmResult.error && crmResult.data) {
        setCrm(crmResult.data);
      }
      setLoading(false);
    }
    if (clientId) load();
  }, [clientId]);

  // ── Period-filtered metrics ──────────────────────────────────────────────
  const periodSales = useMemo(
    () => (crm ? filterSales(crm.projects, period) : []),
    [crm, period]
  );

  const periodRevenue = useMemo(
    () => periodSales.reduce((sum, p) => sum + (p.actual_value ?? 0), 0),
    [periodSales]
  );

  const periodAvg = useMemo(
    () => (periodSales.length > 0 ? periodRevenue / periodSales.length : null),
    [periodSales, periodRevenue]
  );

  // ── Edit helpers ─────────────────────────────────────────────────────────
  function openEdit() {
    if (!client) return;
    setEditName(client.name);
    setEditEmail(client.email);
    setEditPhone(formatPhone(client.phone ?? ""));
    setEditDocument(formatDocument(client.document ?? ""));
    setEditAddress(client.address ?? "");
    setEditNotes(client.notes ?? "");
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!client) return;
    const { error } = await updateClientRecord(client.id, {
      name: editName,
      email: editEmail,
      phone: sanitizeDigits(editPhone),
      document: sanitizeDigits(editDocument),
      address: editAddress,
      notes: editNotes || null,
    });
    if (error) {
      toast({ title: "Erro ao salvar", description: error, variant: "destructive" });
      return;
    }
    setClient((prev) =>
      prev
        ? {
            ...prev,
            name: editName,
            email: editEmail,
            phone: sanitizeDigits(editPhone),
            document: sanitizeDigits(editDocument),
            address: editAddress,
            notes: editNotes || null,
          }
        : prev
    );
    toast({ title: "Cliente atualizado" });
    setEditOpen(false);
  }

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <AppMainBleed className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </AppMainBleed>
    );
  }

  if (error || !client) {
    return (
      <AppMainBleed className="flex flex-col items-center justify-center gap-4 py-24">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">{error ?? "Cliente não encontrado."}</p>
        <Button variant="outline" onClick={() => router.push("/clientes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Clientes
        </Button>
      </AppMainBleed>
    );
  }

  const periodLabel: Record<Period, string> = {
    all: "Todo o histórico",
    this_year: "Este ano",
    last_12m: "Últimos 12 meses",
    last_year: "Ano passado",
  };

  return (
    <AppMainBleed className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/clientes")}
            aria-label="Voltar para clientes"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold leading-tight">{client.name}</h1>
              <Badge variant="outline" className="capitalize">
                {client.type === "company" ? "Empresa" : "Pessoa Física"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Cliente desde {formatDate(client.created_at)}
            </p>
          </div>
        </div>
        <Protected section="clientes" action="edit">
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </Protected>
      </div>

      {/* ── Contact info strip ── */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {client.document && (
          <span className="flex items-center gap-1.5">
            {client.type === "company" ? (
              <Building2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <User className="h-3.5 w-3.5 shrink-0" />
            )}
            {formatDocument(client.document)}
          </span>
        )}
        {client.email && (
          <a
            href={`mailto:${client.email}`}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {client.email}
          </a>
        )}
        {client.phone && (
          <a
            href={`tel:${sanitizeDigits(client.phone)}`}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {formatPhone(client.phone)}
          </a>
        )}
        {client.address && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {client.address}
          </span>
        )}
      </div>

      {client.notes && (
        <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-3 border border-border/50">
          {client.notes}
        </p>
      )}

      <Separator />

      {/* ── Period selector + KPI cards ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-base font-semibold">Métricas comerciais</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Período:</span>
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as Period)}
            >
              <SelectTrigger className="w-[180px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o histórico</SelectItem>
                <SelectItem value="this_year">Este ano</SelectItem>
                <SelectItem value="last_12m">Últimos 12 meses</SelectItem>
                <SelectItem value="last_year">Ano passado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            icon={Calendar}
            label="Cliente desde"
            value={formatDate(client.created_at)}
          />
          <KpiCard
            icon={DollarSign}
            label="Total vendido (histórico)"
            value={formatCurrency(crm?.total_revenue_all_time)}
          />
          <KpiCard
            icon={TrendingUp}
            label={`Média/venda (${periodLabel[period].toLowerCase()})`}
            value={formatCurrency(periodAvg)}
            sub={`${periodSales.length} venda${periodSales.length !== 1 ? "s" : ""}`}
          />
          <KpiCard
            icon={Briefcase}
            label="Projetos ativos"
            value={String(crm?.active_projects ?? 0)}
            sub={`${crm?.total_projects ?? 0} total`}
          />
          <KpiCard
            icon={CheckCircle2}
            label="Última venda"
            value={formatDate(crm?.last_sale_date)}
          />
        </div>
      </div>

      <Separator />

      {/* ── Projects table ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Projetos</h2>
          {crm && (
            <span className="text-sm text-muted-foreground">
              {crm.total_projects} projeto{crm.total_projects !== 1 ? "s" : ""} ·{" "}
              {crm.completed_projects} concluído{crm.completed_projects !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {!crm || crm.projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground border border-dashed rounded-lg">
            <Briefcase className="h-8 w-8 opacity-40" />
            <p className="text-sm">Nenhum projeto cadastrado para este cliente.</p>
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Valor estimado</TableHead>
                  <TableHead>Valor realizado</TableHead>
                  <TableHead className="w-[110px]">Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crm.projects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-accent/40"
                    onClick={() => router.push(`/projetos/${project.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {project.code ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projetos/${project.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline underline-offset-4"
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge project={project} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {project.end_date ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          {formatDate(project.end_date)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatCurrency(project.estimated_value)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {project.status === "done" && project.actual_value != null ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(project.actual_value)}
                        </span>
                      ) : project.status === "done" ? (
                        <span className="text-muted-foreground text-xs italic">
                          Sem valor realizado
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(project.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize os dados do cliente</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_name">Nome / Razão Social</Label>
              <Input
                id="edit_name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
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
                  onChange={(e) =>
                    setEditPhone(
                      applyMask(
                        sanitizeDigits(e.target.value),
                        sanitizeDigits(e.target.value).length <= 10
                          ? "(##) ####-####"
                          : "(##) #####-####"
                      )
                    )
                  }
                  inputMode="tel"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_address">Endereço</Label>
              <Input
                id="edit_address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_notes">Observações</Label>
              <Input
                id="edit_notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notas internas sobre o cliente"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppMainBleed>
  );
}
