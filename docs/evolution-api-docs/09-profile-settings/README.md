# Profile Settings - Configurações de Perfil

Esta categoria contém endpoints para gerenciar as configurações de perfil da instância WhatsApp.

## Endpoints Disponíveis

### 1. Fetch Business Profile
**Método:** `GET`  
**URL:** `{{baseUrl}}/chat/fetchBusinessProfile/{{instance}}?number={{number}}`

Busca o perfil comercial de um contato.

**Parâmetros de Query:**
- `number` (string): Número do contato

**Resposta Esperada:**
```json
{
  "wid": "5511999999999@s.whatsapp.net",
  "description": "Descrição do negócio",
  "category": "Varejo",
  "email": "contato@empresa.com",
  "website": ["https://www.empresa.com"],
  "address": "Rua das Flores, 123",
  "businessHours": {
    "timezone": "America/Sao_Paulo",
    "config": [
      {
        "day": "MONDAY",
        "mode": "OPEN",
        "openTime": 540,
        "closeTime": 1080
      }
    ]
  }
}
```

### 2. Fetch Profile
**Método:** `GET`  
**URL:** `{{baseUrl}}/chat/fetchProfile/{{instance}}?number={{number}}`

Busca o perfil básico de um contato.

**Parâmetros de Query:**
- `number` (string): Número do contato

**Resposta Esperada:**
```json
{
  "wid": "5511999999999@s.whatsapp.net",
  "name": "João Silva",
  "status": "Disponível para conversar",
  "isBusiness": false,
  "pictureUrl": "https://pps.whatsapp.net/v/..."
}
```

### 3. Update Profile Name
**Método:** `PUT`  
**URL:** `{{baseUrl}}/chat/updateProfileName/{{instance}}`

Atualiza o nome do perfil da instância.

**Corpo da Requisição:**
```json
{
  "name": "Novo Nome do Perfil"
}
```

**Parâmetros:**
- `name` (string): Novo nome do perfil (máximo 25 caracteres)

### 4. Update Profile Status
**Método:** `PUT`  
**URL:** `{{baseUrl}}/chat/updateProfileStatus/{{instance}}`

Atualiza o status/recado do perfil da instância.

**Corpo da Requisição:**
```json
{
  "status": "Novo status do perfil"
}
```

**Parâmetros:**
- `status` (string): Novo status do perfil (máximo 139 caracteres)

### 5. Update Profile Picture
**Método:** `PUT`  
**URL:** `{{baseUrl}}/chat/updateProfilePicture/{{instance}}`

Atualiza a foto do perfil da instância.

**Corpo da Requisição:**
```json
{
  "picture": "https://example.com/nova-foto.jpg"
}
```

**Parâmetros:**
- `picture` (string): URL da nova foto ou base64

### 6. Remove Profile Picture
**Método:** `DELETE`  
**URL:** `{{baseUrl}}/chat/removeProfilePicture/{{instance}}`

Remove a foto do perfil da instância.

**Sem corpo de requisição necessário.**

### 7. Fetch Privacy Settings
**Método:** `GET`  
**URL:** `{{baseUrl}}/chat/fetchPrivacySettings/{{instance}}`

Busca as configurações de privacidade da instância.

**Resposta Esperada:**
```json
{
  "readreceipts": "all",
  "profile": "contacts",
  "status": "contacts",
  "online": "all",
  "last": "contacts",
  "groupadd": "contacts",
  "calladd": "all"
}
```

### 8. Update Privacy Settings
**Método:** `PUT`  
**URL:** `{{baseUrl}}/chat/updatePrivacySettings/{{instance}}`

Atualiza as configurações de privacidade da instância.

**Corpo da Requisição:**
```json
{
  "privacySettings": {
    "readreceipts": "all",
    "profile": "contacts",
    "status": "contacts",
    "online": "all",
    "last": "contacts",
    "groupadd": "contacts",
    "calladd": "all"
  }
}
```

**Parâmetros:**
- `privacySettings` (object): Configurações de privacidade
  - `readreceipts` (string): Confirmação de leitura
  - `profile` (string): Quem pode ver o perfil
  - `status` (string): Quem pode ver o status
  - `online` (string): Quem pode ver quando está online
  - `last` (string): Quem pode ver "visto por último"
  - `groupadd` (string): Quem pode adicionar em grupos
  - `calladd` (string): Quem pode fazer chamadas

## Opções de Privacidade

### Valores Aceitos
- `all`: Todos
- `contacts`: Apenas contatos
- `contact_blacklist`: Contatos exceto...
- `none`: Ninguém

### Configurações Específicas

#### Read Receipts (Confirmação de Leitura)
- `all`: Enviar e receber confirmações
- `none`: Não enviar confirmações

#### Profile (Foto e Nome)
- `all`: Todos podem ver
- `contacts`: Apenas contatos
- `contact_blacklist`: Contatos exceto bloqueados
- `none`: Ninguém pode ver

#### Status (Recado)
- `all`: Todos podem ver
- `contacts`: Apenas contatos
- `contact_blacklist`: Contatos exceto bloqueados
- `none`: Ninguém pode ver

#### Online (Status Online)
- `all`: Todos podem ver
- `contacts`: Apenas contatos
- `none`: Ninguém pode ver

#### Last Seen (Visto por Último)
- `all`: Todos podem ver
- `contacts`: Apenas contatos
- `contact_blacklist`: Contatos exceto bloqueados
- `none`: Ninguém pode ver

#### Group Add (Adicionar em Grupos)
- `all`: Todos podem adicionar
- `contacts`: Apenas contatos
- `contact_blacklist`: Contatos exceto bloqueados
- `none`: Ninguém pode adicionar

#### Call Add (Fazer Chamadas)
- `all`: Todos podem chamar
- `contacts`: Apenas contatos
- `contact_blacklist`: Contatos exceto bloqueados
- `none`: Ninguém pode chamar

## Exemplos de Uso

### Buscar perfil comercial
```bash
curl -X GET "{{baseUrl}}/chat/fetchBusinessProfile/minha-instancia?number=5511999999999"
```

### Buscar perfil básico
```bash
curl -X GET "{{baseUrl}}/chat/fetchProfile/minha-instancia?number=5511999999999"
```

### Atualizar nome do perfil
```bash
curl -X PUT "{{baseUrl}}/chat/updateProfileName/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meu Novo Nome"
  }'
```

### Atualizar status do perfil
```bash
curl -X PUT "{{baseUrl}}/chat/updateProfileStatus/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Trabalhando remotamente 🏠"
  }'
```

### Atualizar foto do perfil
```bash
curl -X PUT "{{baseUrl}}/chat/updateProfilePicture/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "picture": "https://example.com/minha-foto.jpg"
  }'
```

### Remover foto do perfil
```bash
curl -X DELETE "{{baseUrl}}/chat/removeProfilePicture/minha-instancia"
```

### Buscar configurações de privacidade
```bash
curl -X GET "{{baseUrl}}/chat/fetchPrivacySettings/minha-instancia"
```

### Atualizar configurações de privacidade
```bash
curl -X PUT "{{baseUrl}}/chat/updatePrivacySettings/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "privacySettings": {
      "readreceipts": "all",
      "profile": "contacts",
      "status": "contacts",
      "online": "contacts",
      "last": "contacts",
      "groupadd": "contacts",
      "calladd": "contacts"
    }
  }'
```

## Formatos Suportados

### Foto de Perfil
- **Formatos:** JPG, PNG, WebP
- **Tamanho:** Máximo 5MB
- **Resolução:** Recomendado 640x640 pixels
- **Formato:** Quadrado (será cortado automaticamente)

### Nome do Perfil
- **Caracteres:** Máximo 25 caracteres
- **Emojis:** Suportados
- **Caracteres especiais:** Permitidos

### Status do Perfil
- **Caracteres:** Máximo 139 caracteres
- **Emojis:** Suportados
- **Quebras de linha:** Não suportadas

## Códigos de Resposta

### Sucesso (200)
```json
{
  "status": "success",
  "message": "Profile updated successfully"
}
```

### Erro (400)
```json
{
  "error": "Invalid input",
  "message": "Nome do perfil excede o limite de caracteres"
}
```

### Erro (404)
```json
{
  "error": "Profile not found",
  "message": "Perfil não encontrado"
}
```

## Casos de Uso

### Personalização
- **Branding:** Manter identidade visual consistente
- **Informações:** Fornecer informações de contato atualizadas
- **Status:** Comunicar disponibilidade ou promoções
- **Profissionalismo:** Manter perfil profissional para negócios

### Privacidade
- **Segurança:** Controlar quem pode ver informações pessoais
- **Spam:** Reduzir mensagens indesejadas
- **Profissional:** Separar vida pessoal e profissional
- **Controle:** Gerenciar interações indesejadas

### Automação
- **Atualizações:** Atualizar informações automaticamente
- **Sincronização:** Manter dados consistentes entre sistemas
- **Monitoramento:** Acompanhar mudanças de perfil
- **Backup:** Fazer backup das configurações

## Boas Práticas

### Para Negócios
- Use foto profissional e de alta qualidade
- Mantenha nome claro e identificável
- Atualize status com informações relevantes
- Configure privacidade adequada para negócios

### Para Uso Pessoal
- Proteja informações pessoais com configurações de privacidade
- Use foto atual e reconhecível
- Mantenha status atualizado
- Revise configurações periodicamente

### Segurança
- Não compartilhe informações sensíveis no status
- Use configurações restritivas para desconhecidos
- Monitore mudanças não autorizadas
- Mantenha backup das configurações importantes

## Limitações

- Mudanças de nome têm limite de frequência
- Fotos são comprimidas automaticamente pelo WhatsApp
- Algumas configurações podem não estar disponíveis em todas as regiões
- Perfis comerciais têm recursos adicionais não disponíveis em contas pessoais