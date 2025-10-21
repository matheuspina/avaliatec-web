# Send Message - Envio de Mensagens

Esta categoria contém endpoints para enviar diferentes tipos de mensagens através da Evolution API.

## Endpoints Disponíveis

### 1. Send Text
**Método:** `POST`  
**URL:** `{{baseUrl}}/message/sendText/{{instance}}`

Envia uma mensagem de texto simples.

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "text": "Olá! Esta é uma mensagem de texto.",
  "delay": 1200,
  "quoted": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "messageId"
    },
    "message": {
      "conversation": "Mensagem original"
    }
  }
}
```

**Parâmetros:**
- `number` (string): Número do destinatário (formato: 5511999999999)
- `text` (string): Texto da mensagem
- `delay` (number, opcional): Delay em milissegundos antes de enviar
- `quoted` (object, opcional): Mensagem a ser citada/respondida

### 2. Send Media
**Método:** `POST`  
**URL:** `{{baseUrl}}/message/sendMedia/{{instance}}`

Envia arquivos de mídia (imagem, vídeo, áudio, documento).

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "mediatype": "image",
  "media": "https://example.com/image.jpg",
  "caption": "Legenda da imagem",
  "fileName": "minha-imagem.jpg",
  "delay": 1200
}
```

**Parâmetros:**
- `number` (string): Número do destinatário
- `mediatype` (string): Tipo de mídia (image, video, audio, document)
- `media` (string): URL da mídia ou base64
- `caption` (string, opcional): Legenda para imagem/vídeo
- `fileName` (string, opcional): Nome do arquivo
- `delay` (number, opcional): Delay em milissegundos

### 3. Send Audio
**Método:** `POST`  
**URL:** `{{baseUrl}}/message/sendWhatsAppAudio/{{instance}}`

Envia áudio como mensagem de voz do WhatsApp.

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "audio": "https://example.com/audio.mp3",
  "delay": 1200
}
```

**Parâmetros:**
- `number` (string): Número do destinatário
- `audio` (string): URL do áudio ou base64
- `delay` (number, opcional): Delay em milissegundos

### 4. Send Status/Stories
**Método:** `POST`  
**URL:** `{{baseUrl}}/message/sendStatus/{{instance}}`

Envia status/stories para contatos específicos ou todos.

**Corpo da Requisição:**
```json
{
  "type": "text",
  "content": "Meu status de texto",
  "backgroundColor": "#FF5733",
  "font": 1,
  "statusJidList": [
    "5511999999999@s.whatsapp.net",
    "5511888888888@s.whatsapp.net"
  ]
}
```

**Parâmetros:**
- `type` (string): Tipo do status (text, image, video)
- `content` (string): Conteúdo do status (texto ou URL da mídia)
- `backgroundColor` (string, opcional): Cor de fundo para status de texto
- `font` (number, opcional): Fonte para status de texto (0-5)
- `statusJidList` (array, opcional): Lista de contatos para enviar (vazio = todos)

## Tipos de Mídia Suportados

### Imagens
- **Formatos:** JPG, PNG, GIF, WebP
- **Tamanho máximo:** 16MB
- **Parâmetro mediatype:** `image`

### Vídeos
- **Formatos:** MP4, AVI, MOV, 3GP
- **Tamanho máximo:** 16MB
- **Parâmetro mediatype:** `video`

### Áudios
- **Formatos:** MP3, AAC, AMR, OGG
- **Tamanho máximo:** 16MB
- **Parâmetro mediatype:** `audio`

### Documentos
- **Formatos:** PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, etc.
- **Tamanho máximo:** 100MB
- **Parâmetro mediatype:** `document`

## Exemplos de Uso

### Enviar texto simples
```bash
curl -X POST "{{baseUrl}}/message/sendText/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Olá! Como você está?"
  }'
```

### Enviar imagem com legenda
```bash
curl -X POST "{{baseUrl}}/message/sendMedia/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "mediatype": "image",
    "media": "https://example.com/foto.jpg",
    "caption": "Olha que foto legal!"
  }'
```

### Enviar documento
```bash
curl -X POST "{{baseUrl}}/message/sendMedia/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "mediatype": "document",
    "media": "https://example.com/documento.pdf",
    "fileName": "Relatório Mensal.pdf"
  }'
```

### Enviar áudio como mensagem de voz
```bash
curl -X POST "{{baseUrl}}/message/sendWhatsAppAudio/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "audio": "https://example.com/audio.mp3"
  }'
```

### Responder uma mensagem
```bash
curl -X POST "{{baseUrl}}/message/sendText/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Esta é minha resposta",
    "quoted": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "messageId123"
      },
      "message": {
        "conversation": "Mensagem original"
      }
    }
  }'
```

### Enviar status de texto
```bash
curl -X POST "{{baseUrl}}/message/sendStatus/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "content": "Trabalhando duro hoje! 💪",
    "backgroundColor": "#4CAF50",
    "font": 2
  }'
```

## Formatação de Texto

### Texto em Negrito
```
*texto em negrito*
```

### Texto em Itálico
```
_texto em itálico_
```

### Texto Riscado
```
~texto riscado~
```

### Texto Monoespaçado
```
```texto monoespaçado```
```

### Exemplo com formatação
```json
{
  "number": "5511999999999",
  "text": "*Título em Negrito*\n\n_Subtítulo em itálico_\n\nTexto normal com ~riscado~ e ```código```."
}
```

## Códigos de Resposta

### Sucesso (200)
```json
{
  "key": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": true,
    "id": "messageId123"
  },
  "message": {
    "conversation": "Mensagem enviada"
  },
  "messageTimestamp": 1640995200,
  "status": "PENDING"
}
```

### Erro (400)
```json
{
  "error": "Invalid number format",
  "message": "O número deve estar no formato internacional sem símbolos"
}
```

## Observações Importantes

- Números devem estar no formato internacional (5511999999999)
- Delay mínimo recomendado: 1000ms entre mensagens
- URLs de mídia devem ser acessíveis publicamente
- Base64 deve incluir o prefixo do tipo de mídia
- Status são visíveis por 24 horas
- Mensagens citadas requerem o objeto completo da mensagem original