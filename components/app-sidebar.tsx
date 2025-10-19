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

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Projetos",
    href: "/projetos",
    icon: Briefcase,
  },
  {
    title: "Tarefas",
    href: "/kanban",
    icon: FolderKanban,
  },
  {
    title: "Agenda",
    href: "/agenda",
    icon: Calendar,
  },
  {
    title: "Atendimento",
    href: "/atendimento",
    icon: WhatsAppIcon,
  },
  {
    title: "Arquivos",
    href: "/arquivos",
    icon: FileText,
  },
  {
    title: "Email",
    href: "/email",
    icon: Mail,
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const supabase = createClient()

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
            {menuItems.map((item) => (
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
