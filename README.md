# AIDA-Desafio

Aplicação de gerenciamento de biblioteca com backend em .NET (C#) e frontend em React.

## Decisões técnicas

- **Backend em .NET/C#**: o desafio permitia livre escolha de linguagem no backend. Mesmo perdendo o diferencial de usar a stack da empresa no backend, optei por .NET com C# por familiaridade com o framework, considerando a urgência do desafio. No frontend, segui a stack da empresa com React.
- **Regra de exclusão de livros (RF-11/RI-11)**: em vez de bloquear somente livros com empréstimos ativos, foi adotada restrição para qualquer livro com histórico de empréstimos (ativos ou retornados), preservando a integridade dos registros.
- **Testes de integração com banco principal**: os testes foram configurados para usar o banco da aplicação, também servindo como carga inicial de dados de exemplo para facilitar a avaliação da plataforma.

## Deploy

**Links:**

- **Site (Frontend)**: https://booksmanager.fabriciomqueiroz.com.br
- **API (Backend)**: https://booksmanagerapi.fabriciomqueiroz.com.br

**Detalhes:**

- **Frontend**: publicado no Cloudflare Pages, escutando a branch `deploy`.
- **Backend e banco de dados**: publicados em VPS Hostinger (Debian), via painel Easypanel, escutando a branch `deploy`.
- **Política de CORS do backend**: configurada por whitelist de origens permitidas, aceitando requisições somente dos domínios autorizados do frontend.

## Setup

### Arquivos `.env`

Preencha os arquivos `.env` a partir dos respectivos `.env.example`:

```bash
cp .env.example .env
cp Library-Frontend/.env.example Library-Frontend/.env
```

#### `.env` (raiz)

- `POSTGRES_USER`: usuário do banco PostgreSQL.
- `POSTGRES_PASSWORD`: senha do usuário do PostgreSQL.
- `POSTGRES_DB`: nome do banco de dados da aplicação.
- `FRONTEND_ALLOWED_ORIGINS`: origens permitidas no CORS do backend (separadas por vírgula).

#### `Library-Frontend/.env`

- `VITE_API_BASE_URL`: URL base da API usada pelo frontend.

### Portas padrão

As portas abaixo precisam estar livres para a aplicação funcionar normalmente:

- `5173`: frontend (Vite)
- `5042`: backend (.NET API)
- `5432`: PostgreSQL

## Execução - Docker Compose

### Dependências

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### Comandos

Na raiz do projeto:

Subir os serviços:

```bash
docker compose up --build -d
```

Parar e remover containers/rede:

```bash
docker compose down
```

Parar e remover também os volumes:

```bash
docker compose down -v
```

## Execução - Local

### Dependências

- [Node.js](https://nodejs.org/): `v20`
- [.NET SDK](https://dotnet.microsoft.com/): `v10`
- [PostgreSQL](https://www.postgresql.org/)

### Requisitos de portas

No ambiente local, garanta que as portas estejam livres/abertas:

- `5173` (frontend)
- `5042` (backend)
- `5432` (PostgreSQL)

### Variáveis de ambiente do backend (na máquina)

Executando o backend localmente, configure estas variáveis no sistema operacional:

- `ConnectionStrings__DefaultConnection`
- `Cors__AllowedOrigins`

Exemplo (Linux):

```bash
export ConnectionStrings__DefaultConnection='Host=localhost;Port=5432;Database=library_db;Username=library_user;Password=SUA_SENHA'
export Cors__AllowedOrigins='http://localhost:5173'
```

### Comandos de execução local

**Antes de iniciar o backend, é necessário ter um serviço PostgreSQL em execução.**

Backend:

```bash
cd Library-Service
dotnet run
```

Frontend (em outro terminal):

```bash
cd Library-Frontend
npm install
npm run dev
```

### Testes (execução local)

No modo local, os testes **não** são executados automaticamente como na execução via Docker Compose.

Para executar manualmente:

```bash
cd Library-Service
dotnet test -l "console;verbosity=normal"
```
