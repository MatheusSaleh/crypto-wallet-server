import { ApiProperty } from "@nestjs/swagger";

export class LedgerResponseDto {

    @ApiProperty()
    type: string;

    @ApiProperty()
    token: string; 

    @ApiProperty()
    amount: number;

    @ApiProperty()
    previousBalance: number;

    @ApiProperty()
    newBalance: number;

    @ApiProperty()
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