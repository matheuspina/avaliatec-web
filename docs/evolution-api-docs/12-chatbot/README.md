# Chatbot - Integração com Chatbots

Esta categoria contém endpoints para integrar e gerenciar diferentes plataformas de chatbot, incluindo Chatwoot, Typebot, Evolution Bot e OpenAI.

## Subcategorias Disponíveis

### 1. Chatwoot
### 2. Typebot
### 3. Evolution Bot
### 4. OpenAI
### 5. Dify

---

## 1. Chatwoot

### Set Chatwoot
**Método:** `POST`  
**URL:** `{{baseUrl}}/chatwoot/set/{{instance}}`

Configura integração com Chatwoot.

**Corpo da Requisição:**
```json
{
  "enabled": true,
  "account_id": "1",
  "token": "seu-token-chatwoot",
  "url": "https://app.chatwoot.com",
  "sign_msg": true,
  "reopen_conversation": false,
  "conversation_pending": false
}
```

**Parâmetros:**
- `enabled` (boolean): Se a integração está ativa
- `account_id` (string): ID da conta no Chatwoot
- `token` (string): Token de acesso do Chatwoot
- `url` (string): URL da instância Chatwoot
- `sign_msg` (boolean): Assinar mensagens
- `reopen_conversation` (boolean): Reabrir conversas automaticamente
- `conversation_pending` (boolean): Marcar conversas como pendentes

### Find Chatwoot
**Método:** `GET`  
**URL:** `{{baseUrl}}/chatwoot/find/{{instance}}`

Busca a configuração atual do Chatwoot.

**Resposta Esperada:**
```json
{
  "enabled": true,
  "account_id": "1",
  "url": "https://app.chatwoot.com",
  "sign_msg": true,
  "reopen_conversation": false,
  "conversation_pending": false
}
```

---

## 2. Typebot

### Typebot Session Management

#### Change Session Status
**Método:** `POST`  
**URL:** `{{baseUrl}}/typebot/changeStatus/{{instance}}`

Altera o status de uma sessão do Typebot.

**Corpo da Requisição:**
```json
{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "status": "paused"
}
```

**Parâmetros:**
- `remoteJid` (string): JID do contato
- `status` (string): Novo status da sessão
  - `opened`: Sessão ativa
  - `paused`: Sessão pausada
  - `closed`: Sessão encerrada

#### Fetch Sessions
**Método:** `GET`  
**URL:** `{{baseUrl}}/typebot/fetchSessions/{{instance}}?remoteJid={{remoteJid}}`

Busca sessões ativas do Typebot.

**Parâmetros de Query:**
- `remoteJid` (string, opcional): JID específico para filtrar

### Typebot Default Settings

#### Set Default Settings
**Método:** `POST`  
**URL:** `{{baseUrl}}/typebot/settings/{{instance}}`

Define configurações padrão do Typebot.

**Corpo da Requisição:**
```json
{
  "expire": 20,
  "keywordFinish": "#SAIR",
  "delayMessage": 1000,
  "unknownMessage": "Mensagem não compreendida",
  "listeningFromMe": false
}
```

**Parâmetros:**
- `expire` (number): Tempo de expiração da sessão em minutos
- `keywordFinish` (string): Palavra-chave para encerrar sessão
- `delayMessage` (number): Delay entre mensagens em ms
- `unknownMessage` (string): Mensagem para comandos não reconhecidos
- `listeningFromMe` (boolean): Escutar mensagens próprias

#### Fetch Default Settings
**Método:** `GET`  
**URL:** `{{baseUrl}}/typebot/settings/{{instance}}`

Busca as configurações padrão do Typebot.

### Typebot Management

#### Create Typebot
**Método:** `POST`  
**URL:** `{{baseUrl}}/typebot/create/{{instance}}`

Cria um novo Typebot.

**Corpo da Requisição:**
```json
{
  "enabled": true,
  "url": "https://typebot.io/meu-bot",
  "typebot": "meu-bot-id",
  "expire": 20,
  "keywordFinish": "#SAIR",
  "delayMessage": 1000,
  "unknownMessage": "Não entendi, pode repetir?",
  "listeningFromMe": false,
  "stopBotFromMe": false,
  "keepOpen": false,
  "debounceTime": 0,
  "triggerType": "keyword",
  "triggerOperator": "contains",
  "triggerValue": "oi"
}
```

**Parâmetros:**
- `enabled` (boolean): Se o bot está ativo
- `url` (string): URL do Typebot
- `typebot` (string): ID do Typebot
- `expire` (number): Tempo de expiração em minutos
- `keywordFinish` (string): Palavra para encerrar
- `delayMessage` (number): Delay entre mensagens
- `unknownMessage` (string): Mensagem para comandos desconhecidos
- `listeningFromMe` (boolean): Escutar próprias mensagens
- `stopBotFromMe` (boolean): Parar bot com próprias mensagens
- `keepOpen` (boolean): Manter sessão aberta
- `debounceTime` (number): Tempo de debounce
- `triggerType` (string): Tipo de gatilho
- `triggerOperator` (string): Operador do gatilho
- `triggerValue` (string): Valor do gatilho

#### Find Typebots
**Método:** `GET`  
**URL:** `{{baseUrl}}/typebot/find/{{instance}}`

Lista todos os Typebots da instância.

#### Fetch Typebot
**Método:** `GET`  
**URL:** `{{baseUrl}}/typebot/fetch/{{instance}}?typebotId={{typebotId}}`

Busca um Typebot específico.

**Parâmetros de Query:**
- `typebotId` (string): ID do Typebot

#### Update Typebot
**Método:** `PUT`  
**URL:** `{{baseUrl}}/typebot/update/{{instance}}`

Atualiza um Typebot existente.

**Corpo da Requisição:**
```json
{
  "typebotId": "bot-id",
  "enabled": true,
  "url": "https://typebot.io/meu-bot-atualizado",
  "expire": 30
}
```

#### Delete Typebot
**Método:** `DELETE`  
**URL:** `{{baseUrl}}/typebot/delete/{{instance}}`

Remove um Typebot.

**Corpo da Requisição:**
```json
{
  "typebotId": "bot-id"
}
```

#### Start Typebot
**Método:** `POST`  
**URL:** `{{baseUrl}}/typebot/start/{{instance}}`

Inicia uma sessão do Typebot manualmente.

**Corpo da Requisição:**
```json
{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "typebotId": "meu-bot-id"
}
```

---

## 3. Evolution Bot

### Evolution Bot Session Management

#### Change Session Status
**Método:** `POST`  
**URL:** `{{baseUrl}}/evolutionbot/changeStatus/{{instance}}`

Altera o status de uma sessão do Evolution Bot.

**Corpo da Requisição:**
```json
{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "status": "paused"
}
```

#### Fetch Sessions
**Método:** `GET`  
**URL:** `{{baseUrl}}/evolutionbot/fetchSessions/{{instance}}?remoteJid={{remoteJid}}`

Busca sessões ativas do Evolution Bot.

### Evolution Bot Default Settings

#### Set Default Settings
**Método:** `POST`  
**URL:** `{{baseUrl}}/evolutionbot/settings/{{instance}}`

Define configurações padrão do Evolution Bot.

**Corpo da Requisição:**
```json
{
  "expire": 20,
  "keywordFinish": "#SAIR",
  "delayMessage": 1000,
  "unknownMessage": "Comando não reconhecido",
  "listeningFromMe": false
}
```

#### Fetch Default Settings
**Método:** `GET`  
**URL:** `{{baseUrl}}/evolutionbot/settings/{{instance}}`

Busca as configurações padrão do Evolution Bot.

### Evolution Bot Management

#### Create Bots
**Método:** `POST`  
**URL:** `{{baseUrl}}/evolutionbot/create/{{instance}}`

Cria um novo Evolution Bot.

#### Find Bots
**Método:** `GET`  
**URL:** `{{baseUrl}}/evolutionbot/find/{{instance}}`

Lista todos os Evolution Bots.

#### Fetch Bot
**Método:** `GET`  
**URL:** `{{baseUrl}}/evolutionbot/fetch/{{instance}}?evolutionBotId={{evolutionBotId}}`

Busca um Evolution Bot específico.

#### Update Bot
**Método:** `PUT`  
**URL:** `{{baseUrl}}/evolutionbot/update/{{instance}}`

Atualiza um Evolution Bot.

#### Delete Bot
**Método:** `DELETE`  
**URL:** `{{baseUrl}}/evolutionbot/delete/{{instance}}`

Remove um Evolution Bot.

---

## 4. OpenAI

### OpenAI Session Management

#### Change Session Status
**Método:** `POST`  
**URL:** `{{baseUrl}}/openai/changeStatus/{{instance}}`

Altera o status de uma sessão do OpenAI.

#### Fetch Sessions
**Método:** `GET`  
**URL:** `{{baseUrl}}/openai/fetchSessions/{{instance}}?remoteJid={{remoteJid}}`

Busca sessões ativas do OpenAI.

### OpenAI Default Settings

#### Set Default Settings
**Método:** `POST`  
**URL:** `{{baseUrl}}/openai/settings/{{instance}}`

Define configurações padrão do OpenAI.

**Corpo da Requisição:**
```json
{
  "expire": 20,
  "keywordFinish": "#SAIR",
  "delayMessage": 1000,
  "unknownMessage": "Não consegui processar sua solicitação",
  "listeningFromMe": false,
  "stopBotFromMe": false,
  "keepOpen": false,
  "debounceTime": 0,
  "openaiCredsId": "creds-id"
}
```

#### Fetch Default Settings
**Método:** `GET`  
**URL:** `{{baseUrl}}/openai/settings/{{instance}}`

Busca as configurações padrão do OpenAI.

### OpenAI Credentials Management

#### Set OpenAI Creds
**Método:** `POST`  
**URL:** `{{baseUrl}}/openai/creds/{{instance}}`

Define credenciais do OpenAI.

**Corpo da Requisição:**
```json
{
  "name": "Minhas Credenciais OpenAI",
  "apiKey": "sk-...",
  "organization": "org-...",
  "model": "gpt-3.5-turbo",
  "systemMessages": [
    {
      "role": "system",
      "content": "Você é um assistente útil e amigável."
    }
  ],
  "assistantMessages": [
    {
      "role": "assistant",
      "content": "Olá! Como posso ajudá-lo hoje?"
    }
  ],
  "userMessages": [
    {
      "role": "user",
      "content": "Exemplo de mensagem do usuário"
    }
  ],
  "maxTokens": 1000,
  "temperature": 0.7,
  "topP": 1,
  "n": 1,
  "stop": null,
  "presencePenalty": 0,
  "frequencyPenalty": 0
}
```

#### Get OpenAI Creds
**Método:** `GET`  
**URL:** `{{baseUrl}}/openai/creds/{{instance}}?openaiCredsId={{openaiCredsId}}`

Busca credenciais do OpenAI.

#### Delete OpenAI Creds
**Método:** `DELETE`  
**URL:** `{{baseUrl}}/openai/creds/{{instance}}`

Remove credenciais do OpenAI.

### OpenAI Bot Management

#### Create OpenAI Bots
**Método:** `POST`  
**URL:** `{{baseUrl}}/openai/create/{{instance}}`

Cria um novo bot OpenAI.

#### Find OpenAI Bots
**Método:** `GET`  
**URL:** `{{baseUrl}}/openai/find/{{instance}}`

Lista todos os bots OpenAI.

#### Fetch OpenAI Bot
**Método:** `GET`  
**URL:** `{{baseUrl}}/openai/fetch/{{instance}}?openaiId={{openaiId}}`

Busca um bot OpenAI específico.

#### Update OpenAI Bot
**Método:** `PUT`  
**URL:** `{{baseUrl}}/openai/update/{{instance}}`

Atualiza um bot OpenAI.

#### Delete OpenAI Bot
**Método:** `DELETE`  
**URL:** `{{baseUrl}}/openai/delete/{{instance}}`

Remove um bot OpenAI.

---

## 5. Dify

### Dify Session Management

#### Change Session Status
**Método:** `POST`  
**URL:** `{{baseUrl}}/dify/changeStatus/{{instance}}`

Altera o status de uma sessão do Dify.

**Corpo da Requisição:**
```json
{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "status": "paused"
}
```

---

## Tipos de Gatilhos (Triggers)

### Trigger Types
- `keyword`: Palavra-chave específica
- `all`: Todas as mensagens
- `none`: Nenhum gatilho automático

### Trigger Operators
- `equals`: Igual exato
- `contains`: Contém a palavra
- `startsWith`: Começa com
- `endsWith`: Termina com
- `regex`: Expressão regular

## Status de Sessão

### Status Disponíveis
- `opened`: Sessão ativa e respondendo
- `paused`: Sessão pausada temporariamente
- `closed`: Sessão encerrada

### Transições de Status
- `opened` → `paused`: Pausar temporariamente
- `paused` → `opened`: Reativar sessão
- `opened/paused` → `closed`: Encerrar definitivamente

## Exemplos de Uso

### Configurar Chatwoot
```bash
curl -X POST "{{baseUrl}}/chatwoot/set/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "account_id": "1",
    "token": "seu-token-chatwoot",
    "url": "https://app.chatwoot.com",
    "sign_msg": true
  }'
```

### Criar Typebot
```bash
curl -X POST "{{baseUrl}}/typebot/create/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "url": "https://typebot.io/meu-bot",
    "typebot": "meu-bot-id",
    "triggerType": "keyword",
    "triggerOperator": "contains",
    "triggerValue": "oi"
  }'
```

### Configurar OpenAI
```bash
curl -X POST "{{baseUrl}}/openai/creds/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bot Atendimento",
    "apiKey": "sk-...",
    "model": "gpt-3.5-turbo",
    "systemMessages": [
      {
        "role": "system",
        "content": "Você é um assistente de atendimento ao cliente."
      }
    ]
  }'
```

### Pausar sessão
```bash
curl -X POST "{{baseUrl}}/typebot/changeStatus/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "remoteJid": "5511999999999@s.whatsapp.net",
    "status": "paused"
  }'
```

## Casos de Uso

### Chatwoot
- **Atendimento:** Centralizar conversas em uma plataforma
- **Equipe:** Distribuir atendimento entre agentes
- **Histórico:** Manter registro completo das conversas
- **Métricas:** Acompanhar performance do atendimento

### Typebot
- **Fluxos visuais:** Criar conversas com interface drag-and-drop
- **Qualificação:** Coletar informações dos leads
- **Automação:** Responder perguntas frequentes
- **Integração:** Conectar com outros sistemas

### Evolution Bot
- **Bot nativo:** Usar recursos específicos da Evolution API
- **Personalização:** Criar fluxos customizados
- **Performance:** Otimizado para a plataforma
- **Flexibilidade:** Máximo controle sobre o comportamento

### OpenAI
- **IA conversacional:** Respostas inteligentes e contextuais
- **Processamento de linguagem:** Entender intenções complexas
- **Personalização:** Adaptar personalidade do bot
- **Multilíngue:** Suporte a múltiplos idiomas

### Dify
- **Plataforma LLM:** Gerenciar modelos de linguagem
- **Workflows:** Criar fluxos complexos com IA
- **Integração:** Conectar múltiplos modelos
- **Monitoramento:** Acompanhar uso e performance

## Configurações Avançadas

### Debounce Time
Tempo de espera antes de processar mensagem (evita spam):
```json
{
  "debounceTime": 2000
}
```

### Keep Open
Manter sessão sempre aberta (não expira):
```json
{
  "keepOpen": true
}
```

### Listening From Me
Bot responde às próprias mensagens:
```json
{
  "listeningFromMe": true
}
```

### Stop Bot From Me
Parar bot com mensagens próprias:
```json
{
  "stopBotFromMe": true
}
```

## Boas Práticas

### Configuração
- Defina gatilhos específicos para evitar ativação acidental
- Configure tempo de expiração adequado
- Use mensagens de erro claras e úteis
- Teste fluxos antes de ativar

### Performance
- Configure debounce para evitar spam
- Use delays apropriados entre mensagens
- Monitore uso de tokens (OpenAI)
- Otimize fluxos para reduzir latência

### Experiência do Usuário
- Forneça opções de saída claras
- Use linguagem natural e amigável
- Implemente fallbacks para erros
- Mantenha conversas contextuais

### Monitoramento
- Acompanhe métricas de engajamento
- Monitore erros e falhas
- Analise feedback dos usuários
- Ajuste configurações baseado em dados

## Limitações

### Chatwoot
- Requer instância Chatwoot configurada
- Limitado pelas funcionalidades da plataforma
- Pode ter latência adicional

### Typebot
- Dependente da disponibilidade do serviço
- Limitações de fluxo da plataforma
- Requer configuração externa

### OpenAI
- Consome tokens por interação
- Sujeito a limites de rate
- Custos variáveis por uso
- Dependente da API externa

### Evolution Bot
- Funcionalidades específicas da plataforma
- Requer conhecimento técnico
- Menos recursos visuais

### Geral
- Apenas uma sessão ativa por contato
- Conflitos entre diferentes bots
- Dependência de conectividade
- Necessidade de monitoramento constante