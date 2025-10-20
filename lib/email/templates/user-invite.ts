import type { EmailOptions } from '../types'

/**
 * User Invite Email Template
 * 
 * Professional email template for user invitations with group assignment
 */

interface UserInviteEmailParams {
  recipientEmail: string
  groupName: string
  inviteLink: string
  inviterName?: string
  expiresAt?: string
}

/**
 * Generates a professional user invite email
 * 
 * @param params - Email template parameters
 * @returns EmailOptions - Ready-to-send email configuration
 */
export function generateInviteEmail(params: UserInviteEmailParams): EmailOptions {
  const { 
    recipientEmail, 
    groupName, 
    inviteLink, 
    inviterName = 'Equipe AvaliaTec',
    expiresAt 
  } = params

  // Format expiry date if provided
  const expiryText = expiresAt 
    ? new Date(expiresAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '7 dias'

  const expiryMessage = expiresAt
    ? `Este convite expira em ${expiryText}.`
    : 'Este convite expira em 7 dias.'

  return {
    to: recipientEmail,
    subject: `Convite para AvaliaTec - Grupo ${groupName}`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite para AvaliaTec</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content { 
              padding: 40px 30px;
            }
            .content p {
              margin: 0 0 20px 0;
              font-size: 16px;
            }
            .group-badge {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 14px;
              margin: 10px 0;
            }
            .invite-button { 
              display: block;
              width: fit-content;
              margin: 30px auto;
              padding: 16px 32px; 
              background: #4caf50; 
              color: white; 
              text-decoration: none; 
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
              transition: background-color 0.3s ease;
            }
            .invite-button:hover {
              background: #45a049;
            }
            .info-box {
              background: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 25px 0;
              border-radius: 0 8px 8px 0;
            }
            .info-box h3 {
              margin: 0 0 10px 0;
              color: #667eea;
              font-size: 18px;
            }
            .info-box ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .info-box li {
              margin: 8px 0;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              text-align: center;
            }
            .warning strong {
              color: #856404;
            }
            .footer { 
              background: #f8f9fa;
              padding: 30px;
              text-align: center; 
              color: #666; 
              font-size: 14px;
              border-top: 1px solid #e9ecef;
            }
            .footer p {
              margin: 5px 0;
            }
            .link-fallback {
              word-break: break-all;
              background: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 12px;
              margin-top: 15px;
            }
            @media (max-width: 600px) {
              .container {
                margin: 10px;
                border-radius: 8px;
              }
              .header, .content {
                padding: 30px 20px;
              }
              .invite-button {
                padding: 14px 24px;
                font-size: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Você foi convidado!</h1>
              <p>Junte-se à nossa plataforma de gestão</p>
            </div>
            
            <div class="content">
              <p>Olá!</p>

              <p><strong>${inviterName}</strong> convidou você para fazer parte do AvaliaTec, nossa plataforma de gestão de projetos e colaboração.</p>

              <p>Você foi designado para o grupo:</p>
              <div style="text-align: center;">
                <span class="group-badge">${groupName}</span>
              </div>

              <div class="info-box">
                <h3>🚀 O que você pode fazer no AvaliaTec:</h3>
                <ul>
                  <li><strong>Gerenciar projetos</strong> - Organize e acompanhe o progresso</li>
                  <li><strong>Colaborar em tarefas</strong> - Trabalhe em equipe de forma eficiente</li>
                  <li><strong>Agendar eventos</strong> - Mantenha sua agenda organizada</li>
                  <li><strong>Compartilhar arquivos</strong> - Centralize documentos importantes</li>
                  <li><strong>Comunicar-se</strong> - Mantenha contato com clientes e equipe</li>
                </ul>
              </div>

              <p>Para começar, clique no botão abaixo e complete seu cadastro:</p>

              <a href="${inviteLink}" class="invite-button">
                ✨ Aceitar Convite
              </a>

              <div class="warning">
                <strong>⏰ Atenção:</strong> ${expiryMessage}
              </div>

              <p>Após aceitar o convite, você terá acesso completo às funcionalidades do seu grupo e poderá começar a colaborar imediatamente.</p>

              <p>Estamos ansiosos para tê-lo em nossa equipe!</p>

              <p>Atenciosamente,<br>
              <strong>${inviterName}</strong><br>
              <em>AvaliaTec - Gestão Inteligente</em></p>
            </div>
            
            <div class="footer">
              <p><strong>Problemas para acessar?</strong></p>
              <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
              <div class="link-fallback">${inviteLink}</div>
              <p style="margin-top: 20px;">Este é um email automático. Por favor, não responda.</p>
              <p>© ${new Date().getFullYear()} AvaliaTec. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
🎉 Você foi convidado para o AvaliaTec!

Olá!

${inviterName} convidou você para fazer parte do AvaliaTec, nossa plataforma de gestão de projetos e colaboração.

Você foi designado para o grupo: ${groupName}

O que você pode fazer no AvaliaTec:
• Gerenciar projetos - Organize e acompanhe o progresso
• Colaborar em tarefas - Trabalhe em equipe de forma eficiente  
• Agendar eventos - Mantenha sua agenda organizada
• Compartilhar arquivos - Centralize documentos importantes
• Comunicar-se - Mantenha contato com clientes e equipe

Para começar, acesse o link abaixo e complete seu cadastro:
${inviteLink}

⏰ ATENÇÃO: ${expiryMessage}

Após aceitar o convite, você terá acesso completo às funcionalidades do seu grupo e poderá começar a colaborar imediatamente.

Estamos ansiosos para tê-lo em nossa equipe!

Atenciosamente,
${inviterName}
AvaliaTec - Gestão Inteligente

---
Se você não conseguir clicar no link, copie e cole no seu navegador:
${inviteLink}

Este é um email automático. Por favor, não responda.
© ${new Date().getFullYear()} AvaliaTec. Todos os direitos reservados.
    `.trim()
  }
}

/**
 * Generates a reminder email for pending invites
 * 
 * @param params - Email template parameters
 * @returns EmailOptions - Ready-to-send email configuration
 */
export function generateInviteReminderEmail(params: UserInviteEmailParams): EmailOptions {
  const { 
    recipientEmail, 
    groupName, 
    inviteLink, 
    inviterName = 'Equipe AvaliaTec',
    expiresAt 
  } = params

  const expiryText = expiresAt 
    ? new Date(expiresAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'em breve'

  return {
    to: recipientEmail,
    subject: `🔔 Lembrete: Seu convite para AvaliaTec expira ${expiresAt ? 'em ' + expiryText : 'em breve'}`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lembrete - Convite AvaliaTec</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); 
              color: white; 
              padding: 30px; 
              text-align: center;
            }
            .content { 
              padding: 30px;
            }
            .invite-button { 
              display: block;
              width: fit-content;
              margin: 20px auto;
              padding: 14px 28px; 
              background: #ff9800; 
              color: white; 
              text-decoration: none; 
              border-radius: 8px;
              font-weight: 600;
              text-align: center;
            }
            .urgent-warning {
              background: #ffebee;
              border: 2px solid #f44336;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .footer { 
              background: #f8f9fa;
              padding: 20px;
              text-align: center; 
              color: #666; 
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Lembrete de Convite</h1>
            </div>
            
            <div class="content">
              <p>Olá!</p>

              <p>Este é um lembrete de que você tem um convite pendente para o AvaliaTec.</p>

              <p><strong>Grupo:</strong> ${groupName}</p>

              <div class="urgent-warning">
                <strong>⚠️ Seu convite expira ${expiresAt ? 'em ' + expiryText : 'em breve'}!</strong><br>
                Não perca a oportunidade de fazer parte da nossa equipe.
              </div>

              <a href="${inviteLink}" class="invite-button">
                Aceitar Convite Agora
              </a>

              <p>Atenciosamente,<br><strong>${inviterName}</strong></p>
            </div>
            
            <div class="footer">
              <p>Link: ${inviteLink}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
🔔 Lembrete de Convite - AvaliaTec

Olá!

Este é um lembrete de que você tem um convite pendente para o AvaliaTec.

Grupo: ${groupName}

⚠️ Seu convite expira ${expiresAt ? 'em ' + expiryText : 'em breve'}!

Aceite agora: ${inviteLink}

Atenciosamente,
${inviterName}
    `.trim()
  }
}