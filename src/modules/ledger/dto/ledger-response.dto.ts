export class LedgerResponseDto {

    type: string;
    token: string; 
    amount: number;
    previousBalance: number;
    newBalance: number;
    createdAt: Date
    
    constructor(
        type: string,
        token: string,
        amount: number, 
        previousBalance: number, 
        newBalance: number,
        createdAt: Date
    ){
        this.type = type;
        this.token = token;
        this.amount = amount;
        this.previousBalance = previousBalance;
        this.newBalance = newBalance;
        this.createdAt = createdAt;
    }
}