# Requirements Document

## Introduction

Este documento define os requisitos para a feature de Atendimento via WhatsApp, que permitirá aos usuários do sistema Avaliatec conectar números de WhatsApp através da Evolution API (API não oficial do WhatsApp), gerenciar conversas, enviar e receber mensagens, e automatizar atendimentos. A feature suporta múltiplas instâncias (números), armazenamento de mensagens no Supabase, mensagens rápidas por atalhos, integração com a base de clientes existente, e configurações de disponibilidade.

## Glossary

- **Evolution API**: API não oficial do WhatsApp que permite integração programática com o WhatsApp
- **Instância**: Representa uma conexão de um número de WhatsApp na Evolution API
- **QR Code**: Código de resposta rápida usado para autenticar e conectar um número de WhatsApp
- **Webhook**: URL de callback que recebe eventos da Evolution API em tempo real
- **RemoteJid**: Identificador único de um contato no formato WhatsApp (ex: 5511999999999@s.whatsapp.net)
- **Sistema Avaliatec**: Aplicação web de gerenciamento de projetos e atendimento
- **Mensagem Rápida**: Mensagem pré-configurada ativada por atalho de texto
- **Supabase**: Plataforma de banco de dados PostgreSQL utilizada pelo sistema
- **Contato WhatsApp**: Pessoa ou entidade que interage via WhatsApp com o sistema
- **Cliente**: Entidade cadastrada na tabela de clientes do sistema
- **Lead**: Potencial cliente ainda não convertido
- **Profissional**: Usuário interno do sistema
- **Prestador de Serviço**: Fornecedor externo cadastrado no sistema

## Requirements

### Requirement 1

**User Story:** Como administrador do sistema, eu quero configurar as credenciais da Evolution API através de variáveis de ambiente, para que o sistema possa se conectar à API de forma segura.

#### Acceptance Criteria

1. WHEN o sistema é inicializado, THE Sistema Avaliatec SHALL carregar as variáveis EVOLUTION_API_BASE_URL e EVOLUTION_API_KEY do arquivo .env
2. IF as variáveis de ambiente não estiverem definidas, THEN THE Sistema Avaliatec SHALL exibir mensagem de erro clara indicando as variáveis faltantes
3. THE Sistema Avaliatec SHALL validar o formato da EVOLUTION_API_BASE_URL como URL válida antes de utilizá-la
4. THE Sistema Avaliatec SHALL incluir a EVOLUTION_API_KEY no header Authorization de todas as requisições à Evolution API

### Requirement 2

**User Story:** Como usuário do sistema, eu quero conectar um número de WhatsApp escaneando um QR Code, para que eu possa começar a receber e enviar mensagens.

#### Acceptance Criteria

1. WHEN o usuário acessa a página de atendimento sem instâncias conectadas, THE Sistema Avaliatec SHALL exibir mensagem informando a necessidade de conectar um número
2. WHEN o usuário clica no botão de conectar número, THE Sistema Avaliatec SHALL abrir modal com QR Code para escaneamento
3. WHEN o usuário solicita conexão, THE Sistema Avaliatec SHALL criar instância na Evolution API com webhook configurado
4. WHEN o QR Code é atualizado pela Evolution API, THE Sistema Avaliatec SHALL atualizar o QR Code exibido no modal em tempo real
5. WHEN a instância é conectada com sucesso, THE Sistema Avaliatec SHALL fechar o modal e exibir a interface de conversas
6. THE Sistema Avaliatec SHALL incluir os eventos MESSAGES_UPSERT, MESSAGES_UPDATE, CONNECTION_UPDATE, QRCODE_UPDATED e CONTACTS_UPSERT na configuração do webhook

### Requirement 3

**User Story:** Como usuário do sistema, eu quero receber mensagens enviadas para meu número de WhatsApp, para que eu possa responder aos contatos através do sistema.

#### Acceptance Criteria

1. WHEN a Evolution API envia evento MESSAGES_UPSERT para o webhook, THE Sistema Avaliatec SHALL processar a mensagem recebida
2. WHEN uma mensagem é recebida, THE Sistema Avaliatec SHALL armazenar a mensagem na tabela whatsapp_messages do Supabase
3. WHEN uma mensagem é recebida, THE Sistema Avaliatec SHALL armazenar ou atualizar os dados do contato na tabela whatsapp_contacts do Supabase
4. WHEN uma mensagem de texto é recebida, THE Sistema Avaliatec SHALL armazenar o conteúdo textual
5. WHEN uma mensagem de mídia é recebida, THE Sistema Avaliatec SHALL armazenar a URL ou referência da mídia
6. WHEN uma mensagem de áudio é recebida, THE Sistema Avaliatec SHALL armazenar a referência do áudio
7. THE Sistema Avaliatec SHALL associar cada mensagem recebida à instância correspondente

### Requirement 4

**User Story:** Como usuário do sistema, eu quero enviar mensagens de texto e áudio para contatos do WhatsApp, para que eu possa me comunicar com clientes e leads.

#### Acceptance Criteria

1. WHEN o usuário digita texto e pressiona enviar, THE Sistema Avaliatec SHALL enviar mensagem de texto através do endpoint sendText da Evolution API
2. WHEN o usuário grava e envia áudio, THE Sistema Avaliatec SHALL enviar mensagem de áudio através do endpoint sendWhatsAppAudio da Evolution API
3. WHEN uma mensagem é enviada com sucesso, THE Sistema Avaliatec SHALL armazenar a mensagem na tabela whatsapp_messages do Supabase
4. WHEN uma mensagem é enviada, THE Sistema Avaliatec SHALL marcar a mensagem como enviada pelo usuário (fromMe: true)
5. THE Sistema Avaliatec SHALL exibir indicador de envio enquanto a mensagem está sendo processada
6. IF o envio falhar, THEN THE Sistema Avaliatec SHALL exibir mensagem de erro e permitir reenvio

### Requirement 5

**User Story:** Como usuário do sistema, eu quero visualizar o histórico completo de mensagens de cada contato, para que eu possa entender o contexto das conversas.

#### Acceptance Criteria

1. WHEN o usuário seleciona um contato, THE Sistema Avaliatec SHALL carregar todas as mensagens associadas ao remoteJid do contato
2. THE Sistema Avaliatec SHALL exibir mensagens em ordem cronológica com as mais recentes no final
3. THE Sistema Avaliatec SHALL diferenciar visualmente mensagens enviadas de mensagens recebidas
4. THE Sistema Avaliatec SHALL exibir timestamp de cada mensagem
5. WHEN mensagens de áudio estão presentes, THE Sistema Avaliatec SHALL exibir player de áudio funcional
6. THE Sistema Avaliatec SHALL carregar mensagens com paginação para otimizar performance

### Requirement 6

**User Story:** Como usuário do sistema, eu quero usar atalhos de texto para enviar mensagens rápidas, para que eu possa responder de forma eficiente a perguntas comuns.

#### Acceptance Criteria

1. WHEN o usuário digita um atalho iniciado com "/" seguido de texto, THE Sistema Avaliatec SHALL reconhecer como atalho de mensagem rápida
2. WHEN um atalho válido é digitado, THE Sistema Avaliatec SHALL substituir o atalho pelo texto completo da mensagem rápida
3. THE Sistema Avaliatec SHALL suportar variáveis dinâmicas como {nome_cliente} nas mensagens rápidas
4. WHEN uma variável {nome_cliente} está presente, THE Sistema Avaliatec SHALL substituir pelo nome do contato atual
5. THE Sistema Avaliatec SHALL armazenar mensagens rápidas na tabela whatsapp_quick_messages do Supabase
6. THE Sistema Avaliatec SHALL permitir criar, editar e excluir mensagens rápidas através de interface de configuração

### Requirement 7

**User Story:** Como usuário do sistema, eu quero que contatos do WhatsApp sejam automaticamente associados a clientes cadastrados, para que eu tenha acesso rápido às informações do cliente durante o atendimento.

#### Acceptance Criteria

1. WHEN uma mensagem é recebida de um número, THE Sistema Avaliatec SHALL verificar se existe cliente com telefone correspondente
2. IF um cliente correspondente existe, THEN THE Sistema Avaliatec SHALL associar o contato WhatsApp ao cliente
3. WHEN um contato associado a cliente é exibido, THE Sistema Avaliatec SHALL mostrar o nome do cliente
4. THE Sistema Avaliatec SHALL permitir ao usuário associar manualmente um contato a cliente existente
5. THE Sistema Avaliatec SHALL permitir ao usuário criar novo cliente a partir de um contato WhatsApp
6. THE Sistema Avaliatec SHALL normalizar números de telefone para comparação (remover formatação)

### Requirement 8

**User Story:** Como usuário do sistema, eu quero classificar contatos do WhatsApp como cliente, lead, profissional ou prestador de serviço, para que eu possa organizar e filtrar conversas por tipo de contato.

#### Acceptance Criteria

1. THE Sistema Avaliatec SHALL armazenar tipo de contato na tabela whatsapp_contacts com valores: cliente, lead, profissional, prestador
2. WHEN o usuário salva um contato, THE Sistema Avaliatec SHALL permitir selecionar o tipo de contato
3. WHEN um contato é classificado como cliente, THE Sistema Avaliatec SHALL permitir associar a registro existente ou criar novo cliente
4. THE Sistema Avaliatec SHALL exibir indicador visual do tipo de contato na lista de conversas
5. THE Sistema Avaliatec SHALL permitir filtrar conversas por tipo de contato
6. WHEN o tipo é alterado, THE Sistema Avaliatec SHALL atualizar o registro no Supabase imediatamente

### Requirement 9

**User Story:** Como usuário do sistema, eu quero configurar horário de indisponibilidade e mensagem automática, para que contatos sejam informados quando eu não estiver disponível para atendimento.

#### Acceptance Criteria

1. THE Sistema Avaliatec SHALL armazenar configurações de disponibilidade na tabela whatsapp_instance_settings do Supabase
2. THE Sistema Avaliatec SHALL permitir definir horários de início e fim de disponibilidade para cada dia da semana
3. THE Sistema Avaliatec SHALL permitir configurar mensagem automática de indisponibilidade personalizada
4. WHEN uma mensagem é recebida fora do horário de disponibilidade, THE Sistema Avaliatec SHALL enviar automaticamente a mensagem de indisponibilidade
5. THE Sistema Avaliatec SHALL enviar mensagem automática apenas uma vez por conversa durante período de indisponibilidade
6. THE Sistema Avaliatec SHALL permitir ativar ou desativar resposta automática de indisponibilidade

### Requirement 10

**User Story:** Como usuário do sistema, eu quero gerenciar múltiplos números de WhatsApp, para que eu possa atender diferentes departamentos ou linhas de negócio através do mesmo sistema.

#### Acceptance Criteria

1. THE Sistema Avaliatec SHALL permitir conectar múltiplas instâncias da Evolution API
2. THE Sistema Avaliatec SHALL armazenar cada instância com identificador único na tabela whatsapp_instances do Supabase
3. WHEN o usuário alterna entre instâncias, THE Sistema Avaliatec SHALL carregar conversas e mensagens específicas da instância selecionada
4. THE Sistema Avaliatec SHALL exibir indicador visual da instância ativa
5. THE Sistema Avaliatec SHALL permitir nomear cada instância para fácil identificação
6. THE Sistema Avaliatec SHALL manter estado de conexão independente para cada instância

### Requirement 11

**User Story:** Como usuário do sistema, eu quero configurar comportamentos da instância como rejeição de chamadas e ignorar grupos, para que eu possa personalizar como cada número opera.

#### Acceptance Criteria

1. THE Sistema Avaliatec SHALL fornecer interface para configurar settings da instância
2. THE Sistema Avaliatec SHALL permitir ativar rejeição automática de chamadas através do endpoint settings/set da Evolution API
3. WHEN rejeição de chamadas está ativa, THE Sistema Avaliatec SHALL permitir configurar mensagem enviada ao chamador
4. THE Sistema Avaliatec SHALL permitir ativar opção de ignorar mensagens de grupos
5. THE Sistema Avaliatec SHALL permitir configurar se mensagens devem ser marcadas como lidas automaticamente
6. WHEN configurações são alteradas, THE Sistema Avaliatec SHALL enviar requisição PUT para endpoint settings/set da Evolution API
7. THE Sistema Avaliatec SHALL armazenar configurações localmente no Supabase para referência

### Requirement 12

**User Story:** Como desenvolvedor do sistema, eu quero que o webhook receba eventos da Evolution API de forma confiável, para que mensagens e atualizações sejam processadas em tempo real.

#### Acceptance Criteria

1. THE Sistema Avaliatec SHALL expor endpoint público de webhook em /api/webhooks/evolution
2. THE Sistema Avaliatec SHALL validar origem das requisições do webhook
3. WHEN evento MESSAGES_UPSERT é recebido, THE Sistema Avaliatec SHALL processar nova mensagem
4. WHEN evento CONNECTION_UPDATE é recebido, THE Sistema Avaliatec SHALL atualizar status de conexão da instância
5. WHEN evento QRCODE_UPDATED é recebido, THE Sistema Avaliatec SHALL atualizar QR Code exibido ao usuário
6. WHEN evento CONTACTS_UPSERT é recebido, THE Sistema Avaliatec SHALL atualizar informações do contato
7. THE Sistema Avaliatec SHALL responder ao webhook com status 200 em até 5 segundos
8. IF processamento do webhook falhar, THEN THE Sistema Avaliatec SHALL registrar erro em logs sem bloquear resposta
