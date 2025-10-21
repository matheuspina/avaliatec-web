# Message - Gerenciamento de Mensagens

Esta categoria contém endpoints para enviar tipos específicos de mensagens e gerenciar mensagens existentes.

## Endpoints Disponíveis

### 1. Send Sticker
**Método:** `POST`  
**URL:** `{{baseUrl}}/message/sendSticker/{{instance}}`

Envia um sticker/figurinha.

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "sticker": "https://example.com/sticker.webp",
  "delay": 1200
}
```

**Parâmetros:**
- `number` (string): Número do destinatário
- `sticker` (string): URL do sticker ou base64
- `delay` (number, opcional): Delay em milissegundos

### 2. Send Location
**Método:** `POST`  
**URL:** `{{baseUrl}}/message/sendLocation/{{instance}}`

Envia uma localização geográfica.

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "name": "São Paulo, SP",
  "address": "São Paulo, Estado de São Paulo, Brasil",
  "delay": 1200
}
```

**Parâmetros:**
- `number` (string): Número do destinatário
- `latitude` (number): Latitude da localização
- `longitude` (number): Longitude da localização
- `name` (string, opcional): Nome do local
- `address` (string, opcional): Endereço do local
- `delay` (number, opcional): Delay em milissegundos

### 3. Send Contact
**Método:** `POST`  
**URL:** `{{baseUrl}}/message/sendContact/{{instance}}`

Envia um contato.

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "contact": {
    "fullName": "João Silva",
    "wuid": "5511888888888",
    "phoneNumber": "5511888888888",
    "organization": "Empresa XYZ",
    "email": "joao@empresa.com"
  },
  "delay": 1200
}
```

**Parâmetros:**
- `number` (string): Número do destinatário
- `contact` (object): Dados do contato
  - `fullName` (string): Nome completo
  - `wuid` (string): WhatsApp ID
  - `phoneNumber` (string): Número de telefone
  - `organization` (string, opcional): Organização
  - `email` (string, opcional): Email
- `delay` (number, opcional): Delay em milissegundos

### 4. Send Reaction
**Método:** `POST`  
**URL:** `{{baseUrl}}/message/sendReaction/{{instance}}`

Envia uma reação (emoji) para uma mensagem.

**Corpo da Requisição:**
```json
{
  "reactionMessage": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "messageId123"
    },
    "reaction": "👍"
  }
}
```

**Parâmetros:**
- `reactionMessage` (object): Dados da reação
  - `key` (object): Chave da mensagem original
  - `reaction` (string): Emoji da reação (vazio para remover)

### 5. Send Poll
**Método:** `POST`  
**URL:** `{{baseUrl}}/message/sendPoll/{{instance}}`

Envia uma enquete.

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "name": "Qual sua cor favorita?",
  "selectableCount": 1,
  "values": [
    "Azul",
    "Vermelho",
    "Verde",
    "Amarelo"
  ],
  "delay": 1200
}
```

**Parâmetros:**
- `number` (string): Número do destinatário
- `name` (string): Pergunta da enquete
- `selectableCount` (number): Número de opções selecionáveis
- `values` (array): Lista de opções
- `delay` (number, opcional): Delay em milissegundos

### 6. Send List
**Método:** `POST`  
**URL:** `{{baseUrl}}/message/sendList/{{instance}}`

Envia uma lista interativa.

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "title": "Escolha uma opção",
  "description": "Selecione uma das opções abaixo:",
  "buttonText": "Ver opções",
  "footerText": "Evolution API",
  "sections": [
    {
      "title": "Seção 1",
      "rows": [
        {
          "title": "Opção 1",
          "description": "Descrição da opção 1",
          "rowId": "opcao1"
        },
        {
          "title": "Opção 2",
          "description": "Descrição da opção 2",
          "rowId": "opcao2"
        }
      ]
    }
  ],
  "delay": 1200
}
```

**Parâmetros:**
- `number` (string): Número do destinatário
- `title` (string): Título da lista
- `description` (string): Descrição da lista
- `buttonText` (string): Texto do botão
- `footerText` (string, opcional): Texto do rodapé
- `sections` (array): Seções da lista
- `delay` (number, opcional): Delay em milissegundos

### 7. Send Button
**Método:** `POST`  
**URL:** `{{baseUrl}}/message/sendButton/{{instance}}`

Envia botões interativos.

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "title": "Título da mensagem",
  "description": "Descrição da mensagem com botões",
  "footer": "Evolution API",
  "buttons": [
    {
      "type": "replyButton",
      "reply": {
        "id": "btn1",
        "title": "Botão 1"
      }
    },
    {
      "type": "replyButton",
      "reply": {
        "id": "btn2",
        "title": "Botão 2"
      }
    }
  ],
  "delay": 1200
}
```

**Parâmetros:**
- `number` (string): Número do destinatário
- `title` (string): Título da mensagem
- `description` (string): Descrição da mensagem
- `footer` (string, opcional): Rodapé da mensagem
- `buttons` (array): Lista de botões
- `delay` (number, opcional): Delay em milissegundos

## Exemplos de Uso

### Enviar sticker
```bash
curl -X POST "{{baseUrl}}/message/sendSticker/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "sticker": "https://example.com/sticker.webp"
  }'
```

### Enviar localização
```bash
curl -X POST "{{baseUrl}}/message/sendLocation/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "name": "São Paulo",
    "address": "São Paulo, SP, Brasil"
  }'
```

### Enviar contato
```bash
curl -X POST "{{baseUrl}}/message/sendContact/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "contact": {
      "fullName": "João Silva",
      "wuid": "5511888888888",
      "phoneNumber": "5511888888888"
    }
  }'
```

### Reagir a uma mensagem
```bash
curl -X POST "{{baseUrl}}/message/sendReaction/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "reactionMessage": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "messageId123"
      },
      "reaction": "❤️"
    }
  }'
```

### Criar enquete
```bash
curl -X POST "{{baseUrl}}/message/sendPoll/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "name": "Qual seu filme favorito?",
    "selectableCount": 1,
    "values": ["Ação", "Comédia", "Drama", "Terror"]
  }'
```

## Formatos Suportados

### Stickers
- **Formato:** WebP (recomendado), PNG, JPG
- **Tamanho:** 512x512 pixels (recomendado)
- **Tamanho máximo:** 1MB

### Localizações
- **Latitude:** -90 a 90
- **Longitude:** -180 a 180
- **Precisão:** Até 6 casas decimais

### Contatos
- **Número:** Formato internacional (5511999999999)
- **Nome:** Até 256 caracteres
- **Organização:** Até 128 caracteres

### Reações
- **Emojis:** Qualquer emoji Unicode
- **Remover:** String vazia ("")

### Enquetes
- **Opções:** Máximo 12 opções
- **Selecionáveis:** 1 a número total de opções
- **Texto:** Até 60 caracteres por opção

### Listas
- **Seções:** Máximo 10 seções
- **Linhas:** Máximo 10 linhas por seção
- **Título:** Até 24 caracteres
- **Descrição:** Até 72 caracteres

### Botões
- **Quantidade:** Máximo 3 botões
- **Título:** Até 20 caracteres por botão
- **ID:** Até 256 caracteres

## Observações Importantes

- Stickers devem ter fundo transparente para melhor qualidade
- Localizações podem incluir informações adicionais como nome e endereço
- Contatos são enviados como vCard
- Reações podem ser removidas enviando string vazia
- Enquetes permitem múltipla seleção configurando `selectableCount`
- Listas e botões são recursos interativos do WhatsApp Business
- Todos os endpoints suportam delay para controle de envio