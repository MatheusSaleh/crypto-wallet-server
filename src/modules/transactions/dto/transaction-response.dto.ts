import { ApiProperty } from "@nestjs/swagger"

export class TransactionResponseDto {

    @ApiProperty()
    type: string 

    @ApiProperty()
    fromToken?: string
    
    @ApiProperty()
    toToken?: string 

    @ApiProperty()
    amount: number

    @ApiProperty()
    fee?: number

    @ApiProperty()
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