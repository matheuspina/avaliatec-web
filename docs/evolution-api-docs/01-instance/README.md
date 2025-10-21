# Instance - Gerenciamento de Instâncias

Esta categoria contém todos os endpoints relacionados ao gerenciamento de instâncias do WhatsApp na Evolution API.

## Endpoints Disponíveis

### 1. Create Instance
**Método:** `POST`  
**URL:** `{{baseUrl}}/instance/create`

Cria uma nova instância do WhatsApp.

**Corpo da Requisição:**
```json
{
  "instanceName": "MyInstance",
  "token": "MyToken",
  "qrcode": true,
  "number": "5511999999999",
  "businessId": "optional",
  "webhookUrl": "https://webhook.site/your-webhook-url",
  "webhookByEvents": false,
  "webhookBase64": false,
  "webhookEvents": [
    "APPLICATION_STARTUP",
    "QRCODE_UPDATED",
    "MESSAGES_SET",
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
    "CONNECTION_UPDATE",
    "LABELS_EDIT",
    "LABELS_ASSOCIATION",
    "CALL",
    "TYPEBOT_START",
    "TYPEBOT_CHANGE_STATUS"
  ],
  "rejectCall": false,
  "msgCall": "Mensagem automática para chamadas rejeitadas",
  "groupsIgnore": true,
  "alwaysOnline": false,
  "readMessages": false,
  "readStatus": false,
  "syncFullHistory": true,
  "rabbitmqEnabled": false,
  "rabbitmqEvents": [],
  "websocketEnabled": false,
  "websocketEvents": [],
  "chatwootAccountId": "1",
  "chatwootToken": "TOKEN",
  "chatwootUrl": "https://chatwoot.com",
  "chatwootSignMsg": true,
  "chatwootReopenConversation": true,
  "chatwootConversationPending": false
}
```

**Parâmetros Obrigatórios:**
- `instanceName`: Nome único da instância
- `token`: Token de autenticação da instância

**Parâmetros Opcionais:**
- `qrcode`: Gerar QR Code (padrão: true)
- `number`: Número do WhatsApp (para conexão direta)
- `businessId`: ID da conta business
- `webhookUrl`: URL do webhook
- `webhookByEvents`: Webhook por eventos
- `webhookBase64`: Enviar mídia em base64
- `webhookEvents`: Lista de eventos do webhook
- `rejectCall`: Rejeitar chamadas automaticamente
- `msgCall`: Mensagem para chamadas rejeitadas
- `groupsIgnore`: Ignorar grupos
- `alwaysOnline`: Sempre online
- `readMessages`: Marcar mensagens como lidas
- `readStatus`: Ler status
- `syncFullHistory`: Sincronizar histórico completo

### 2. Fetch Instances
**Método:** `GET`  
**URL:** `{{baseUrl}}/instance/fetchInstances`

Busca todas as instâncias criadas.

**Parâmetros de Query:**
- `instanceName` (opcional): Nome específico da instância

### 3. Connect
**Método:** `GET`  
**URL:** `{{baseUrl}}/instance/connect/{{instance}}`

Conecta uma instância específica ao WhatsApp.

### 4. Connection State
**Método:** `GET`  
**URL:** `{{baseUrl}}/instance/connectionState/{{instance}}`

Verifica o estado de conexão de uma instância.

### 5. Fetch Instance
**Método:** `GET`  
**URL:** `{{baseUrl}}/instance/fetchInstance/{{instance}}`

Busca informações detalhadas de uma instância específica.

### 6. Restart Instance
**Método:** `PUT`  
**URL:** `{{baseUrl}}/instance/restart/{{instance}}`

Reinicia uma instância específica.

### 7. Logout Instance
**Método:** `DELETE`  
**URL:** `{{baseUrl}}/instance/logout/{{instance}}`

Faz logout de uma instância específica.

### 8. Delete Instance
**Método:** `DELETE`  
**URL:** `{{baseUrl}}/instance/delete/{{instance}}`

Deleta uma instância específica.

## Estados de Conexão

- `close`: Instância desconectada
- `connecting`: Conectando
- `open`: Conectada e pronta para uso

## Eventos Disponíveis

### Eventos de Aplicação
- `APPLICATION_STARTUP`: Inicialização da aplicação

### Eventos de QR Code
- `QRCODE_UPDATED`: QR Code atualizado

### Eventos de Mensagens
- `MESSAGES_SET`: Mensagens definidas
- `MESSAGES_UPSERT`: Mensagens inseridas/atualizadas
- `MESSAGES_UPDATE`: Mensagens atualizadas
- `MESSAGES_DELETE`: Mensagens deletadas
- `SEND_MESSAGE`: Mensagem enviada

### Eventos de Contatos
- `CONTACTS_SET`: Contatos definidos
- `CONTACTS_UPSERT`: Contatos inseridos/atualizados
- `CONTACTS_UPDATE`: Contatos atualizados

### Eventos de Presença
- `PRESENCE_UPDATE`: Atualização de presença

### Eventos de Chats
- `CHATS_SET`: Chats definidos
- `CHATS_UPSERT`: Chats inseridos/atualizados
- `CHATS_UPDATE`: Chats atualizados
- `CHATS_DELETE`: Chats deletados

### Eventos de Grupos
- `GROUPS_UPSERT`: Grupos inseridos/atualizados
- `GROUP_UPDATE`: Grupo atualizado
- `GROUP_PARTICIPANTS_UPDATE`: Participantes do grupo atualizados

### Eventos de Conexão
- `CONNECTION_UPDATE`: Atualização de conexão

### Eventos de Etiquetas
- `LABELS_EDIT`: Etiqueta editada
- `LABELS_ASSOCIATION`: Associação de etiqueta

### Eventos de Chamadas
- `CALL`: Chamada recebida

### Eventos de Chatbot
- `TYPEBOT_START`: Typebot iniciado
- `TYPEBOT_CHANGE_STATUS`: Status do Typebot alterado

## Exemplos de Uso

### Criar uma instância simples
```bash
curl -X POST "{{baseUrl}}/instance/create" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "minha-instancia",
    "token": "meu-token-secreto",
    "qrcode": true
  }'
```

### Verificar estado de conexão
```bash
curl -X GET "{{baseUrl}}/instance/connectionState/minha-instancia"
```

### Conectar instância
```bash
curl -X GET "{{baseUrl}}/instance/connect/minha-instancia"
```