export class TransactionResponseDto {

    type: string 
    fromToken?: string 
    toToken?: string 
    amount: number
    fee?: number
    createdAt: Date

    constructor(
        type: string,
        fromToken: string | undefined,
        toToken: string | undefined, 
        amount: number, 
        fee: number | undefined,
        createdAt: Date
    ){
        this.type = type
        this.fromToken = fromToken
        this.toToken = toToken
        this.amount = amount
        this.fee = fee
        this.createdAt = createdAt
    }
}