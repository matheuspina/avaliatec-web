# Label - Gerenciamento de Etiquetas

Esta categoria contém endpoints para gerenciar etiquetas (labels) de conversas no WhatsApp Business.

## Endpoints Disponíveis

### 1. Find Labels
**Método:** `GET`  
**URL:** `{{baseUrl}}/chat/findLabels/{{instance}}`

Busca todas as etiquetas disponíveis na instância.

**Resposta Esperada:**
```json
[
  {
    "id": "1",
    "name": "Importante",
    "color": 1,
    "predefinedId": null
  },
  {
    "id": "2",
    "name": "Trabalho",
    "color": 2,
    "predefinedId": null
  },
  {
    "id": "3",
    "name": "Pessoal",
    "color": 3,
    "predefinedId": null
  }
]
```

**Campos da Resposta:**
- `id` (string): ID único da etiqueta
- `name` (string): Nome da etiqueta
- `color` (number): Código da cor (1-20)
- `predefinedId` (string|null): ID predefinido do WhatsApp (se aplicável)

### 2. Handle Labels
**Método:** `PUT`  
**URL:** `{{baseUrl}}/chat/handleLabel/{{instance}}`

Adiciona ou remove etiquetas de uma conversa.

**Corpo da Requisição:**
```json
{
  "number": "5511999999999",
  "action": "add",
  "labelId": "1"
}
```

**Parâmetros:**
- `number` (string): Número do contato ou JID da conversa
- `action` (string): Ação a ser executada ("add" ou "remove")
- `labelId` (string): ID da etiqueta

## Cores Disponíveis

As etiquetas suportam 20 cores diferentes, identificadas por números:

| Código | Cor |
|--------|-----|
| 1 | Vermelho |
| 2 | Laranja |
| 3 | Amarelo |
| 4 | Verde Claro |
| 5 | Verde |
| 6 | Verde Escuro |
| 7 | Ciano |
| 8 | Azul Claro |
| 9 | Azul |
| 10 | Azul Escuro |
| 11 | Roxo |
| 12 | Rosa |
| 13 | Rosa Escuro |
| 14 | Marrom |
| 15 | Cinza |
| 16 | Cinza Escuro |
| 17 | Preto |
| 18 | Branco |
| 19 | Dourado |
| 20 | Prata |

## Exemplos de Uso

### Buscar todas as etiquetas
```bash
curl -X GET "{{baseUrl}}/chat/findLabels/minha-instancia"
```

### Adicionar etiqueta a uma conversa
```bash
curl -X PUT "{{baseUrl}}/chat/handleLabel/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "action": "add",
    "labelId": "1"
  }'
```

### Remover etiqueta de uma conversa
```bash
curl -X PUT "{{baseUrl}}/chat/handleLabel/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "action": "remove",
    "labelId": "1"
  }'
```

### Adicionar etiqueta usando JID
```bash
curl -X PUT "{{baseUrl}}/chat/handleLabel/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999@s.whatsapp.net",
    "action": "add",
    "labelId": "2"
  }'
```

## Códigos de Resposta

### Sucesso (200)
```json
{
  "status": "success",
  "message": "Label added successfully",
  "data": {
    "chatId": "5511999999999@s.whatsapp.net",
    "labelId": "1",
    "action": "add"
  }
}
```

### Erro (400)
```json
{
  "error": "Label not found",
  "message": "A etiqueta especificada não existe"
}
```

### Erro (404)
```json
{
  "error": "Chat not found",
  "message": "A conversa especificada não foi encontrada"
}
```

## Casos de Uso

### Organização de Conversas
- **Categorização:** Separar conversas por tipo (trabalho, pessoal, vendas)
- **Priorização:** Marcar conversas importantes ou urgentes
- **Status:** Indicar status de atendimento (pendente, resolvido, em andamento)
- **Segmentação:** Agrupar clientes por categoria ou região

### Automação
- **Fluxos:** Aplicar etiquetas automaticamente baseado em palavras-chave
- **Integração:** Sincronizar com sistemas CRM usando etiquetas
- **Relatórios:** Gerar estatísticas baseadas em etiquetas
- **Filtros:** Criar filtros personalizados para diferentes equipes

## Limitações e Considerações

### Etiquetas Predefinidas
- O WhatsApp Business possui algumas etiquetas predefinidas
- Etiquetas predefinidas não podem ser deletadas
- Cores das etiquetas predefinidas são fixas

### Limites
- **Máximo por conversa:** Até 20 etiquetas por conversa
- **Total de etiquetas:** Até 1000 etiquetas por conta Business
- **Nome:** Máximo 25 caracteres por nome de etiqueta
- **Duplicação:** Nomes de etiquetas devem ser únicos

### Sincronização
- Etiquetas são sincronizadas entre dispositivos
- Mudanças podem levar alguns segundos para aparecer
- Etiquetas são específicas da conta Business

## Boas Práticas

### Nomenclatura
- Use nomes descritivos e consistentes
- Evite abreviações confusas
- Mantenha padrão de nomenclatura na equipe
- Use prefixos para categorizar (ex: "VEN_", "SUP_")

### Cores
- Defina um padrão de cores para sua organização
- Use cores consistentes para categorias similares
- Documente o significado de cada cor
- Evite cores muito similares

### Organização
- Crie etiquetas antes de precisar usá-las
- Revise periodicamente etiquetas não utilizadas
- Treine a equipe sobre o uso correto
- Integre com processos de atendimento

### Automação
- Configure regras automáticas quando possível
- Monitore a aplicação automática de etiquetas
- Mantenha logs de mudanças para auditoria
- Teste automações em ambiente controlado

## Integração com Outros Sistemas

### CRM
```javascript
// Exemplo de integração com CRM
const labelMapping = {
  "1": "cliente_vip",
  "2": "lead_quente",
  "3": "suporte_tecnico"
};

// Sincronizar etiqueta com CRM
function syncLabelToCRM(chatId, labelId) {
  const crmCategory = labelMapping[labelId];
  // Atualizar categoria no CRM
}
```

### Relatórios
```javascript
// Exemplo de relatório por etiquetas
function generateLabelReport() {
  const labels = await findLabels();
  const report = {};
  
  for (const label of labels) {
    report[label.name] = {
      conversations: 0,
      lastActivity: null
    };
  }
  
  return report;
}
```

## Observações Importantes

- Etiquetas são um recurso do WhatsApp Business
- Requer conta Business ativa para funcionar
- Etiquetas não são visíveis para os contatos
- Mudanças são refletidas em tempo real
- Suporte a múltiplas etiquetas por conversa
- Etiquetas persistem mesmo após arquivar conversas