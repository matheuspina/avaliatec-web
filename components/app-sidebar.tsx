"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Calendar,
  FileText,
  Settings,
  Briefcase,
  Mail,
  LogOut,
} from "lucide-react"
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { usePermissions } from "@/contexts/permission-context"
import type { SectionKey } from "@/lib/types"

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    sectionKey: "dashboard" as SectionKey,
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
    sectionKey: "clientes" as SectionKey,
  },
  {
    title: "Projetos",
    href: "/projetos",
    icon: Briefcase,
    sectionKey: "projetos" as SectionKey,
  },
  {
    title: "Tarefas",
    href: "/kanban",
    icon: FolderKanban,
    sectionKey: "kanban" as SectionKey,
  },
  {
    title: "Agenda",
    href: "/agenda",
    icon: Calendar,
    sectionKey: "agenda" as SectionKey,
  },
  {
    title: "Atendimento",
    href: "/atendimento",
    icon: WhatsAppIcon,
    sectionKey: "atendimento" as SectionKey,
  },
  {
    title: "Arquivos",
    href: "/arquivos",
    icon: FileText,
    sectionKey: "arquivos" as SectionKey,
  },
  {
    title: "Email",
    href: "/email",
    icon: Mail,
    sectionKey: "email" as SectionKey,
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    sectionKey: "configuracoes" as SectionKey,
  },
]

function SidebarSkeleton() {
  return (
    <Sidebar>
      <SidebarHeader className="justify-center">
        <div className="relative h-[4.5rem] w-[15rem]">
          <Image
            src="/logo-avaliatec.png"
            alt="AvaliaTec"
            fill
            className="object-contain"
            priority
          />
        </div>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md px-3 py-2"
              >
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const supabase = createClient()
  const { permissions, isLoading } = usePermissions()

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      toast({
        title: "Logout realizado com sucesso!",
        description: "Até logo!",
      })

      router.push("/login")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      })
      setIsLoggingOut(false)
    }
  }

  // Filter menu items based on user's view permissions
  const visibleMenuItems = menuItems.filter((item) => {
    return permissions[item.sectionKey]?.view === true
  })

  // Show loading skeleton while permissions are being loaded
  if (isLoading) {
    return <SidebarSkeleton />
  }

  return (
    <Sidebar>
      <SidebarHeader className="justify-center">
        <div className="relative h-[4.5rem] w-[15rem]">
          <Image
            src="/logo-avaliatec.png"
            alt="AvaliaTec"
            fill
            className="object-contain"
            priority
          />
        </div>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {visibleMenuItems.map((item) => (
              <SidebarMenuItem
                key={item.href}
                active={pathname === item.href}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Saindo..." : "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
