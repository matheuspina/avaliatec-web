import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Erro na Autenticação</h1>
          <p className="text-muted-foreground">
            Houve um problema ao processar sua autenticação. Por favor, tente fazer login novamente.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Voltar para Login</Link>
        </Button>
      </div>
    </div>
  )
}
