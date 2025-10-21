# Evolution API v2.3 - Documentação Completa

Esta documentação contém todos os endpoints da Evolution API v2.3, uma API não oficial do WhatsApp, organizados por categorias para facilitar o uso por ferramentas de LLM e desenvolvedores.

## 📋 Índice de Categorias

1. **[Instance](./01-instance/README.md)** - Gerenciamento de instâncias (criar, conectar, desconectar, status)
2. **[Proxy](./02-proxy/README.md)** - Configuração de proxy (HTTP, HTTPS, SOCKS4, SOCKS5)
3. **[Settings](./03-settings/README.md)** - Configurações da instância (rejeitar chamadas, grupos, etc.)
4. **[Send Message](./04-send-message/README.md)** - Envio de mensagens (texto, mídia, áudio, status)
5. **[Message](./05-message/README.md)** - Mensagens avançadas (sticker, localização, contato, enquete, lista, botões)
6. **[Call](./06-call/README.md)** - Funcionalidades de chamadas (fake call, verificar número)
7. **[Chat](./07-chat/README.md)** - Gerenciamento de conversas (ler, arquivar, deletar, presença)
8. **[Label](./08-label/README.md)** - Sistema de etiquetas (criar, gerenciar, organizar)
9. **[Profile Settings](./09-profile-settings/README.md)** - Configurações de perfil (nome, status, foto, privacidade)
10. **[Group](./10-group/README.md)** - Gerenciamento de grupos (criar, configurar, participantes, administração)
11. **[Integrations](./11-integrations/README.md)** - Integrações (Webhook, Websocket, RabbitMQ, SQS, NATS, Pusher)
12. **[Chatbot](./12-chatbot/README.md)** - Integrações com chatbots (Chatwoot, Typebot, Evolution Bot, OpenAI, Dify)
13. **[Storage](./13-storage/README.md)** - Armazenamento e endpoints gerais (S3, informações, métricas)

## Estrutura dos Arquivos

Cada categoria possui:
- `README.md` - Visão geral da categoria
- Arquivos individuais para cada endpoint com:
  - Método HTTP
  - URL do endpoint
  - Parâmetros obrigatórios e opcionais
  - Corpo da requisição (quando aplicável)
  - Exemplos de uso
  - Descrição detalhada

## Variáveis Globais

A API utiliza as seguintes variáveis:
- `{{baseUrl}}` - URL base da API
- `{{instance}}` - Nome da instância
- `{{remoteJid}}` - ID do contato/grupo (formato: número@s.whatsapp.net ou groupId@g.us)
- `{{groupJid}}` - ID do grupo
- `{{inviteCode}}` - Código de convite do grupo

## Formato dos JIDs

- **Contato individual**: `5511999999999@s.whatsapp.net`
- **Grupo**: `120363123456789012@g.us`
- **Status/Stories**: `status@broadcast`

## Autenticação

A API utiliza autenticação via API Key que deve ser enviada no header das requisições:
```
Authorization: Bearer YOUR_API_KEY
```

## Base URL

```
https://your-evolution-api-domain.com
```

---

**Nota**: Esta documentação foi extraída da coleção Postman da Evolution API v2.3 e organizada para uso como base de conhecimento para LLMs.