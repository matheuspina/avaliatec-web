# Group - Gerenciamento de Grupos

Esta categoria contém endpoints para gerenciar grupos do WhatsApp, incluindo criação, configuração, participantes e administração.

## Endpoints Disponíveis

### 1. Create Group
**Método:** `POST`  
**URL:** `{{baseUrl}}/group/create/{{instance}}`

Cria um novo grupo.

**Corpo da Requisição:**
```json
{
  "subject": "Nome do Grupo",
  "description": "Descrição do grupo",
  "participants": [
    "5511999999999@s.whatsapp.net",
    "5511888888888@s.whatsapp.net"
  ]
}
```

**Parâmetros:**
- `subject` (string): Nome do grupo (máximo 25 caracteres)
- `description` (string, opcional): Descrição do grupo (máximo 512 caracteres)
- `participants` (array): Lista de JIDs dos participantes

### 2. Update Group Picture
**Método:** `PUT`  
**URL:** `{{baseUrl}}/group/updateGroupPicture/{{instance}}`

Atualiza a foto do grupo.

**Corpo da Requisição:**
```json
{
  "groupJid": "120363123456789012@g.us",
  "image": "https://example.com/group-photo.jpg"
}
```

**Parâmetros:**
- `groupJid` (string): JID do grupo
- `image` (string): URL da imagem ou base64

### 3. Update Group Subject
**Método:** `PUT`  
**URL:** `{{baseUrl}}/group/updateGroupSubject/{{instance}}`

Atualiza o nome/assunto do grupo.

**Corpo da Requisição:**
```json
{
  "groupJid": "120363123456789012@g.us",
  "subject": "Novo Nome do Grupo"
}
```

**Parâmetros:**
- `groupJid` (string): JID do grupo
- `subject` (string): Novo nome do grupo (máximo 25 caracteres)

### 4. Update Group Description
**Método:** `PUT`  
**URL:** `{{baseUrl}}/group/updateGroupDescription/{{instance}}`

Atualiza a descrição do grupo.

**Corpo da Requisição:**
```json
{
  "groupJid": "120363123456789012@g.us",
  "description": "Nova descrição do grupo"
}
```

**Parâmetros:**
- `groupJid` (string): JID do grupo
- `description` (string): Nova descrição (máximo 512 caracteres)

### 5. Fetch Invite Code
**Método:** `GET`  
**URL:** `{{baseUrl}}/group/inviteCode/{{instance}}?groupJid={{groupJid}}`

Busca o código de convite do grupo.

**Parâmetros de Query:**
- `groupJid` (string): JID do grupo

**Resposta Esperada:**
```json
{
  "inviteCode": "ABC123DEF456GHI789"
}
```

### 6. Revoke Invite Code
**Método:** `PUT`  
**URL:** `{{baseUrl}}/group/revokeInviteCode/{{instance}}`

Revoga o código de convite atual e gera um novo.

**Corpo da Requisição:**
```json
{
  "groupJid": "120363123456789012@g.us"
}
```

**Parâmetros:**
- `groupJid` (string): JID do grupo

### 7. Send Invite Url
**Método:** `POST`  
**URL:** `{{baseUrl}}/group/sendInvite/{{instance}}`

Envia o link de convite do grupo para contatos específicos.

**Corpo da Requisição:**
```json
{
  "groupJid": "120363123456789012@g.us",
  "description": "Venha participar do nosso grupo!",
  "numbers": [
    "5511999999999",
    "5511888888888"
  ]
}
```

**Parâmetros:**
- `groupJid` (string): JID do grupo
- `description` (string): Mensagem de convite
- `numbers` (array): Lista de números para enviar o convite

### 8. Find Group by Invite Code
**Método:** `GET`  
**URL:** `{{baseUrl}}/group/inviteInfo/{{instance}}?inviteCode={{inviteCode}}`

Busca informações do grupo pelo código de convite.

**Parâmetros de Query:**
- `inviteCode` (string): Código de convite do grupo

**Resposta Esperada:**
```json
{
  "id": "120363123456789012@g.us",
  "subject": "Nome do Grupo",
  "subjectOwner": "5511999999999@s.whatsapp.net",
  "subjectTime": 1640995200,
  "creation": 1640995200,
  "owner": "5511999999999@s.whatsapp.net",
  "desc": "Descrição do grupo",
  "descOwner": "5511999999999@s.whatsapp.net",
  "descTime": 1640995200,
  "participants": [
    {
      "id": "5511999999999@s.whatsapp.net",
      "admin": "admin"
    }
  ],
  "size": 1,
  "announce": false,
  "restrict": false
}
```

### 9. Find Group by Jid
**Método:** `GET`  
**URL:** `{{baseUrl}}/group/findGroupByJid/{{instance}}?groupJid={{groupJid}}`

Busca informações do grupo pelo JID.

**Parâmetros de Query:**
- `groupJid` (string): JID do grupo

### 10. Fetch All Groups
**Método:** `GET`  
**URL:** `{{baseUrl}}/group/fetchAllGroups/{{instance}}?getParticipants={{getParticipants}}`

Busca todos os grupos da instância.

**Parâmetros de Query:**
- `getParticipants` (boolean, opcional): Se deve incluir lista de participantes

**Resposta Esperada:**
```json
[
  {
    "id": "120363123456789012@g.us",
    "subject": "Grupo 1",
    "subjectOwner": "5511999999999@s.whatsapp.net",
    "subjectTime": 1640995200,
    "creation": 1640995200,
    "owner": "5511999999999@s.whatsapp.net",
    "desc": "Descrição do grupo",
    "participants": [
      {
        "id": "5511999999999@s.whatsapp.net",
        "admin": "admin"
      }
    ],
    "size": 5,
    "announce": false,
    "restrict": false
  }
]
```

### 11. Find Participants
**Método:** `GET`  
**URL:** `{{baseUrl}}/group/participants/{{instance}}?groupJid={{groupJid}}`

Busca os participantes de um grupo específico.

**Parâmetros de Query:**
- `groupJid` (string): JID do grupo

**Resposta Esperada:**
```json
{
  "participants": [
    {
      "id": "5511999999999@s.whatsapp.net",
      "admin": "admin"
    },
    {
      "id": "5511888888888@s.whatsapp.net",
      "admin": null
    }
  ]
}
```

### 12. Update Participant
**Método:** `PUT`  
**URL:** `{{baseUrl}}/group/updateParticipant/{{instance}}`

Atualiza o status de um participante (adicionar, remover, promover, rebaixar).

**Corpo da Requisição:**
```json
{
  "groupJid": "120363123456789012@g.us",
  "action": "add",
  "participants": [
    "5511999999999@s.whatsapp.net",
    "5511888888888@s.whatsapp.net"
  ]
}
```

**Parâmetros:**
- `groupJid` (string): JID do grupo
- `action` (string): Ação a ser executada
  - `add`: Adicionar participantes
  - `remove`: Remover participantes
  - `promote`: Promover a administrador
  - `demote`: Rebaixar de administrador
- `participants` (array): Lista de JIDs dos participantes

### 13. Update Setting
**Método:** `PUT`  
**URL:** `{{baseUrl}}/group/updateSetting/{{instance}}`

Atualiza as configurações do grupo.

**Corpo da Requisição:**
```json
{
  "groupJid": "120363123456789012@g.us",
  "action": "announcement",
  "value": true
}
```

**Parâmetros:**
- `groupJid` (string): JID do grupo
- `action` (string): Configuração a ser alterada
  - `announcement`: Apenas admins podem enviar mensagens
  - `not_announcement`: Todos podem enviar mensagens
  - `locked`: Apenas admins podem editar info do grupo
  - `unlocked`: Todos podem editar info do grupo
- `value` (boolean): Valor da configuração

### 14. Toggle Ephemeral
**Método:** `PUT`  
**URL:** `{{baseUrl}}/group/toggleEphemeral/{{instance}}`

Ativa/desativa mensagens temporárias no grupo.

**Corpo da Requisição:**
```json
{
  "groupJid": "120363123456789012@g.us",
  "expiration": 86400
}
```

**Parâmetros:**
- `groupJid` (string): JID do grupo
- `expiration` (number): Tempo de expiração em segundos
  - `0`: Desativar mensagens temporárias
  - `86400`: 1 dia
  - `604800`: 7 dias
  - `7776000`: 90 dias

### 15. Leave Group
**Método:** `DELETE`  
**URL:** `{{baseUrl}}/group/leaveGroup/{{instance}}`

Sai do grupo.

**Corpo da Requisição:**
```json
{
  "groupJid": "120363123456789012@g.us"
}
```

**Parâmetros:**
- `groupJid` (string): JID do grupo

## Tipos de Administração

### Níveis de Permissão
- **Owner (Criador):** Controle total do grupo
- **Admin (Administrador):** Pode gerenciar participantes e configurações
- **Member (Membro):** Participante comum

### Ações por Nível

#### Owner
- Todas as ações de Admin
- Transferir propriedade do grupo
- Deletar o grupo
- Promover/rebaixar administradores

#### Admin
- Adicionar/remover participantes
- Alterar nome e descrição do grupo
- Alterar foto do grupo
- Gerenciar códigos de convite
- Configurar permissões do grupo
- Ativar/desativar mensagens temporárias

#### Member
- Enviar mensagens (se permitido)
- Visualizar informações do grupo
- Sair do grupo

## Configurações de Grupo

### Announcement (Anúncio)
- **true:** Apenas administradores podem enviar mensagens
- **false:** Todos os participantes podem enviar mensagens

### Restrict (Restrito)
- **true:** Apenas administradores podem editar informações do grupo
- **false:** Todos os participantes podem editar informações

### Ephemeral (Temporário)
- **0:** Mensagens permanentes
- **86400:** Mensagens desaparecem em 1 dia
- **604800:** Mensagens desaparecem em 7 dias
- **7776000:** Mensagens desaparecem em 90 dias

## Exemplos de Uso

### Criar grupo
```bash
curl -X POST "{{baseUrl}}/group/create/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Equipe de Desenvolvimento",
    "description": "Grupo para discussões da equipe",
    "participants": [
      "5511999999999@s.whatsapp.net",
      "5511888888888@s.whatsapp.net"
    ]
  }'
```

### Atualizar foto do grupo
```bash
curl -X PUT "{{baseUrl}}/group/updateGroupPicture/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "groupJid": "120363123456789012@g.us",
    "image": "https://example.com/logo-equipe.jpg"
  }'
```

### Adicionar participantes
```bash
curl -X PUT "{{baseUrl}}/group/updateParticipant/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "groupJid": "120363123456789012@g.us",
    "action": "add",
    "participants": [
      "5511777777777@s.whatsapp.net"
    ]
  }'
```

### Promover a administrador
```bash
curl -X PUT "{{baseUrl}}/group/updateParticipant/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "groupJid": "120363123456789012@g.us",
    "action": "promote",
    "participants": [
      "5511999999999@s.whatsapp.net"
    ]
  }'
```

### Configurar grupo como anúncio
```bash
curl -X PUT "{{baseUrl}}/group/updateSetting/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "groupJid": "120363123456789012@g.us",
    "action": "announcement",
    "value": true
  }'
```

### Ativar mensagens temporárias (7 dias)
```bash
curl -X PUT "{{baseUrl}}/group/toggleEphemeral/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "groupJid": "120363123456789012@g.us",
    "expiration": 604800
  }'
```

### Buscar todos os grupos
```bash
curl -X GET "{{baseUrl}}/group/fetchAllGroups/minha-instancia?getParticipants=true"
```

### Obter código de convite
```bash
curl -X GET "{{baseUrl}}/group/inviteCode/minha-instancia?groupJid=120363123456789012@g.us"
```

## Formatos Suportados

### Foto do Grupo
- **Formatos:** JPG, PNG, WebP
- **Tamanho:** Máximo 5MB
- **Resolução:** Recomendado 640x640 pixels
- **Formato:** Quadrado (será cortado automaticamente)

### Nome do Grupo
- **Caracteres:** Máximo 25 caracteres
- **Emojis:** Suportados
- **Caracteres especiais:** Permitidos

### Descrição do Grupo
- **Caracteres:** Máximo 512 caracteres
- **Emojis:** Suportados
- **Quebras de linha:** Suportadas

## Códigos de Resposta

### Sucesso (200)
```json
{
  "status": "success",
  "message": "Group created successfully",
  "groupJid": "120363123456789012@g.us"
}
```

### Erro (400)
```json
{
  "error": "Invalid input",
  "message": "Nome do grupo excede o limite de caracteres"
}
```

### Erro (403)
```json
{
  "error": "Permission denied",
  "message": "Apenas administradores podem executar esta ação"
}
```

### Erro (404)
```json
{
  "error": "Group not found",
  "message": "Grupo não encontrado"
}
```

## Casos de Uso

### Corporativo
- **Equipes:** Criar grupos por departamento ou projeto
- **Comunicação:** Centralizar comunicação da empresa
- **Anúncios:** Usar modo anúncio para comunicados oficiais
- **Hierarquia:** Gerenciar permissões por cargo

### Educacional
- **Turmas:** Criar grupos por classe ou matéria
- **Professores:** Grupo exclusivo para coordenação
- **Pais:** Comunicação escola-família
- **Eventos:** Organizar atividades escolares

### Comunidades
- **Bairro:** Grupos de vizinhança
- **Hobbies:** Comunidades de interesse
- **Eventos:** Organização de encontros
- **Suporte:** Grupos de ajuda mútua

### Automação
- **Bots:** Integrar bots para automação
- **Notificações:** Enviar alertas automáticos
- **Moderação:** Automatizar regras do grupo
- **Analytics:** Monitorar atividade do grupo

## Boas Práticas

### Criação de Grupos
- Use nomes descritivos e claros
- Defina descrição informativa
- Adicione foto representativa
- Configure permissões adequadas

### Gerenciamento
- Mantenha lista de participantes atualizada
- Remova membros inativos periodicamente
- Use mensagens temporárias quando apropriado
- Monitore atividade do grupo

### Moderação
- Defina regras claras
- Use modo anúncio quando necessário
- Promova administradores confiáveis
- Mantenha backup dos códigos de convite

### Segurança
- Controle quem pode adicionar membros
- Revogue códigos de convite comprometidos
- Monitore participantes suspeitos
- Use configurações restritivas quando necessário

## Limitações

- Máximo de 1024 participantes por grupo
- Apenas administradores podem executar certas ações
- Códigos de convite podem ser revogados
- Algumas configurações são irreversíveis
- Mensagens temporárias não afetam mensagens já enviadas