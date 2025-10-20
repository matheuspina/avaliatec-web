"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { GroupsManagement } from "@/components/user-management/groups-management"
import { UsersList } from "@/components/user-management/users-list"
import { InviteUsers } from "@/components/user-management/invite-users"

export default function UserManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdminPermission() {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push("/dashboard")
          return
        }

        // Check if user has admin permissions
        const { data: userData, error: permError } = await supabase
          .from("users")
          .select(`
            id,
            group_id,
            user_groups (
              name
            )
          `)
          .eq("auth_user_id", user.id)
          .single()

        if (permError) {
          console.error("Error checking permissions:", permError)
          setIsAdmin(false)
          setLoading(false)
          return
        }

        // Check if user is in Administrador group
        const groupName = (userData?.user_groups as any)?.name
        const isAdminUser = groupName === "Administrador"
        setIsAdmin(isAdminUser)

        if (!isAdminUser) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar esta página",
            variant: "destructive",
          })
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error checking admin permission:", error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminPermission()
  }, [router, toast])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Carregando...
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie grupos, usuários e convites do sistema
        </p>
      </div>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="invites">Convites</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          <GroupsManagement />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersList />
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <InviteUsers />
        </TabsContent>
      </Tabs>
    </div>
  )
}
