# Crypto Wallet — API

Backend de uma **carteira digital de criptoativos** desenvolvido com **NestJS, Prisma e PostgreSQL**.

O objetivo do projeto é simular a **infraestrutura básica de um sistema financeiro de tokens**: cada usuário tem uma carteira com saldos em **BRL, BTC e ETH**, pode depositar, sacar e converter entre moedas com **cotação real da CoinGecko**, e todas as movimentações ficam registradas em um **livro-razão (ledger)** auditável.

Esta API é consumida pelo frontend [crypto-wallet-client](https://github.com/MatheusSaleh/crypto-wallet-client).

> 🌐 **API em produção:** https://crypto-wallet-server-kappa.vercel.app
>
> 📘 **Swagger:** https://crypto-wallet-server-kappa.vercel.app/docs
>
> 💻 **Frontend:** https://crypto-wallet-client-pink.vercel.app

---

## Sumário

- [Prints](#prints)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Endpoints](#endpoints)
- [Regras de negócio](#regras-de-negócio)
- [Como rodar localmente](#como-rodar-localmente)
- [Testes](#testes)
- [Deploy](#deploy)
- [Estrutura do banco de dados](#estrutura-do-banco-de-dados)
- [Decisões técnicas](#decisões-técnicas)

---

## Prints

### Documentação Swagger

Todos os endpoints estão documentados e podem ser testados em `/docs`.

![Swagger](docs/screenshots/swagger.jpg)

### Frontend consumindo a API

| Dashboard | Conversão de moedas |
| --- | --- |
| ![Home](docs/screenshots/home.jpg) | ![Conversão](docs/screenshots/conversao.jpg) |

---

## Funcionalidades

- **Autenticação JWT** com access token (15 min) e refresh token (7 dias)
- **Carteira automática**: ao se cadastrar, o usuário recebe uma carteira com saldo zerado em BRL, BTC e ETH
- **Depósitos via webhook**, com **chave de idempotência** para impedir depósitos duplicados
- **Saques** com validação de saldo
- **Conversão (swap)** entre BRL, BTC e ETH com cotação em tempo real e taxa de 1,5%
- **Ledger contábil**: cada movimentação registra saldo anterior e saldo posterior
- **Histórico de transações** (visão resumida das operações)
- **Cotações de mercado**: 12 moedas fiduciárias e 12 criptomoedas em BRL, com cache de 60 s
- **Operações atômicas**: toda movimentação de saldo roda dentro de uma transação do banco

---

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| **NestJS 11** | Framework backend modular, com injeção de dependências |
| **Prisma 7** + adapter `pg` | ORM e migrations |
| **PostgreSQL** | Banco relacional |
| **Passport + JWT** | Autenticação baseada em token |
| **class-validator / class-transformer** | Validação e conversão dos DTOs |
| **Axios** | Consumo da API da CoinGecko |
| **Swagger** (`@nestjs/swagger`) | Documentação interativa |
| **Jest** | Testes unitários |
| **Vercel** | Hospedagem da API (preset NestJS) com deploy automático a cada push |
| **Neon** | PostgreSQL gerenciado em produção (integração da Vercel) |
| **Docker** | Imagem da aplicação para rodar em qualquer ambiente |
| **GitHub Actions** | Build e publicação da imagem no Docker Hub |

---

## Arquitetura

Cada domínio é um módulo NestJS independente, com controller (HTTP), service (regra de negócio) e DTOs (contrato de entrada e saída).

```plaintext
src
 ├── main.ts                    # Bootstrap: CORS, ValidationPipe e Swagger
 ├── app.module.ts              # Módulo raiz e guard JWT global
 ├── common/dto                 # DTOs compartilhados (paginação)
 ├── prisma                     # PrismaService (conexão com o Postgres)
 └── modules
      ├── auth                  # Cadastro, login, refresh, guard e estratégia JWT
      ├── users                 # Dados do usuário autenticado
      ├── wallet                # Saldos da carteira
      ├── webhooks              # Depósito via webhook (idempotente)
      ├── withdraw              # Saque
      ├── swap                  # Cotação e conversão entre moedas
      ├── ledger                # Livro-razão paginado
      ├── transactions          # Histórico resumido paginado
      └── market                # Cotações para o letreiro (cache em memória)
```

**Autenticação global:** o `JwtGuard` é registrado como `APP_GUARD`, então **todas as rotas exigem token por padrão**. Rotas públicas são marcadas explicitamente com o decorator `@Public()`.

---

## Endpoints

🔒 = exige `Authorization: Bearer <accessToken>`

| Método | Rota | Auth | Descrição |
| --- | --- | :---: | --- |
| `POST` | `/auth/register` | | Cadastra o usuário e cria a carteira. Retorna `accessToken` e `refreshToken` |
| `POST` | `/auth/login` | | Autentica e retorna os tokens |
| `POST` | `/auth/refresh` | | Gera novos tokens a partir do `refreshToken` |
| `GET` | `/users/me` | 🔒 | Dados do usuário autenticado (`id`, `email`, `createdAt`) |
| `GET` | `/wallet/balance` | 🔒 | Saldo de cada token da carteira |
| `POST` | `/webhooks/deposit` | 🔒 | Depósito (`userId`, `token`, `amount`, `idempotencyKey`) |
| `POST` | `/withdraw` | 🔒 | Saque (`token`, `amount`) |
| `GET` | `/swap/quote` | 🔒 | Cotação (`fromToken`, `toToken`, `amount`): preço, valor líquido e taxa |
| `POST` | `/swap` | 🔒 | Executa a conversão (`fromToken`, `toToken`, `amount`) |
| `GET` | `/ledger?page=1&limit=10` | 🔒 | Livro-razão paginado, do mais recente para o mais antigo |
| `GET` | `/transactions?page=1&limit=10` | 🔒 | Histórico resumido de operações |
| `GET` | `/market/ticker` | | Cotações de moedas e criptomoedas em BRL (cache de 60 s) |

<details>
<summary>Exemplo: fluxo completo com <code>curl</code></summary>

```bash
# 1. Cadastro (já retorna os tokens)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"123456"}'

TOKEN="<accessToken retornado>"

# 2. Dados do usuário (para obter o id)
curl http://localhost:3000/users/me -H "Authorization: Bearer $TOKEN"

# 3. Depósito de R$ 1.000
curl -X POST http://localhost:3000/webhooks/deposit \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"userId":"<id>","token":"BRL","amount":"1000","idempotencyKey":"deposito-001"}'

# 4. Cotação e conversão de R$ 500 em BTC
curl "http://localhost:3000/swap/quote?fromToken=BRL&toToken=BTC&amount=500" \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:3000/swap \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"fromToken":"BRL","toToken":"BTC","amount":500}'

# 5. Saldo e extrato
curl http://localhost:3000/wallet/balance -H "Authorization: Bearer $TOKEN"
curl "http://localhost:3000/ledger?page=1&limit=10" -H "Authorization: Bearer $TOKEN"
```

</details>

---

## Regras de negócio

### Cotação

A CoinGecko não oferece todos os pares diretamente (por exemplo, `brl` não é um ativo e `bitcoin` não é uma moeda de cotação). Por isso, **os dois tokens são cotados em BRL** e o preço do par é a razão entre eles:

```
preço(from → to) = preçoEmBRL(from) / preçoEmBRL(to)      (BRL = 1)
```

Isso permite qualquer combinação: BTC→BRL, BRL→ETH, ETH→BTC etc.

### Taxa de conversão

A plataforma cobra **1,5% sobre o valor convertido**:

```
bruto   = quantidade × preço
taxa    = bruto × 1,5%
líquido = bruto − taxa      ← valor creditado na carteira
```

### Lançamentos no ledger

Cada operação gera lançamentos com `previousBalance` e `newBalance`, de modo que a sequência sempre bate com o saldo real:

| Operação | Lançamentos |
| --- | --- |
| Depósito | `DEPOSIT` (+) |
| Saque | `WITHDRAWAL` (−) |
| Conversão | `SWAP_OUT` (− origem) → `SWAP_IN` (+ valor bruto no destino) → `SWAP_FEE` (− taxa no destino) |

Exemplo: com R$ 500 de saldo, ao converter 1 BTC a R$ 100.000:
`SWAP_IN` +100.000 (500 → 100.500) e depois `SWAP_FEE` −1.500 (100.500 → **99.000**, o saldo final).

### Idempotência de depósitos

Cada depósito traz uma `idempotencyKey`. Se a mesma chave chegar de novo, o depósito é rejeitado, o que evita crédito em dobro quando o provedor reenvia o webhook.

### Cache de cotações de mercado

`/market/ticker` consulta a CoinGecko no máximo uma vez a cada 60 s, por mais clientes que estejam conectados. Requisições simultâneas compartilham a mesma chamada. Se a CoinGecko falhar (por exemplo, por limite de requisições), a API devolve o último valor conhecido.

---

## Como rodar localmente

### Pré-requisitos

- **Node.js 20+** e **pnpm**
- **PostgreSQL**: o jeito mais simples é via Docker

### 1. Clonar e instalar

```bash
git clone https://github.com/MatheusSaleh/crypto-wallet-server
cd crypto-wallet-server
pnpm install
```

### 2. Subir o PostgreSQL (Docker)

```bash
docker run -d --name crypto-wallet-db \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=wallet \
  -p 5432:5432 postgres:16
```

Nas próximas vezes, basta `docker start crypto-wallet-db`.

### 3. Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wallet"
JWT_SECRET="troque_por_um_segredo_forte"
CORS_ORIGIN="http://localhost:5173"
```

| Variável | Obrigatória | Descrição |
| --- | :---: | --- |
| `DATABASE_URL` | ✅ | String de conexão do PostgreSQL |
| `JWT_SECRET` | ✅ | Segredo usado para assinar os tokens JWT |
| `CORS_ORIGIN` | | Origens liberadas no CORS, separadas por vírgula. Padrão: `http://localhost:5173` |
| `PORT` | | Porta da API. Padrão: `3000` |

### 4. Migrations e Prisma Client

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### 5. Rodar

```bash
pnpm run start:dev    # modo desenvolvimento (recarrega ao salvar)
pnpm run start        # execução simples
pnpm run start:prod   # após pnpm run build
```

A API sobe em **http://localhost:3000** e o Swagger em **http://localhost:3000/docs**.

---

## Testes

```bash
pnpm test          # testes unitários
pnpm test:cov      # com cobertura
```

Os testes isolam as dependências externas: o Prisma e a CoinGecko (axios) são substituídos por mocks. Destaques:

- **SwapService**: cotação nos três sentidos (cripto→BRL, BRL→cripto, cripto→cripto), rejeição de tokens inválidos e de saldo insuficiente, e **consistência do ledger** após o swap
- **MarketService**: conversão de moedas fiduciárias para BRL, uso do cache, fallback para o último valor e erro 503 sem cache

---

## Deploy

### Vercel (produção)

A API roda na **Vercel** com o preset **NestJS**, conectada ao repositório: cada push no `master` gera um novo deploy de produção. O banco é um **PostgreSQL da Neon**, conectado pela integração de Storage da Vercel.

No deploy, a Vercel executa o script `vercel-build`:

```bash
prisma migrate deploy && pnpm run build   # build = prisma generate && nest build
```

Ou seja, **as migrations pendentes são aplicadas automaticamente** a cada deploy. Elas usam a conexão direta da Neon (`DATABASE_URL_UNPOOLED`), configurada no [`prisma.config.ts`](prisma.config.ts), enquanto a aplicação usa a conexão com pooler (`DATABASE_URL`).

Variáveis de ambiente do projeto na Vercel:

| Variável | Origem |
| --- | --- |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Criadas pela integração da Neon |
| `JWT_SECRET` | Definida manualmente |
| `CORS_ORIGIN` | URL do frontend (`https://crypto-wallet-client-pink.vercel.app`) |

### Imagem Docker

O workflow [`.github/workflows/docker.yml`](.github/workflows/docker.yml) roda a cada push no `master`, gera a imagem com o [`Dockerfile`](Dockerfile) e publica no Docker Hub como `matheussaleh/nest-api:latest`. Para rodar a API em qualquer ambiente com Docker:

```bash
docker run -p 3000:3000   -e DATABASE_URL="postgresql://..." -e JWT_SECRET="..." -e CORS_ORIGIN="http://localhost:5173"   matheussaleh/nest-api:latest
```

---

## Estrutura do banco de dados

### 1. User
Representa o **usuário da plataforma**.

- **id**: UUID, chave primária
- **email**: único, impede duplicidade
- **password**: hash bcrypt da senha
- **wallet**: relação 1:1 com `Wallet`
- **createdAt**: data de criação

Cada usuário possui **apenas uma carteira**, criada junto com o cadastro.

### 2. Wallet
**Container financeiro** do usuário.

- **id**: UUID, chave primária
- **userId**: único, referência a `User`
- **createdAt**: data de criação

### 3. Balance
**Saldo de cada token** dentro da carteira.

- **id**: UUID, chave primária
- **walletId**: referência à carteira
- **token**: `BRL`, `BTC` ou `ETH`
- **amount**: quantidade, padrão 0

Uma carteira não pode ter dois saldos do mesmo token, o que é garantido pela constraint `@@unique([walletId, token])`.

### 4. LedgerEntry
**Registro contábil** de cada movimentação, para auditoria.

- **type**: `DEPOSIT`, `WITHDRAWAL`, `SWAP_IN`, `SWAP_OUT` ou `SWAP_FEE`
- **token**, **amount** (positivo = crédito, negativo = débito)
- **previousBalance / newBalance**: saldo antes e depois do lançamento
- **createdAt**

### 5. Transaction
**Visão resumida** das operações do usuário. O ledger é detalhado e contábil; esta tabela serve para consultar o histórico de operações.

- **type**: `DEPOSIT`, `WITHDRAWAL` ou `SWAP`
- **fromToken / toToken**: token de origem e de destino
- **amount**: valor da operação
- **fee**: taxa cobrada (conversões)
- **createdAt**

### 6. WebhookEvent
Controle de **idempotência** dos depósitos.

- **idempotencyKey**: identificador único da operação
- **createdAt**: data do processamento

### Relacionamentos

```mermaid
erDiagram
    USER {
        String id PK
        String email
        String password
        DateTime createdAt
    }

    WALLET {
        String id PK
        String userId FK
        DateTime createdAt
    }

    BALANCE {
        String id PK
        String walletId FK
        String token
        Float amount
    }

    LEDGERENTRY {
        String id PK
        String walletId FK
        String type
        String token
        Float amount
        Float previousBalance
        Float newBalance
        DateTime createdAt
    }

    TRANSACTION {
        String id PK
        String userId
        String type
        String fromToken
        String toToken
        Float amount
        Float fee
        DateTime createdAt
    }

    WEBHOOKEVENT {
        String id PK
        String idempotencyKey
        DateTime createdAt
    }

    USER ||--o| WALLET : possui
    WALLET ||--o{ BALANCE : possui
    WALLET ||--o{ LEDGERENTRY : registra
    USER ||--o{ TRANSACTION : realiza
```

---

## Decisões técnicas

### NestJS
Arquitetura modular, separação clara entre controllers, services e DTOs, e suporte nativo a injeção de dependências, o que facilita os testes com mocks.

### Prisma ORM
Tipagem forte com TypeScript, migrations simples, client gerado automaticamente e boa integração com o NestJS. As operações financeiras usam `prisma.$transaction` para garantir atomicidade: ou todos os lançamentos são gravados, ou nenhum.

### Ledger + Transaction
O **ledger** é a fonte da verdade contábil: cada linha registra o saldo antes e depois, permitindo reconstruir e auditar qualquer saldo. A tabela **Transaction** é uma visão simplificada, voltada à consulta do histórico pelo usuário.

### Guard JWT global
Proteger todas as rotas por padrão e liberar só as necessárias com `@Public()` evita expor um endpoint por esquecimento.

### Cotação via BRL e cache
Cotar tudo em BRL resolve pares que a CoinGecko não suporta diretamente. O cache em memória das cotações de mercado protege o limite da API gratuita, que também é usada pelas conversões.
