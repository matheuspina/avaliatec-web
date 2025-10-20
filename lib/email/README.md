# Motor de Disparo de Emails

Serviço reutilizável para envio de emails via SMTP usando Nodemailer.

## Configuração

### 1. Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env.local`:

```env
# SMTP Configuration
SMTP_HOST=smtp.example.com      # Host do servidor SMTP
SMTP_PORT=587                    # Porta (587 para TLS, 465 para SSL)
SMTP_SECURE=false                # true para SSL, false para TLS/STARTTLS
SMTP_USER=seu-email@example.com  # Usuário de autenticação
SMTP_PASSWORD=sua-senha          # Senha ou token de app
SMTP_FROM_NAME=AvaliaTec         # Nome do remetente
SMTP_FROM_EMAIL=noreply@example.com  # Email do remetente
```

### 2. Exemplos de Configuração por Provedor

#### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app  # Criar em: https://myaccount.google.com/apppasswords
SMTP_FROM_NAME=AvaliaTec
SMTP_FROM_EMAIL=seu-email@gmail.com
```

**Importante**: Para Gmail, você precisa criar uma "Senha de App" (não use sua senha normal).

#### Outlook/Office365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@outlook.com
SMTP_PASSWORD=sua-senha
SMTP_FROM_NAME=AvaliaTec
SMTP_FROM_EMAIL=seu-email@outlook.com
```

#### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.sua-api-key-aqui
SMTP_FROM_NAME=AvaliaTec
SMTP_FROM_EMAIL=noreply@seudominio.com
```

#### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@seu-dominio.mailgun.org
SMTP_PASSWORD=sua-senha-smtp
SMTP_FROM_NAME=AvaliaTec
SMTP_FROM_EMAIL=noreply@seudominio.com
```

## Uso

### Exemplo Básico

```typescript
import { sendEmail } from '@/lib/email'

// Email simples com texto
const result = await sendEmail({
  to: 'usuario@example.com',
  subject: 'Bem-vindo ao AvaliaTec!',
  text: 'Olá! Bem-vindo à nossa plataforma.'
})

if (result.success) {
  console.log('Email enviado:', result.messageId)
} else {
  console.error('Erro:', result.error)
}
```

### Email HTML

```typescript
import { sendEmail } from '@/lib/email'

await sendEmail({
  to: 'usuario@example.com',
  subject: 'Relatório Mensal',
  html: `
    <h1>Relatório de Atividades</h1>
    <p>Olá <strong>João</strong>,</p>
    <p>Segue abaixo seu relatório mensal...</p>
    <ul>
      <li>Projetos concluídos: 5</li>
      <li>Horas trabalhadas: 120</li>
    </ul>
  `
})
```

### Múltiplos Destinatários

```typescript
await sendEmail({
  to: ['usuario1@example.com', 'usuario2@example.com', 'usuario3@example.com'],
  subject: 'Convite para Reunião',
  html: '<p>Reunião agendada para amanhã às 14h</p>',
  cc: 'gerente@example.com',
  bcc: 'arquivo@example.com'
})
```

### Email com Anexos

```typescript
await sendEmail({
  to: 'cliente@example.com',
  subject: 'Proposta Comercial',
  html: '<p>Segue em anexo nossa proposta comercial.</p>',
  attachments: [
    {
      filename: 'proposta.pdf',
      path: '/caminho/para/proposta.pdf'
    },
    {
      filename: 'catalogo.pdf',
      path: '/caminho/para/catalogo.pdf'
    }
  ]
})
```

### Anexo de Buffer/String

```typescript
await sendEmail({
  to: 'usuario@example.com',
  subject: 'Seu Relatório',
  html: '<p>Relatório em anexo</p>',
  attachments: [
    {
      filename: 'relatorio.txt',
      content: 'Conteúdo do relatório em texto'
    },
    {
      filename: 'dados.json',
      content: JSON.stringify({ dados: 'exemplo' }),
      contentType: 'application/json'
    }
  ]
})
```

### Personalizar Remetente e Reply-To

```typescript
await sendEmail({
  to: 'usuario@example.com',
  subject: 'Suporte Técnico',
  html: '<p>Como podemos ajudar?</p>',
  from: '"Suporte AvaliaTec" <suporte@avaliatec.com>',
  replyTo: 'atendimento@avaliatec.com'
})
```

## Uso em API Routes (Next.js)

### Exemplo: `/app/api/send-welcome-email/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userName } = await request.json()

    const result = await sendEmail({
      to: userEmail,
      subject: 'Bem-vindo ao AvaliaTec!',
      html: `
        <h1>Olá, ${userName}!</h1>
        <p>Seja bem-vindo à nossa plataforma.</p>
        <p>Estamos felizes em tê-lo conosco.</p>
      `
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Email enviado com sucesso',
      messageId: result.messageId
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}
```

### Exemplo: Envio após cadastro de cliente

```typescript
import { sendEmail } from '@/lib/email'

async function criarCliente(data: ClienteData) {
  // ... salvar cliente no banco

  // Enviar email de boas-vindas
  await sendEmail({
    to: data.email,
    subject: 'Cadastro realizado com sucesso',
    html: `
      <h1>Olá, ${data.nome}!</h1>
      <p>Seu cadastro foi realizado com sucesso.</p>
      <p>Seus dados:</p>
      <ul>
        <li>Nome: ${data.nome}</li>
        <li>Email: ${data.email}</li>
        <li>Telefone: ${data.telefone}</li>
      </ul>
    `
  })
}
```

## Funções Disponíveis

### `sendEmail(options)`

Envia um email.

**Parâmetros:**
- `to`: string | string[] - Destinatário(s)
- `subject`: string - Assunto
- `text?`: string - Conteúdo em texto puro
- `html?`: string - Conteúdo em HTML
- `cc?`: string | string[] - Cópia
- `bcc?`: string | string[] - Cópia oculta
- `attachments?`: EmailAttachment[] - Anexos
- `replyTo?`: string - Email para resposta
- `from?`: string - Remetente (opcional, usa padrão do .env)

**Retorno:** `Promise<SendEmailResult>`
```typescript
{
  success: boolean
  messageId?: string  // ID da mensagem se sucesso
  error?: string      // Mensagem de erro se falhou
}
```

### `verifyEmailConfig()`

Verifica se a configuração SMTP está válida e funcional.

```typescript
import { verifyEmailConfig } from '@/lib/email'

const isValid = await verifyEmailConfig()
if (isValid) {
  console.log('Configuração OK')
} else {
  console.log('Configuração inválida')
}
```

### `resetTransporter()`

Reinicia o transporter (útil após alterar variáveis de ambiente).

```typescript
import { resetTransporter } from '@/lib/email'

// Após mudar variáveis de ambiente
resetTransporter()
```

## Tipos TypeScript

```typescript
interface EmailOptions {
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

interface EmailAttachment {
  filename: string
  content?: string | Buffer
  path?: string
  contentType?: string
}

interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}
```

## Troubleshooting

### Erro: "Configuração de email incompleta"

Verifique se todas as variáveis SMTP estão configuradas no `.env.local`:
- SMTP_HOST
- SMTP_USER
- SMTP_PASSWORD
- SMTP_FROM_EMAIL

### Erro de autenticação (Gmail)

Se estiver usando Gmail, você precisa:
1. Ativar verificação em 2 etapas
2. Criar uma senha de app em: https://myaccount.google.com/apppasswords
3. Usar a senha de app no `SMTP_PASSWORD` (não sua senha normal)

### Email não chega

1. Verifique a pasta de spam
2. Verifique se o email do remetente está verificado no provedor SMTP
3. Use `verifyEmailConfig()` para testar a conexão
4. Verifique os logs do servidor para erros

### Timeout/Connection refused

1. Verifique se a porta está correta (587 ou 465)
2. Verifique se `SMTP_SECURE` está correto (false para 587, true para 465)
3. Verifique se seu firewall não está bloqueando a conexão

## Segurança

⚠️ **IMPORTANTE:**
- NUNCA exponha suas credenciais SMTP no código
- NUNCA commite o arquivo `.env.local` no Git
- Use variáveis de ambiente para todas as configurações sensíveis
- Para produção, use serviços gerenciados (SendGrid, Mailgun, etc) em vez de Gmail
- Implemente rate limiting para prevenir abuso
- Valide e sanitize todos os inputs do usuário antes de enviar emails

## Performance

- O transporter é criado apenas uma vez (singleton)
- Conexões são reutilizadas entre envios
- Para envio em massa, considere usar filas (Bull, BullMQ, etc)

## Licença

MIT
