# Configuração do WhatsApp (Evolution API)

## Fluxo de Criação de Instância

### 1. Criação da Instância

Quando você cria uma nova instância do WhatsApp:

1. **Frontend** envia requisição POST para `/api/whatsapp/instances` com:
   ```json
   {
     "displayName": "Nome da Instância"
   }
   ```

2. **Backend** gera um nome único para a instância e chama a Evolution API:
   ```javascript
   {
     "instanceName": "instance_1234567890_abc123",
     "token": "instance_1234567890_abc123",
     "qrcode": true,
     "integration": "WHATSAPP-BAILEYS", // OBRIGATÓRIO!
     "webhookUrl": "https://seu-dominio.com/api/webhooks/evolution",
     "webhookByEvents": true,
     "webhookEvents": [
       "MESSAGES_UPSERT",
       "MESSAGES_UPDATE",
       "CONNECTION_UPDATE",
       "QRCODE_UPDATED",
       "CONTACTS_UPSERT"
     ]
   }
   ```

3. **Evolution API** retorna:
   ```json
   {
     "instance": {
       "instanceName": "instance_1234567890_abc123",
       "instanceId": "uuid",
       "integration": "WHATSAPP-BAILEYS",
       "status": "connecting"
     },
     "hash": "token_string",
     "qrcode": {
       "base64": "data:image/png;base64,...",
       "code": "2@...",
       "count": 1
     }
   }
   ```

4. **Backend** salva no Supabase:
   - `instance_name`: Nome único
   - `instance_token`: Token de autenticação
   - `display_name`: Nome amigável
   - `status`: 'qr_code' (aguardando leitura)
   - `qr_code`: Base64 da imagem
   - `qr_code_updated_at`: Timestamp
   - `webhook_url`: URL do webhook

5. **Frontend** recebe o QR Code e exibe para o usuário

### 2. Leitura do QR Code

1. Usuário escaneia o QR Code com o WhatsApp
2. Evolution API detecta a conexão
3. Evolution API envia webhook `CONNECTION_UPDATE`:
   ```json
   {
     "event": "CONNECTION_UPDATE",
     "instance": "instance_1234567890_abc123",
     "data": {
       "state": "open",
       "instance": {
         "wid": "5511999999999@s.whatsapp.net"
       }
     }
   }
   ```

4. **Webhook Handler** (`/api/webhooks/evolution`) processa:
   - Atualiza status para 'connected'
   - Salva `phone_number` extraído do `wid`
   - Atualiza `connected_at` e `last_seen_at`

5. **Frontend** detecta mudança de status (via polling ou realtime)
6. **Frontend** carrega mensagens automaticamente

### 3. Recebimento de Mensagens

1. Mensagem chega no WhatsApp
2. Evolution API envia webhook `MESSAGES_UPSERT`:
   ```json
   {
     "event": "MESSAGES_UPSERT",
     "instance": "instance_1234567890_abc123",
     "data": {
       "messages": [{
         "key": {
           "remoteJid": "5511999999999@s.whatsapp.net",
           "fromMe": false,
           "id": "message_id"
         },
         "message": {
           "conversation": "Olá!"
         },
         "pushName": "João",
         "messageTimestamp": 1234567890
       }]
     }
   }
   ```

3. **Webhook Handler** processa:
   - Cria/atualiza contato
   - Salva mensagem
   - Verifica auto-resposta
   - Tenta match com cliente

## Configuração Necessária

### 1. Variáveis de Ambiente

```bash
# Evolution API
EVOLUTION_API_BASE_URL=https://evo.conectaredeseti.com.br
EVOLUTION_API_KEY=sua-chave-api

# URL Pública da Aplicação (IMPORTANTE!)
# NÃO use localhost se a Evolution API estiver em servidor externo
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
# OU use ngrok para desenvolvimento:
# NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# Webhook Security (opcional)
WEBHOOK_SECRET=sua-chave-secreta
```

### 2. URL Pública para Webhook

⚠️ **IMPORTANTE**: A Evolution API precisa conseguir acessar sua aplicação!

**Desenvolvimento Local:**
- Use [ngrok](https://ngrok.com/): `ngrok http 3000`
- Configure `NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io`

**Produção:**
- Use seu domínio real: `NEXT_PUBLIC_APP_URL=https://avaliatec.com.br`

### 3. Verificar Webhook

Teste se o webhook está acessível:

```bash
curl -X POST https://seu-dominio.com/api/webhooks/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "CONNECTION_UPDATE",
    "instance": "test",
    "data": {"state": "open"}
  }'
```

Deve retornar: `{"status":"success",...}`

## Troubleshooting

### Erro: "Invalid integration"

**Causa**: Campo `integration` não foi enviado ou está incorreto.

**Solução**: Certifique-se de que o código está enviando `integration: "WHATSAPP-BAILEYS"`.

### Erro: "Failed to create instance" (CREATE_ERROR)

**Causas possíveis**:
1. Erro ao salvar no banco de dados
2. Campos obrigatórios faltando
3. Violação de constraint (nome duplicado)

**Debug**:
```bash
# Verifique os logs do servidor
# Procure por: "Error storing instance in database"
```

**Soluções**:
- Verifique se o usuário tem permissão `atendimento`
- Verifique se as RLS policies estão corretas
- Verifique se não há instância com mesmo nome

### Webhook não recebe eventos

**Causas possíveis**:
1. URL do webhook usa localhost
2. Firewall bloqueando
3. SSL inválido

**Soluções**:
1. Use URL pública (ngrok ou domínio)
2. Configure firewall para permitir Evolution API
3. Use certificado SSL válido

### QR Code não aparece

**Causas possíveis**:
1. Evolution API não retornou QR Code
2. Erro ao salvar no banco

**Debug**:
```bash
# Verifique os logs:
# "Evolution API response: { hasQrCode: true/false }"
```

**Solução**:
- Verifique se `qrcode: true` está sendo enviado
- Verifique se o campo `qr_code` aceita texto longo no banco

### Status não atualiza após escanear QR Code

**Causas possíveis**:
1. Webhook não está sendo recebido
2. Erro ao processar CONNECTION_UPDATE

**Debug**:
```bash
# Verifique logs do webhook:
# "Webhook received: CONNECTION_UPDATE from instance ..."
# "Processed CONNECTION_UPDATE for instance ..."
```

**Soluções**:
1. Teste o webhook manualmente (ver seção "Verificar Webhook")
2. Verifique se a URL do webhook está correta na Evolution API
3. Verifique logs de erro no processamento

## Logs Úteis

### Criação de Instância
```
Creating WhatsApp instance: { instanceName, webhookUrl, displayName }
Evolution API response: { instanceName, status, hasQrCode, hasHash }
```

### Webhook
```
Webhook received: CONNECTION_UPDATE from instance instance_xxx
Processed CONNECTION_UPDATE for instance instance_xxx
```

### Erros
```
Error storing instance in database: { code, message, details }
⚠️  Webhook URL uses localhost - Evolution API may not be able to reach it
```

## Fluxo Completo (Resumo)

```
1. Usuário clica "Criar Instância"
   ↓
2. POST /api/whatsapp/instances
   ↓
3. Evolution API cria instância + QR Code
   ↓
4. Salva no Supabase (status: qr_code)
   ↓
5. Frontend exibe QR Code
   ↓
6. Usuário escaneia QR Code
   ↓
7. Evolution API → Webhook CONNECTION_UPDATE
   ↓
8. Atualiza status para 'connected'
   ↓
9. Frontend detecta conexão
   ↓
10. Carrega mensagens automaticamente
```

## Próximos Passos

Após conectar a instância:

1. **Sincronização de Contatos**: Evolution API enviará `CONTACTS_UPSERT`
2. **Mensagens Antigas**: Configure `syncFullHistory: true` se necessário
3. **Auto-resposta**: Configure em Settings da instância
4. **Match com Clientes**: Automático via background job
