export class WalletBalanceResponseDto {

    token: string;
    balance: number;

    constructor(token: string, balance: number) {
        this.token = token;
        this.balance = balance;
    }
}