# Call - Gerenciamento de Chamadas

Esta categoria contém endpoints para gerenciar chamadas no WhatsApp.

## Endpoints Disponíveis

### 1. Fake Call
**Método:** `POST`  
**URL:** `{{baseUrl}}/call/fakeCall/{{instance}}`

Simula uma chamada falsa para um contato.

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "isVideo": false,
  "delay": 1200
}
```

**Parâmetros:**
- `number` (string): Número do destinatário (formato: 5511999999999)
- `isVideo` (boolean): Se é uma chamada de vídeo (true) ou voz (false)
- `delay` (number, opcional): Delay em milissegundos antes de executar

### 2. Check is WhatsApp Number
**Método:** `POST`  
**URL:** `{{baseUrl}}/call/checkNumber/{{instance}}`

Verifica se um número possui WhatsApp ativo.

**Corpo da Requisição:**
```json
{
  "numbers": [
    "5511999999999",
    "5511888888888",
    "5511777777777"
  ]
}
```

**Parâmetros:**
- `numbers` (array): Lista de números para verificar

**Resposta Esperada:**
```json
[
  {
    "number": "5511999999999",
    "exists": true,
    "jid": "5511999999999@s.whatsapp.net"
  },
  {
    "number": "5511888888888",
    "exists": false,
    "jid": null
  }
]
```

## Tipos de Chamada

### Chamada de Voz
- **isVideo:** false
- **Duração:** Configurável
- **Qualidade:** Padrão do WhatsApp

### Chamada de Vídeo
- **isVideo:** true
- **Duração:** Configurável
- **Qualidade:** Padrão do WhatsApp

## Exemplos de Uso

### Simular chamada de voz
```bash
curl -X POST "{{baseUrl}}/call/fakeCall/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "isVideo": false
  }'
```

### Simular chamada de vídeo
```bash
curl -X POST "{{baseUrl}}/call/fakeCall/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "isVideo": true,
    "delay": 2000
  }'
```

### Verificar múltiplos números
```bash
curl -X POST "{{baseUrl}}/call/checkNumber/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "numbers": [
      "5511999999999",
      "5511888888888",
      "5511777777777"
    ]
  }'
```

### Verificar um único número
```bash
curl -X POST "{{baseUrl}}/call/checkNumber/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "numbers": ["5511999999999"]
  }'
```

## Códigos de Resposta

### Fake Call - Sucesso (200)
```json
{
  "status": "success",
  "message": "Fake call initiated",
  "data": {
    "number": "5511999999999",
    "isVideo": false,
    "timestamp": 1640995200
  }
}
```

### Check Number - Sucesso (200)
```json
[
  {
    "number": "5511999999999",
    "exists": true,
    "jid": "5511999999999@s.whatsapp.net",
    "businessAccount": false,
    "verified": true
  }
]
```

### Erro (400)
```json
{
  "error": "Invalid number format",
  "message": "O número deve estar no formato internacional sem símbolos"
}
```

## Casos de Uso

### Fake Call
1. **Testes de Conectividade:** Verificar se a instância consegue iniciar chamadas
2. **Simulação:** Testar comportamento de aplicações que dependem de chamadas
3. **Desenvolvimento:** Simular cenários de chamada sem realmente chamar
4. **Automação:** Integrar em fluxos automatizados de teste

### Check Number
1. **Validação:** Verificar se números são válidos antes de enviar mensagens
2. **Limpeza de Base:** Remover números inválidos de listas de contatos
3. **Segmentação:** Separar contatos com e sem WhatsApp
4. **Otimização:** Evitar tentativas de envio para números inexistentes

## Limitações e Considerações

### Fake Call
- **Não é uma chamada real:** Apenas simula o processo
- **Sem áudio/vídeo:** Não há transmissão real de mídia
- **Detecção:** Pode ser detectado como chamada falsa pelo WhatsApp
- **Rate Limit:** Sujeito a limitações de taxa do WhatsApp

### Check Number
- **Cache:** Resultados podem ser armazenados em cache temporariamente
- **Precisão:** Baseado na disponibilidade da API do WhatsApp
- **Privacidade:** Respeita configurações de privacidade dos usuários
- **Limite:** Máximo de 100 números por requisição

## Boas Práticas

### Para Fake Call
- Use com moderação para evitar bloqueios
- Implemente delays adequados entre chamadas
- Monitore logs para detectar problemas
- Use apenas para testes e desenvolvimento

### Para Check Number
- Processe números em lotes para eficiência
- Implemente cache local para evitar consultas repetidas
- Valide formato dos números antes de consultar
- Trate adequadamente números inexistentes

## Formatos de Número

### Formato Aceito
- **Internacional:** 5511999999999
- **Sem símbolos:** Apenas dígitos
- **Com código do país:** Obrigatório

### Exemplos Válidos
- Brasil: 5511999999999
- Estados Unidos: 15551234567
- Reino Unido: 447700900123

### Exemplos Inválidos
- +55 11 99999-9999 (com símbolos)
- 11999999999 (sem código do país)
- 055 11 99999-9999 (formato nacional)