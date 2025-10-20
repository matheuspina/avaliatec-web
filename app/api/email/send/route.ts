import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * API Route para envio de emails
 *
 * POST /api/email/send
 *
 * Body (JSON):
 * {
 *   "to": "usuario@example.com" | ["email1@example.com", "email2@example.com"],
 *   "subject": "Assunto do email",
 *   "text": "Conteúdo em texto" (opcional),
 *   "html": "<h1>Conteúdo HTML</h1>" (opcional),
 *   "cc": "copia@example.com" (opcional),
 *   "bcc": "copia-oculta@example.com" (opcional),
 *   "replyTo": "responder@example.com" (opcional)
 * }
 *
 * Exemplo de uso:
 *
 * ```typescript
 * const response = await fetch('/api/email/send', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     to: 'cliente@example.com',
 *     subject: 'Bem-vindo!',
 *     html: '<h1>Olá!</h1><p>Bem-vindo ao AvaliaTec</p>'
 *   })
 * })
 * const data = await response.json()
 * ```
 */
export async function POST(request: NextRequest) {
  return withPermissionCheck(request, 'email', async (userId) => {
    try {
      // Parse do body
      const body = await request.json()

      // Validações básicas
      if (!body.to || !body.subject) {
        return NextResponse.json(
          {
            success: false,
            error: 'Campos obrigatórios: to, subject'
          },
          { status: 400 }
        )
      }

      if (!body.text && !body.html) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forneça pelo menos um dos campos: text ou html'
          },
          { status: 400 }
        )
      }

      // Enviar email
      const result = await sendEmail({
        to: body.to,
        subject: body.subject,
        text: body.text,
        html: body.html,
        cc: body.cc,
        bcc: body.bcc,
        replyTo: body.replyTo,
      })

      // Retornar resultado
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Email enviado com sucesso'
      })
    } catch (error) {
      console.error('Erro na API de envio de email:', error)

      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao processar requisição'
        },
        { status: 500 }
      )
    }
  })
}
