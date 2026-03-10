# Aplicação de Carteira Digital

Esta aplicação utiliza **PostgreSQL** como banco de dados e gerencia usuários, carteiras, saldos de tokens e histórico de transações.

## Estrutura do Banco de Dados

O banco é estruturado com quatro tabelas principais: `User`, `Wallet`, `Balance` e `LedgerEntry`. Abaixo está um diagrama visual mostrando os relacionamentos entre elas:

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

    USER ||--o| WALLET : tem
    WALLET ||--o| BALANCE : possui
    WALLET ||--o| LEDGERENTRY : registra