# Comportamento do QR Code do WhatsApp

## Fluxo Normal

### 1. Criação da Instância
```
POST /api/whatsapp/instances
↓
Evolution API cria instância
↓
Retorna QR Code inicial
↓
Status: 'qr_code'
```

### 2. Aguardando Leitura do QR Code

Durante este período, a Evolution API envia eventos `CONNECTION_UPDATE` repetidamente:

```json
{
  "event": "CONNECTION_UPDATE",
  "instance": "instance_xxx",
  "data": {
    "state": "close"  // Significa "aguardando conexão"
  }
}
```

**Comportamento Esperado:**
- ✅ O QR Code **permanece visível** mesmo recebendo eventos `close`
- ✅ O status permanece como `qr_code`
- ✅ O webhook **ignora** mudanças para `disconnected` enquanto o QR Code está ativo
- ✅ O `last_seen_at` é atualizado para mostrar que a instância está sendo monitorada

### 3. QR Code Atualizado

Se o QR Code expirar, a Evolution API envia:

```json
{
  "event": "QRCODE_UPDATED",
  "instance": "instance_xxx",
  "data": {
    "qrcode": {
      "base64": "data:image/png;base64,..."
    }
  }
}
```

**Comportamento:**
- ✅ O QR Code é atualizado automaticamente no banco
- ✅ O frontend detecta a mudança via polling
- ✅ O novo QR Code é exibido sem interromper o fluxo

### 4. Conexão Bem-Sucedida

Quando o usuário escaneia o QR Code:

```json
{
  "event": "CONNECTION_UPDATE",
  "instance": "instance_xxx",
  "data": {
    "state": "open",
    "instance": {
      "wid": "5511999999999@s.whatsapp.net"
    }
  }
}
```

**Comportamento:**
- ✅ Status muda para `connected`
- ✅ `phone_number` é extraído e salvo
- ✅ `connected_at` é registrado
- ✅ Frontend fecha o modal e mostra sucesso

## Lógica de Proteção do QR Code

### Backend (whatsappService.ts)

```typescript
private async handleConnectionUpdate(instance, data) {
  const newStatus = mapConnectionStatus(data.state)
  
  // PROTEÇÃO: Não muda para 'disconnected' se está em 'qr_code'
  if (newStatus === 'disconnected' && instance.status === 'qr_code') {
    console.log('Ignoring disconnected - QR code is still active')
    // Apenas atualiza last_seen_at
    return
  }
  
  // Atualiza status normalmente
  updateStatus(newStatus)
}
```

### Frontend (whatsapp-connection-modal.tsx)

```typescript
switch (instance.status) {
  case 'qr_code':
    setStatus('qr_code')  // Mantém QR Code visível
    break
    
  case 'disconnected':
    // Só mostra erro se estava conectado antes
    if (status === 'connected' || status === 'connecting') {
      setError('Connection failed')
    }
    // Se estava em qr_code, ignora
    break
}
```

## Mapeamento de Status

### Evolution API → Sistema

| Evolution State | Sistema Status | Descrição |
|----------------|----------------|-----------|
| `close` | `disconnected` | Desconectado (mas pode estar aguardando QR) |
| `connecting` | `connecting` | Conectando |
| `open` | `connected` | Conectado e pronto |

### Estados do Sistema

| Status | Descrição | Ação do Usuário |
|--------|-----------|-----------------|
| `qr_code` | Aguardando leitura do QR Code | Escanear QR Code |
| `connecting` | Estabelecendo conexão | Aguardar |
| `connected` | Conectado e operacional | Usar normalmente |
| `disconnected` | Desconectado (erro ou logout) | Reconectar |

## Polling do Frontend

O frontend faz polling a cada 2 segundos:

```typescript
const interval = setInterval(() => {
  pollInstanceStatus(instanceId)
}, 2000)
```

**O que é verificado:**
- ✅ Status da instância
- ✅ QR Code atualizado
- ✅ Número de telefone conectado

**Quando para:**
- ✅ Status muda para `connected`
- ✅ Usuário cancela
- ✅ Modal é fechado

## Troubleshooting

### QR Code desaparece imediatamente

**Causa:** Webhook está mudando status para `disconnected`

**Solução:** 
1. Verificar logs do webhook: `CONNECTION_UPDATE for instance`
2. Confirmar que a proteção está ativa: `Ignoring disconnected status`
3. Verificar se o código está atualizado

### QR Code não atualiza

**Causa:** Polling não está funcionando ou evento `QRCODE_UPDATED` não está sendo processado

**Solução:**
1. Verificar logs do webhook: `Processed QRCODE_UPDATED`
2. Verificar se o polling está ativo no frontend
3. Usar botão "Refresh QR Code" manualmente

### Erro "Connection failed" aparece cedo demais

**Causa:** Frontend está interpretando `disconnected` como erro

**Solução:**
1. Verificar lógica no componente
2. Confirmar que só mostra erro se estava `connected` ou `connecting` antes

### Webhook não recebe eventos

**Causa:** URL do webhook incorreta ou inacessível

**Solução:**
1. Verificar `NEXT_PUBLIC_APP_URL` no `.env.local`
2. Testar webhook manualmente: `curl -X POST https://seu-dominio.com/api/webhooks/evolution`
3. Verificar logs da Evolution API

## Logs Úteis

### Backend (Webhook)

```
CONNECTION_UPDATE for instance xxx: {
  currentStatus: 'qr_code',
  newStatus: 'disconnected',
  state: 'close',
  hasQrCode: true
}
✓ Ignoring disconnected status for instance xxx - QR code is still active
```

### Backend (QR Code Update)

```
Webhook received: QRCODE_UPDATED from instance xxx
Processed QRCODE_UPDATED for instance xxx
```

### Frontend (Polling)

```
Polling instance status: xxx
Status: qr_code
QR Code updated: true
```

## Fluxo Completo (Resumo)

```
1. Usuário clica "Connect"
   ↓
2. POST /api/whatsapp/instances
   ↓
3. Evolution API retorna QR Code
   ↓
4. Status: 'qr_code' (QR Code visível)
   ↓
5. Webhook recebe CONNECTION_UPDATE (state: close)
   ↓
6. Backend IGNORA (QR Code ainda ativo)
   ↓
7. Frontend continua mostrando QR Code
   ↓
8. Usuário escaneia QR Code
   ↓
9. Webhook recebe CONNECTION_UPDATE (state: open)
   ↓
10. Status: 'connected'
    ↓
11. Frontend fecha modal e mostra sucesso
```

## Configurações Importantes

### Tempo de Polling
```typescript
const POLLING_INTERVAL = 2000 // 2 segundos
```

### Timeout do QR Code
- Evolution API: ~40 segundos
- Sistema: Sem timeout (aguarda indefinidamente)
- Usuário pode cancelar a qualquer momento

### Eventos do Webhook
```typescript
[
  'MESSAGES_UPSERT',
  'MESSAGES_UPDATE',
  'CONNECTION_UPDATE',  // ← Importante para status
  'QRCODE_UPDATED',     // ← Importante para QR Code
  'CONTACTS_UPSERT'
]
```
