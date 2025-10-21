# Design Document - WhatsApp Atendimento

## Overview

A feature de Atendimento via WhatsApp integra o sistema Avaliatec com a Evolution API (API não oficial do WhatsApp) para permitir comunicação bidirecional com clientes através do WhatsApp. O sistema suporta múltiplas instâncias (números), armazenamento persistente de mensagens no Supabase, mensagens rápidas configuráveis, integração com a base de clientes existente, e configurações avançadas de disponibilidade e comportamento.

A arquitetura segue o padrão Next.js App Router com Server Components e Client Components, utilizando Supabase para persistência de dados e Evolution API para comunicação com WhatsApp.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
│                                                               │
│  ┌────────────────┐         ┌──────────────────┐            │
│  │  UI Components │◄────────┤  React Context   │            │
│  │  (Client Side) │         │  (State Mgmt)    │            │
│  └────────┬───────┘         └──────────────────┘            │
│           │                                                   │
│           ▼                                                   │
│  ┌────────────────────────────────────────────┐             │
│  │         API Routes (Server Side)           │             │
│  │  ┌──────────────┐  ┌──────────────────┐   │             │
│  │  │  WhatsApp    │  │  Webhook Handler │   │             │
│  │  │  Management  │  │  (Evolution API) │   │             │
│  │  └──────────────┘  └──────────────────┘   │             │
│  └────────┬───────────────────┬───────────────┘             │
│           │                   │                              │
└───────────┼───────────────────┼──────────────────────────────┘
            │                   │
            ▼                   ▼
   ┌────────────────┐   ┌──────────────┐
   │  Evolution API │   │   Supabase   │
   │  (WhatsApp)    │   │  (Database)  │
   └────────────────┘   └──────────────┘
```

### Data Flow

#### Sending Messages
```
User Input → UI Component → API Route → Evolution API → WhatsApp
                                ↓
                          Supabase (Store)
```

#### Receiving Messages
```
WhatsApp → Evolution API → Webhook → API Route → Supabase (Store)
                                                      ↓
                                              UI Update (Real-time)
```

## Components and Interfaces

### 1. Database Schema (Supabase)

#### Table: `whatsapp_instances`
Armazena informações das instâncias conectadas.

```sql
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL UNIQUE,
  instance_token TEXT NOT NULL,
  phone_number TEXT,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (
    status IN ('disconnected', 'connecting', 'connected', 'qr_code')
  ),
  qr_code TEXT,
  qr_code_updated_at TIMESTAMPTZ,
  webhook_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ
);

CREATE INDEX idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX idx_whatsapp_instances_created_by ON whatsapp_instances(created_by);
```

#### Table: `whatsapp_contacts`
Armazena informações dos contatos do WhatsApp.

```sql
CREATE TABLE whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE CASCADE NOT NULL,
  remote_jid TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  name TEXT,
  profile_picture_url TEXT,
  contact_type TEXT CHECK (
    contact_type IN ('cliente', 'lead', 'profissional', 'prestador', 'unknown')
  ) DEFAULT 'unknown',
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(instance_id, remote_jid)
);

CREATE INDEX idx_whatsapp_contacts_instance ON whatsapp_contacts(instance_id);
CREATE INDEX idx_whatsapp_contacts_remote_jid ON whatsapp_contacts(remote_jid);
CREATE INDEX idx_whatsapp_contacts_phone ON whatsapp_contacts(phone_number);
CREATE INDEX idx_whatsapp_contacts_client ON whatsapp_contacts(client_id);
CREATE INDEX idx_whatsapp_contacts_type ON whatsapp_contacts(contact_type);
CREATE INDEX idx_whatsapp_contacts_last_message ON whatsapp_contacts(last_message_at DESC);
```

#### Table: `whatsapp_messages`
Armazena todas as mensagens enviadas e recebidas.

```sql
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE NOT NULL,
  message_id TEXT NOT NULL,
  remote_jid TEXT NOT NULL,
  from_me BOOLEAN NOT NULL DEFAULT false,
  message_type TEXT NOT NULL CHECK (
    message_type IN ('text', 'audio', 'image', 'video', 'document', 'sticker', 'location', 'contact', 'other')
  ),
  text_content TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  media_size BIGINT,
  media_filename TEXT,
  quoted_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'delivered', 'read', 'failed')
  ),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(instance_id, message_id)
);

CREATE INDEX idx_whatsapp_messages_instance ON whatsapp_messages(instance_id);
CREATE INDEX idx_whatsapp_messages_contact ON whatsapp_messages(contact_id);
CREATE INDEX idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX idx_whatsapp_messages_from_me ON whatsapp_messages(from_me);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
```

#### Table: `whatsapp_quick_messages`
Armazena mensagens rápidas configuráveis.

```sql
CREATE TABLE whatsapp_quick_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcut TEXT NOT NULL UNIQUE,
  message_text TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_quick_messages_shortcut ON whatsapp_quick_messages(shortcut);
```

#### Table: `whatsapp_instance_settings`
Configurações específicas de cada instância.

```sql
CREATE TABLE whatsapp_instance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE CASCADE NOT NULL UNIQUE,
  reject_calls BOOLEAN NOT NULL DEFAULT false,
  reject_call_message TEXT,
  ignore_groups BOOLEAN NOT NULL DEFAULT true,
  always_online BOOLEAN NOT NULL DEFAULT false,
  read_messages BOOLEAN NOT NULL DEFAULT false,
  read_status BOOLEAN NOT NULL DEFAULT false,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_reply_message TEXT,
  availability_schedule JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_instance_settings_instance ON whatsapp_instance_settings(instance_id);
```

#### Table: `whatsapp_auto_reply_log`
Log de respostas automáticas enviadas.

```sql
CREATE TABLE whatsapp_auto_reply_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE NOT NULL,
  message_sent TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_auto_reply_log_instance ON whatsapp_auto_reply_log(instance_id);
CREATE INDEX idx_whatsapp_auto_reply_log_contact ON whatsapp_auto_reply_log(contact_id, sent_at DESC);
```

### 2. API Routes

#### `/api/whatsapp/instances` (GET, POST)
Gerencia instâncias do WhatsApp.

**GET** - Lista todas as instâncias
```typescript
Response: {
  instances: Array<{
    id: string
    instanceName: string
    displayName: string
    phoneNumber: string | null
    status: 'disconnected' | 'connecting' | 'connected' | 'qr_code'
    connectedAt: string | null
    lastSeenAt: string | null
  }>
}
```

**POST** - Cria nova instância
```typescript
Request: {
  displayName: string
}

Response: {
  instance: {
    id: string
    instanceName: string
    displayName: string
    qrCode: string | null
    status: string
  }
}
```

#### `/api/whatsapp/instances/[id]` (GET, PUT, DELETE)
Gerencia instância específica.

**GET** - Detalhes da instância
**PUT** - Atualiza configurações
**DELETE** - Remove instância

#### `/api/whatsapp/instances/[id]/connect` (POST)
Inicia processo de conexão e retorna QR Code.

```typescript
Response: {
  qrCode: string
  status: 'qr_code'
}
```

#### `/api/whatsapp/instances/[id]/disconnect` (POST)
Desconecta instância.

#### `/api/whatsapp/contacts` (GET)
Lista contatos de uma instância.

```typescript
Query: {
  instanceId: string
  type?: 'cliente' | 'lead' | 'profissional' | 'prestador' | 'unknown'
  search?: string
}

Response: {
  contacts: Array<{
    id: string
    remoteJid: string
    phoneNumber: string
    name: string | null
    profilePictureUrl: string | null
    contactType: string
    clientId: string | null
    lastMessageAt: string | null
    unreadCount: number
  }>
}
```

#### `/api/whatsapp/contacts/[id]` (GET, PUT)
Gerencia contato específico.

**PUT** - Atualiza tipo de contato e associação com cliente
```typescript
Request: {
  contactType?: 'cliente' | 'lead' | 'profissional' | 'prestador'
  clientId?: string | null
  name?: string
}
```

#### `/api/whatsapp/messages` (GET, POST)
Gerencia mensagens.

**GET** - Lista mensagens de um contato
```typescript
Query: {
  contactId: string
  limit?: number
  before?: string // cursor para paginação
}

Response: {
  messages: Array<{
    id: string
    messageId: string
    fromMe: boolean
    messageType: string
    textContent: string | null
    mediaUrl: string | null
    timestamp: string
    status: string
  }>
  hasMore: boolean
  nextCursor: string | null
}
```

**POST** - Envia mensagem
```typescript
Request: {
  instanceId: string
  contactId: string
  messageType: 'text' | 'audio'
  textContent?: string
  audioUrl?: string
  quotedMessageId?: string
}

Response: {
  message: {
    id: string
    messageId: string
    status: string
    timestamp: string
  }
}
```

#### `/api/whatsapp/quick-messages` (GET, POST, PUT, DELETE)
Gerencia mensagens rápidas.

#### `/api/whatsapp/settings/[instanceId]` (GET, PUT)
Gerencia configurações da instância.

**GET** - Busca configurações atuais
**PUT** - Atualiza configurações

```typescript
Request: {
  rejectCalls?: boolean
  rejectCallMessage?: string
  ignoreGroups?: boolean
  alwaysOnline?: boolean
  readMessages?: boolean
  readStatus?: boolean
  autoReplyEnabled?: boolean
  autoReplyMessage?: string
  availabilitySchedule?: {
    [day: string]: {
      enabled: boolean
      start: string // HH:mm
      end: string // HH:mm
    }
  }
}
```

#### `/api/webhooks/evolution` (POST)
Recebe eventos da Evolution API.

```typescript
Request: {
  event: string
  instance: string
  data: any
}
```

Eventos processados:
- `MESSAGES_UPSERT`: Nova mensagem recebida
- `MESSAGES_UPDATE`: Atualização de status de mensagem
- `CONNECTION_UPDATE`: Mudança no status de conexão
- `QRCODE_UPDATED`: QR Code atualizado
- `CONTACTS_UPSERT`: Contato adicionado/atualizado

### 3. React Components

#### `WhatsAppConnectionModal`
Modal para conectar nova instância via QR Code.

```typescript
interface WhatsAppConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (instance: WhatsAppInstance) => void
}
```

Features:
- Exibe QR Code em tempo real
- Atualiza automaticamente quando QR Code muda
- Mostra status de conexão
- Fecha automaticamente ao conectar

#### `WhatsAppInstanceSelector`
Seletor de instâncias ativas.

```typescript
interface WhatsAppInstanceSelectorProps {
  instances: WhatsAppInstance[]
  selectedInstanceId: string | null
  onSelectInstance: (instanceId: string) => void
}
```

#### `WhatsAppContactList`
Lista de contatos com busca e filtros.

```typescript
interface WhatsAppContactListProps {
  instanceId: string
  selectedContactId: string | null
  onSelectContact: (contactId: string) => void
}
```

Features:
- Busca por nome/número
- Filtro por tipo de contato
- Indicador de mensagens não lidas
- Última mensagem preview
- Avatar do contato

#### `WhatsAppChatView`
Visualização da conversa com um contato.

```typescript
interface WhatsAppChatViewProps {
  contactId: string
  instanceId: string
}
```

Features:
- Lista de mensagens com scroll infinito
- Diferenciação visual entre mensagens enviadas/recebidas
- Player de áudio para mensagens de voz
- Indicadores de status (enviado, entregue, lido)
- Timestamps formatados

#### `WhatsAppMessageInput`
Input para enviar mensagens.

```typescript
interface WhatsAppMessageInputProps {
  instanceId: string
  contactId: string
  onMessageSent: (message: WhatsAppMessage) => void
}
```

Features:
- Input de texto com suporte a atalhos (/)
- Botão de gravação de áudio
- Autocomplete de mensagens rápidas
- Substituição de variáveis ({nome_cliente})
- Indicador de "digitando"

#### `WhatsAppContactInfoPanel`
Painel lateral com informações do contato.

```typescript
interface WhatsAppContactInfoPanelProps {
  contactId: string
}
```

Features:
- Informações do contato
- Classificação de tipo
- Associação com cliente
- Botão para criar cliente
- Histórico de interações

#### `WhatsAppSettingsPanel`
Painel de configurações da instância.

```typescript
interface WhatsAppSettingsPanelProps {
  instanceId: string
}
```

Features:
- Configurações de comportamento
- Horários de disponibilidade
- Mensagem automática
- Mensagens rápidas

#### `WhatsAppQuickMessagesManager`
Gerenciador de mensagens rápidas.

```typescript
interface WhatsAppQuickMessagesManagerProps {
  onSave: () => void
}
```

### 4. React Context

#### `WhatsAppContext`
Gerencia estado global do WhatsApp.

```typescript
interface WhatsAppContextValue {
  instances: WhatsAppInstance[]
  selectedInstanceId: string | null
  selectedContactId: string | null
  contacts: WhatsAppContact[]
  messages: WhatsAppMessage[]
  isLoading: boolean
  selectInstance: (instanceId: string) => void
  selectContact: (contactId: string) => void
  sendMessage: (data: SendMessageData) => Promise<void>
  refreshContacts: () => Promise<void>
  refreshMessages: () => Promise<void>
}
```

### 5. Services/Utilities

#### `evolutionApiClient.ts`
Cliente para comunicação com Evolution API.

```typescript
class EvolutionApiClient {
  private baseUrl: string
  private apiKey: string

  async createInstance(data: CreateInstanceData): Promise<Instance>
  async connectInstance(instanceName: string): Promise<void>
  async getConnectionState(instanceName: string): Promise<ConnectionState>
  async sendTextMessage(instanceName: string, data: SendTextData): Promise<MessageResponse>
  async sendAudioMessage(instanceName: string, data: SendAudioData): Promise<MessageResponse>
  async setSettings(instanceName: string, settings: InstanceSettings): Promise<void>
  async getSettings(instanceName: string): Promise<InstanceSettings>
  async deleteInstance(instanceName: string): Promise<void>
}
```

#### `whatsappService.ts`
Serviço de negócio para WhatsApp.

```typescript
class WhatsAppService {
  async processIncomingMessage(webhookData: WebhookData): Promise<void>
  async syncContact(instanceId: string, contactData: ContactData): Promise<WhatsAppContact>
  async matchContactWithClient(phoneNumber: string): Promise<Client | null>
  async shouldSendAutoReply(instanceId: string, contactId: string): Promise<boolean>
  async sendAutoReply(instanceId: string, contactId: string): Promise<void>
  async replaceMessageVariables(message: string, contact: WhatsAppContact): Promise<string>
  async normalizePhoneNumber(phone: string): Promise<string>
}
```

#### `availabilityChecker.ts`
Verifica disponibilidade baseado em horários configurados.

```typescript
function isWithinAvailability(schedule: AvailabilitySchedule): boolean
function getNextAvailableTime(schedule: AvailabilitySchedule): Date | null
```

## Data Models

### TypeScript Interfaces

```typescript
interface WhatsAppInstance {
  id: string
  instanceName: string
  instanceToken: string
  phoneNumber: string | null
  displayName: string
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_code'
  qrCode: string | null
  qrCodeUpdatedAt: string | null
  webhookUrl: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  connectedAt: string | null
  lastSeenAt: string | null
}

interface WhatsAppContact {
  id: string
  instanceId: string
  remoteJid: string
  phoneNumber: string
  name: string | null
  profilePictureUrl: string | null
  contactType: 'cliente' | 'lead' | 'profissional' | 'prestador' | 'unknown'
  clientId: string | null
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
}

interface WhatsAppMessage {
  id: string
  instanceId: string
  contactId: string
  messageId: string
  remoteJid: string
  fromMe: boolean
  messageType: 'text' | 'audio' | 'image' | 'video' | 'document' | 'sticker' | 'location' | 'contact' | 'other'
  textContent: string | null
  mediaUrl: string | null
  mediaMimeType: string | null
  mediaSize: number | null
  mediaFilename: string | null
  quotedMessageId: string | null
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  createdAt: string
}

interface WhatsAppQuickMessage {
  id: string
  shortcut: string
  messageText: string
  description: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

interface WhatsAppInstanceSettings {
  id: string
  instanceId: string
  rejectCalls: boolean
  rejectCallMessage: string | null
  ignoreGroups: boolean
  alwaysOnline: boolean
  readMessages: boolean
  readStatus: boolean
  autoReplyEnabled: boolean
  autoReplyMessage: string | null
  availabilitySchedule: AvailabilitySchedule
  createdAt: string
  updatedAt: string
}

interface AvailabilitySchedule {
  [day: string]: {
    enabled: boolean
    start: string // HH:mm
    end: string // HH:mm
  }
}

interface WebhookData {
  event: string
  instance: string
  data: any
  destination: string
  date_time: string
  sender: string
  server_url: string
  apikey: string
}
```

## Error Handling

### Error Types

```typescript
class EvolutionApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message)
    this.name = 'EvolutionApiError'
  }
}

class WhatsAppServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'WhatsAppServiceError'
  }
}
```

### Error Handling Strategy

1. **API Route Level**: Catch all errors and return appropriate HTTP status codes
2. **Service Level**: Throw typed errors with context
3. **UI Level**: Display user-friendly error messages with toast notifications
4. **Webhook Level**: Log errors but always return 200 to prevent retries

### Common Error Scenarios

- Evolution API unreachable: Retry with exponential backoff
- Invalid QR Code: Regenerate and update UI
- Message send failure: Mark as failed, allow retry
- Webhook processing error: Log and continue
- Database constraint violation: Return validation error

## Testing Strategy

### Unit Tests

1. **Services**
   - `evolutionApiClient`: Mock HTTP requests
   - `whatsappService`: Mock database and API calls
   - `availabilityChecker`: Test schedule logic

2. **Utilities**
   - Phone number normalization
   - Message variable replacement
   - Date/time formatting

### Integration Tests

1. **API Routes**
   - Test all endpoints with mock data
   - Verify authentication and authorization
   - Test error scenarios

2. **Webhook Processing**
   - Test each event type
   - Verify database updates
   - Test idempotency

### E2E Tests

1. **Connection Flow**
   - Create instance
   - Display QR Code
   - Connect successfully

2. **Messaging Flow**
   - Send text message
   - Send audio message
   - Receive message via webhook
   - Display in UI

3. **Contact Management**
   - Create contact from incoming message
   - Associate with existing client
   - Update contact type

### Manual Testing Checklist

- [ ] Connect multiple instances
- [ ] Switch between instances
- [ ] Send/receive text messages
- [ ] Send/receive audio messages
- [ ] Use quick messages with variables
- [ ] Configure availability schedule
- [ ] Test auto-reply outside hours
- [ ] Associate contact with client
- [ ] Create client from contact
- [ ] Configure instance settings
- [ ] Test webhook reliability

## Security Considerations

### Authentication & Authorization

- All API routes require authentication via Supabase Auth
- RLS policies enforce data isolation per user
- Webhook endpoint validates Evolution API signature

### Data Protection

- Evolution API key stored in environment variables
- Instance tokens encrypted at rest
- Sensitive data (phone numbers) handled per LGPD/GDPR

### Rate Limiting

- Implement rate limiting on message sending (1 msg/second per instance)
- Webhook endpoint rate limited to prevent abuse

### Input Validation

- Validate all user inputs
- Sanitize message content
- Validate phone number format
- Validate webhook signatures

## Performance Optimizations

### Database

- Indexes on frequently queried columns
- Pagination for message lists
- Efficient queries with proper joins

### Caching

- Cache instance settings in memory
- Cache quick messages
- Cache contact list with short TTL

### Real-time Updates

- Use Supabase Realtime for message updates
- Debounce typing indicators
- Optimize re-renders with React.memo

### Media Handling

- Store media URLs, not files
- Lazy load images
- Compress audio before sending

## Deployment Considerations

### Environment Variables

```env
# Evolution API
EVOLUTION_API_BASE_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-api-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXT_PUBLIC_APP_URL=https://your-app.com
WEBHOOK_SECRET=your-webhook-secret
```

### Database Migrations

Run migrations in order:
1. Create tables
2. Create indexes
3. Enable RLS
4. Create policies
5. Insert default data (quick messages)

### Monitoring

- Log all Evolution API calls
- Monitor webhook processing time
- Track message delivery rates
- Alert on connection failures

## Future Enhancements

1. **Message Templates**: Support for WhatsApp Business message templates
2. **Chatbot Integration**: AI-powered auto-responses
3. **Analytics Dashboard**: Message volume, response time metrics
4. **Bulk Messaging**: Send messages to multiple contacts
5. **Message Scheduling**: Schedule messages for later
6. **Rich Media**: Support for documents, images, videos
7. **Group Support**: Manage group conversations
8. **CRM Integration**: Deeper integration with client management
9. **Mobile App**: React Native app for mobile access
10. **Voice Calls**: Support for WhatsApp voice calls
