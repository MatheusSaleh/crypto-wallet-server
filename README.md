# Aplicação de Carteira Digital

Esta aplicação utiliza **PostgreSQL** como banco de dados e gerencia usuários, carteiras, saldos de tokens e histórico de transações.

## Estrutura do Banco de Dados

O banco é estruturado com quatro tabelas principais: `User`, `Wallet`, `Balance` e `LedgerEntry`.

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

    USER ||--o| WALLET : "tem"
    WALLET ||--o| BALANCE : "possui"
    WALLET ||--o| LEDGERENTRY : "registra"

---

### **1. User**
- **id**: UUID, chave primária.
- **email**: único, impede duplicidade.
- **password**: senha do usuário.
- **wallet**: relação opcional 1:1 com `Wallet`.
- **createdAt**: data de criação do usuário.

> Cada usuário pode ter no máximo **uma carteira**, mas não é obrigatório.

---

### **2. Wallet**
- **id**: UUID, chave primária.
- **userId**: único, referência a `User`.
- **balances**: relação 1:N com `Balance` (saldos de tokens).
- **ledger**: relação 1:N com `LedgerEntry` (movimentações da carteira).
- **createdAt**: data de criação da carteira.

> Cada carteira pertence a **um único usuário** e pode ter **vários saldos e registros de movimentação**.

---

### **3. Balance**
- **id**: UUID, chave primária.
- **walletId**: referência à carteira.
- **token**: identifica o tipo de token.
- **amount**: quantidade do token, padrão 0.
- **Único por token em cada carteira**.

> Controla **quanto de cada token** a carteira possui.

---

### **4. LedgerEntry**
- **id**: UUID, chave primária.
- **walletId**: referência à carteira.
- **type**: tipo da movimentação (deposit, withdraw, transfer, etc).
- **token**: token movimentado.
- **amount**: valor da transação.
- **previousBalance / newBalance**: histórico do saldo antes e depois da operação.
- **createdAt**: data da movimentação.

> Mantém o **histórico completo de todas as transações** para auditoria.

---

### **Relacionamentos**
- **User ↔ Wallet**: 1:1  
- **Wallet ↔ Balance**: 1:N  
- **Wallet ↔ LedgerEntry**: 1:N  

---

### **Fluxo de Funcionamento**
1. Usuário se cadastra → cria um `User`.  
2. Criação de carteira → gera um `Wallet` vinculado ao `userId`.  
3. Recebimento de tokens → cria ou atualiza um `Balance`.  
4. Movimentações → cada ação gera uma `LedgerEntry`, registrando o histórico e atualizando o saldo.

---

### **Observações**
- O banco garante **integridade referencial** entre usuários, carteiras, saldos e movimentações.  
- Cada carteira não pode ter **mais de um saldo do mesmo token**.  
- Permite auditoria completa de todas as transações realizadas.