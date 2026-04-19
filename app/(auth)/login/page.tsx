import { Suspense } from "react"
import { LoginContent } from "./login-content"
import { isEmailLoginEnabled } from "@/lib/auth/email-login"

export default function LoginPage() {
  const emailLoginEnabled = isEmailLoginEnabled()

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Carregando...
        </div>
      }
    >
      <LoginContent emailLoginEnabled={emailLoginEnabled} />
    </Suspense>
  )
}
