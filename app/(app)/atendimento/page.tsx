import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon"

export default function AtendimentoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Atendimento</h1>
        <p className="text-muted-foreground">
          Central de atendimento via WhatsApp
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WhatsAppIcon className="h-5 w-5 text-green-500" />
            WhatsApp Business
          </CardTitle>
          <CardDescription>
            Integração com WhatsApp em desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <WhatsAppIcon className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Em breve!</h3>
            <p className="text-muted-foreground max-w-md">
              A integração com WhatsApp Business estará disponível em breve.
              Você poderá gerenciar conversas, enviar mensagens e automatizar atendimentos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
