Este documento lista todas as funcionalidades atuais da aplicação **Clube dos Jogos**, bem como sugestões de funcionalidades que podem ser implementadas no futuro para expandir a plataforma.

---

## 🚀 Funcionalidades Atuais

A aplicação foi construída utilizando **Next.js (App Router)**, **Vercel KV (Redis)** para o banco de dados, **NextAuth** para autenticação e **Tailwind CSS** para estilização. Abaixo estão as funcionalidades que já estão presentes no sistema:

### 1. Autenticação e Usuários
- **Login/Logout**: Sistema de autenticação de usuários (integrado via `NextAuth`).
- **Perfil de Usuário**: Área dedicada ao usuário (`/user`), onde ele pode visualizar suas informações e o histórico de reviews que já publicou (`UserProfileReviewList`).

### 2. Gestão de Jogos (Área Administrativa)
Apenas usuários com permissões de administrador têm acesso a essas funções na rota `/admin`:
- **Adicionar Jogos** (`/admin/add-game`): Formulário para cadastrar novos jogos no catálogo.
- **Editar Jogos** (`/admin/edit-game`): Formulário para atualizar informações de jogos já existentes.
- **Gerenciar/Listar Jogos** (`/admin/manage-games`): Painel listando todos os jogos criados, permitindo acesso rápido para edição ou exclusão.

### 3. Catálogo de Jogos (Visão Pública)
- **Página Inicial** (`/`): Exibe a lista completa de todos os jogos cadastrados no clube. Mostra um card para cada jogo contendo o título e a quantidade total de avaliações (reviews) que o jogo recebeu.
- **Página do Jogo** (`/game/[slug]`): Rota dinâmica que mostra as informações detalhadas de um jogo específico, com base no seu `slug`.

### 4. Sistema de Avaliações (Reviews)
- **Publicar Review** (`ReviewForm`): Usuários autenticados podem publicar avaliações para os jogos.
- **Listagem de Reviews do Jogo** (`ReviewList`): Na página de cada jogo, é possível ler todas as avaliações deixadas por outros usuários.
- **Contagem de Reviews**: A quantidade de reviews fica visível logo na página inicial.

### 5. Backend (API Routes)
A aplicação conta com rotas de API robustas (`/api`) para:
- Gerenciar a autenticação (`/api/auth`).
- Criar, ler, atualizar e excluir dados dos Jogos (`/api/games`).
- Gerenciar a postagem e leitura das Reviews (`/api/reviews`).

---

## 🔮 Funcionalidades Futuras (Sugestões para Modificação)

Caso você queira expandir a aplicação no futuro, aqui estão algumas ideias de novas funcionalidades que podem ser adicionadas usando a mesma base de código e tecnologias:

### Melhorias no Sistema de Avaliações (Reviews)
- **Notas/Estrelas**: Permitir que os usuários deem uma nota de 1 a 5 estrelas junto com a review em texto. A página do jogo exibiria a média de notas.
- **Curtidas (Likes) em Reviews**: Permitir que usuários curtam as reviews de outras pessoas para destacar as avaliações mais úteis.
- **Edição/Exclusão de Reviews**: Permitir que os usuários editem ou apaguem temporariamente suas próprias reviews.

### Melhorias na Comunidade e Usuários
- **Sistema de Favoritos (Wishlist/Meus Jogos)**: Botão de "Adicionar aos Favoritos" ou "Quero Jogar" na página do jogo. Estes jogos apareceriam salvos no perfil do usuário (`/user`).
- **Avatares de Usuário**: Permitir o upload ou seleção de fotos de perfil personalizadas, que apareceriam junto com o nome do usuário nas reviews.
- **Comentários nas Reviews**: Permitir que usuários respondam às reviews de outras pessoas.

### Melhorias no Catálogo de Jogos
- **Filtros e Buscas**: Adicionar uma barra de pesquisa na página inicial para encontrar jogos pelo nome, e filtros por categoria (Ex: RPG, Tabuleiro, Ação).
- **Categorias e Tags**: No painel de Admin (`/admin`), adicionar a opção de definir gêneros/tags aos jogos e mostrá-los nos cards da página inicial.
- **Imagens e Capas de Jogos**: Anexar uma URL de imagem de capa ao criar um jogo no painel de admin para deixar os cards da Home mais bonitos.

### Recursos Administrativos
- **Dashboard de Dados**: Adicionar na `/admin` gráficos mostrando qual jogo é o mais avaliado ou o jogo com as notas mais altas.
- **Moderação de Comentários**: Uma tela para que os administradores possam deletar ou ocultar reviews que violem as regras do clube.# Clube dos Jogos - Funcionalidades da Aplicação



---

> **Dica para Desenvolvimento:** A estrutura da aplicação já está separada por domínios no banco de dados KV (ex: `games:all`, `game:[slug]`, `reviews_for_game:[slug]`). Adicionar novos campos (como Imagens de Capa ou Notas Numéricas) é apenas questão de atualizar o arquivo `@/lib/types.ts` (ou a tipagem principal), modificar o formulário em `src/components/`, e adaptar o endpoint de gravação em `src/app/api/`.
