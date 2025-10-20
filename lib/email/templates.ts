import { sendEmail } from './mailer'
import type { SendEmailResult } from './types'

/**
 * Templates de email reutilizáveis
 *
 * Funções prontas para enviar emails comuns da aplicação
 */

interface WelcomeEmailParams {
  to: string
  userName: string
  loginUrl?: string
}

interface ResetPasswordParams {
  to: string
  userName: string
  resetUrl: string
  expiresIn?: string
}

interface ProjectInviteParams {
  to: string
  userName: string
  projectName: string
  inviterName: string
  acceptUrl: string
}

interface NotificationParams {
  to: string
  userName: string
  title: string
  message: string
  actionUrl?: string
  actionText?: string
}

/**
 * Envia email de boas-vindas ao novo usuário
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<SendEmailResult> {
  const { to, userName, loginUrl = 'https://avaliatec.com/login' } = params

  return sendEmail({
    to,
    subject: 'Bem-vindo ao AvaliaTec! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bem-vindo ao AvaliaTec!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${userName}</strong>,</p>

              <p>Estamos muito felizes em tê-lo conosco! 🎉</p>

              <p>Sua conta foi criada com sucesso e você já pode começar a usar todas as funcionalidades da nossa plataforma de gestão de projetos.</p>

              <p>Com o AvaliaTec você pode:</p>
              <ul>
                <li>Gerenciar projetos e tarefas</li>
                <li>Acompanhar o progresso da equipe</li>
                <li>Organizar documentos e arquivos</li>
                <li>Colaborar em tempo real</li>
              </ul>

              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Acessar Plataforma</a>
              </div>

              <p>Se tiver qualquer dúvida, nossa equipe de suporte está sempre à disposição.</p>

              <p>Boas-vindas e ótimo trabalho!</p>

              <p>Atenciosamente,<br><strong>Equipe AvaliaTec</strong></p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Olá ${userName},

Bem-vindo ao AvaliaTec! 🎉

Estamos muito felizes em tê-lo conosco. Sua conta foi criada com sucesso.

Acesse a plataforma em: ${loginUrl}

Atenciosamente,
Equipe AvaliaTec
    `.trim()
  })
}

/**
 * Envia email de recuperação de senha
 */
export async function sendResetPasswordEmail(params: ResetPasswordParams): Promise<SendEmailResult> {
  const { to, userName, resetUrl, expiresIn = '1 hora' } = params

  return sendEmail({
    to,
    subject: 'Recuperação de Senha - AvaliaTec',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Recuperação de Senha</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${userName}</strong>,</p>

              <p>Recebemos uma solicitação para redefinir a senha da sua conta no AvaliaTec.</p>

              <p>Para criar uma nova senha, clique no botão abaixo:</p>

              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </div>

              <div class="warning">
                <strong>⚠️ Atenção:</strong> Este link expira em <strong>${expiresIn}</strong>.
              </div>

              <p>Se você não solicitou a recuperação de senha, ignore este email. Sua senha atual permanecerá inalterada.</p>

              <p>Por segurança, nunca compartilhe este link com outras pessoas.</p>

              <p>Atenciosamente,<br><strong>Equipe AvaliaTec</strong></p>
            </div>
            <div class="footer">
              <p>Se você não conseguir clicar no botão, copie e cole este link no navegador:</p>
              <p style="word-break: break-all;">${resetUrl}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Olá ${userName},

Recuperação de Senha - AvaliaTec

Recebemos uma solicitação para redefinir a senha da sua conta.

Para criar uma nova senha, acesse o link abaixo:
${resetUrl}

⚠️ Este link expira em ${expiresIn}.

Se você não solicitou a recuperação de senha, ignore este email.

Atenciosamente,
Equipe AvaliaTec
    `.trim()
  })
}

/**
 * Envia convite para colaborar em um projeto
 */
export async function sendProjectInviteEmail(params: ProjectInviteParams): Promise<SendEmailResult> {
  const { to, userName, projectName, inviterName, acceptUrl } = params

  return sendEmail({
    to,
    subject: `Convite: ${projectName} - AvaliaTec`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #4caf50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .project-info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Convite para Projeto</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${userName}</strong>,</p>

              <p><strong>${inviterName}</strong> convidou você para colaborar em um projeto!</p>

              <div class="project-info">
                <strong>Projeto:</strong> ${projectName}
              </div>

              <p>Aceite o convite para ter acesso ao projeto e começar a colaborar com a equipe.</p>

              <div style="text-align: center;">
                <a href="${acceptUrl}" class="button">Aceitar Convite</a>
              </div>

              <p>Estamos ansiosos para ter você no time!</p>

              <p>Atenciosamente,<br><strong>Equipe AvaliaTec</strong></p>
            </div>
            <div class="footer">
              <p>Se você não esperava este convite, você pode ignorar este email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Olá ${userName},

${inviterName} convidou você para colaborar no projeto "${projectName}"!

Aceite o convite acessando: ${acceptUrl}

Atenciosamente,
Equipe AvaliaTec
    `.trim()
  })
}

/**
 * Envia notificação genérica ao usuário
 */
export async function sendNotificationEmail(params: NotificationParams): Promise<SendEmailResult> {
  const { to, userName, title, message, actionUrl, actionText } = params

  const actionButton = actionUrl && actionText
    ? `
      <div style="text-align: center;">
        <a href="${actionUrl}" class="button">${actionText}</a>
      </div>
    `
    : ''

  return sendEmail({
    to,
    subject: `${title} - AvaliaTec`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196f3; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #2196f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 ${title}</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${userName}</strong>,</p>

              <p>${message}</p>

              ${actionButton}

              <p>Atenciosamente,<br><strong>Equipe AvaliaTec</strong></p>
            </div>
            <div class="footer">
              <p>Esta é uma notificação automática do sistema.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Olá ${userName},

${title}

${message}

${actionUrl ? `Acesse: ${actionUrl}` : ''}

Atenciosamente,
Equipe AvaliaTec
    `.trim()
  })
}
