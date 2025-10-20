# Requirements Document

## Introduction

Este documento define os requisitos para o sistema de Gestão de Usuários, que permitirá a criação de grupos de usuários com permissões granulares, convite de novos usuários via email, e controle de acesso baseado em funções (RBAC) para todas as seções do sistema. A feature será integrada na página de configurações e afetará todo o sistema de navegação e visualização de conteúdo.

## Glossary

- **Sistema**: A aplicação web de gestão empresarial
- **Grupo de Usuário**: Uma coleção de permissões que pode ser atribuída a múltiplos usuários
- **Seção**: Um item do menu sidebar que representa uma área funcional do sistema (ex: Dashboard, Projetos, Tarefas, Clientes)
- **Nível de Permissão**: O tipo de acesso que um usuário tem sobre uma seção (visualizar, criar, editar, excluir)
- **Convite de Usuário**: Um link único enviado por email que permite o cadastro de um novo usuário
- **Administrador**: Usuário com permissões completas no sistema
- **Filtro de Conteúdo**: Mecanismo que restringe a visualização de dados apenas aos usuários atribuídos
- **Token de Convite**: Identificador único e temporário usado para validar o cadastro de um novo usuário
- **Autenticação Microsoft**: Processo de login usando conta Microsoft OAuth
- **Sincronização de Usuário**: Processo de criar ou atualizar dados do usuário no Supabase após autenticação

## Requirements

### Requirement 1

**User Story:** Como administrador, eu quero criar grupos de usuários com nomes personalizados, para que eu possa organizar permissões por função ou departamento

#### Acceptance Criteria

1. WHEN o Administrador acessa a seção de configurações, THE Sistema SHALL exibir uma interface de gestão de grupos de usuários
2. WHEN o Administrador cria um novo Grupo de Usuário, THE Sistema SHALL validar que o nome do grupo é único e contém entre 3 e 50 caracteres
3. WHEN o Administrador salva um novo Grupo de Usuário, THE Sistema SHALL persistir o grupo na base de dados com timestamp de criação
4. THE Sistema SHALL permitir que o Administrador edite o nome de um Grupo de Usuário existente
5. WHEN o Administrador tenta excluir um Grupo de Usuário, THE Sistema SHALL verificar se existem usuários atribuídos e exibir confirmação antes da exclusão

### Requirement 2

**User Story:** Como administrador, eu quero definir permissões granulares para cada grupo de usuários, para que eu possa controlar o acesso às diferentes seções do sistema

#### Acceptance Criteria

1. WHEN o Administrador configura um Grupo de Usuário, THE Sistema SHALL exibir uma tabela de checkbox com todas as Seções disponíveis
2. FOR cada Seção selecionada, THE Sistema SHALL permitir que o Administrador defina os Níveis de Permissão: visualizar, criar, editar e excluir
3. WHEN o Administrador marca uma permissão de nível superior (criar, editar, excluir), THE Sistema SHALL automaticamente marcar a permissão de visualizar
4. WHEN o Administrador salva as permissões, THE Sistema SHALL persistir a matriz de permissões associada ao Grupo de Usuário
5. THE Sistema SHALL validar que pelo menos uma Seção está selecionada antes de salvar o Grupo de Usuário

### Requirement 3

**User Story:** Como administrador, eu quero convidar novos usuários para o sistema, para que eles possam se cadastrar e acessar o sistema com as permissões do grupo atribuído

#### Acceptance Criteria

1. WHEN o Administrador envia um convite, THE Sistema SHALL solicitar o email do destinatário e o Grupo de Usuário a ser atribuído
2. WHEN o Administrador confirma o convite, THE Sistema SHALL gerar um Token de Convite único com validade de 7 dias
3. WHEN o Token de Convite é gerado, THE Sistema SHALL enviar um email ao destinatário contendo o link de cadastro com o token
4. WHEN o destinatário acessa o link de cadastro, THE Sistema SHALL validar que o Token de Convite é válido e não expirado
5. WHEN o novo usuário completa o cadastro, THE Sistema SHALL criar a conta do usuário e atribuí-lo ao Grupo de Usuário especificado no convite

### Requirement 4

**User Story:** Como usuário do sistema, eu quero visualizar apenas as seções para as quais tenho permissão, para que a interface seja simplificada e relevante ao meu papel

#### Acceptance Criteria

1. WHEN um usuário faz login no Sistema, THE Sistema SHALL carregar as permissões do Grupo de Usuário atribuído
2. WHEN o Sistema renderiza o sidebar, THE Sistema SHALL exibir apenas as Seções para as quais o usuário tem permissão de visualizar
3. WHEN um usuário tenta acessar uma URL de uma Seção sem permissão, THE Sistema SHALL redirecionar para a página de acesso negado
4. FOR cada Seção visível, THE Sistema SHALL habilitar ou desabilitar botões de ação (criar, editar, excluir) baseado nos Níveis de Permissão do usuário
5. THE Sistema SHALL armazenar as permissões do usuário no contexto da sessão para acesso rápido

### Requirement 5

**User Story:** Como usuário do sistema, eu quero visualizar apenas o conteúdo que foi atribuído a mim, para que eu veja apenas informações relevantes ao meu trabalho

#### Acceptance Criteria

1. WHEN um usuário acessa a seção de Projetos, THE Sistema SHALL filtrar e exibir apenas os Projetos onde o usuário é membro da equipe
2. WHEN um usuário acessa a seção de Tarefas, THE Sistema SHALL filtrar e exibir apenas as Tarefas atribuídas ao usuário
3. WHEN um usuário acessa a seção de Clientes, THE Sistema SHALL filtrar e exibir apenas os Clientes atribuídos ao usuário
4. WHEN um usuário acessa a seção de Eventos, THE Sistema SHALL filtrar e exibir apenas os Eventos onde o usuário é participante ou criador
5. WHEN um Administrador cria ou edita conteúdo, THE Sistema SHALL permitir a atribuição de usuários específicos ao conteúdo

### Requirement 6

**User Story:** Como administrador, eu quero visualizar e gerenciar todos os usuários do sistema, para que eu possa ter controle completo sobre quem tem acesso e suas permissões

#### Acceptance Criteria

1. WHEN o Administrador acessa a gestão de usuários, THE Sistema SHALL exibir uma lista completa de todos os usuários cadastrados incluindo nome, email, grupo atribuído e status
2. THE Sistema SHALL exibir informações detalhadas de cada usuário: foto de perfil, data de criação, último acesso, método de autenticação e status da conta
3. WHEN o Administrador seleciona um usuário, THE Sistema SHALL permitir a alteração do Grupo de Usuário atribuído através de um dropdown ou modal de edição
4. WHEN o Administrador altera o grupo de um usuário, THE Sistema SHALL atualizar imediatamente as permissões do usuário e registrar a alteração no log de auditoria
5. WHEN o Administrador desativa um usuário, THE Sistema SHALL revogar o acesso do usuário ao sistema sem excluir seus dados históricos
6. WHEN o Administrador reativa um usuário, THE Sistema SHALL restaurar o acesso do usuário com as permissões do grupo atribuído
7. THE Sistema SHALL permitir filtrar e buscar usuários por nome, email, grupo ou status

### Requirement 7

**User Story:** Como usuário convidado, eu quero receber um email claro com instruções de cadastro, para que eu possa facilmente criar minha conta no sistema

#### Acceptance Criteria

1. WHEN o Sistema envia um email de convite, THE Sistema SHALL utilizar o serviço de email configurado em /lib/email/
2. THE email de convite SHALL conter o nome do sistema, o nome do Grupo de Usuário atribuído, e o link de cadastro
3. THE email de convite SHALL incluir instruções claras sobre como completar o cadastro
4. WHEN o Token de Convite expira, THE Sistema SHALL exibir uma mensagem informativa e permitir que o usuário solicite um novo convite
5. THE Sistema SHALL registrar o envio de cada email de convite para fins de auditoria

### Requirement 8

**User Story:** Como sistema, eu quero sincronizar automaticamente os dados dos usuários autenticados com a tabela do Supabase, para que todos os usuários tenham registros consistentes no banco de dados

#### Acceptance Criteria

1. WHEN um usuário completa o login existente com Microsoft, THE Sistema SHALL verificar se o usuário já existe na tabela de usuários do Supabase usando o email como identificador único
2. IF o usuário não existe no Supabase, THEN THE Sistema SHALL criar um novo registro na tabela de usuários com os dados obtidos da sessão autenticada (nome, email, foto de perfil)
3. IF o usuário já existe no Supabase, THEN THE Sistema SHALL atualizar os dados do usuário com as informações mais recentes da sessão
4. WHEN um novo usuário é criado via sincronização, THE Sistema SHALL atribuir o usuário a um Grupo de Usuário padrão configurado pelo administrador
5. WHEN a Sincronização de Usuário é concluída, THE Sistema SHALL registrar a data e hora do último acesso do usuário
6. THE Sistema SHALL armazenar o ID do usuário do Supabase na sessão para uso em queries e verificações de permissão
7. IF ocorrer um erro durante a Sincronização de Usuário, THEN THE Sistema SHALL registrar o erro em logs e permitir que o usuário continue usando o sistema com permissões limitadas

### Requirement 9

**User Story:** Como desenvolvedor, eu quero que todas as páginas e modais do sistema respeitem as permissões de usuário, para que o controle de acesso seja consistente em toda a aplicação

#### Acceptance Criteria

1. WHEN uma página é carregada, THE Sistema SHALL verificar as permissões do usuário antes de renderizar componentes de ação
2. WHEN um modal é aberto, THE Sistema SHALL verificar se o usuário tem permissão para a operação (criar, editar, excluir)
3. WHEN uma API é chamada, THE Sistema SHALL validar as permissões do usuário no backend antes de executar a operação
4. IF o usuário não tem permissão para uma operação, THEN THE Sistema SHALL exibir uma mensagem de erro apropriada
5. THE Sistema SHALL implementar verificação de permissões em todas as rotas de API existentes: projetos, tarefas, clientes, eventos, kanban, agenda, e arquivos
