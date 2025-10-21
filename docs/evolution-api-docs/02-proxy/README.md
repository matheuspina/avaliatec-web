# Proxy - Configurações de Proxy

Esta categoria contém endpoints para configurar proxy nas instâncias da Evolution API.

## Endpoints Disponíveis

### 1. Set Proxy
**Método:** `POST`  
**URL:** `{{baseUrl}}/proxy/set/{{instance}}`

Define configurações de proxy para uma instância específica.

**Corpo da Requisição:**
```json
{
  "enabled": true,
  "host": "proxy.example.com",
  "port": "8080",
  "protocol": "http",
  "username": "usuario",
  "password": "senha"
}
```

**Parâmetros:**
- `enabled` (boolean): Habilita ou desabilita o proxy
- `host` (string): Endereço do servidor proxy
- `port` (string): Porta do servidor proxy
- `protocol` (string): Protocolo do proxy (http, https, socks4, socks5)
- `username` (string, opcional): Nome de usuário para autenticação
- `password` (string, opcional): Senha para autenticação

### 2. Find Proxy
**Método:** `GET`  
**URL:** `{{baseUrl}}/proxy/find/{{instance}}`

Busca as configurações de proxy de uma instância específica.

**Resposta Esperada:**
```json
{
  "enabled": true,
  "host": "proxy.example.com",
  "port": "8080",
  "protocol": "http",
  "username": "usuario"
}
```

## Protocolos Suportados

- `http`: Proxy HTTP padrão
- `https`: Proxy HTTPS
- `socks4`: Proxy SOCKS4
- `socks5`: Proxy SOCKS5

## Casos de Uso

### Configurar proxy HTTP simples
```bash
curl -X POST "{{baseUrl}}/proxy/set/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "host": "proxy.empresa.com",
    "port": "8080",
    "protocol": "http"
  }'
```

### Configurar proxy com autenticação
```bash
curl -X POST "{{baseUrl}}/proxy/set/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "host": "proxy.empresa.com",
    "port": "8080",
    "protocol": "http",
    "username": "meu-usuario",
    "password": "minha-senha"
  }'
```

### Desabilitar proxy
```bash
curl -X POST "{{baseUrl}}/proxy/set/minha-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }'
```

### Verificar configurações de proxy
```bash
curl -X GET "{{baseUrl}}/proxy/find/minha-instancia"
```

## Observações

- As configurações de proxy são aplicadas por instância
- É necessário reiniciar a instância após alterar as configurações de proxy
- O proxy é usado para todas as conexões da instância com o WhatsApp
- Credenciais de autenticação são armazenadas de forma segura
- A senha não é retornada nas consultas por motivos de segurança