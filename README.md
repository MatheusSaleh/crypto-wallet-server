# Aplicação de Carteira Digital

Backend de uma **carteira digital de tokens** desenvolvido com **NestJS, Prisma e PostgreSQL**.
A aplicação permite:

- Cadastro e autenticação de usuários
- Gerenciamento de carteira
- Controle de saldo de tokens
- Depósitos via webhook
- Conversão de tokens (swap)
- Saques
- Histórico contábil completo (Ledger)
- Histórico de transações

O objetivo do projeto é simular a **infraestrutura básica de um sistema financeiro de tokens**, mantendo **consistência de saldo e rastreabilidade das operações**.

---

# Tecnologias Utilizadas

- **NestJS** → Framework backend Node.js estruturado
- **Prisma ORM** → Mapeamento e acesso ao banco de dados
- **PostgreSQL** → Banco relacional
- **JWT** → Autenticação baseada em token
- **CoinGecko API** → Cotação real de tokens
- **Docker** → Esta API Executa por meio de uma imagem docker, facilitando o processo de deploy
- **Render** → Plataforma para Deploy da API
- **Github Actions** → Ferramenta de CI/CD utilizada para automatizar o processo de deploy
- **Swagger** → Conjunto de ferramentas que permite documentar e consumir APIs RESTful, facilitando a visualização interativa da API
---
# Como rodar o projeto

### Foi realizado o deploy desta API através do Render sob a seguinte URL: 

https://nest-api-r1fz.onrender.com/docs

# Como rodar o projeto localmente

## 1. Clonar o repositório

```bash
git clone https://github.com/MatheusSaleh/crypto-wallet-server
cd crypto-wallet-server
```

## 2. Instalar depêndencias

```bash
 pnpm install
```

## 3. Configurar Variáveis de ambiente
Crie um arquivo .env que armazerá as credencias do banco Postgres que rodará a aplicação
Exemplo:
```bash
 DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wallet"
 JWT_SECRET="secret_exemplo"
```

## 4. Executar as migrations do prisma
```bash
    pnpm prisma migrate dev
```

## 5. Gerar o client do Prisma
```bash
    pnpm prisma generate
```

## 6. Rodar a aplicação
```bash
    pnpm run start
```

## 7. Execução
A API se iniciará em localhost:3000

# Decisões Técnicas

## NestJS
Optou-se por usar o NestJS por oferecer uma arquitetura modular, separação clara entre Controllers, Services e DTOs e suporte nativo a injeção de dependências

## PrismaORM
O Prisma foi escolhido ao invés de outras ORMs pois possui tipagem forte com Typescript, migrations simples, client gerado automaticamente e uma excelente integração com o NestJS.



## Estrutura do Banco de Dados

### **1. User**
Representa o **usuário da plataforma**.

- **id**: UUID, chave primária.
- **email**: único, impede duplicidade.
- **password**: senha do usuário.
- **wallet**: relação opcional 1:1 com `Wallet`.
- **createdAt**: data de criação do usuário.

Regras: 
- Cada usuário pode possuir **apenas uma carteira**.
- A criação da carteira é feita após o registro do usuário.


---

### **2. Wallet**
Representa a **carteira digital do usuário**, onde ficam armazenados os tokens.


- **id**: UUID, chave primária.
- **userId**: único, referência a `User`.
- **createdAt**: data de criação da carteira.

Relacionamentos:

- **1:1 com User**
- **1:N com Balance**
- **1:N com LedgerEntry**

Responsabilidade:

A carteira funciona como **container financeiro** do usuário.

---

### **3. Balance**
Controla o **saldo de cada token dentro da carteira**.



- **id**: UUID, chave primária.
- **walletId**: referência à carteira.
- **token**: identifica o tipo de token.
- **amount**: quantidade do token, padrão 0.

- **Único por token em cada carteira**.
Regra importante:

Uma carteira não pode ter dois saldos do mesmo token.
Isso é garantido pela constraint:
```bash
     @@unique([walletId, token])
```

---

### **4. LedgerEntry**
Tabela responsável pelo registro contábil das movimentações da carteira.

- **id**: UUID, chave primária.
- **walletId**: referência à carteira.
- **type**: tipo da movimentação (DEPOSIT, WITHDRAWAL, SWAP_IN, SWAP_OUT).
- **token**: token movimentado.
- **amount**: valor da transação.
- **previousBalance / newBalance**: histórico do saldo antes e depois da operação.
- **createdAt**: data da movimentação.

> Mantém o **histórico completo de todas as transações** para auditoria, o Ledger é um controle contabil detalhado já Tranasactions representa uma visão resumida das operações

---


### **5. Transaction**
Tabela responsável pelo registro contábil das movimentações da carteira.
Representa uma visão resumida das operações realizadas pelo usuário.

Diferente do ledger, que é contábil e detalhado, essa tabela serve para consultar histórico de operações.

- **id**: UUID, chave primária.
- **userId**: usuário que realizou a operação.
- **type**: tipo da movimentação (DEPOSIT, WITHDRAWAL, SWAP_IN, SWAP_OUT).
- **fromToken**: token de origem (ex: BTC)
- **toToken**: token de destino (ex: BRL)
- **amount**: valor da operação.
- **fee**: taxa cobrada 
- **createdAt**: data da movimentação.

---

### **6. WebhookEvent**
Tabela utilizada para controle de idempotência de webhooks de depósito.

Quando um serviço externo envia um depósito, ele inclui uma idempotencyKey.

- **id**: UUID, chave primária.
- **idempotencyKey**: identificador único da operação.
- **type**: data do processamento.

Se um webhook com a mesma idempotencyKey chegar novamente, ele será ignorado, evitando depósitos duplicados.

---

### **Relacionamentos**
- **User ↔ Wallet**: 1:1  
- **Wallet ↔ Balance**: 1:N  
- **Wallet ↔ LedgerEntry**: 1:N  
- **User ↔ Transaction**: 1:N  
---

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