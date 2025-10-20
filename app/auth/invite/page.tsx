"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

interface InviteData {
  email: string
  group_id: string
  expires_at: string
  group_name: string | null
}

function InviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient()

  const token = searchParams.get("token")

  useEffect(() => {
    const checkAuthAndValidateToken = async () => {
      if (!token) {
        setError("Token de convite não fornecido")
        setLoading(false)
        return
      }

      try {
        // Check if user is already authenticated
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)

        // Validate the invite token
        const response = await fetch("/api/invites/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (!response.ok || !data.valid) {
          setError(data.error || "Token de convite inválido ou expirado")
          setLoading(false)
          return
        }

        setInviteData(data.data)
        setLoading(false)
      } catch (err) {
        console.error("Error validating invite:", err)
        setError("Erro ao validar convite. Tente novamente.")
        setLoading(false)
      }
    }

    checkAuthAndValidateToken()
  }, [token, supabase.auth])

  const handleAcceptInvite = async () => {
    if (!token) return

    setAccepting(true)

    try {
      const response = await fetch("/api/invites/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao aceitar convite")
      }

      toast({
        title: "Convite aceito com sucesso!",
        description: "Você foi adicionado ao grupo. Redirecionando...",
      })

      // Redirect to dashboard after successful acceptance
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error("Error accepting invite:", err)
      toast({
        title: "Erro ao aceitar convite",
        description: err.message || "Tente novamente mais tarde.",
        variant: "destructive",
      })
      setAccepting(false)
    }
  }

  const handleLogin = () => {
    // Redirect to login with return URL to come back to this invite page
    router.push(`/login?redirectTo=/auth/invite?token=${token}`)
  }

  const handleMicrosoftLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          scopes: "email Mail.Read Mail.ReadWrite offline_access",
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/invite?token=${token}`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login com Microsoft",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <Image
          src="/bg-avaliatec.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-md">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Validando convite...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <Image
          src="/bg-avaliatec.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-8">
          <div className="relative w-72 h-24">
            <Image
              src="/logo-avaliatec.png"
              alt="AvaliaTec"
              fill
              className="object-contain"
              priority
            />
          </div>
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Convite Inválido</CardTitle>
              </div>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  O link de convite pode ter expirado ou já foi utilizado. 
                  Entre em contato com o administrador para solicitar um novo convite.
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => router.push("/login")}
                >
                  Ir para Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Valid invite - user needs to login
  if (inviteData && !isAuthenticated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <Image
          src="/bg-avaliatec.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-8">
          <div className="relative w-72 h-24">
            <Image
              src="/logo-avaliatec.png"
              alt="AvaliaTec"
              fill
              className="object-contain"
              priority
            />
          </div>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Você foi convidado!</CardTitle>
              <CardDescription>
                Você foi convidado para fazer parte do grupo{" "}
                <span className="font-semibold text-foreground">
                  {inviteData.group_name || "do sistema"}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm">
                    <span className="font-medium">Email:</span>{" "}
                    <span className="text-muted-foreground">{inviteData.email}</span>
                  </p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Expira em:</span>{" "}
                    <span className="text-muted-foreground">
                      {new Date(inviteData.expires_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Para aceitar este convite, você precisa fazer login com a conta Microsoft 
                    associada ao email <span className="font-medium text-foreground">{inviteData.email}</span>
                  </p>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleMicrosoftLogin}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <rect width="10" height="10" x="2" y="2" fill="#F25022" />
                    <rect width="10" height="10" x="12" y="2" fill="#7FBA00" />
                    <rect width="10" height="10" x="2" y="12" fill="#00A4EF" />
                    <rect width="10" height="10" x="12" y="12" fill="#FFB900" />
                  </svg>
                  Entrar com Microsoft
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleLogin}
                >
                  Fazer Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Valid invite - user is authenticated - ready to accept
  if (inviteData && isAuthenticated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <Image
          src="/bg-avaliatec.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-8">
          <div className="relative w-72 h-24">
            <Image
              src="/logo-avaliatec.png"
              alt="AvaliaTec"
              fill
              className="object-contain"
              priority
            />
          </div>
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <CardTitle>Aceitar Convite</CardTitle>
              </div>
              <CardDescription>
                Você está prestes a ser adicionado ao grupo{" "}
                <span className="font-semibold text-foreground">
                  {inviteData.group_name || "do sistema"}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm">
                    <span className="font-medium">Email:</span>{" "}
                    <span className="text-muted-foreground">{inviteData.email}</span>
                  </p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Grupo:</span>{" "}
                    <span className="text-muted-foreground">
                      {inviteData.group_name || "Não especificado"}
                    </span>
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Ao aceitar este convite, você terá acesso às funcionalidades 
                  e permissões definidas para este grupo.
                </p>

                <Button
                  className="w-full"
                  onClick={handleAcceptInvite}
                  disabled={accepting}
                >
                  {accepting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aceitando...
                    </>
                  ) : (
                    "Aceitar Convite"
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/dashboard")}
                  disabled={accepting}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  )
}
