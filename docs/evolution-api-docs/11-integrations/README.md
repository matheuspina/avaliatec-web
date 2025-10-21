# Integrations - Integrações

Esta categoria contém endpoints para configurar e gerenciar integrações com sistemas externos, incluindo webhooks, websockets, filas de mensagens e outros serviços.

## Subcategorias Disponíveis

### 1. Webhook
### 2. Websocket
### 3. RabbitMQ
### 4. SQS (Amazon Simple Queue Service)
### 5. NATS
### 6. Pusher

---

## 1. Webhook

### Set Webhook
**Método:** `POST`  
**URL:** `{{baseUrl}}/webhook/set/{{instance}}`

Configura webhook para receber eventos da instância.

**Corpo da Requisição:**
```json
{
  "url": "https://meusite.com/webhook",
  "enabled": true,
  "events": [
    "APPLICATION_STARTUP",
    "QRCODE_UPDATED",
    "CONNECTION_UPDATE",
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "MESSAGES_DELETE",
    "SEND_MESSAGE",
    "CONTACTS_SET",
    "CONTACTS_UPSERT",
    "CONTACTS_UPDATE",
    "PRESENCE_UPDATE",
    "CHATS_SET",
    "CHATS_UPSERT",
    "CHATS_UPDATE",
    "CHATS_DELETE",
    "GROUPS_UPSERT",
    "GROUP_UPDATE",
    "GROUP_PARTICIPANTS_UPDATE",
    "NEW_JWT_TOKEN",
    "TYPEBOT_START",
    "TYPEBOT_CHANGE_STATUS"
  ],
  "webhook_by_events": false,
  "webhook_base64": false
}
```

**Parâmetros:**
- `url` (string): URL do webhook
- `enabled` (boolean): Se o webhook está ativo
- `events` (array): Lista de eventos para escutar
- `webhook_by_events` (boolean): Separar webhooks por evento
- `webhook_base64` (boolean): Enviar mídias em base64

### Find Webhook
**Método:** `GET`  
**URL:** `{{baseUrl}}/webhook/find/{{instance}}`

Busca a configuração atual do webhook.

**Resposta Esperada:**
```json
{
  "url": "https://meusite.com/webhook",
  "enabled": true,
  "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
  "webhook_by_events": false,
  "webhook_base64": false
}
```

### Evolution Channel Webhook
**Método:** `POST`  
**URL:** `{{baseUrl}}/webhook/evolution/{{instance}}`

Webhook específico para canal Evolution.

---

## 2. Websocket

### Set Websocket
**Método:** `POST`  
**URL:** `{{baseUrl}}/websocket/set/{{instance}}`

Configura conexão websocket para eventos em tempo real.

**Corpo da Requisição:**
```json
{
  "enabled": true,
  "events": [
    "APPLICATION_STARTUP",
    "QRCODE_UPDATED",
    "CONNECTION_UPDATE",
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "SEND_MESSAGE"
  ]
}
```

**Parâmetros:**
- `enabled` (boolean): Se o websocket está ativo
- `events` (array): Lista de eventos para transmitir

### Find Websocket
**Método:** `GET`  
**URL:** `{{baseUrl}}/websocket/find/{{instance}}`

Busca a configuração atual do websocket.

**Resposta Esperada:**
```json
{
  "enabled": true,
  "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
}
```

---

## 3. RabbitMQ

### Set RabbitMQ
**Método:** `POST`  
**URL:** `{{baseUrl}}/rabbitmq/set/{{instance}}`

Configura integração com RabbitMQ.

**Corpo da Requisição:**
```json
{
  "enabled": true,
  "events": [
    "APPLICATION_STARTUP",
    "QRCODE_UPDATED",
    "CONNECTION_UPDATE",
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "SEND_MESSAGE"
  ]
}
```

**Parâmetros:**
- `enabled` (boolean): Se a integração está ativa
- `events` (array): Lista de eventos para publicar

### Find RabbitMQ
**Método:** `GET`  
**URL:** `{{baseUrl}}/rabbitmq/find/{{instance}}`

Busca a configuração atual do RabbitMQ.

---

## 4. SQS (Amazon Simple Queue Service)

### Set SQS
**Método:** `POST`  
**URL:** `{{baseUrl}}/sqs/set/{{instance}}`

Configura integração com Amazon SQS.

**Corpo da Requisição:**
```json
{
  "enabled": true,
  "events": [
    "APPLICATION_STARTUP",
    "QRCODE_UPDATED",
    "CONNECTION_UPDATE",
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "SEND_MESSAGE"
  ]
}
```

**Parâmetros:**
- `enabled` (boolean): Se a integração está ativa
- `events` (array): Lista de eventos para enviar para a fila

### Find SQS
**Método:** `GET`  
**URL:** `{{baseUrl}}/sqs/find/{{instance}}`

Busca a configuração atual do SQS.

---

## 5. NATS

### Set NATS
**Método:** `POST`  
**URL:** `{{baseUrl}}/nats/set/{{instance}}`

Configura integração com NATS messaging system.

**Corpo da Requisição:**
```json
{
  "enabled": true,
  "events": [
    "APPLICATION_STARTUP",
    "QRCODE_UPDATED",
    "CONNECTION_UPDATE",
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "SEND_MESSAGE"
  ]
}
```

**Parâmetros:**
- `enabled` (boolean): Se a integração está ativa
- `events` (array): Lista de eventos para publicar

### Find NATS
**Método:** `GET`  
**URL:** `{{baseUrl}}/nats/find/{{instance}}`

Busca a configuração atual do NATS.

---

## 6. Pusher

### Set Pusher
**Método:** `POST`  
**URL:** `{{baseUrl}}/pusher/set/{{instance}}`

Configura integração com Pusher para notificações em tempo real.

**Corpo da Requisição:**
```json
{
  "enabled": true,
  "events": [
    "APPLICATION_STARTUP",
    "QRCODE_UPDATED",
    "CONNECTION_UPDATE",
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "SEND_MESSAGE"
  ]
}
```

**Parâmetros:**
- `enabled` (boolean): Se a integração está ativa
- `events` (array): Lista de eventos para transmitir

### Find Pusher
**Método:** `GET`  
**URL:** `{{baseUrl}}/pusher/find/{{instance}}`

Busca a configuração atual do Pusher.

---

## Eventos Disponíveis

### Eventos de Aplicação
- `APPLICATION_STARTUP`: Inicialização da aplicação
- `QRCODE_UPDATED`: QR Code atualizado
- `CONNECTION_UPDATE`: Mudança no status da conexão
- `NEW_JWT_TOKEN`: Novo token JWT gerado

### Eventos de Mensagens
- `MESSAGES_UPSERT`: Nova mensagem recebida/enviada
- `MESSAGES_UPDATE`: Mensagem atualizada
- `MESSAGES_DELETE`: Mensagem deletada
- `SEND_MESSAGE`: Mensagem enviada

### Eventos de Contatos
- `CONTACTS_SET`: Lista de contatos definida
- `CONTACTS_UPSERT`: Contato adicionado/atualizado
- `CONTACTS_UPDATE`: Contato atualizado
- `PRESENCE_UPDATE`: Status de presença atualizado

### Eventos de Chats
- `CHATS_SET`: Lista de chats definida
- `CHATS_UPSERT`: Chat adicionado/atualizado
- `CHATS_UPDATE`: Chat atualizado
- `CHATS_DELETE`: Chat deletado

### Eventos de Grupos
- `GROUPS_UPSERT`: Grupo adicionado/atualizado
- `GROUP_UPDATE`: Informações do grupo atualizadas
- `GROUP_PARTICIPANTS_UPDATE`: Participantes do grupo atualizados

### Eventos de Typebot
- `TYPEBOT_START`: Typebot iniciado
- `TYPEBOT_CHANGE_STATUS`: Status do Typebot alterado

## Estrutura dos Payloads

### Webhook Payload
```json
{
  "event": "MESSAGES_UPSERT",
  "instance": "minha-instancia",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0C767D82B632A2E4A"
    },
    "message": {
      "conversation": "Olá, como você está?"
    },
    "messageTimestamp": 1640995200,
    "status": "RECEIVED"
  },
  "destination": "https://meusite.com/webhook",
  "date_time": "2024-01-01T12:00:00.000Z",
  "sender": "Evolution API",
  "server_url": "https://api.evolution.com",
  "apikey": "sua-api-key"
}
```

### Websocket Message
```json
{
  "event": "CONNECTION_UPDATE",
  "instance": "minha-instancia",
  "data": {
    "state": "open",
    "statusReason": 200
  }
}
```

## Exemplos de Uso

### Configurar Webhook
```bash
curl -X POST "{{baseUrl}}/webhook/set/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://meusite.com/webhook",
    "enabled": true,
    "events": [
      "MESSAGES_UPSERT",
      "CONNECTION_UPDATE"
    ],
    "webhook_by_events": false,
    "webhook_base64": false
  }'
```

### Configurar Websocket
```bash
curl -X POST "{{baseUrl}}/websocket/set/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "events": [
      "MESSAGES_UPSERT",
      "SEND_MESSAGE"
    ]
  }'
```

### Configurar RabbitMQ
```bash
curl -X POST "{{baseUrl}}/rabbitmq/set/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "events": [
      "MESSAGES_UPSERT",
      "CONNECTION_UPDATE"
    ]
  }'
```

### Buscar configuração do Webhook
```bash
curl -X GET "{{baseUrl}}/webhook/find/minha-instancia"
```

## Casos de Uso

### Webhook
- **Notificações:** Receber notificações de mensagens em tempo real
- **Integração:** Conectar com sistemas CRM, ERP, etc.
- **Automação:** Disparar ações baseadas em eventos
- **Logs:** Registrar atividades da instância

### Websocket
- **Dashboard:** Atualizar interface em tempo real
- **Monitoramento:** Acompanhar status da conexão
- **Chat ao vivo:** Implementar chat em tempo real
- **Notificações:** Alertas instantâneos

### Filas de Mensagens (RabbitMQ, SQS, NATS)
- **Processamento assíncrono:** Processar eventos em background
- **Escalabilidade:** Distribuir carga entre múltiplos workers
- **Confiabilidade:** Garantir entrega de mensagens
- **Microserviços:** Comunicação entre serviços

### Pusher
- **Aplicações web:** Notificações push em browsers
- **Apps móveis:** Notificações em tempo real
- **Dashboards:** Atualizações automáticas
- **Colaboração:** Ferramentas colaborativas

## Configurações Avançadas

### Webhook por Eventos
Quando `webhook_by_events` é `true`, cada evento é enviado para uma URL específica:
- `https://meusite.com/webhook/messages_upsert`
- `https://meusite.com/webhook/connection_update`

### Base64 para Mídias
Quando `webhook_base64` é `true`, mídias são enviadas em formato base64 no payload.

### Filtros de Eventos
Configure apenas os eventos necessários para reduzir tráfego:
```json
{
  "events": ["MESSAGES_UPSERT", "SEND_MESSAGE"]
}
```

## Segurança

### Webhook
- Use HTTPS para URLs de webhook
- Implemente verificação de assinatura
- Valide origem das requisições
- Configure rate limiting

### Websocket
- Use WSS (WebSocket Secure)
- Implemente autenticação por token
- Configure CORS adequadamente
- Monitore conexões ativas

### Filas
- Configure autenticação adequada
- Use conexões criptografadas
- Implemente dead letter queues
- Monitore performance das filas

## Monitoramento

### Métricas Importantes
- Taxa de entrega de webhooks
- Latência de processamento
- Erros de conexão
- Volume de eventos

### Logs
- Registre tentativas de entrega
- Monitore falhas de conexão
- Acompanhe performance
- Implemente alertas

## Troubleshooting

### Webhook não recebe eventos
1. Verifique se a URL está acessível
2. Confirme se os eventos estão configurados
3. Verifique logs de erro
4. Teste conectividade

### Websocket desconecta frequentemente
1. Verifique estabilidade da rede
2. Implemente reconexão automática
3. Monitore heartbeat
4. Configure timeout adequado

### Fila com muitas mensagens
1. Aumente número de workers
2. Otimize processamento
3. Configure dead letter queue
4. Monitore recursos do servidor

## Boas Práticas

### Webhook
- Responda rapidamente (< 5 segundos)
- Implemente idempotência
- Use filas para processamento pesado
- Configure retry com backoff

### Websocket
- Implemente heartbeat/ping-pong
- Gerencie reconexões automaticamente
- Limite número de conexões
- Use compressão quando apropriado

### Filas
- Configure TTL para mensagens
- Use acknowledgments adequadamente
- Monitore tamanho das filas
- Implemente circuit breakers

### Geral
- Monitore todas as integrações
- Mantenha logs detalhados
- Configure alertas proativos
- Teste regularmente as integrações