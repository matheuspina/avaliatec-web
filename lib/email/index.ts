/**
 * Motor de disparo de emails
 *
 * Serviço reutilizável para envio de emails via SMTP
 *
 * @example
 * ```typescript
 * import { sendEmail } from '@/lib/email'
 *
 * await sendEmail({
 *   to: 'usuario@example.com',
 *   subject: 'Bem-vindo',
 *   html: '<h1>Olá!</h1>'
 * })
 * ```
 *
 * @example
 * ```typescript
 * import { sendWelcomeEmail } from '@/lib/email'
 *
 * await sendWelcomeEmail({
 *   to: 'usuario@example.com',
 *   userName: 'João Silva'
 * })
 * ```
 */

// Funções principais
export { sendEmail, verifyEmailConfig, resetTransporter } from './mailer'

// Templates prontos
export {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendProjectInviteEmail,
  sendNotificationEmail
} from './templates'

// User invite templates
export {
  generateInviteEmail,
  generateInviteReminderEmail
} from './templates/user-invite'

// Tipos
export type { EmailOptions, EmailAttachment, EmailConfig, SendEmailResult } from './types'
