import { AppSidebar } from "@/components/app-sidebar"
import { AuthProvider } from "@/components/auth-provider"
import { PermissionProvider } from "@/contexts/permission-context"
import { OnboardingGate } from "@/components/onboarding-gate"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <PermissionProvider>
        <div className="flex min-h-0 h-screen overflow-hidden bg-background">
          <AppSidebar />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background">
            <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
              {children}
            </div>
          </main>
        </div>
        <OnboardingGate />
      </PermissionProvider>
    </AuthProvider>
  )
}
