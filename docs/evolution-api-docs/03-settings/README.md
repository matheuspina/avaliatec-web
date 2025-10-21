# Settings - Configurações da Instância

Esta categoria contém endpoints para gerenciar as configurações gerais de uma instância da Evolution API.

## Endpoints Disponíveis

### 1. Set Settings
**Método:** `POST`  
**URL:** `{{baseUrl}}/settings/set/{{instance}}`

Define as configurações gerais de uma instância específica.

**Corpo da Requisição:**
```json
{
  "rejectCall": false,
  "msgCall": "Mensagem automática para chamadas rejeitadas",
  "groupsIgnore": true,
  "alwaysOnline": false,
  "readMessages": false,
  "readStatus": false,
  "syncFullHistory": true
}
```

**Parâmetros:**
- `rejectCall` (boolean): Rejeitar chamadas automaticamente
- `msgCall` (string): Mensagem enviada quando uma chamada é rejeitada
- `groupsIgnore` (boolean): Ignorar mensagens de grupos
- `alwaysOnline` (boolean): Manter status sempre online
- `readMessages` (boolean): Marcar mensagens como lidas automaticamente
- `readStatus` (boolean): Ler status/stories automaticamente
- `syncFullHistory` (boolean): Sincronizar histórico completo de mensagens

### 2. Find Settings
**Método:** `GET`  
**URL:** `{{baseUrl}}/settings/find/{{instance}}`

Busca as configurações atuais de uma instância específica.

**Resposta Esperada:**
```json
{
  "rejectCall": false,
  "msgCall": "Mensagem automática para chamadas rejeitadas",
  "groupsIgnore": true,
  "alwaysOnline": false,
  "readMessages": false,
  "readStatus": false,
  "syncFullHistory": true
}
```

## Descrição das Configurações

### Reject Call
- **Tipo:** Boolean
- **Padrão:** false
- **Descrição:** Quando habilitado, todas as chamadas recebidas são automaticamente rejeitadas
- **Uso:** Útil para bots que não devem receber chamadas

### Message Call
- **Tipo:** String
- **Descrição:** Mensagem automática enviada quando uma chamada é rejeitada
- **Exemplo:** "Desculpe, não posso atender chamadas no momento. Por favor, envie uma mensagem de texto."

### Groups Ignore
- **Tipo:** Boolean
- **Padrão:** true
- **Descrição:** Quando habilitado, ignora mensagens de grupos
- **Uso:** Útil para bots que devem responder apenas mensagens privadas

### Always Online
- **Tipo:** Boolean
- **Padrão:** false
- **Descrição:** Mantém o status da instância sempre como "online"
- **Observação:** Pode afetar a privacidade do usuário

### Read Messages
- **Tipo:** Boolean
- **Padrão:** false
- **Descrição:** Marca automaticamente todas as mensagens recebidas como lidas
- **Uso:** Útil para bots que processam todas as mensagens

### Read Status
- **Tipo:** Boolean
- **Padrão:** false
- **Descrição:** Visualiza automaticamente todos os status/stories
- **Observação:** O remetente será notificado que você visualizou o status

### Sync Full History
- **Tipo:** Boolean
- **Padrão:** true
- **Descrição:** Sincroniza o histórico completo de mensagens ao conectar
- **Observação:** Pode demorar mais para conectar, mas garante histórico completo

## Exemplos de Uso

### Configurar bot básico
```bash
curl -X POST "{{baseUrl}}/settings/set/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectCall": true,
    "msgCall": "Sou um bot, por favor envie mensagem de texto.",
    "groupsIgnore": true,
    "alwaysOnline": true,
    "readMessages": true,
    "readStatus": false,
    "syncFullHistory": false
  }'
```

### Configurar para uso pessoal
```bash
curl -X POST "{{baseUrl}}/settings/set/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectCall": false,
    "groupsIgnore": false,
    "alwaysOnline": false,
    "readMessages": false,
    "readStatus": false,
    "syncFullHistory": true
  }'
```

### Verificar configurações atuais
```bash
curl -X GET "{{baseUrl}}/settings/find/minha-instancia"
```

## Boas Práticas

### Para Bots
- Habilite `rejectCall` e defina uma `msgCall` explicativa
- Considere habilitar `groupsIgnore` se o bot não deve responder em grupos
- Habilite `readMessages` para processar todas as mensagens
- Desabilite `syncFullHistory` para conexão mais rápida

### Para Uso Pessoal
- Mantenha `rejectCall` desabilitado
- Desabilite `alwaysOnline` para privacidade
- Desabilite `readMessages` para controle manual
- Habilite `syncFullHistory` para histórico completo

### Para Atendimento
- Configure `msgCall` com horário de funcionamento
- Mantenha `groupsIgnore` conforme necessidade
- Considere `alwaysOnline` para disponibilidade
- Habilite `readMessages` para não perder mensagens