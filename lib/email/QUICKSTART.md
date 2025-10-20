# Motor de Emails - Guia Rápido

## 🚀 Início Rápido em 3 Passos

### 1️⃣ Configure as Variáveis de Ambiente

Edite o arquivo `.env.local` e adicione suas credenciais SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
SMTP_FROM_NAME=AvaliaTec
SMTP_FROM_EMAIL=seu-email@gmail.com
```

> **Gmail**: Crie uma senha de app em https://myaccount.google.com/apppasswords

### 2️⃣ Envie seu Primeiro Email

```typescript
import { sendEmail } from '@/lib/email'

await sendEmail({
  to: 'destinatario@example.com',
  subject: 'Meu primeiro email!',
  html: '<h1>Olá!</h1><p>Este é meu primeiro email usando o motor.</p>'
})
```

### 3️⃣ Ou Use um Template Pronto

```typescript
import { sendWelcomeEmail } from '@/lib/email'

await sendWelcomeEmail({
  to: 'novo-usuario@example.com',
  userName: 'João Silva'
})
```

## 📧 Templates Disponíveis

### Email de Boas-vindas
```typescript
import { sendWelcomeEmail } from '@/lib/email'

await sendWelcomeEmail({
  to: 'usuario@example.com',
  userName: 'João Silva',
  loginUrl: 'https://avaliatec.com/login' // opcional
})
```

### Recuperação de Senha
```typescript
import { sendResetPasswordEmail } from '@/lib/email'

await sendResetPasswordEmail({
  to: 'usuario@example.com',
  userName: 'João Silva',
  resetUrl: 'https://avaliatec.com/reset?token=abc123',
  expiresIn: '1 hora' // opcional
})
```

### Convite para Projeto
```typescript
import { sendProjectInviteEmail } from '@/lib/email'

await sendProjectInviteEmail({
  to: 'colaborador@example.com',
  userName: 'Maria Santos',
  projectName: 'Projeto Alpha',
  inviterName: 'João Silva',
  acceptUrl: 'https://avaliatec.com/invite/accept?id=123'
})
```

### Notificação Genérica
```typescript
import { sendNotificationEmail } from '@/lib/email'

await sendNotificationEmail({
  to: 'usuario@example.com',
  userName: 'João Silva',
  title: 'Nova Tarefa Atribuída',
  message: 'Você foi atribuído à tarefa "Revisar Proposta".',
  actionUrl: 'https://avaliatec.com/tasks/456',
  actionText: 'Ver Tarefa'
})
```

## 🛠️ Exemplos Práticos

### Em uma API Route
```typescript
// app/api/users/welcome/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const { email, name } = await request.json()

  const result = await sendWelcomeEmail({
    to: email,
    userName: name
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

### Em um Server Action
```typescript
// app/actions/auth.ts
'use server'

import { sendResetPasswordEmail } from '@/lib/email'

export async function requestPasswordReset(email: string) {
  // 1. Gerar token de reset
  const token = generateResetToken()

  // 2. Salvar token no banco
  await saveResetToken(email, token)

  // 3. Enviar email
  const result = await sendResetPasswordEmail({
    to: email,
    userName: await getUserName(email),
    resetUrl: `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${token}`
  })

  return { success: result.success }
}
```

### Email com Anexo
```typescript
import { sendEmail } from '@/lib/email'

await sendEmail({
  to: 'cliente@example.com',
  subject: 'Relatório Mensal',
  html: '<p>Segue em anexo o relatório do mês.</p>',
  attachments: [
    {
      filename: 'relatorio-janeiro-2024.pdf',
      path: '/tmp/relatorio.pdf'
    }
  ]
})
```

### Múltiplos Destinatários
```typescript
import { sendEmail } from '@/lib/email'

await sendEmail({
  to: ['usuario1@example.com', 'usuario2@example.com'],
  cc: 'gerente@example.com',
  bcc: 'admin@example.com',
  subject: 'Reunião de Equipe',
  html: '<p>Reunião agendada para sexta-feira às 14h.</p>'
})
```

## ✅ Verificar Configuração

Teste se suas credenciais SMTP estão corretas:

```typescript
import { verifyEmailConfig } from '@/lib/email'

const isValid = await verifyEmailConfig()

if (isValid) {
  console.log('✅ Configuração SMTP válida!')
} else {
  console.log('❌ Erro na configuração SMTP')
}
```

## 🔧 Provedores SMTP Populares

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
```

### Outlook/Office365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@outlook.com
SMTP_PASSWORD=sua-senha
```

### SendGrid (Recomendado para produção)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.sua-api-key
```

## 📚 Documentação Completa

Para mais detalhes, consulte o [README.md](./README.md) completo.

## ⚠️ Importante

- ✅ Configure o `.env.local` antes de usar
- ✅ Use senhas de app (não senhas normais) para Gmail
- ✅ Nunca commite credenciais no Git
- ✅ Para produção, use serviços profissionais (SendGrid, Mailgun, etc)
- ✅ Implemente rate limiting para prevenir abuso

## 🆘 Problemas Comuns

**Email não chega?**
- Verifique a pasta de spam
- Confirme se o email do remetente está verificado
- Use `verifyEmailConfig()` para testar a conexão

**Erro de autenticação no Gmail?**
- Ative a verificação em 2 etapas
- Crie uma senha de app específica
- Use a senha de app (não sua senha normal)

**Timeout/Connection refused?**
- Verifique se a porta está correta (587 ou 465)
- Confirme o valor de `SMTP_SECURE`
- Verifique seu firewall

---

**Pronto para usar! 🎉**
