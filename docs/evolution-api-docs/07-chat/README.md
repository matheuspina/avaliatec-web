# Chat - Gerenciamento de Conversas

Esta categoria contém endpoints para gerenciar conversas, mensagens e interações no WhatsApp.

## Endpoints Disponíveis

### 1. Read Messages
**Método:** `PUT`  
**URL:** `{{baseUrl}}/chat/readMessages/{{instance}}`

Marca mensagens como lidas.

**Corpo da Requisição:**
```json
{
  "readMessages": [
    {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "messageId123"
    }
  ]
}
```

**Parâmetros:**
- `readMessages` (array): Lista de mensagens para marcar como lidas
  - `remoteJid` (string): JID do remetente
  - `fromMe` (boolean): Se a mensagem foi enviada por você
  - `id` (string): ID da mensagem

### 2. Archive Chat
**Método:** `PUT`  
**URL:** `{{baseUrl}}/chat/archiveChat/{{instance}}`

Arquiva ou desarquiva uma conversa.

**Corpo da Requisição:**
```json
{
  "chat": "5511999999999@s.whatsapp.net",
  "archive": true
}
```

**Parâmetros:**
- `chat` (string): JID da conversa
- `archive` (boolean): true para arquivar, false para desarquivar

### 3. Mark Chat Unread
**Método:** `PUT`  
**URL:** `{{baseUrl}}/chat/markChatUnread/{{instance}}`

Marca uma conversa como não lida.

**Corpo da Requisição:**
```json
{
  "chat": "5511999999999@s.whatsapp.net"
}
```

**Parâmetros:**
- `chat` (string): JID da conversa

### 4. Delete Message
**Método:** `DELETE`  
**URL:** `{{baseUrl}}/chat/deleteMessage/{{instance}}`

Deleta uma mensagem para todos ou apenas para você.

**Corpo da Requisição:**
```json
{
  "key": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": true,
    "id": "messageId123"
  },
  "forEveryone": true
}
```

**Parâmetros:**
- `key` (object): Chave da mensagem
- `forEveryone` (boolean): true para deletar para todos, false apenas para você

### 5. Fetch Profile Picture
**Método:** `GET`  
**URL:** `{{baseUrl}}/chat/fetchProfilePictureUrl/{{instance}}?number={{number}}`

Busca a URL da foto de perfil de um contato.

**Parâmetros de Query:**
- `number` (string): Número do contato

**Resposta Esperada:**
```json
{
  "profilePictureUrl": "https://pps.whatsapp.net/v/t61.24694-24/...",
  "id": "5511999999999@s.whatsapp.net"
}
```

### 6. Get Base64 From Media Message
**Método:** `POST`  
**URL:** `{{baseUrl}}/chat/getBase64FromMediaMessage/{{instance}}`

Converte uma mensagem de mídia para base64.

**Corpo da Requisição:**
```json
{
  "message": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "messageId123"
    }
  },
  "convertToMp4": false
}
```

**Parâmetros:**
- `message` (object): Objeto da mensagem de mídia
- `convertToMp4` (boolean, opcional): Converter vídeo para MP4

### 7. Update Message
**Método:** `PUT`  
**URL:** `{{baseUrl}}/chat/updateMessage/{{instance}}`

Edita uma mensagem enviada.

**Corpo da Requisição:**
```json
{
  "key": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": true,
    "id": "messageId123"
  },
  "text": "Texto editado da mensagem"
}
```

**Parâmetros:**
- `key` (object): Chave da mensagem original
- `text` (string): Novo texto da mensagem

### 8. Send Presence
**Método:** `PUT`  
**URL:** `{{baseUrl}}/chat/sendPresence/{{instance}}`

Define o status de presença (digitando, gravando, online, etc.).

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "presence": "composing",
  "delay": 2000
}
```

**Parâmetros:**
- `number` (string): Número do contato
- `presence` (string): Tipo de presença
- `delay` (number, opcional): Duração em milissegundos

### 9. Update Block Status
**Método:** `PUT`  
**URL:** `{{baseUrl}}/chat/updateBlockStatus/{{instance}}`

Bloqueia ou desbloqueia um contato.

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "status": "block"
}
```

**Parâmetros:**
- `number` (string): Número do contato
- `status` (string): "block" ou "unblock"

### 10. Find Contacts
**Método:** `GET`  
**URL:** `{{baseUrl}}/chat/findContacts/{{instance}}`

Busca todos os contatos da instância.

**Resposta Esperada:**
```json
[
  {
    "id": "5511999999999@s.whatsapp.net",
    "name": "João Silva",
    "notify": "João",
    "verifiedName": null,
    "imgUrl": "https://pps.whatsapp.net/...",
    "status": "Disponível"
  }
]
```

### 11. Find Messages
**Método:** `GET`  
**URL:** `{{baseUrl}}/chat/findMessages/{{instance}}?remoteJid={{remoteJid}}&limit={{limit}}&page={{page}}`

Busca mensagens de uma conversa específica.

**Parâmetros de Query:**
- `remoteJid` (string): JID da conversa
- `limit` (number, opcional): Limite de mensagens (padrão: 20)
- `page` (number, opcional): Página (padrão: 1)

### 12. Find Status Message
**Método:** `GET`  
**URL:** `{{baseUrl}}/chat/findStatusMessage/{{instance}}?limit={{limit}}&page={{page}}`

Busca mensagens de status/stories.

**Parâmetros de Query:**
- `limit` (number, opcional): Limite de status (padrão: 20)
- `page` (number, opcional): Página (padrão: 1)

### 13. Find Chats
**Método:** `GET`  
**URL:** `{{baseUrl}}/chat/findChats/{{instance}}`

Busca todas as conversas da instância.

**Resposta Esperada:**
```json
[
  {
    "id": "5511999999999@s.whatsapp.net",
    "name": "João Silva",
    "unreadCount": 3,
    "lastMessage": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "messageId123"
      },
      "message": {
        "conversation": "Última mensagem"
      },
      "messageTimestamp": 1640995200
    },
    "archived": false
  }
]
```

## Tipos de Presença

- `available`: Disponível/Online
- `unavailable`: Indisponível/Offline
- `composing`: Digitando
- `recording`: Gravando áudio
- `paused`: Pausou de digitar

## Exemplos de Uso

### Marcar mensagens como lidas
```bash
curl -X PUT "{{baseUrl}}/chat/readMessages/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "readMessages": [
      {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "messageId123"
      }
    ]
  }'
```

### Arquivar conversa
```bash
curl -X PUT "{{baseUrl}}/chat/archiveChat/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "chat": "5511999999999@s.whatsapp.net",
    "archive": true
  }'
```

### Deletar mensagem para todos
```bash
curl -X DELETE "{{baseUrl}}/chat/deleteMessage/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": true,
      "id": "messageId123"
    },
    "forEveryone": true
  }'
```

### Buscar foto de perfil
```bash
curl -X GET "{{baseUrl}}/chat/fetchProfilePictureUrl/minha-instancia?number=5511999999999"
```

### Mostrar que está digitando
```bash
curl -X PUT "{{baseUrl}}/chat/sendPresence/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "presence": "composing",
    "delay": 3000
  }'
```

### Bloquear contato
```bash
curl -X PUT "{{baseUrl}}/chat/updateBlockStatus/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "status": "block"
  }'
```

### Buscar mensagens de uma conversa
```bash
curl -X GET "{{baseUrl}}/chat/findMessages/minha-instancia?remoteJid=5511999999999@s.whatsapp.net&limit=50&page=1"
```

### Buscar todas as conversas
```bash
curl -X GET "{{baseUrl}}/chat/findChats/minha-instancia"
```

## Observações Importantes

- **Chaves de mensagem:** Sempre necessárias para operações específicas
- **JID Format:** Contatos individuais usam @s.whatsapp.net
- **Presença:** Automaticamente removida após o delay especificado
- **Bloqueio:** Afeta tanto envio quanto recebimento de mensagens
- **Arquivamento:** Não deleta a conversa, apenas a oculta
- **Edição:** Apenas mensagens próprias podem ser editadas
- **Deleção:** Mensagens só podem ser deletadas para todos dentro de um tempo limite