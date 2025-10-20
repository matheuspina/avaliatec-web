/**
 * Tipos para o serviço de envio de emails
 */

export interface EmailAttachment {
  filename: string
  content?: string | Buffer
  path?: string
  contentType?: string
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: EmailAttachment[]
  replyTo?: string
  from?: string
}

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: {
    name: string
    address: string
  }
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}
