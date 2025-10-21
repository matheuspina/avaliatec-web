# Storage & General - Armazenamento e Endpoints Gerais

Esta categoria contém endpoints para gerenciamento de armazenamento de mídias e endpoints gerais da API.

## Subcategorias Disponíveis

### 1. Storage (S3)
### 2. General Endpoints

---

## 1. Storage - S3

### Get Media
**Método:** `GET`  
**URL:** `{{baseUrl}}/s3/getMedia/{{instance}}?messageId={{messageId}}&convertToMp4={{convertToMp4}}`

Obtém mídia armazenada no S3.

**Parâmetros de Query:**
- `messageId` (string): ID da mensagem contendo a mídia
- `convertToMp4` (boolean, opcional): Converter vídeo para MP4

**Resposta Esperada:**
```json
{
  "mediaUrl": "https://s3.amazonaws.com/bucket/media/file.jpg",
  "mediaType": "image",
  "fileName": "image_2024_01_01.jpg",
  "fileSize": 1024000,
  "mimeType": "image/jpeg"
}
```

### Get Media URL
**Método:** `GET`  
**URL:** `{{baseUrl}}/s3/getMediaUrl/{{instance}}?messageId={{messageId}}&convertToMp4={{convertToMp4}}`

Obtém apenas a URL da mídia armazenada no S3.

**Parâmetros de Query:**
- `messageId` (string): ID da mensagem contendo a mídia
- `convertToMp4` (boolean, opcional): Converter vídeo para MP4

**Resposta Esperada:**
```json
{
  "mediaUrl": "https://s3.amazonaws.com/bucket/media/file.jpg"
}
```

---

## 2. General Endpoints

### Get Informations
**Método:** `GET`  
**URL:** `{{baseUrl}}/{{instance}}`

Obtém informações gerais da instância.

**Resposta Esperada:**
```json
{
  "instance": {
    "instanceName": "minha-instancia",
    "status": "open",
    "serverUrl": "https://api.evolution.com",
    "apikey": "sua-api-key"
  },
  "owner": {
    "id": "5511999999999@s.whatsapp.net",
    "name": "Meu Nome",
    "profilePictureUrl": "https://pps.whatsapp.net/v/..."
  },
  "profilePictureUrl": "https://pps.whatsapp.net/v/...",
  "profileStatus": "Disponível",
  "profileName": "Meu Nome"
}
```

### Metrics
**Método:** `GET`  
**URL:** `{{baseUrl}}/metrics/{{instance}}`

Obtém métricas de uso da instância.

**Resposta Esperada:**
```json
{
  "messages": {
    "sent": 1250,
    "received": 890,
    "total": 2140
  },
  "contacts": {
    "total": 156,
    "blocked": 2
  },
  "groups": {
    "total": 8,
    "admin": 3,
    "member": 5
  },
  "chats": {
    "total": 45,
    "unread": 3,
    "archived": 2
  },
  "uptime": {
    "seconds": 86400,
    "formatted": "1 day, 0 hours, 0 minutes"
  },
  "lastActivity": "2024-01-01T12:00:00.000Z",
  "connectionStatus": "open"
}
```

---

## Configuração do S3

### Variáveis de Ambiente Necessárias
```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=sua-access-key
AWS_SECRET_ACCESS_KEY=sua-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=evolution-media-bucket

# S3 Settings
S3_ENABLED=true
S3_PORT=443
S3_USE_SSL=true
```

### Estrutura de Armazenamento
```
bucket-name/
├── instances/
│   ├── instancia-1/
│   │   ├── images/
│   │   ├── videos/
│   │   ├── audios/
│   │   └── documents/
│   └── instancia-2/
│       ├── images/
│       ├── videos/
│       ├── audios/
│       └── documents/
```

## Tipos de Mídia Suportados

### Imagens
- **Formatos:** JPG, JPEG, PNG, WebP, GIF
- **Tamanho máximo:** 16MB
- **Compressão:** Automática pelo WhatsApp

### Vídeos
- **Formatos:** MP4, AVI, MOV, 3GP
- **Tamanho máximo:** 64MB
- **Duração máxima:** 90 segundos (status), ilimitado (chat)
- **Conversão:** Opcional para MP4

### Áudios
- **Formatos:** MP3, AAC, AMR, OGG
- **Tamanho máximo:** 16MB
- **Duração máxima:** Ilimitada

### Documentos
- **Formatos:** PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
- **Tamanho máximo:** 100MB
- **Visualização:** Suporte limitado no WhatsApp

## Exemplos de Uso

### Obter mídia do S3
```bash
curl -X GET "{{baseUrl}}/s3/getMedia/minha-instancia?messageId=3EB0C767D82B632A2E4A&convertToMp4=true"
```

### Obter apenas URL da mídia
```bash
curl -X GET "{{baseUrl}}/s3/getMediaUrl/minha-instancia?messageId=3EB0C767D82B632A2E4A"
```

### Obter informações da instância
```bash
curl -X GET "{{baseUrl}}/minha-instancia"
```

### Obter métricas
```bash
curl -X GET "{{baseUrl}}/metrics/minha-instancia"
```

## Códigos de Resposta

### Sucesso (200)
```json
{
  "status": "success",
  "data": {
    "mediaUrl": "https://s3.amazonaws.com/bucket/media/file.jpg"
  }
}
```

### Erro (404)
```json
{
  "error": "Media not found",
  "message": "Mídia não encontrada para o messageId fornecido"
}
```

### Erro (500)
```json
{
  "error": "S3 connection error",
  "message": "Erro ao conectar com o serviço S3"
}
```

## Casos de Uso

### Storage S3
- **Backup:** Armazenar mídias permanentemente
- **CDN:** Distribuir conteúdo globalmente
- **Análise:** Processar mídias com IA
- **Compliance:** Manter registros para auditoria

### Informações da Instância
- **Monitoramento:** Verificar status da conexão
- **Dashboard:** Exibir informações em tempo real
- **Debugging:** Diagnosticar problemas
- **Relatórios:** Gerar relatórios de uso

### Métricas
- **Analytics:** Analisar padrões de uso
- **Performance:** Monitorar desempenho
- **Billing:** Calcular custos de uso
- **Alertas:** Configurar alertas baseados em métricas

## Configurações Avançadas

### Conversão de Vídeo
```json
{
  "convertToMp4": true,
  "quality": "medium",
  "maxSize": "10MB"
}
```

### Cache de Mídia
```json
{
  "cacheEnabled": true,
  "cacheDuration": 3600,
  "cacheLocation": "local"
}
```

### Compressão
```json
{
  "compressionEnabled": true,
  "imageQuality": 80,
  "videoQuality": "medium"
}
```

## Segurança

### Acesso ao S3
- Use IAM roles com permissões mínimas
- Configure bucket policies restritivas
- Ative logging de acesso
- Use HTTPS para todas as requisições

### URLs Presignadas
- Configure tempo de expiração adequado
- Use HTTPS obrigatório
- Implemente rate limiting
- Monitore acessos suspeitos

### Dados Sensíveis
- Criptografe dados em repouso
- Use KMS para gerenciar chaves
- Implemente DLP (Data Loss Prevention)
- Configure alertas de segurança

## Monitoramento

### Métricas do S3
- Número de objetos armazenados
- Tamanho total do bucket
- Número de requisições
- Latência de acesso

### Métricas da API
- Tempo de resposta
- Taxa de erro
- Throughput
- Uso de recursos

### Alertas
- Falhas de upload
- Espaço em disco baixo
- Erros de conexão
- Uso excessivo de recursos

## Otimização

### Performance
- Use CloudFront para CDN
- Configure cache adequadamente
- Otimize tamanho das mídias
- Use compressão quando possível

### Custos
- Configure lifecycle policies
- Use classes de armazenamento apropriadas
- Monitore custos regularmente
- Implemente limpeza automática

### Escalabilidade
- Use múltiplas regiões
- Configure auto-scaling
- Implemente load balancing
- Monitore capacidade

## Troubleshooting

### Mídia não encontrada
1. Verifique se o messageId está correto
2. Confirme se a mídia foi armazenada no S3
3. Verifique permissões de acesso
4. Consulte logs de erro

### Erro de conexão S3
1. Verifique credenciais AWS
2. Confirme configuração de região
3. Teste conectividade de rede
4. Verifique status do serviço AWS

### Performance lenta
1. Verifique latência de rede
2. Otimize tamanho das mídias
3. Configure cache adequadamente
4. Use CDN quando possível

## Boas Práticas

### Armazenamento
- Organize arquivos em estrutura lógica
- Use nomes de arquivo descritivos
- Implemente versionamento quando necessário
- Configure backup regular

### Acesso
- Use URLs presignadas para acesso temporário
- Implemente autenticação adequada
- Configure CORS quando necessário
- Monitore padrões de acesso

### Manutenção
- Limpe arquivos antigos regularmente
- Monitore uso de espaço
- Atualize configurações conforme necessário
- Mantenha logs de auditoria

### Performance
- Otimize tamanho de mídias antes do upload
- Use formatos eficientes
- Configure cache adequadamente
- Monitore métricas de performance

## Limitações

### S3
- Dependente de conectividade com AWS
- Custos variáveis por uso
- Latência baseada na região
- Limites de rate da AWS

### Conversão de Mídia
- Tempo adicional de processamento
- Limitações de formato
- Possível perda de qualidade
- Uso adicional de recursos

### Métricas
- Dados podem ter delay
- Limitações de histórico
- Precisão baseada em logs
- Dependente de configuração correta