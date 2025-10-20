import nodemailer, { Transporter } from 'nodemailer'
import type { EmailOptions, EmailConfig, SendEmailResult } from './types'

/**
 * Motor de disparo de emails reutilizável
 *
 * Configuração via variáveis de ambiente (.env):
 * - SMTP_HOST: Host do servidor SMTP
 * - SMTP_PORT: Porta do servidor SMTP
 * - SMTP_SECURE: true para TLS, false caso contrário
 * - SMTP_USER: Usuário de autenticação SMTP
 * - SMTP_PASSWORD: Senha de autenticação SMTP
 * - SMTP_FROM_NAME: Nome do remetente
 * - SMTP_FROM_EMAIL: Email do remetente
 */

let transporter: Transporter | null = null

/**
 * Obtém a configuração de email das variáveis de ambiente
 */
function getEmailConfig(): EmailConfig {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
    from: {
      name: process.env.SMTP_FROM_NAME || 'AvaliaTec',
      address: process.env.SMTP_FROM_EMAIL || '',
    },
  }

  // Validar configuração
  if (!config.host || !config.auth.user || !config.auth.pass || !config.from.address) {
    throw new Error(
      'Configuração de email incompleta. Verifique as variáveis de ambiente SMTP_* no arquivo .env'
    )
  }

  return config
}

/**
 * Cria e configura o transporter do nodemailer
 */
function createTransporter(): Transporter {
  if (transporter) {
    return transporter
  }

  const config = getEmailConfig()

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass,
    },
  })

  return transporter
}

/**
 * Envia um email
 *
 * @param options Opções do email (destinatário, assunto, conteúdo, etc)
 * @returns Resultado do envio com sucesso/erro
 *
 * @example
 * ```typescript
 * // Email simples (texto)
 * await sendEmail({
 *   to: 'usuario@example.com',
 *   subject: 'Bem-vindo!',
 *   text: 'Olá, bem-vindo ao AvaliaTec!'
 * })
 *
 * // Email HTML com múltiplos destinatários
 * await sendEmail({
 *   to: ['usuario1@example.com', 'usuario2@example.com'],
 *   subject: 'Relatório Mensal',
 *   html: '<h1>Relatório</h1><p>Confira seus dados...</p>',
 *   cc: 'gerente@example.com'
 * })
 *
 * // Email com anexo
 * await sendEmail({
 *   to: 'cliente@example.com',
 *   subject: 'Proposta Comercial',
 *   html: '<p>Segue em anexo nossa proposta.</p>',
 *   attachments: [
 *     {
 *       filename: 'proposta.pdf',
 *       path: '/caminho/para/proposta.pdf'
 *     }
 *   ]
 * })
 * ```
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  try {
    const config = getEmailConfig()
    const transport = createTransporter()

    // Preparar opções do email
    const mailOptions = {
      from: options.from || `"${config.from.name}" <${config.from.address}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      replyTo: options.replyTo,
      attachments: options.attachments,
    }

    // Validar que há conteúdo (texto ou HTML)
    if (!mailOptions.text && !mailOptions.html) {
      throw new Error('Email deve conter texto ou HTML')
    }

    // Enviar email
    const info = await transport.sendMail(mailOptions)

    console.log('Email enviado com sucesso:', {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject,
    })

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error('Erro ao enviar email:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar email',
    }
  }
}

/**
 * Verifica se a configuração de email está válida
 * Útil para testar a conexão SMTP
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transport = createTransporter()
    await transport.verify()
    console.log('Configuração de email verificada com sucesso')
    return true
  } catch (error) {
    console.error('Erro ao verificar configuração de email:', error)
    return false
  }
}

/**
 * Reinicia o transporter (útil após mudanças nas variáveis de ambiente)
 */
export function resetTransporter(): void {
  transporter = null
}
